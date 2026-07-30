import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123456", 12)

  await prisma.user.create({
    data: {
      email: "admin@trustchain.com",
      username: "admin",
      name: "Administrator",
      role: UserRole.administrator,
      department: "Administration",
      badgeNumber: "ADMIN001",
      passwordHash,
      isActive: true,
      mustChangePassword: false
    }
  })

  console.log("✅ Admin user created")
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })