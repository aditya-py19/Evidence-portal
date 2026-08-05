import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const jwtSecret = process.env.JWT_SECRET || 'trustchain_secure_jwt_secret_key_2026'

async function testAuth() {
  const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, isActive: true } })
  const officerUser = users.find(u => u.role === 'investigating_officer')
  const adminUser = users.find(u => u.role === 'administrator')
  const judgeUser = users.find(u => u.role === 'judge')

  console.log('Testing Officer (investigating_officer) Upload...')
  if (officerUser) {
    const officerToken = jwt.sign({ role: officerUser.role }, jwtSecret, { subject: officerUser.id, expiresIn: '1h' })
    const formData = new FormData()
    const blob = new Blob(['test image payload'], { type: 'image/png' })
    formData.append('file', blob, 'test_evidence.png')
    formData.append('caseId', 'TC-2026-0142')
    formData.append('note', 'Test field note from investigating officer')

    const res = await fetch('http://localhost:4000/api/evidence/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: formData
    })
    console.log('Officer /api/evidence/upload Status:', res.status)
    const json = await res.json()
    console.log('Officer Upload Response:', json)
  }
}

testAuth()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
