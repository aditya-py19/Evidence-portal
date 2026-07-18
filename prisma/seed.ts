import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!password || password === 'set-a-strong-private-password') {
    throw new Error('Set SEED_ADMIN_PASSWORD in .env before seeding the administrator account.')
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@police.gov.in'
  const username = process.env.SEED_ADMIN_USERNAME ?? 'portal.admin'
  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email },
    update: { username, passwordHash, isActive: true, role: UserRole.administrator },
    create: {
      email,
      username,
      passwordHash,
      name: 'Portal Administrator',
      role: UserRole.administrator,
      department: 'Evidence Portal Administration',
      badgeNumber: 'ADMIN-001',
      isActive: true,
    },
  })

  const judgePassword = process.env.SEED_JUDGE_PASSWORD
  if (!judgePassword || judgePassword === 'set-a-strong-private-password') {
    throw new Error('Set SEED_JUDGE_PASSWORD in .env before seeding the judge account.')
  }
  const judgeEmail = process.env.SEED_JUDGE_EMAIL ?? 'judge@courts.gov.in'
  const judgeUsername = process.env.SEED_JUDGE_USERNAME ?? 'judge.portal'
  await prisma.user.upsert({
    where: { email: judgeEmail },
    update: { username: judgeUsername, passwordHash: await bcrypt.hash(judgePassword, 12), isActive: true, role: UserRole.judge },
    create: {
      email: judgeEmail, username: judgeUsername, passwordHash: await bcrypt.hash(judgePassword, 12),
      name: 'Hon. Justice Portal', role: UserRole.judge, department: 'District & Sessions Court',
      badgeNumber: 'JUDGE-001', isActive: true,
    },
  })
}

main().finally(() => prisma.$disconnect())
