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
  ACCESS_REQUEST_CREATED: 'Access Request Created',
  ACCESS_REQUEST_APPROVED: 'Access Request Approved',
  ACCESS_REQUEST_REJECTED: 'Access Request Rejected',
  CASE_ACCESS_GRANTED: 'Case Access Granted',
  EVIDENCE_ACCESS_GRANTED: 'Evidence Access Granted',
  ACCESS_DENIED: 'Access Denied',
  CASE_VIEWED: 'Case Viewed',
  EVIDENCE_DOWNLOADED: 'Evidence Downloaded',
  REPORT_DOWNLOADED: 'Report Downloaded',
  LOGIN_FAILED: 'Login Failed',
  JUDGE_CASE_REVIEW_STARTED: 'Judicial Review Started',
  JUDGE_CASE_REVIEW_COMPLETED: 'Judicial Review Completed',
  JUDICIAL_NOTE_CREATED: 'Judicial Note Created',
  JUDICIAL_NOTE_UPDATED: 'Judicial Note Updated',
  JUDICIAL_CLARIFICATION_REQUESTED: 'Judicial Clarification Requested',
  JUDICIAL_CLARIFICATION_RESPONDED: 'Judicial Clarification Responded',
  JUDGE_REPORT_DOWNLOADED: 'Judicial Case Report Downloaded',
  SECURE_CAPTURE_STARTED: 'Secure Capture Started',
  SECURE_CAPTURE_COMPLETED: 'Secure Capture Completed',
  CAPTURE_LOCATION_RECORDED: 'Capture Location Recorded',
  CAPTURE_SHA256_GENERATED: 'Capture SHA-256 Generated',
  SERVER_HASH_VERIFIED: 'Server Hash Verified',
  INTEGRITY_MISMATCH: 'Integrity Mismatch Detected',
  UNASSIGNED_EVIDENCE_REGISTERED: 'Unassigned Evidence Registered',
  EVIDENCE_ASSIGNED_TO_CASE: 'Evidence Assigned to Case',
  OTP_GENERATED: 'OTP Generated',
  OTP_VERIFIED: 'OTP Verified',
  REFRESH_TOKEN: 'Refresh Token Issued',
  BIOMETRIC_LOGIN: 'Biometric Re-Authentication',
  DEVICE_REGISTERED: 'Trusted Device Registered',
  DEVICE_REMOVED: 'Trusted Device Revoked',
  ACCOUNT_LOCKED: 'Account Locked (Brute Force Protection)',
  PASSWORD_RESET: 'Password Reset Completed',
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
