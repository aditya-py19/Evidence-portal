import type { Request } from 'express'
import { PrismaClient, UserRole } from '@prisma/client'

export const ACTIVITY = {
  ADMINISTRATOR_LOGIN: 'Administrator Login',
  ADMINISTRATOR_LOGOUT: 'Administrator Logout',
  OFFICER_LOGIN: 'Officer Login',
  OFFICER_LOGOUT: 'Officer Logout',
  OFFICER_CREATED: 'Officer Created',
  OFFICER_UPDATED: 'Officer Updated',
  EVIDENCE_UPLOADED: 'Evidence Uploaded',
  EVIDENCE_VIEWED: 'Evidence Viewed',
  EVIDENCE_DOWNLOADED: 'Evidence Downloaded',
} as const

export function getClientIp(req: Request): string {
  const forwarded = req.header('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown'
  return req.socket.remoteAddress ?? 'unknown'
}

export async function logActivity(
  prisma: PrismaClient,
  req: Request,
  data: {
    activity: string
    username: string
    role: UserRole
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
        ipAddress: getClientIp(req),
        userId: data.userId,
        details: data.details,
      },
    })
  } catch (error) {
    console.error('Failed to write activity log:', error)
  }
}
