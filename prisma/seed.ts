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

  const initialEvidences = [
    {
      evidenceId: 'EVD-TC-2026-0142-001',
      caseId: 'TC-2026-0142',
      caseTitle: 'Cyber Fraud – UPI Payment Scam',
      type: 'image',
      fileName: 'phishing_screenshot_01.png',
      fileSize: '2.4 MB',
      ipfsCid: 'QmX7bK9nR2pL4mJ8vF3hW6tY1sA5dG0cE9uI2oP7qN4rT6',
      ipfsGatewayUrl: 'https://gateway.pinata.cloud/ipfs/QmX7bK9nR2pL4mJ8vF3hW6tY1sA5dG0cE9uI2oP7qN4rT6',
      sha256: 'a3f5c8d9e2b1a7f4c6d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
      trustScore: 96,
      trustLevel: 'highly_trusted',
      status: 'approved',
      uploadedBy: 'Rajesh Kumar',
      blockchainTxId: 'tx_8f3a2b1c9d0e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0',
      blockNumber: 2847591,
      digitalSignature: 'sig_RSA_2048_a3f5c8d9e2b1a7f4',
      currentOwner: 'Rajesh Kumar',
      currentDepartment: 'Cyber Crime Cell, Delhi Police',
      aiAnalysis: {
        deepfakeDetection: { score: 92, status: 'Clean' },
        imageForgery: { score: 97, status: 'Authentic' },
        videoTampering: { score: 92, status: 'Intact' },
        metadataAnalysis: { score: 95, status: 'Consistent' },
        duplicateDetection: { score: 98, status: 'Unique' },
        blurDetection: { score: 92, status: 'Acceptable Quality' },
        aiGeneratedContent: { score: 92, status: 'Human Created' },
        riskScore: 8,
        confidence: 90,
        recommendation: 'approved',
      },
      trustBreakdown: { aiVerification: 96, metadataConsistency: 98, sha256Hash: 100, digitalSignature: 97, chainOfCustody: 95, geolocation: 94, blockchain: 100 },
      geoStatus: 'verified',
      geoDistance: 1.2,
      allowedRadius: 5.0,
      crimeLocation: { lat: 28.6315, lng: 77.2167, address: 'Connaught Place, New Delhi' },
      uploadLocation: { lat: 28.6289, lng: 77.2065, address: 'Cyber Crime Cell HQ, Delhi' },
    },
    {
      evidenceId: 'EVD-TC-2026-0138-003',
      caseId: 'TC-2026-0138',
      caseTitle: 'Digital Evidence Tampering – Hit & Run',
      type: 'video',
      fileName: 'cctv_footage_ringroad.mp4',
      fileSize: '156.8 MB',
      ipfsCid: 'QmY8cL0oS3qM5nK9wG4iX7uZ2tB6eH1dF0vJ3pQ8rO5sU7',
      ipfsGatewayUrl: 'https://gateway.pinata.cloud/ipfs/QmY8cL0oS3qM5nK9wG4iX7uZ2tB6eH1dF0vJ3pQ8rO5sU7',
      sha256: 'b4e6d7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
      trustScore: 34,
      trustLevel: 'high_risk',
      status: 'high_risk',
      uploadedBy: 'Vikram Singh',
      blockchainTxId: 'tx_7e2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2',
      blockNumber: 2845102,
      digitalSignature: 'sig_RSA_2048_b4e6d7f8a9b0c1d2',
      currentOwner: 'Priya Sharma',
      currentDepartment: 'Central Forensic Science Laboratory',
      aiAnalysis: {
        deepfakeDetection: { score: 22, status: 'Suspicious' },
        imageForgery: { score: 27, status: 'Anomalies Detected' },
        videoTampering: { score: 22, status: 'Tampering Detected' },
        metadataAnalysis: { score: 95, status: 'Consistent' },
        duplicateDetection: { score: 98, status: 'Unique' },
        blurDetection: { score: 92, status: 'Acceptable Quality' },
        aiGeneratedContent: { score: 22, status: 'Human Created' },
        riskScore: 78,
        confidence: 88,
        recommendation: 'high_risk',
      },
      trustBreakdown: { aiVerification: 22, metadataConsistency: 45, sha256Hash: 100, digitalSignature: 60, chainOfCustody: 70, geolocation: 30, blockchain: 100 },
      geoStatus: 'outside_boundary',
      geoDistance: 12.8,
      allowedRadius: 5.0,
      crimeLocation: { lat: 28.5244, lng: 77.1855, address: 'Ring Road, South Delhi' },
      uploadLocation: { lat: 28.6139, lng: 77.2090, address: 'Mumbai Police HQ' },
    },
  ]

  for (const item of initialEvidences) {
    await prisma.evidence.upsert({
      where: { evidenceId: item.evidenceId },
      update: {},
      create: item,
    })
  }
}

main().finally(() => prisma.$disconnect())

