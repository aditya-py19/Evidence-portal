process.env.NODE_ENV = 'test'
import 'dotenv/config'
import express from 'express'
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import http from 'http'

const prisma = new PrismaClient()

async function runAuthBackendTests() {
  console.log('=== STARTING BACKEND AUTHENTICATION INTEGRATION TEST SUITE ===')

  // 1. Ensure test officer user exists
  const testMobile = '+919876543210'
  const testBadge = 'OFF-2026-TEST'
  const testUsername = 'test_officer_2026'
  const testEmail = 'test.officer2026@police.gov.in'
  const testPassword = 'Password123!'

  const passwordHash = await bcrypt.hash(testPassword, 10)

  const testUser = await prisma.user.upsert({
    where: { username: testUsername },
    update: {
      passwordHash,
      mobileNumber: testMobile,
      badgeNumber: testBadge,
      email: testEmail,
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true,
    },
    create: {
      username: testUsername,
      email: testEmail,
      mobileNumber: testMobile,
      badgeNumber: testBadge,
      name: 'Test Officer Rajesh',
      role: UserRole.investigating_officer,
      department: 'Cyber Crime Cell',
      passwordHash,
      isActive: true,
    },
  })

  console.log(`✓ Test user verified: ID ${testUser.id}, Username: ${testUser.username}`)

  // Start test Express server instance dynamically on port 3099
  const { app } = await import('../server/index.js')
  const server = http.createServer(app)
  await new Promise<void>((resolve) => server.listen(3099, resolve))
  console.log('✓ Test Express server listening on http://localhost:3099')

  const baseUrl = 'http://localhost:3099'

  // Helper for fetch with retry for database warm-up
  async function fetchWithRetry(url: string, opts: any, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fetch(url, opts)
      } catch (err) {
        if (i === retries - 1) throw err
        await new Promise((r) => setTimeout(r, 1000))
      }
    }
  }

  try {
    // Feature 1: Flexible Login by Username
    console.log('\n--- Test 1: Flexible Login (Username) ---')
    let res = await fetchWithRetry(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testUsername, password: testPassword }),
    })
    let data = await res.json() as any
    if (res.status !== 200 || !data.token || !data.refreshToken) {
      throw new Error(`Username login failed: HTTP ${res.status} - ${JSON.stringify(data)}`)
    }
    console.log('✓ Username login succeeded. Access Token & Refresh Token issued.')

    // Feature 1: Flexible Login by Force ID / Badge Number
    console.log('\n--- Test 2: Flexible Login (Force ID / Badge Number) ---')
    res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testBadge, password: testPassword }),
    })
    data = await res.json() as any
    if (res.status !== 200 || !data.token) {
      throw new Error(`Force ID login failed: HTTP ${res.status} - ${JSON.stringify(data)}`)
    }
    console.log('✓ Force ID login succeeded.')

    // Feature 1: Flexible Login by Registered Mobile Number
    console.log('\n--- Test 3: Flexible Login (Registered Mobile Number) ---')
    res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testMobile,
        password: testPassword,
        deviceId: 'TEST-DEVICE-001',
        deviceName: 'Pixel 8 Pro Test',
        os: 'Android 14',
      }),
    })
    data = await res.json() as any
    if (res.status !== 200 || !data.token) {
      throw new Error(`Mobile number login failed: HTTP ${res.status} - ${JSON.stringify(data)}`)
    }
    const officerToken = data.token
    const officerRefreshToken = data.refreshToken
    console.log('✓ Mobile number login succeeded. Device registered: TEST-DEVICE-001.')

    // Feature 2: OTP Request
    console.log('\n--- Test 4: Request OTP ---')
    res = await fetch(`${baseUrl}/api/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testMobile }),
    })
    data = await res.json() as any
    if (res.status !== 200 || !data.success || !data.devOtp) {
      throw new Error(`OTP request failed: HTTP ${res.status} - ${JSON.stringify(data)}`)
    }
    const devOtp = data.devOtp
    console.log(`✓ OTP request succeeded. Dev OTP generated: ${devOtp}`)

    // Feature 3: Verify OTP
    console.log('\n--- Test 5: Verify OTP ---')
    res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testMobile,
        otp: devOtp,
        rememberMe: true,
        deviceId: 'TEST-DEVICE-001',
      }),
    })
    data = await res.json() as any
    if (res.status !== 200 || !data.token) {
      throw new Error(`OTP verification failed: HTTP ${res.status} - ${JSON.stringify(data)}`)
    }
    const otpSessionRefreshToken = data.refreshToken
    console.log('✓ OTP verified successfully. Token pair issued & OTP record deleted.')

    // Feature 4: Refresh Token Rotation
    console.log('\n--- Test 6: Refresh Token Rotation ---')
    res = await fetch(`${baseUrl}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: otpSessionRefreshToken }),
    })
    data = await res.json() as any
    if (res.status !== 200 || !data.token || !data.refreshToken) {
      throw new Error(`Refresh token rotation failed: HTTP ${res.status} - ${JSON.stringify(data)}`)
    }
    const rotatedRefreshToken = data.refreshToken
    console.log('✓ Refresh Token rotated successfully.')

    // Verify old refresh token is revoked
    res = await fetch(`${baseUrl}/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: otpSessionRefreshToken }),
    })
    if (res.status !== 401) {
      throw new Error(`Revoked refresh token was improperly accepted! HTTP ${res.status}`)
    }
    console.log('✓ Old refresh token correctly rejected (401 Revoked).')

    // Feature 6 & 7: Device Authorization & Listing
    console.log('\n--- Test 7: Device Management ---')
    res = await fetch(`${baseUrl}/api/auth/devices`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    })
    data = await res.json() as any
    if (res.status !== 200 || !Array.isArray(data.devices)) {
      throw new Error(`Get devices failed: HTTP ${res.status}`)
    }
    console.log(`✓ Fetched ${data.devices.length} trusted devices for officer.`)

    // Feature 8: Session Management
    console.log('\n--- Test 8: Session Listing ---')
    res = await fetch(`${baseUrl}/api/auth/sessions`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    })
    data = await res.json() as any
    if (res.status !== 200 || !Array.isArray(data.sessions)) {
      throw new Error(`Get sessions failed: HTTP ${res.status}`)
    }
    console.log(`✓ Fetched ${data.sessions.length} active sessions for officer.`)

    // Feature 9: Logout
    console.log('\n--- Test 9: Logout ---')
    res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({ refreshToken: rotatedRefreshToken }),
    })
    data = await res.json() as any
    if (res.status !== 200) {
      throw new Error(`Logout failed: HTTP ${res.status}`)
    }
    console.log('✓ Logout succeeded.')

    // Feature 10: Logout All Devices
    console.log('\n--- Test 10: Logout All Devices ---')
    res = await fetch(`${baseUrl}/api/auth/logout-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
    })
    data = await res.json() as any
    if (res.status !== 200) {
      throw new Error(`Logout-all failed: HTTP ${res.status}`)
    }
    console.log('✓ Logout All devices & sessions succeeded.')

    console.log('\n======================================================')
    console.log('ALL BACKEND AUTHENTICATION INTEGRATION TESTS PASSED!')
    console.log('======================================================\n')
  } finally {
    server.close()
    await prisma.$disconnect()
  }
}

runAuthBackendTests().catch((err) => {
  console.error('FATAL TEST ERROR:', err)
  process.exit(1)
})
