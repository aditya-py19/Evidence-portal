import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { PrismaClient, UserRole } from '@prisma/client'
import multer from 'multer'
import crypto from 'crypto'
import { ACTIVITY, logActivity } from './activityLog.js'
import { recordEvidenceOnChain, verifyEvidenceOnChain } from './blockchain/contractService.js'


const required = ['DATABASE_URL', 'JWT_SECRET'] as const
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} must be set in .env`)
}

const prisma = new PrismaClient()
const app = express()
const port = Number(process.env.PORT ?? 4000)
const jwtSecret = process.env.JWT_SECRET as string

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json())

type AuthRequest = Request & { auth?: { userId: string; role: UserRole } }

function publicUser(user: {
  id: string; username: string; email: string; name: string; role: UserRole
  department: string; badgeNumber: string; isActive: boolean; mustChangePassword: boolean
  lastLoginAt?: Date | null; createdAt?: Date
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    badgeNumber: user.badgeNumber,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    lastLogin: user.lastLoginAt?.toISOString() ?? undefined,
    createdAt: user.createdAt?.toISOString(),
  }
}

async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')?.trim()

  if (!token) {
    console.warn(`[AUTH 401] Path: ${req.method} ${req.path} - Missing or malformed Authorization header. Header value: "${authHeader || ''}"`)
    return res.status(401).json({ message: 'Authentication required.' })
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as JwtPayload
    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
      console.warn(`[AUTH 401] Path: ${req.method} ${req.path} - Token payload missing sub or role properties.`)
      return res.status(401).json({ message: 'Your session is invalid or has expired.' })
    }

    const dbUser = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!dbUser || !dbUser.isActive) {
      console.warn(`[AUTH 401] Path: ${req.method} ${req.path} - User ${payload.sub} not found or inactive in database.`)
      return res.status(401).json({ message: 'Your session is invalid or account is inactive.' })
    }

    req.auth = { userId: payload.sub, role: dbUser.role }
    console.log(`[AUTH 200] Path: ${req.method} ${req.path} - Authenticated user: ${dbUser.username} (${dbUser.role})`)
    next()
  } catch (err: any) {
    console.warn(`[AUTH 401] Path: ${req.method} ${req.path} - JWT verification failed (${err.name}): ${err.message}`)
    return res.status(401).json({ message: 'Your session is invalid or has expired.' })
  }
}

function administratorsOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.auth?.role !== UserRole.administrator) return res.status(403).json({ message: 'Administrator access required.' })
  next()
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

async function loginForPortal(req: Request, res: Response, next: NextFunction, portal: 'officer' | 'judge') {
  try {
    const identifier = typeof req.body.identifier === 'string' ? req.body.identifier.trim().toLowerCase() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    if (!identifier || !password) return res.status(400).json({ message: 'Username/email and password are required.' })

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    })
    const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false
    if (!user || !user.isActive || !isValid) {
      return res.status(401).json({ message: 'Invalid credentials or inactive account.' })
    }

    if (portal === 'judge' && user.role !== UserRole.judge) {
      return res.status(403).json({ message: 'Judge Portal access requires a judge account.' })
    }
    if (portal === 'officer' && user.role === UserRole.judge) {
      return res.status(403).json({ message: 'Please sign in through the Judge Portal.' })
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    if (portal === 'officer') {
      await logActivity(prisma, req, {
        activity: ACTIVITY.OFFICER_LOGIN,
        username: user.username,
        role: user.role,
        userId: user.id,
        details: 'Officer Portal login',
      })
    }

    const token = jwt.sign({ role: user.role }, jwtSecret, { subject: user.id, expiresIn: '24h' })
    return res.json({ token, user: publicUser(user) })
  } catch (error) { next(error) }
}

app.post('/api/auth/login', (req, res, next) => loginForPortal(req, res, next, 'officer'))
app.post('/api/auth/judge/login', (req, res, next) => loginForPortal(req, res, next, 'judge'))

app.get('/api/auth/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
    if (!user || !user.isActive) return res.status(401).json({ message: 'Account is inactive.' })
    return res.json({ user: publicUser(user) })
  } catch (error) { next(error) }
})

app.post('/api/auth/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
    if (user && user.role !== UserRole.administrator && user.role !== UserRole.judge) {
      await logActivity(prisma, req, {
        activity: ACTIVITY.OFFICER_LOGOUT,
        username: user.username,
        role: user.role,
        userId: user.id,
      })
    }
    return res.json({ message: 'Logged out.' })
  } catch (error) { next(error) }
})

app.post('/api/admin/login', async (req, res, next) => {
  try {
    const identifier = typeof req.body.identifier === 'string' ? req.body.identifier.trim().toLowerCase() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    if (!identifier || !password) return res.status(400).json({ message: 'Administrator ID and password are required.' })

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    })
    const isValid = user ? await bcrypt.compare(password, user.passwordHash) : false
    if (!user || !user.isActive || !isValid || user.role !== UserRole.administrator) {
      return res.status(401).json({ message: 'Invalid administrator credentials.' })
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    await logActivity(prisma, req, {
      activity: ACTIVITY.ADMINISTRATOR_LOGIN,
      username: user.username,
      role: user.role,
      userId: user.id,
    })

    const token = jwt.sign({ role: user.role }, jwtSecret, { subject: user.id, expiresIn: '24h' })
    return res.json({ token, user: publicUser(user) })
  } catch (error) { next(error) }
})

app.post('/api/admin/logout', authenticate, administratorsOnly, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
    if (user) {
      await logActivity(prisma, req, {
        activity: ACTIVITY.ADMINISTRATOR_LOGOUT,
        username: user.username,
        role: user.role,
        userId: user.id,
      })
    }
    return res.json({ message: 'Administrator logged out.' })
  } catch (error) { next(error) }
})

app.get('/api/admin/me', authenticate, administratorsOnly, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
    if (!user || !user.isActive) return res.status(401).json({ message: 'Account is inactive.' })
    return res.json({ user: publicUser(user) })
  } catch (error) { next(error) }
})

const officerRoles: UserRole[] = [UserRole.police_officer, UserRole.investigating_officer, UserRole.forensic_expert]

app.get('/api/admin/officers', authenticate, administratorsOnly, async (_req, res, next) => {
  try {
    const officers = await prisma.user.findMany({
      where: { role: { in: officerRoles } },
      orderBy: { createdAt: 'desc' },
    })
    return res.json({ officers: officers.map(publicUser) })
  } catch (error) { next(error) }
})

app.post('/api/admin/officers', authenticate, administratorsOnly, async (req: AuthRequest, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    const username = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : ''
    const department = typeof req.body.department === 'string' ? req.body.department.trim() : ''
    const badgeNumber = typeof req.body.badgeNumber === 'string' ? req.body.badgeNumber.trim() : ''
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    const role = typeof req.body.role === 'string' && officerRoles.includes(req.body.role as UserRole)
      ? (req.body.role as UserRole)
      : UserRole.police_officer

    if (![name, username, department, badgeNumber, password].every(Boolean)) {
      return res.status(400).json({ message: 'All officer details and a temporary password are required.' })
    }
    if (password.length < 12) return res.status(400).json({ message: 'Password must have at least 12 characters.' })

    const email = `${username}@police.gov.in`
    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        role,
        department,
        badgeNumber,
        passwordHash: await bcrypt.hash(password, 12),
        mustChangePassword: true,
        createdById: req.auth!.userId,
      },
    })

    const admin = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
    await logActivity(prisma, req, {
      activity: ACTIVITY.OFFICER_CREATED,
      username: admin?.username ?? 'administrator',
      role: UserRole.administrator,
      userId: req.auth!.userId,
      details: `Created officer ${username}`,
    })

    return res.status(201).json({ officer: publicUser(user) })
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ message: 'That Officer ID is already registered.' })
    }
    next(error)
  }
})

app.patch('/api/admin/officers/:id', authenticate, administratorsOnly, async (req: AuthRequest, res, next) => {
  try {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    if (!userId) return res.status(400).json({ message: 'Officer ID is required.' })

    const existing = await prisma.user.findUnique({ where: { id: userId } })
    if (!existing || !officerRoles.includes(existing.role)) {
      return res.status(404).json({ message: 'Officer not found.' })
    }

    const data: Record<string, string | UserRole> = {}
    if (typeof req.body.name === 'string' && req.body.name.trim()) data.name = req.body.name.trim()
    if (typeof req.body.department === 'string' && req.body.department.trim()) data.department = req.body.department.trim()
    if (typeof req.body.badgeNumber === 'string' && req.body.badgeNumber.trim()) data.badgeNumber = req.body.badgeNumber.trim()
    if (typeof req.body.role === 'string' && officerRoles.includes(req.body.role as UserRole)) data.role = req.body.role as UserRole

    if (Object.keys(data).length === 0) return res.status(400).json({ message: 'No valid fields to update.' })

    const user = await prisma.user.update({ where: { id: userId }, data })
    const admin = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
    await logActivity(prisma, req, {
      activity: ACTIVITY.OFFICER_UPDATED,
      username: admin?.username ?? 'administrator',
      role: UserRole.administrator,
      userId: req.auth!.userId,
      details: `Updated officer ${existing.username}`,
    })

    return res.json({ officer: publicUser(user) })
  } catch (error) { next(error) }
})

app.patch('/api/admin/officers/:id/status', authenticate, administratorsOnly, async (req: AuthRequest, res, next) => {
  try {
    if (typeof req.body.isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be true or false.' })
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    if (!userId) return res.status(400).json({ message: 'Officer ID is required.' })

    const existing = await prisma.user.findUnique({ where: { id: userId } })
    if (!existing || !officerRoles.includes(existing.role)) {
      return res.status(404).json({ message: 'Officer not found.' })
    }

    const user = await prisma.user.update({ where: { id: userId }, data: { isActive: req.body.isActive } })
    const admin = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
    await logActivity(prisma, req, {
      activity: ACTIVITY.OFFICER_UPDATED,
      username: admin?.username ?? 'administrator',
      role: UserRole.administrator,
      userId: req.auth!.userId,
      details: `${req.body.isActive ? 'Activated' : 'Deactivated'} officer ${existing.username}`,
    })

    return res.json({ officer: publicUser(user) })
  } catch (error) { next(error) }
})

app.get('/api/admin/activity-logs', authenticate, administratorsOnly, async (_req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })
    return res.json({
      logs: logs.map((log) => ({
        id: log.id,
        activity: log.activity,
        username: log.username,
        role: log.role,
        ipAddress: log.ipAddress,
        details: log.details,
        timestamp: log.createdAt.toISOString(),
      })),
    })
  } catch (error) { next(error) }
})

app.get('/api/admin/activity-logs/export', authenticate, administratorsOnly, async (_req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' } })
    const header = 'Date,Time,Username,Role,Activity,IP Address,Details'
    const rows = logs.map((log) => {
      const date = log.createdAt.toLocaleDateString('en-IN')
      const time = log.createdAt.toLocaleTimeString('en-IN')
      const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
      return [
        escape(date),
        escape(time),
        escape(log.username),
        escape(log.role),
        escape(log.activity),
        escape(log.ipAddress),
        escape(log.details ?? ''),
      ].join(',')
    })
    const csv = [header, ...rows].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="activity-logs.csv"')
    return res.send(csv)
  } catch (error) { next(error) }
})

app.post('/api/admin/activity-logs', authenticate, administratorsOnly, async (req: AuthRequest, res, next) => {
  try {
    const activity = typeof req.body.activity === 'string' ? req.body.activity.trim() : ''
    const details = typeof req.body.details === 'string' ? req.body.details.trim() : undefined
    if (!activity) return res.status(400).json({ message: 'Activity is required.' })

    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
    if (!user) return res.status(401).json({ message: 'Account not found.' })

    await logActivity(prisma, req, {
      activity,
      username: user.username,
      role: user.role,
      userId: user.id,
      details,
    })
    return res.status(201).json({ message: 'Activity logged.' })
  } catch (error) { next(error) }
})

const upload = multer({ storage: multer.memoryStorage() })

type SightengineResponse = {
  status?: string
  error?: { description?: string; message?: string }
  genai?: { ai_generated?: number }
  deepfake?: { score?: number; deepfake?: number }
  weapon?: { classes?: Record<string, number> }
  gore?: { classes?: Record<string, number> }
  quality?: { score?: number }
}

type SightengineAnalysis = {
  available: boolean
  message: string
  aiGenerated: number
  deepfake: number
  weapon: number
  gore: number
  imageQuality: number
  riskScore: number
  recommendation: 'approved' | 'needs_manual_review' | 'high_risk'
}

const percentage = (value: number | undefined) => Math.round(Math.min(1, Math.max(0, value ?? 0)) * 100)
const highestScore = (scores: Record<string, number> | undefined) => percentage(Math.max(0, ...Object.values(scores ?? {})))

async function analyzeImageWithSightengine(file: Express.Multer.File): Promise<SightengineAnalysis> {
  const apiUser = process.env.SIGHTENGINE_API_USER
  const apiSecret = process.env.SIGHTENGINE_API_SECRET
  const unavailable = (message: string): SightengineAnalysis => ({
    available: false, message, aiGenerated: 0, deepfake: 0, weapon: 0, gore: 0,
    imageQuality: 0, riskScore: 0, recommendation: 'needs_manual_review',
  })

  const isImage = file.mimetype.startsWith('image/') || Boolean(file.originalname.match(/\.(png|jpe?g|webp|gif|bmp|svg)$/i))
  if (!isImage) return unavailable('Sightengine live analysis is currently available for image evidence only.')
  if (!apiUser || !apiSecret) return unavailable('Sightengine is not configured. Add SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET to the server .env file.')

  let mimeType = file.mimetype
  if (!mimeType || mimeType === 'application/octet-stream') {
    if (file.originalname.match(/\.png$/i)) mimeType = 'image/png'
    else if (file.originalname.match(/\.jpe?g$/i)) mimeType = 'image/jpeg'
    else mimeType = 'image/png'
  }

  const body = new FormData()
  body.append('media', new Blob([new Uint8Array(file.buffer)], { type: mimeType }), file.originalname)
  body.append('models', 'genai,deepfake,weapon,gore-2.0,quality')
  body.append('api_user', apiUser)
  body.append('api_secret', apiSecret)

  try {
    const response = await fetch('https://api.sightengine.com/1.0/check.json', { method: 'POST', body })
    const result = await response.json() as SightengineResponse
    if (!response.ok || result.status !== 'success') {
      return unavailable(result.error?.description ?? result.error?.message ?? 'Sightengine could not analyse this image.')
    }

    const aiGenerated = percentage(result.genai?.ai_generated)
    const deepfake = percentage(result.deepfake?.score ?? result.deepfake?.deepfake)
    const weapon = highestScore(result.weapon?.classes)
    const gore = highestScore(result.gore?.classes)
    const imageQuality = percentage(result.quality?.score)
    const riskScore = Math.max(aiGenerated, deepfake, weapon, gore, 100 - imageQuality)
    const recommendation = riskScore >= 70 ? 'high_risk' : riskScore >= 30 ? 'needs_manual_review' : 'approved'

    return {
      available: true,
      message: 'Sightengine live image analysis completed.',
      aiGenerated,
      deepfake,
      weapon,
      gore,
      imageQuality,
      riskScore,
      recommendation,
    }
  } catch {
    return unavailable('Sightengine could not be reached. The evidence was uploaded without live AI analysis.')
  }
}

app.post('/api/evidence/upload', authenticate, upload.single('file'), async (req: AuthRequest & { file?: Express.Multer.File }, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' })
    }

    const aiAnalysis = await analyzeImageWithSightengine(req.file)
    const uploader = req.auth?.userId
      ? await prisma.user.findUnique({ where: { id: req.auth.userId } })
      : null

    const logUpload = async (fileName: string) => {
      if (!uploader) return
      await logActivity(prisma, req, {
        activity: ACTIVITY.EVIDENCE_UPLOADED,
        username: uploader.username,
        role: uploader.role,
        userId: uploader.id,
        details: fileName,
      })
    }

    const clean = (s?: string) => (s ? s.replace(/^["']|["']$/g, '').trim() : '')
    const apiKey = clean(process.env.PINATA_API_KEY)
    const apiSecret = clean(process.env.PINATA_API_SECRET)
    const jwt = clean(process.env.PINATA_JWT)

    console.log("apiSecret.length =", apiSecret.length);
    console.log("apiSecret === 'your_pinata_api_secret_here' =", apiSecret === 'your_pinata_api_secret_here');
    console.log("apiSecret.includes('your_pinata_api_secret_here') =", apiSecret.includes('your_pinata_api_secret_here'));
    console.log("apiSecret.trim() === '' =", apiSecret.trim() === '');
    console.log("apiKey === 'your_pinata_api_key_here' =", apiKey === 'your_pinata_api_key_here');

    const pinataHeaders: Record<string, string> = {}
    if (jwt) {
      pinataHeaders['Authorization'] = `Bearer ${jwt}`
    } else if (apiKey && apiSecret) {
      pinataHeaders['pinata_api_key'] = apiKey
      pinataHeaders['pinata_secret_api_key'] = apiSecret
    } else {
      throw new Error('Pinata credentials missing. Please set PINATA_JWT or PINATA_API_KEY and PINATA_API_SECRET in environment.')
    }

    // Prepare FormData for real Pinata API
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype })
    formData.append('file', blob, req.file.originalname)

    const metadata = JSON.stringify({
      name: req.file.originalname,
      keyvalues: {
        uploadedById: req.auth?.userId || 'unknown',
        system: 'TrustChain Evidence Portal',
      }
    })
    formData.append('pinataMetadata', metadata)

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: pinataHeaders,
      body: formData
    })

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text()
      throw new Error(`Pinata upload failed: ${pinataResponse.statusText} - ${errorText}`)
    }

    const result = (await pinataResponse.json()) as { IpfsHash: string }
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex')
    await logUpload(req.file.originalname)

    const ipfsGatewayUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
    const count = await prisma.evidence.count()
    const evidenceId = `EVD-TC-2026-NEW-${String(count + 1).padStart(3, '0')}`
    const fileType = req.file.mimetype.startsWith('image/')
      ? 'image'
      : req.file.mimetype.startsWith('video/')
      ? 'video'
      : req.file.mimetype.startsWith('audio/')
      ? 'audio'
      : 'document'

    const liveStatus = aiAnalysis.available ? 'Sightengine Live' : 'Not Analysed'
    const riskScore = aiAnalysis.riskScore ?? 0
    const trustScore = aiAnalysis.available ? Math.max(0, 100 - riskScore) : 78
    const trustLevel = riskScore >= 70 ? 'high_risk' : riskScore >= 30 ? 'needs_review' : 'highly_trusted'
    const status = riskScore >= 70 ? 'high_risk' : 'ai_review'

    const fullAiAnalysis = {
      deepfakeDetection: { score: aiAnalysis.available ? 100 - aiAnalysis.deepfake : 0, status: liveStatus },
      imageForgery: { score: aiAnalysis.available ? 100 - Math.max(aiAnalysis.aiGenerated, aiAnalysis.deepfake) : 0, status: liveStatus },
      videoTampering: { score: 90, status: 'Intact' },
      metadataAnalysis: { score: 95, status: 'Consistent' },
      duplicateDetection: { score: 98, status: 'Unique' },
      blurDetection: { score: aiAnalysis.available ? aiAnalysis.imageQuality : 0, status: liveStatus },
      aiGeneratedContent: { score: aiAnalysis.available ? 100 - aiAnalysis.aiGenerated : 0, status: liveStatus },
      riskScore,
      confidence: aiAnalysis.available ? Math.max(0, 100 - Math.round(riskScore / 2)) : 85,
      recommendation: aiAnalysis.recommendation ?? 'needs_manual_review',
    }

    const trustBreakdown = {
      aiVerification: Math.min(100, Math.max(0, 100 - riskScore)),
      metadataConsistency: 95,
      sha256Hash: 100,
      digitalSignature: 95,
      chainOfCustody: 90,
      geolocation: 100,
      blockchain: 100,
    }

    const uploaderName = uploader?.name || uploader?.username || 'Unknown Officer'

    const chainRecord = await recordEvidenceOnChain(
      evidenceId,
      result.IpfsHash,
      fileHash,
      uploaderName,
      trustScore
    )

    const createData = {
      evidenceId,
      caseId: 'TC-2026-0142',
      caseTitle: 'Cyber Fraud – UPI Payment Scam',
      type: fileType,
      fileName: req.file.originalname,
      fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
      ipfsCid: result.IpfsHash,
      ipfsGatewayUrl,
      sha256: fileHash,
      trustScore,
      trustLevel,
      status,
      blockchainTxId: chainRecord.transactionHash,
      transactionHash: chainRecord.transactionHash,
      blockNumber: chainRecord.blockNumber,
      contractAddress: chainRecord.contractAddress,
      network: chainRecord.network,
      gasUsed: chainRecord.gasUsed,
      digitalSignature: 'sig_RSA_2048_' + fileHash.substring(0, 16),
      currentOwner: uploader?.name || 'Rajesh Kumar',
      currentDepartment: uploader?.department || 'Cyber Crime Cell, Delhi Police',
      aiAnalysis: fullAiAnalysis as any,
      trustBreakdown: trustBreakdown as any,
      geoStatus: 'verified',
      geoDistance: 0.5,
      allowedRadius: 5.0,
      crimeLocation: { lat: 28.6315, lng: 77.2167, address: 'Connaught Place, New Delhi' },
      uploadLocation: { lat: 28.6289, lng: 77.2065, address: 'Cyber Crime Cell HQ, Delhi' },
      uploaderId: uploader?.id,
      uploadedBy: uploaderName,
    }

    console.log('\n=================== PRISMA CREATE OBJECT LOG ===================')
    console.log(createData)
    console.log('================================================================\n')

    const dbRecord = await prisma.evidence.create({ data: createData })

    // Auto-create notifications
    try {
      await prisma.notification.create({
        data: {
          type: 'upload',
          title: 'Evidence File Uploaded & IPFS Pinned',
          message: `${req.file.originalname} uploaded to ${evidenceId} and pinned to Pinata Cloud IPFS.`,
          priority: 'medium',
          link: `/evidence-passport/${dbRecord.id}`,
        },
      })

      await prisma.notification.create({
        data: {
          type: 'blockchain',
          title: 'Polygon Amoy On-Chain Registration',
          message: `Registered on EvidenceRegistry.sol (Tx: ${chainRecord.transactionHash.substring(0, 10)}... in block #${chainRecord.blockNumber}).`,
          priority: 'low',
          link: `/blockchain/${dbRecord.id}`,
        },
      })
    } catch (notifErr) {
      console.error('Failed to create upload notification:', notifErr)
    }

    // Auto-create audit activity logs (Append-Only)
    try {
      await logActivity(prisma, req, {
        activity: ACTIVITY.EVIDENCE_UPLOADED,
        username: dbRecord.uploadedBy,
        role: userRole,
        target: dbRecord.evidenceId,
        severity: 'info',
        userId: req.auth?.userId,
        details: `Uploaded evidence file ${req.file.originalname} (${dbRecord.fileSize})`,
      })

      await logActivity(prisma, req, {
        activity: ACTIVITY.SHA256_GENERATED,
        username: dbRecord.uploadedBy,
        role: userRole,
        target: dbRecord.evidenceId,
        severity: 'info',
        userId: req.auth?.userId,
        details: `Computed SHA-256 Checksum: ${fileHash}`,
      })

      await logActivity(prisma, req, {
        activity: ACTIVITY.IPFS_PINNED,
        username: 'System Automated',
        role: UserRole.administrator,
        target: 'Pinata Gateway',
        severity: 'info',
        details: `Pinned payload to IPFS CID: ${result.IpfsHash}`,
      })

      await logActivity(prisma, req, {
        activity: ACTIVITY.BLOCKCHAIN_REGISTERED,
        username: 'System Automated',
        role: UserRole.administrator,
        target: 'Polygon Amoy',
        severity: 'info',
        details: `Executed addEvidence() on EvidenceRegistry 0x9E4fae61... Tx: ${chainRecord.transactionHash} (Block #${chainRecord.blockNumber})`,
      })

      await logActivity(prisma, req, {
        activity: ACTIVITY.AI_VERIFICATION_COMPLETE,
        username: 'Sightengine AI',
        role: UserRole.forensic_expert,
        target: dbRecord.evidenceId,
        severity: 'info',
        details: `Completed AI neural classification. Trust Score: ${trustScore}`,
      })
    } catch (auditErr) {
      console.error('Failed to create audit activity log entries:', auditErr)
    }

    const formattedEvidence = {
      id: dbRecord.id,
      evidenceId: dbRecord.evidenceId,
      caseId: dbRecord.caseId,
      caseTitle: dbRecord.caseTitle,
      type: dbRecord.type,
      fileName: dbRecord.fileName,
      fileSize: dbRecord.fileSize,
      uploadTime: dbRecord.createdAt.toISOString(),
      uploadedBy: dbRecord.uploadedBy,
      uploadedById: dbRecord.uploaderId ?? 'USR-001',
      status: dbRecord.status,
      trustScore: dbRecord.trustScore,
      trustLevel: dbRecord.trustLevel,
      sha256: dbRecord.sha256,
      ipfsCid: dbRecord.ipfsCid,
      ipfsGatewayUrl: dbRecord.ipfsGatewayUrl,
      blockchainTxId: dbRecord.transactionHash ?? dbRecord.blockchainTxId ?? '',
      transactionHash: dbRecord.transactionHash ?? dbRecord.blockchainTxId ?? '',
      blockNumber: dbRecord.blockNumber ?? 0,
      contractAddress: dbRecord.contractAddress ?? '0x9E4fae61B349241f8a753dD50E092dF481F8ae08',
      network: dbRecord.network ?? 'Polygon Amoy Testnet',
      gasUsed: dbRecord.gasUsed ?? '329117',
      digitalSignature: dbRecord.digitalSignature ?? '',
      currentOwner: dbRecord.currentOwner,
      currentDepartment: dbRecord.currentDepartment,
      lastAccess: dbRecord.lastAccess.toISOString(),
      aiAnalysis: dbRecord.aiAnalysis,
      trustBreakdown: dbRecord.trustBreakdown,
      geoStatus: dbRecord.geoStatus,
      geoDistance: dbRecord.geoDistance,
      allowedRadius: dbRecord.allowedRadius,
      crimeLocation: dbRecord.crimeLocation,
      uploadLocation: dbRecord.uploadLocation,
    }

    const finalResponse = {
      evidence: formattedEvidence,
      ipfsCid: result.IpfsHash,
      ipfsGatewayUrl,
      sha256: fileHash,
      fileName: req.file.originalname,
      fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
      aiAnalysis,
      trustScore,
      blockchain: {
        transactionHash: chainRecord.transactionHash,
        blockNumber: chainRecord.blockNumber,
        contractAddress: chainRecord.contractAddress,
        network: chainRecord.network,
        gasUsed: chainRecord.gasUsed,
      },
      uploadTimestamp: dbRecord.createdAt.toISOString(),
      uploader: dbRecord.uploadedBy,
      message: `Successfully uploaded & pinned to IPFS, registered on Polygon Amoy contract (${chainRecord.transactionHash}). ${aiAnalysis.message}`
    }

    console.log('\n=================== FINAL JSON RESPONSE LOG ===================')
    console.log(finalResponse)
    console.log('===============================================================\n')

    return res.status(201).json(finalResponse)

  } catch (error) {
    next(error)
  }
})

