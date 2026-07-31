import type { Request } from 'express'
import { PrismaClient, UserRole } from '@prisma/client'

export const ACTIVITY = {
  ADMINISTRATOR_LOGIN: 'Administrator Login',
  ADMINISTRATOR_LOGOUT: 'Administrator Logout',
  OFFICER_LOGIN: 'Officer Login',
  OFFICER_LOGOUT: 'Officer Logout',
  JUDGE_LOGIN: 'Judge Login',
  OFFICER_CREATED: 'Officer Created',
  OFFICER_UPDATED: 'Officer Updated',
  EVIDENCE_UPLOADED: 'Evidence Uploaded',
  SHA256_GENERATED: 'SHA-256 Checksum Computed',
  IPFS_PINNED: 'IPFS Storage Pinned',
  BLOCKCHAIN_REGISTERED: 'Polygon Amoy Registered',
  AI_VERIFICATION_COMPLETE: 'AI Forensic Verification',
  EVIDENCE_VIEWED: 'Evidence Viewed',
  EVIDENCE_VERIFIED: 'Evidence Verified On-Chain',
  AUDIT_LOG_EXPORT: 'Audit Trail Exported',
} as const

export function getClientIp(req: Request): string {
  const forwarded = req.header('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? '127.0.0.1'
  const ip = req.socket.remoteAddress ?? '127.0.0.1'
  return ip === '::1' ? '127.0.0.1' : ip
}

export async function logActivity(
  prisma: PrismaClient,
  req: Request,
  data: {
    activity: string
    username: string
    role: UserRole
    target?: string
    severity?: string
    userId?: string
    details?: string
  },
) {
  try {
    await prisma.activityLog.create({
      data: {
        activity: data.activity,
        username: data.username,
        role: data.role,
        target: data.target ?? 'System',
        severity: data.severity ?? 'info',
        ipAddress: getClientIp(req),
        userId: data.userId,
        details: data.details,
      },
    })
  } catch (error) {
    console.error('Failed to write activity log:', error)
  }
}
