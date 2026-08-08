import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetTestOfficer() {
  console.log('Resetting test_officer_2026 account state in Neon DB...')
  const passwordHash = await bcrypt.hash('Password123!', 10)

  const updated = await prisma.user.update({
    where: { username: 'test_officer_2026' },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true,
    },
  })

  console.log('Successfully updated officer account:', updated.username)
  await prisma.$disconnect()
}

resetTestOfficer()