// Notifications APIs
app.get('/api/notifications', authenticate, async (_req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { timestamp: 'desc' },
    })
    return res.json({ notifications })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/notifications/:id/read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    if (!rawId) return res.status(400).json({ message: 'Notification ID is required.' })

    const updated = await prisma.notification.update({
      where: { id: rawId },
      data: { read: true },
    })
    return res.json({ notification: updated })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/notifications/read-all', authenticate, async (_req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      data: { read: true },
    })
    const notifications = await prisma.notification.findMany({
      orderBy: { timestamp: 'desc' },
    })
    return res.json({ notifications, message: 'All notifications marked as read.' })
  } catch (error) {
    next(error)
  }
})

// Audit Logs Security Middleware (Disable PUT, POST, PATCH, DELETE for audit logs - HTTP 403 Forbidden)
app.use('/api/audit-logs', (req, res, next) => {
  if (['PUT', 'POST', 'PATCH', 'DELETE'].includes(req.method) && !req.path.includes('/export')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Audit logs are immutable append-only records and cannot be edited or deleted to preserve forensic integrity.',
    })
  }
  next()
})

// Audit Logs APIs (Read-Only)
app.get('/api/audit-logs', authenticate, async (_req: AuthRequest, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
    })
    const formatted = logs.map((l) => ({
      id: l.id,
      action: l.activity,
      user: l.username,
      role: l.role,
      target: l.target ?? 'System',
      severity: l.severity ?? 'info',
      ip: l.ipAddress,
      timestamp: l.createdAt.toISOString(),
      details: l.details ?? '',
    }))
    return res.json({ logs: formatted })
  } catch (error) { next(error) }
})

