export type UserRole =
  | 'police_officer'
  | 'investigating_officer'
  | 'forensic_expert'
  | 'judge'
  | 'administrator'

export type CaseStatus = 'open' | 'active' | 'under_review' | 'closed' | 'archived'
export type CasePriority = 'low' | 'medium' | 'high' | 'critical'
export type EvidenceType = 'image' | 'video' | 'audio' | 'document'
export type EvidenceStatus = 'pending' | 'ai_review' | 'approved' | 'needs_review' | 'high_risk' | 'archived'
export type TrustLevel = 'highly_trusted' | 'trusted' | 'needs_review' | 'high_risk'
export type GeoStatus = 'verified' | 'warning' | 'outside_boundary'
export type AccessRequestStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  username: string
  name: string
  email: string
  role: UserRole
  department: string
  badgeNumber: string
  avatar?: string
  isActive: boolean
  lastLogin?: string
  assignedCases: number
  evidenceUploaded: number
}

export interface Case {
  id: string
  caseId: string
  title: string
  firNumber: string
  crimeType: string
  description: string
  location: string
  dateTime: string
  officerAssigned: string
  officerId: string
  priority: CasePriority
  status: CaseStatus
  evidenceCount: number
  createdAt: string
  updatedAt: string
  livePhoto?: string
  biometricVerified?: boolean
  biometricMethod?: 'fingerprint' | 'face' | 'iris'
}

export interface AIAnalysis {
  deepfakeDetection: { score: number; status: string }
  imageForgery: { score: number; status: string }
  videoTampering: { score: number; status: string }
  metadataAnalysis: { score: number; status: string }
  duplicateDetection: { score: number; status: string }
  blurDetection: { score: number; status: string }
  aiGeneratedContent: { score: number; status: string }
  riskScore: number
  confidence: number
  recommendation: 'approved' | 'needs_manual_review' | 'high_risk'
}

export interface TrustScoreBreakdown {
  aiVerification: number
  metadataConsistency: number
  sha256Hash: number
  digitalSignature: number
  chainOfCustody: number
  geolocation: number
  blockchain: number
}

export interface Evidence {
  id: string
  evidenceId: string
  caseId: string
  caseTitle: string
  type: EvidenceType
  fileName: string
  fileSize: string
  uploadTime: string
  uploadedBy: string
  uploadedById: string
  status: EvidenceStatus
  trustScore: number
  trustLevel: TrustLevel
  sha256: string
  ipfsCid: string
  blockchainTxId: string
  blockNumber: number
  digitalSignature: string
  currentOwner: string
  currentDepartment: string
  lastAccess: string
  aiAnalysis: AIAnalysis
  trustBreakdown: TrustScoreBreakdown
  geoStatus: GeoStatus
  geoDistance: number
  allowedRadius: number
  crimeLocation: { lat: number; lng: number; address: string }
  uploadLocation: { lat: number; lng: number; address: string }
}

export interface ChainEvent {
  id: string
  evidenceId: string
  timestamp: string
  officerName: string
  department: string
  location: string
  action: string
  blockchainTxId?: string
  icon: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  link?: string
}

export interface AuditLog {
  id: string
  action: string
  user: string
  role: UserRole
  department: string
  target: string
  ip: string
  timestamp: string
  details: string
  severity: 'info' | 'warning' | 'critical'
}

export interface AccessRequest {
  id: string
  requester: string
  requesterRole: UserRole
  evidenceId: string
  caseId: string
  reason: string
  status: AccessRequestStatus
  requestedAt: string
  reviewedBy?: string
  reviewedAt?: string
  reviewReason?: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  police_officer: 'Police Officer',
  investigating_officer: 'Investigating Officer',
  forensic_expert: 'Forensic Expert',
  judge: 'Judge',
  administrator: 'Administrator',
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  police_officer: ['upload_evidence', 'view_assigned_cases'],
  investigating_officer: ['upload_evidence', 'view_cases', 'download_evidence'],
  forensic_expert: ['analyze_evidence', 'add_reports', 'view_cases'],
  judge: ['verify_evidence', 'view_chain_of_custody', 'view_cases'],
  administrator: ['manage_users', 'manage_roles', 'view_all', 'security_settings'],
}
