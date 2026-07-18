import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { PrismaClient, UserRole } from '@prisma/client'
import multer from 'multer'
import crypto from 'crypto'

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
}) {
  return user
}

function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.header('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: 'Authentication required.' })
  try {
    const payload = jwt.verify(token, jwtSecret) as JwtPayload
    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') throw new Error('Invalid token')
    req.auth = { userId: payload.sub, role: payload.role as UserRole }
    next()
  } catch {
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

  if (!file.mimetype.startsWith('image/')) return unavailable('Sightengine live analysis is currently available for image evidence only.')
  if (!apiUser || !apiSecret) return unavailable('Sightengine is not configured. Add SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET to the server .env file.')

  const body = new FormData()
  body.append('media', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname)
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

    const apiKey = process.env.PINATA_API_KEY
    const apiSecret = process.env.PINATA_API_SECRET

    // Check if real Pinata keys are configured
    if (!apiKey || !apiSecret || apiSecret.includes('your_pinata_api_secret_here') || apiSecret === '') {
      // Fallback: If no secret is configured, generate a mock but valid-looking IPFS CID
      const mockCid = 'Qm' + Array.from({ length: 44 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
      const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex')
      return res.json({
        ipfsCid: mockCid,
        sha256: fileHash,
        fileName: req.file.originalname,
        fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
        aiAnalysis,
        message: `Mock IPFS upload (configure PINATA_API_SECRET in .env for real upload). ${aiAnalysis.message}`
      })
    }

    // Prepare FormData for Pinata API
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype })
    formData.append('file', blob, req.file.originalname)

    const metadata = JSON.stringify({
      name: req.file.originalname,
      keyvalues: {
        uploadedById: req.auth?.userId || 'unknown',
      }
    })
    formData.append('pinataMetadata', metadata)

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': apiSecret,
      },
      body: formData
    })

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text()
      throw new Error(`Pinata upload failed: ${pinataResponse.statusText} - ${errorText}`)
    }

    const result = (await pinataResponse.json()) as { IpfsHash: string }
    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex')

    return res.json({
      ipfsCid: result.IpfsHash,
      sha256: fileHash,
      fileName: req.file.originalname,
      fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
      aiAnalysis,
      message: `Successfully uploaded and pinned to IPFS via Pinata. ${aiAnalysis.message}`
    })
  } catch (error) {
    next(error)
  }
})

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