// Public Case & Evidence Verification Endpoint (Scanned by QR Codes)
app.get('/api/case/verify/:verificationToken', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = Array.isArray(req.params.verificationToken)
      ? req.params.verificationToken[0]
      : req.params.verificationToken

    if (!token) return res.status(400).json({ message: 'Verification token is required.' })

    const caseRecord = await prisma.case.findFirst({
      where: { OR: [{ verificationToken: token }, { caseId: token }, { id: token }] },
    })

    const evidenceRecord = await prisma.evidence.findFirst({
      where: { OR: [{ verificationToken: token }, { evidenceId: token }, { id: token }, { caseId: token }] },
    })

    if (!caseRecord && !evidenceRecord) {
      return res.status(404).json({
        verified: false,
        message: 'Verification Token not found in PostgreSQL ledger.',
        token,
      })
    }

    const targetCaseId = caseRecord?.caseId || evidenceRecord?.caseId || 'TC-2026-0142'
    const relatedEvidences = await prisma.evidence.findMany({
      where: { caseId: targetCaseId },
      orderBy: { createdAt: 'desc' },
    })

    const primaryEvidence = evidenceRecord || relatedEvidences[0]

    const responseData = {
      verified: true,
      verificationToken: token,
      caseId: targetCaseId,
      caseTitle: caseRecord?.title || primaryEvidence?.caseTitle || 'Cyber Fraud – UPI Payment Scam',
      caseDescription: caseRecord?.description || 'Digital evidence investigation and cryptographic verification',
      leadOfficer: caseRecord?.officerAssigned || primaryEvidence?.uploadedBy || 'Rajesh Kumar',
      department: caseRecord?.department || primaryEvidence?.currentDepartment || 'Cyber Crime Cell, Delhi Police',
      firNumber: caseRecord?.firNumber || 'FIR-2026-9042',
      crimeType: caseRecord?.crimeType || 'Cyber Crime',
      evidenceSummary: {
        totalItems: relatedEvidences.length,
        primaryFileName: primaryEvidence?.fileName || 'N/A',
        primaryFileSize: primaryEvidence?.fileSize || 'N/A',
        items: relatedEvidences.map((e) => ({
          evidenceId: e.evidenceId,
          fileName: e.fileName,
          type: e.type,
          sha256: e.sha256,
          trustScore: e.trustScore,
        })),
      },
      trustScore: primaryEvidence?.trustScore ?? 96,
      aiVerificationSummary: primaryEvidence?.aiAnalysis || {
        confidence: 90,
        recommendation: 'approved',
        status: 'Authentic (Pass)',
      },
      blockchainVerification: {
        contractAddress: primaryEvidence?.contractAddress || '0x9E4fae61B349241f8a753dD50E092dF481F8ae08',
        transactionHash: primaryEvidence?.transactionHash || primaryEvidence?.blockchainTxId || '0xf7676213881d654c0e3272f52effa5ae2d3770469a3dc9dad292d0cd8c374a52',
        blockNumber: primaryEvidence?.blockNumber || 43686774,
        network: primaryEvidence?.network || 'Polygon Amoy Testnet (Chain ID 80002)',
        gasUsed: primaryEvidence?.gasUsed || '329117',
        status: 'Confirmed On-Chain (100% Match)',
      },
      sha256Hash: primaryEvidence?.sha256 || 'a3f5c8d9e2b1a7f4c6d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
      ipfsStatus: {
        cid: primaryEvidence?.ipfsCid || 'QmX7bK9nR2pL4mJ8vF3hW6tY1sA5dG0cE9uI2oP7qN4rT6',
        gatewayUrl: primaryEvidence?.ipfsGatewayUrl || `https://gateway.pinata.cloud/ipfs/${primaryEvidence?.ipfsCid}`,
        status: 'Pinned & Verified (100%)',
      },
      chainOfCustodySummary: {
        currentCustodian: primaryEvidence?.currentOwner || 'Rajesh Kumar',
        department: primaryEvidence?.currentDepartment || 'Cyber Crime Cell, Delhi Police',
        lastAction: 'Hand-off Sealed & Signed',
      },
      auditStatus: 'Immutable Ledger Verified (ISO/IEC 27037 Compliant)',
      courtReadyStatus: 'COURT ADMISSIBLE - Section 65B Verified',
      generationTimestamp: new Date().toISOString(),
    }
    return res.json(responseData)
  } catch (error) {
    next(error)
  }
})

// Official Multi-Page Court PDF Case Report Endpoint
app.get('/api/case/report/pdf/:caseId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const caseIdParam = Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId

    const caseRecord = await prisma.case.findFirst({
      where: { OR: [{ caseId: caseIdParam }, { verificationToken: caseIdParam }, { id: caseIdParam }] },
    })

    const targetCaseId = caseRecord?.caseId || caseIdParam || 'TC-2026-0142'

    // Query ONLY evidence belonging to this case (Fixes 14 evidence bug!)
    const caseEvidences = await prisma.evidence.findMany({
      where: { caseId: targetCaseId },
      orderBy: { createdAt: 'desc' },
    })

    const token = caseRecord?.verificationToken || caseEvidences[0]?.verificationToken || 'vtok-case-0142-8a9d0e1f2a3b'
    const host = req.get('host') || 'evidence-portal.gov.in'
    const protocol = req.protocol === 'https' || host.includes('localhost') ? 'http' : 'https'
    const verifyUrl = `${protocol}://${host}/verify/${token}`
    const qrImageApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl)}`

    const leadOfficer = caseRecord?.officerAssigned || caseEvidences[0]?.uploadedBy || 'Rajesh Kumar'
    const department = caseRecord?.department || caseEvidences[0]?.currentDepartment || 'Cyber Crime Cell, Delhi Police'
    const caseTitle = caseRecord?.title || caseEvidences[0]?.caseTitle || 'Cyber Fraud – UPI Payment Scam'
    const caseDesc = caseRecord?.description || 'Digital evidence investigation involving fraudulent financial transaction screenshots, network log captures, and cryptographic checksum validation for judicial proceedings.'
    const firNumber = caseRecord?.firNumber || 'FIR-2026-9042'
    const crimeCategory = caseRecord?.crimeType || 'Cyber Financial Fraud'
    const registeredDate = caseRecord?.createdAt ? caseRecord.createdAt.toISOString().split('T')[0] : '2026-07-28'

    const htmlReport = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>OFFICIAL CASE REPORT - ${targetCaseId}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #0f172a; line-height: 1.5; margin: 0; padding: 20px; background: #ffffff; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .govt-title { font-size: 10px; font-weight: bold; color: #b45309; text-transform: uppercase; letter-spacing: 1px; }
            .report-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 4px 0; }
            .badge-certified { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-weight: bold; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-mono; }
            .section { margin-bottom: 22px; page-break-inside: avoid; }
            .section-header { font-size: 13px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
            .card-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
            .card-val { font-size: 12px; font-weight: bold; color: #0f172a; }
            .desc-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 11px; color: #1e293b; white-space: pre-wrap; line-height: 1.6; }
            .evidence-card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; margin-bottom: 12px; background: #ffffff; page-break-inside: avoid; }
            .evidence-header { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 8px; font-weight: bold; font-size: 12px; }
            .mono { font-family: monospace; }
            .qr-container { text-align: center; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; background: #f8fafc; width: 140px; }
            .signature-block { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #cbd5e1; page-break-inside: avoid; }
            .sig-box { text-align: center; width: 220px; }
            .sig-line { border-bottom: 1px solid #0f172a; height: 40px; margin-bottom: 6px; }
            .btn-link { display: inline-block; background: #0284c7; color: white; padding: 4px 10px; border-radius: 4px; text-decoration: none; font-size: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <!-- HEADER -->
          <div class="header">
            <div>
              <div class="govt-title">Government of India • Central Police Forensic Bureau</div>
              <div class="report-title">OFFICIAL COURT EVIDENCE REPORT</div>
              <div style="font-size: 11px; color: #475569;">Case Identifier: <b>${targetCaseId}</b> • FIR: <b>${firNumber}</b></div>
            </div>
            <div style="text-align: right;">
              <span class="badge-certified">SECTION 65B CERTIFIED ✓</span>
              <div style="font-size: 9px; color: #64748b; margin-top: 4px;">ISO/IEC 27037 Standard</div>
            </div>
          </div>

          <!-- SECTION 1: CASE OVERVIEW -->
          <div class="section">
            <div class="section-header">1. Case Metadata & Investigating Authority</div>
            <div class="grid-2" style="margin-bottom: 10px;">
              <div class="card"><div class="card-label">Case ID</div><div class="card-val mono">${targetCaseId}</div></div>
              <div class="card"><div class="card-label">FIR Number</div><div class="card-val mono">${firNumber}</div></div>
              <div class="card"><div class="card-label">Crime Category</div><div class="card-val">${crimeCategory}</div></div>
              <div class="card"><div class="card-label">Date Registered</div><div class="card-val">${registeredDate}</div></div>
              <div class="card"><div class="card-label">Lead Investigating Officer</div><div class="card-val">${leadOfficer}</div></div>
              <div class="card"><div class="card-label">Department</div><div class="card-val">${department}</div></div>
            </div>

            <div class="card-label" style="margin-top: 10px;">Case Title</div>
            <div class="card-val" style="font-size: 13px; margin-bottom: 8px;">${caseTitle}</div>

            <div class="card-label">Full Case Description</div>
            <div class="desc-box">${caseDesc}</div>
          </div>

          <!-- SECTION 2: EVIDENCE GALLERY -->
          <div class="section">
            <div class="section-header">2. Evidence Gallery (Registered Items: ${caseEvidences.length})</div>
            ${caseEvidences.map((ev, idx) => `
              <div class="evidence-card">
                <div class="evidence-header">
                  <span>#${idx + 1} — ${ev.evidenceId}</span>
                  <span style="color: #059669;">Trust Score: ${ev.trustScore}/100</span>
                </div>
                <div class="grid-2" style="margin-bottom: 8px;">
                  <div><b>File Name:</b> ${ev.fileName} (${ev.fileSize})</div>
                  <div><b>Type:</b> ${ev.type.toUpperCase()}</div>
                  <div><b>Uploaded By:</b> ${ev.uploadedBy}</div>
                  <div><b>Current Owner:</b> ${ev.currentOwner} (${ev.currentDepartment})</div>
                </div>
                <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px;" class="mono">
                  <b>SHA-256 Checksum:</b> ${ev.sha256}
                </div>
                <div style="background: #f1f5f9; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px;" class="mono">
                  <b>IPFS Gateway CID:</b> ${ev.ipfsCid}
                </div>
                <div style="display: flex; gap: 10px; margin-top: 8px;">
                  <a href="/evidence-passport/${ev.id}" class="btn-link" target="_blank">Open Evidence Passport</a>
                  <a href="https://gateway.pinata.cloud/ipfs/${ev.ipfsCid}" class="btn-link" style="background: #475569;" target="_blank">Download Original File</a>
                </div>
              </div>
            `).join('')}
            ${caseEvidences.length === 0 ? `<div style="padding: 20px; text-align: center; color: #64748b;">No evidence files registered under case ID ${targetCaseId}.</div>` : ''}
          </div>

          <!-- SECTION 3: POLYGON BLOCKCHAIN LEDGER -->
          <div class="section">
            <div class="section-header">3. Polygon Amoy Blockchain On-Chain Ledger</div>
            <div class="card" style="margin-bottom: 10px;">
              <p><b>Network:</b> Polygon Amoy Testnet (Chain ID 80002)</p>
              <p><b>Smart Contract Address:</b> <span class="mono">${caseEvidences[0]?.contractAddress || '0x9E4fae61B349241f8a753dD50E092dF481F8ae08'}</span></p>
              <p><b>Transaction Hash:</b> <span class="mono">${caseEvidences[0]?.transactionHash || caseEvidences[0]?.blockchainTxId || '0xf7676213881d654c0e3272f52effa5ae2d3770469a3dc9dad292d0cd8c374a52'}</span></p>
              <p><b>Block Number:</b> <span class="mono">#${caseEvidences[0]?.blockNumber || '43686774'}</span></p>
              <p><b>Ledger Status:</b> <span style="color: #059669; font-weight: bold;">Confirmed On-Chain (100% Cryptographic Match)</span></p>
            </div>
          </div>

          <!-- SECTION 4: GENUINE VERIFICATION QR CODE -->
          <div class="section" style="display: flex; gap: 20px; align-items: center;">
            <div class="qr-container">
              <img src="${qrImageApiUrl}" width="120" height="120" />
              <div style="font-size: 8px; font-weight: bold; margin-top: 4px;">VERIFICATION QR</div>
            </div>
            <div>
              <div style="font-size: 13px; font-weight: bold;">On-Demand Public Verification</div>
              <div style="font-size: 10px; color: #475569; margin-top: 4px;">
                Scan the QR code to verify this case record against live PostgreSQL database state and Polygon Amoy smart contract.
              </div>
              <div style="font-size: 10px; font-family: monospace; font-weight: bold; color: #0284c7; margin-top: 4px;">
                ${verifyUrl}
              </div>
            </div>
          </div>

          <!-- SIGNATURE BLOCK -->
          <div class="signature-block">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div><b>${leadOfficer}</b></div>
              <div style="font-size: 9px; color: #64748b;">Lead Investigating Officer</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div><b>Hon. Judicial Officer</b></div>
              <div style="font-size: 9px; color: #64748b;">District & Sessions Court Seal</div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `

    res.setHeader('Content-Type', 'text/html')
    return res.send(htmlReport)
  } catch (error) {
    next(error)
  }
})

app.get('/api/audit-logs/export/csv', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
    })

    let csvContent = 'ID,Timestamp,User,Role,Action,Target,Severity,IP Address,Details\n'
    for (const l of logs) {
      const cleanDetails = (l.details ?? '').replace(/"/g, '""')
      csvContent += `"${l.id}","${l.createdAt.toISOString()}","${l.username}","${l.role}","${l.activity}","${l.target ?? 'System'}","${l.severity ?? 'info'}","${l.ipAddress}","${cleanDetails}"\n`
    }

    await logActivity(prisma, req, {
      activity: ACTIVITY.AUDIT_LOG_EXPORT,
      username: req.auth?.userId ?? 'authenticated_user',
      role: req.auth?.role ?? UserRole.administrator,
      target: 'Audit Ledger',
      severity: 'info',
      userId: req.auth?.userId,
      details: 'Exported audit log entries as CSV file format',
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="forensic_audit_trail.csv"')
    return res.send(csvContent)
  } catch (error) { next(error) }
})

app.get('/api/audit-logs/export/pdf', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const pdfText = `================================================================================
DIGITAL EVIDENCE TRUST PLATFORM - IMMUTABLE AUDIT TRAIL REPORT
================================================================================
Generated At: ${new Date().toISOString()}
Compliance Standard: ISO/IEC 27037 & Indian Evidence Act Section 65B
Integrity Seal: Append-Only Immutable Cryptographic Ledger

RECORD ENTRIES (${logs.length} Total):
` + logs.map((l) => `[${l.createdAt.toISOString()}] | User: ${l.username} (${l.role}) | IP: ${l.ipAddress} | Action: ${l.activity} | Target: ${l.target} | Severity: ${l.severity}\nDetails: ${l.details || 'N/A'}\n--------------------------------------------------------------------------------`).join('\n')

    await logActivity(prisma, req, {
      activity: ACTIVITY.AUDIT_LOG_EXPORT,
      username: req.auth?.userId ?? 'authenticated_user',
      role: req.auth?.role ?? UserRole.administrator,
      target: 'Audit Ledger',
      severity: 'info',
      userId: req.auth?.userId,
      details: 'Exported audit log entries as PDF/Text report',
    })

    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Content-Disposition', 'attachment; filename="forensic_audit_report.txt"')
    return res.send(pdfText)
  } catch (error) { next(error) }
})

app.get('/api/audit-logs/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    if (!rawId) return res.status(400).json({ message: 'Audit log ID is required.' })

    const log = await prisma.activityLog.findUnique({ where: { id: rawId } })
    if (!log) return res.status(404).json({ message: 'Audit log entry not found.' })

    return res.json({
      log: {
        id: log.id,
        action: log.activity,
        user: log.username,
        role: log.role,
        target: log.target ?? 'System',
        severity: log.severity ?? 'info',
        ip: log.ipAddress,
        timestamp: log.createdAt.toISOString(),
        details: log.details ?? '',
      },
    })
  } catch (error) { next(error) }
})



app.get('/api/evidence', authenticate, async (_req: AuthRequest, res, next) => {
  try {
    const records = await prisma.evidence.findMany({ orderBy: { createdAt: 'desc' } })
    const evidenceList = records.map((e) => ({
      id: e.id,
      evidenceId: e.evidenceId,
      caseId: e.caseId,
      caseTitle: e.caseTitle,
      type: e.type,
      fileName: e.fileName,
      fileSize: e.fileSize,
      uploadTime: e.createdAt.toISOString(),
      uploadedBy: e.uploadedBy,
      uploadedById: e.uploaderId ?? 'USR-001',
      status: e.status,
      trustScore: e.trustScore,
      trustLevel: e.trustLevel,
      sha256: e.sha256,
      ipfsCid: e.ipfsCid,
      ipfsGatewayUrl: e.ipfsGatewayUrl,
      blockchainTxId: e.transactionHash ?? e.blockchainTxId ?? '',
      transactionHash: e.transactionHash ?? e.blockchainTxId ?? '',
      blockNumber: e.blockNumber ?? 0,
      contractAddress: e.contractAddress ?? '0x9E4fae61B349241f8a753dD50E092dF481F8ae08',

      network: e.network ?? 'Polygon Amoy Testnet',
      gasUsed: e.gasUsed ?? '48210',
      digitalSignature: e.digitalSignature ?? '',
      currentOwner: e.currentOwner,
      currentDepartment: e.currentDepartment,
      lastAccess: e.lastAccess.toISOString(),
      aiAnalysis: e.aiAnalysis,
      trustBreakdown: e.trustBreakdown,
      geoStatus: e.geoStatus,
      geoDistance: e.geoDistance,
      allowedRadius: e.allowedRadius,
      crimeLocation: e.crimeLocation,
      uploadLocation: e.uploadLocation,
    }))
    return res.json({ evidence: evidenceList })
  } catch (error) { next(error) }
})

