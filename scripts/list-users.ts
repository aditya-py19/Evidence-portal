import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      badgeNumber: true,
      mobileNumber: true,
      role: true,
      isActive: true,
    },
  })

  console.log('Registered Users in PostgreSQL DB:')
  console.table(users)
  await prisma.$disconnect()
}

listUsers()
