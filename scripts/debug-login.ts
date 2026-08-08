import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function debugLogin() {
  try {
    const identifier = 'test_officer_2026'
    const password = 'Password123!'

    console.log('1. Querying user by identifier...')
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
          { badgeNumber: identifier },
          { mobileNumber: identifier },
        ],
      },
    })
    console.log('User found:', user ? { id: user.id, username: user.username, role: user.role } : null)

    if (user) {
      console.log('2. Comparing bcrypt password...')
      const isValid = await bcrypt.compare(password, user.passwordHash)
      console.log('Password valid:', isValid)

      console.log('3. Upserting device...')
      const device = await prisma.device.upsert({
        where: { userId_deviceId: { userId: user.id, deviceId: 'PROD-TEST-DEVICE' } },
        update: { deviceName: 'Test Phone', os: 'Android', appVersion: '1.0.0', lastLoginAt: new Date(), isRevoked: false },
        create: { userId: user.id, deviceId: 'PROD-TEST-DEVICE', deviceName: 'Test Phone', os: 'Android', appVersion: '1.0.0', lastLoginAt: new Date() },
      })
      console.log('Device upserted:', device)

      console.log('4. Creating session...')
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          deviceId: device.id,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
          loginTime: new Date(),
          lastActivity: new Date(),
        },
      })
      console.log('Session created:', session.id)

      console.log('5. Creating refresh token...')
      const refreshToken = await prisma.refreshToken.create({
        data: {
          tokenHash: 'hash1234567890',
          userId: user.id,
          deviceId: device.id,
          sessionId: session.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })
      console.log('Refresh token created:', refreshToken.id)
    }
  } catch (err: any) {
    console.error('Debug error stack:', err)
  } finally {
    await prisma.$disconnect()
  }
}

debugLogin()