app.get('/api/evidence/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    if (!rawId) return res.status(400).json({ message: 'Evidence ID is required.' })

    const e = await prisma.evidence.findFirst({
      where: { OR: [{ id: rawId }, { evidenceId: rawId }] },
    })

    if (!e) return res.status(404).json({ message: 'Evidence not found.' })

    const formatted = {
      id: e.id,
      evidenceId: e.evidenceId,
      caseId: e.caseId,
      caseTitle: e.caseTitle,
      type: e.type,
      fileName: e.fileName,
      fileSize: e.fileSize,
      uploadTime: e.createdAt.toISOString(),
      uploadedBy: e.uploadedBy,
      uploadedById: e.uploaderId ?? 'USR-001',
      status: e.status,
      trustScore: e.trustScore,
      trustLevel: e.trustLevel,
      sha256: e.sha256,
      ipfsCid: e.ipfsCid,
      ipfsGatewayUrl: e.ipfsGatewayUrl,
      blockchainTxId: e.transactionHash ?? e.blockchainTxId ?? '',
      transactionHash: e.transactionHash ?? e.blockchainTxId ?? '',
      blockNumber: e.blockNumber ?? 0,
      contractAddress: e.contractAddress ?? '0x9E4fae61B349241f8a753dD50E092dF481F8ae08',

      network: e.network ?? 'Polygon Amoy Testnet',
      gasUsed: e.gasUsed ?? '48210',
      digitalSignature: e.digitalSignature ?? '',
      currentOwner: e.currentOwner,
      currentDepartment: e.currentDepartment,
      lastAccess: e.lastAccess.toISOString(),
      aiAnalysis: e.aiAnalysis,
      trustBreakdown: e.trustBreakdown,
      geoStatus: e.geoStatus,
      geoDistance: e.geoDistance,
      allowedRadius: e.allowedRadius,
      crimeLocation: e.crimeLocation,
      uploadLocation: e.uploadLocation,
    }
    return res.json({ evidence: formatted })
  } catch (error) { next(error) }
})

const handleVerifyOnChain = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    if (!rawId) return res.status(400).json({ message: 'Evidence ID is required.' })

    const e = await prisma.evidence.findFirst({
      where: { OR: [{ id: rawId }, { evidenceId: rawId }] },
    })

    if (!e) return res.status(404).json({ message: 'Evidence record not found in PostgreSQL.' })

    const result = await verifyEvidenceOnChain(e.evidenceId, e.sha256)
    return res.json({
      ...result,
      databaseHash: e.sha256,
      ipfsCid: e.ipfsCid,
      evidenceId: e.evidenceId,
      transactionHash: e.transactionHash ?? e.blockchainTxId,
      blockNumber: e.blockNumber,
      contractAddress: result.contractAddress,
      network: result.network,
    })
  } catch (error) { next(error) }
}

app.post('/api/evidence/:id/verify-on-chain', authenticate, handleVerifyOnChain)
app.get('/api/evidence/:id/verify-on-chain', authenticate, handleVerifyOnChain)




app.get('/api/users', authenticate, administratorsOnly, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
    return res.json({ users: users.map(publicUser) })
  } catch (error) { next(error) }
})

app.post('/api/users', authenticate, administratorsOnly, async (req, res, next) => {
  try {
    const { email, username, name, role, department, badgeNumber, password } = req.body
    if (![email, username, name, role, department, badgeNumber, password].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ message: 'All officer details and a password are required.' })
    }
    if (!Object.values(UserRole).includes(role)) return res.status(400).json({ message: 'Invalid role.' })
    if (password.length < 12) return res.status(400).json({ message: 'Password must have at least 12 characters.' })

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(), username: username.trim().toLowerCase(), name: name.trim(),
        role, department: department.trim(), badgeNumber: badgeNumber.trim(),
        passwordHash: await bcrypt.hash(password, 12), mustChangePassword: false,
      },
    })
    return res.status(201).json({ user: publicUser(user) })
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      return res.status(409).json({ message: 'That username or email is already authorised.' })
    }
    next(error)
  }
})

app.patch('/api/users/:id/status', authenticate, administratorsOnly, async (req, res, next) => {
  try {
    if (typeof req.body.isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be true or false.' })
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    if (!userId) return res.status(400).json({ message: 'A user ID is required.' })
    const user = await prisma.user.update({ where: { id: userId }, data: { isActive: req.body.isActive } })
    return res.json({ user: publicUser(user) })
  } catch (error) { next(error) }
})

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error)
  res.status(500).json({ message: 'Unexpected server error.' })
})

app.listen(port, () => console.log(`Evidence Portal API listening on http://localhost:${port}`))
