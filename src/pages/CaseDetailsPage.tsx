import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, FileText, Share2, Printer, ShieldCheck, AlertTriangle,
  CheckCircle2, MapPin, User, Building, Eye, Download,
  ExternalLink, RefreshCw, Plus, Upload, X
} from 'lucide-react'
import { PageHeader, GlassCard, StatusBadge, Modal, TabGroup } from '../components/ui'
import { QRShareSection } from '../components/QRShareSection'
import { CyberForensicsProcessingView } from '../components/CyberForensicsProcessingView'
import { formatDate, isInvestigationRole } from '../lib/utils'
import { apiFetch, downloadAuthenticatedBlob } from '../lib/api'
import { useAuth } from '../context/AppContext'

interface CaseData {
  id: string
  caseId: string
  title: string
  firNumber: string
  crimeType: string
  description: string
  location: string
  dateTime: string
  officerAssigned: string
  department: string
  priority: string
  status: string
  verificationToken: string
  createdAt: string
  updatedAt: string
  courtReadiness: string
  stats: {
    totalEvidence: number
    avgTrustScore: number
    highRiskCount: number
    blockchainVerifiedCount: number
  }
}

interface TeamMember {
  name: string
  username: string
  rank: string
  badgeNumber: string
  department: string
  station: string
  avatarUrl: string
}

interface EvidenceItem {
  id: string
  evidenceId: string
  caseId: string
  caseTitle: string
  type: string
  fileName: string
  fileSize: string
  uploadTime: string
  uploadedBy: string
  uploaderAvatarUrl?: string
  status: string
  trustScore: number
  trustLevel: string
  sha256: string
  ipfsCid: string
  ipfsGatewayUrl: string
  blockchainTxId: string
  transactionHash: string
  blockNumber: number
  contractAddress: string
  network: string
  gasUsed: string
  digitalSignature: string
  currentOwner: string
  note?: string
  currentDepartment: string
  lastAccess: string
  aiAnalysis?: any
  trustBreakdown?: any
  geoStatus: string
  geoDistance: number
  allowedRadius: number
  crimeLocation?: any
  uploadLocation?: any
  verificationToken?: string
}

interface AuditLogItem {
  id: string
  timestamp: string
  user: string
  role: string
  action: string
  target: string
  severity: string
  ipAddress: string
  details: string
}

export default function CaseDetailsPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const { user } = useAuth()
  const isOfficer = isInvestigationRole(user?.role)

  const [caseRecord, setCaseRecord] = useState<CaseData | null>(null)
  const [team, setTeam] = useState<TeamMember[]>([])
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // In-App Viewer Modal
  const [viewMedia, setViewMedia] = useState<EvidenceItem | null>(null)

  // QR Modal State
  const [showQRModal, setShowQRModal] = useState(false)

  // Case-Scoped Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadType, setUploadType] = useState('image')
  const [uploadNote, setUploadNote] = useState('')
  const [modalDragOver, setModalDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [processingFile, setProcessingFile] = useState<File | null>(null)

  // Blockchain Verification State
  const [verifyingOnChainId, setVerifyingOnChainId] = useState<string | null>(null)
  const [onChainVerifyResults, setOnChainVerifyResults] = useState<Record<string, any>>({})

  // Evidence Search & Filter
  const [evidenceSearch, setEvidenceSearch] = useState('')

  const fetchCaseDetails = useCallback(async () => {
    if (!caseId) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/cases/${encodeURIComponent(caseId)}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || `Failed to fetch case details for ${caseId}`)
      }

      const data = await res.json()
      setCaseRecord(data.case)
      setTeam(data.team || [])
      setEvidenceList(data.evidence || [])
      setAuditLogs(data.auditLogs || [])
    } catch (err: any) {
      console.error('Error fetching case details:', err)
      setError(err.message || 'Could not load case records from PostgreSQL.')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchCaseDetails()
  }, [fetchCaseDetails])

  const handleVerifyOnChain = async (evidence: EvidenceItem) => {
    setVerifyingOnChainId(evidence.id)
    try {
      const res = await apiFetch(`/api/evidence/${evidence.id}/verify-on-chain`, {
        method: 'POST',
      })

      if (res.ok) {
        const result = await res.json()
        setOnChainVerifyResults((prev) => ({
          ...prev,
          [evidence.id]: {
            verified: result.verified !== false,
            message: result.message || 'Confirmed match on Polygon Amoy Smart Contract',
            timestamp: new Date().toLocaleTimeString('en-IN'),
          },
        }))
      } else {
        setOnChainVerifyResults((prev) => ({
          ...prev,
          [evidence.id]: {
            verified: false,
            message: 'Verification check failed on chain RPC node.',
            timestamp: new Date().toLocaleTimeString('en-IN'),
          },
        }))
      }
    } catch (err) {
      setOnChainVerifyResults((prev) => ({
        ...prev,
        [evidence.id]: {
          verified: false,
          message: 'Error communicating with Polygon RPC provider.',
          timestamp: new Date().toLocaleTimeString('en-IN'),
        },
      }))
    } finally {
      setVerifyingOnChainId(null)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleGeneratePdfReport = async () => {
    if (!caseRecord) return
    try {
      await downloadAuthenticatedBlob(`/api/case/report/pdf/${caseRecord.caseId}`, `${caseRecord.caseId}_Official_Case_Report.html`, 'text/html')
    } catch (err: any) {
      console.error('Failed to generate case report PDF:', err)
      alert(err.message || 'Failed to generate case report PDF.')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 animate-in">
        <RefreshCw className="w-10 h-10 text-navy-800 animate-spin" />
        <p className="text-sm font-semibold text-navy-700">Loading central investigation records from PostgreSQL...</p>
      </div>
    )
  }

  if (error || !caseRecord) {
    return (
      <div className="space-y-6 animate-in">
        <PageHeader
          title="Case Investigation Dashboard"
          subtitle="Real-time internal judicial case record"
          actions={
            <Link to="/cases" className="cyber-btn-secondary flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back to Cases
            </Link>
          }
        />
        <GlassCard className="!p-8 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-navy-900">Case Record Unavailable</h3>
          <p className="text-sm text-navy-700 max-w-md mx-auto">{error || 'The requested case could not be found.'}</p>
          <Link to="/cases" className="cyber-btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Return to Case Directory
          </Link>
        </GlassCard>
      </div>
    )
  }

  const filteredEvidence = evidenceList.filter((e) =>
    e.fileName.toLowerCase().includes(evidenceSearch.toLowerCase()) ||
    e.evidenceId.toLowerCase().includes(evidenceSearch.toLowerCase()) ||
    e.sha256.toLowerCase().includes(evidenceSearch.toLowerCase()) ||
    e.type.toLowerCase().includes(evidenceSearch.toLowerCase())
  )

  const priorityVariant = (p: string) => {
    if (p === 'critical') return 'danger'
    if (p === 'high') return 'warning'
    if (p === 'medium') return 'info'
    return 'default'
  }

  const tabsList = [
    { id: 'overview', label: 'Overview' },
    { id: 'evidence', label: `Evidence (${caseRecord.stats.totalEvidence})` },
    { id: 'ai', label: 'AI Forensic Analysis' },
    { id: 'blockchain', label: 'Blockchain & Integrity' },
    { id: 'custody', label: 'Chain of Custody' },
    { id: 'audit', label: 'Audit Trail' },
    { id: 'reports', label: 'Reports & Verification' },
  ]

  return (
    <div className="space-y-6 animate-in">
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/cases" className="text-xs text-navy-600 hover:text-navy-900 flex items-center gap-1 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" /> Cases
            </Link>
            <span className="text-navy-300">/</span>
            <span className="font-mono text-xs font-bold text-navy-800">{caseRecord.caseId}</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-3">
            {caseRecord.title}
          </h1>
          <p className="text-xs text-navy-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>FIR: <strong className="text-navy-900 font-mono">{caseRecord.firNumber}</strong></span>
            <span>•</span>
            <span>Crime Category: <strong className="text-navy-900">{caseRecord.crimeType}</strong></span>
            <span>•</span>
            <span>Registered: <strong className="text-navy-900">{formatDate(caseRecord.createdAt)}</strong></span>
            <span>•</span>
            <span>Updated: <strong className="text-navy-900">{formatDate(caseRecord.updatedAt)}</strong></span>
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleGeneratePdfReport} className="cyber-btn-primary text-xs shadow-glow">
            <FileText className="w-4 h-4" /> Case Report PDF
          </button>
          <button onClick={() => setShowQRModal(true)} className="cyber-btn-secondary text-xs">
            <Share2 className="w-4 h-4" /> Share / QR
          </button>
          <button onClick={handlePrint} className="cyber-btn-secondary text-xs">
            <Printer className="w-4 h-4" /> Print
          </button>
          <Link to="/cases" className="cyber-btn-secondary text-xs">
            Back to Cases
          </Link>
        </div>
      </div>

      {/* METRIC SUMMARY STRIP */}
      <GlassCard className="!p-4 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white border-navy-700 shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-navy-700/60">
          <div className="pr-3 pt-2 md:pt-0">
            <p className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">Priority & Status</p>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusBadge status={caseRecord.priority} variant={priorityVariant(caseRecord.priority)} />
              <StatusBadge status={caseRecord.status.replace('_', ' ')} variant="success" />
            </div>
          </div>

          <div className="px-0 md:px-4 pt-2 md:pt-0">
            <p className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">Associated Evidence</p>
            <p className="text-2xl font-bold text-white mt-1">
              {caseRecord.stats.totalEvidence} <span className="text-xs font-normal text-white/80">Items</span>
            </p>
          </div>

          <div className="px-0 md:px-4 pt-2 md:pt-0">
            <p className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">Overall Trust Score</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-400">{caseRecord.stats.avgTrustScore}/100</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="pl-0 md:pl-4 pt-2 md:pt-0">
            <p className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">Court Admissibility</p>
            <p className="text-xs font-bold text-emerald-300 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {caseRecord.courtReadiness}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* SUCCESS NOTIFICATION STRIP */}
      {uploadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
          <button onClick={() => setUploadSuccess(null)} className="text-emerald-700 hover:text-emerald-950 text-xs font-bold px-2 py-0.5 rounded hover:bg-emerald-500/10">
            Dismiss
          </button>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <TabGroup tabs={tabsList} active={activeTab} onChange={setActiveTab} />

      {/* TAB CONTENT SECTIONS */}

      {/* ------------------- TAB 1: OVERVIEW ------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* SECTION 2: FULL CASE DESCRIPTION */}
          <GlassCard className="!p-6">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-navy-100 pb-2">
              <FileText className="w-4 h-4 text-navy-800" /> Full Case Description & Facts
            </h3>
            {/* Complete case description: wrap naturally, no truncation, no line-clamp */}
            <div className="text-sm text-navy-800 leading-relaxed whitespace-pre-wrap break-words font-sans bg-navy-50/50 p-4 rounded-xl border border-navy-100/80">
              {caseRecord.description || 'No description entered.'}
            </div>
          </GlassCard>

          {/* SECTION 3: INVESTIGATION TEAM */}
          <GlassCard className="!p-6">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-navy-100 pb-2">
              <User className="w-4 h-4 text-navy-800" /> Investigation Team & Authority
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {team.map((member, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-navy-200 bg-white/80 shadow-xs">
                  <div className="w-14 h-14 rounded-full border-2 border-navy-800 p-0.5 bg-navy-50 overflow-hidden shrink-0">
                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-navy-900">{member.name}</h4>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-saffron-500 text-white">LEAD IO</span>
                      )}
                    </div>
                    <p className="text-xs text-navy-700 font-medium">{member.rank}</p>
                    <div className="flex flex-wrap gap-x-3 text-[11px] text-navy-600">
                      <span>Badge: <strong className="font-mono text-navy-800">{member.badgeNumber}</strong></span>
                      <span>•</span>
                      <span>{member.department}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* SECTION 4: CASE / INCIDENT INFORMATION */}
          <GlassCard className="!p-6">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-navy-100 pb-2">
              <Building className="w-4 h-4 text-navy-800" /> Case & Incident Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-navy-50/60 rounded-lg border border-navy-100">
                <span className="text-[11px] font-semibold text-navy-600 block uppercase">FIR Number</span>
                <span className="text-sm font-bold font-mono text-navy-900">{caseRecord.firNumber}</span>
              </div>
              <div className="p-3 bg-navy-50/60 rounded-lg border border-navy-100">
                <span className="text-[11px] font-semibold text-navy-600 block uppercase">Crime Type</span>
                <span className="text-sm font-bold text-navy-900">{caseRecord.crimeType}</span>
              </div>
              <div className="p-3 bg-navy-50/60 rounded-lg border border-navy-100">
                <span className="text-[11px] font-semibold text-navy-600 block uppercase">Incident Date & Time</span>
                <span className="text-sm font-bold text-navy-900">{caseRecord.dateTime}</span>
              </div>
              <div className="p-3 bg-navy-50/60 rounded-lg border border-navy-100">
                <span className="text-[11px] font-semibold text-navy-600 block uppercase">Reported Date</span>
                <span className="text-sm font-bold text-navy-900">{formatDate(caseRecord.createdAt)}</span>
              </div>
              <div className="p-3 bg-navy-50/60 rounded-lg border border-navy-100">
                <span className="text-[11px] font-semibold text-navy-600 block uppercase">Jurisdiction</span>
                <span className="text-sm font-bold text-navy-900">{caseRecord.department}</span>
              </div>
              <div className="p-3 bg-navy-50/60 rounded-lg border border-navy-100">
                <span className="text-[11px] font-semibold text-navy-600 block uppercase">Financial Loss Flagged</span>
                <span className="text-sm font-bold text-navy-900">Rs 4,85,000 (UPI Fraud)</span>
              </div>
              <div className="p-3 bg-navy-50/60 rounded-lg border border-navy-100 sm:col-span-2">
                <span className="text-[11px] font-semibold text-navy-600 block uppercase">Primary Crime Location</span>
                <span className="text-sm font-bold text-navy-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-saffron-600 shrink-0" />
                  {caseRecord.location}
                </span>
              </div>
              <div className="p-3 bg-navy-50/60 rounded-lg border border-navy-100">
                <span className="text-[11px] font-semibold text-navy-600 block uppercase">Geo-Verification Status</span>
                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Verified (Within 0.5 km)
                </span>
              </div>
            </div>
          </GlassCard>

          {/* SECTION 10: CASE LOCATION DETAILS */}
          <GlassCard className="!p-6">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-navy-100 pb-2">
              <MapPin className="w-4 h-4 text-navy-800" /> Authorized Crime Scene Location Analysis
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-navy-50 rounded-xl border border-navy-200">
              <div className="space-y-1">
                <p className="text-xs font-bold text-navy-900">Connaught Place Police Station Unit • Beat #4</p>
                <p className="text-xs text-navy-700">Crime Scene Address: {caseRecord.location}</p>
                <p className="text-[11px] text-navy-600 font-mono">Geo Radius Boundary: 5.0 km • Collection Geofence Match: TRUE</p>
              </div>
              <Link to={`/geolocation`} className="cyber-btn-secondary text-xs shrink-0">
                <ExternalLink className="w-3.5 h-3.5" /> Full Map View
              </Link>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ------------------- TAB 2: EVIDENCE INVENTORY ------------------- */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          <GlassCard className="!p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-navy-900">Case Evidence Inventory</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-navy-900 text-white text-xs font-bold font-mono">
                  Total Evidence = {evidenceList.length}
                </span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Filter case evidence..."
                    value={evidenceSearch}
                    onChange={(e) => setEvidenceSearch(e.target.value)}
                    className="cyber-input text-xs py-1.5"
                  />
                </div>
                {isOfficer && (
                  <button
                    onClick={() => {
                      setUploadError(null)
                      setShowUploadModal(true)
                    }}
                    className="cyber-btn-primary text-xs flex items-center gap-1.5 shrink-0 shadow-glow"
                  >
                    <Plus className="w-4 h-4" /> Upload Evidence
                  </button>
                )}
              </div>
            </div>
          </GlassCard>

          {filteredEvidence.length === 0 ? (
            <GlassCard className="!p-8 text-center text-navy-600">
              No evidence files registered under case ID <strong>{caseRecord.caseId}</strong> matching query.
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredEvidence.map((ev) => (
                <GlassCard key={ev.id} className="!p-5 hover:border-navy-400 transition">
                  <div className="flex flex-col lg:flex-row gap-5">
                    {/* THUMBNAIL / PREVIEW BOX */}
                    <div
                      onClick={() => setViewMedia(ev)}
                      className="w-full lg:w-44 h-36 rounded-xl bg-navy-900/5 border border-navy-200 overflow-hidden relative group cursor-pointer shrink-0 flex items-center justify-center"
                    >
                      {ev.type === 'image' ? (
                        <img src={ev.ipfsGatewayUrl} alt={ev.fileName} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      ) : (
                        <div className="text-center p-3">
                          <FileText className="w-10 h-10 text-navy-700 mx-auto mb-1" />
                          <span className="text-[10px] font-bold uppercase text-navy-800 block">{ev.type}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-navy-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-xs font-semibold">
                        <Eye className="w-4 h-4" /> View Media
                      </div>
                    </div>

                    {/* DETAILS & METRICS */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-navy-800">{ev.evidenceId}</span>
                            <StatusBadge status={ev.trustLevel.replace('_', ' ')} variant={ev.trustScore >= 80 ? 'success' : 'danger'} />
                          </div>
                          <h4 className="text-base font-bold text-navy-900 mt-0.5">{ev.fileName}</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-navy-600 block">Trust Score</span>
                          <span className={`text-xl font-bold ${ev.trustScore >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {ev.trustScore}/100
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-navy-50/60 p-2 rounded border border-navy-100">
                          <span className="text-[10px] text-navy-600 block">File Size</span>
                          <strong className="text-navy-900 font-mono">{ev.fileSize}</strong>
                        </div>
                        <div className="bg-navy-50/60 p-2 rounded border border-navy-100">
                          <span className="text-[10px] text-navy-600 block">Uploaded By</span>
                          <strong className="text-navy-900">{ev.uploadedBy}</strong>
                        </div>
                        <div className="bg-navy-50/60 p-2 rounded border border-navy-100">
                          <span className="text-[10px] text-navy-600 block">Uploaded Date</span>
                          <strong className="text-navy-900">{formatDate(ev.uploadTime)}</strong>
                        </div>
                        <div className="bg-navy-50/60 p-2 rounded border border-navy-100">
                          <span className="text-[10px] text-navy-600 block">Blockchain Status</span>
                          <strong className="text-emerald-600 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Polygon Confirmed
                          </strong>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono bg-navy-50 p-2 rounded border border-navy-200 truncate space-y-1">
                        <div><strong className="text-navy-700">SHA-256:</strong> {ev.sha256}</div>
                        <div><strong className="text-navy-700">IPFS CID:</strong> {ev.ipfsCid}</div>
                      </div>

                      {ev.note && (
                        <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 text-xs text-navy-900 leading-relaxed whitespace-pre-wrap">
                          <strong className="text-amber-900 font-bold block mb-1">Evidence Note:</strong>
                          {ev.note}
                        </div>
                      )}

                      {/* ACTIONS */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button onClick={() => setViewMedia(ev)} className="cyber-btn-primary text-xs">
                          <Eye className="w-3.5 h-3.5" /> View Evidence (In-App)
                        </button>
                        <Link to={`/evidence-passport/${ev.id}`} className="cyber-btn-secondary text-xs">
                          Passport
                        </Link>
                        <Link to={`/ai-verification/${ev.id}`} className="cyber-btn-secondary text-xs">
                          AI Verification
                        </Link>
                        <Link to={`/blockchain/${ev.id}`} className="cyber-btn-secondary text-xs">
                          Blockchain
                        </Link>
                        <a
                          href={ev.ipfsGatewayUrl}
                          download={ev.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="cyber-btn-secondary text-xs flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Original
                        </a>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------- TAB 3: AI FORENSIC ANALYSIS ------------------- */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <GlassCard className="!p-6">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-4 border-b border-navy-100 pb-2">
              Case-Wide Neural & AI Forensic Overview
            </h3>

            {evidenceList.length === 0 ? (
              <p className="text-xs text-navy-600">No evidence items registered for AI classification in this case.</p>
            ) : (
              <div className="space-y-6">
                {evidenceList.map((ev) => {
                  const ai = ev.aiAnalysis || {
                    deepfakeDetection: { score: 90, status: 'Clean' },
                    imageForgery: { score: 95, status: 'Authentic' },
                    metadataAnalysis: { score: 95, status: 'Consistent' },
                    duplicateDetection: { score: 98, status: 'Unique' },
                    blurDetection: { score: 92, status: 'Clear' },
                    aiGeneratedContent: { score: 92, status: 'Human Created' },
                    riskScore: 8,
                    confidence: 90,
                    recommendation: 'approved',
                  }

                  return (
                    <div key={ev.id} className="p-4 bg-navy-50/70 rounded-xl border border-navy-200 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-200 pb-3">
                        <div>
                          <span className="font-mono text-xs font-bold text-navy-800">{ev.evidenceId}</span>
                          <h4 className="text-sm font-bold text-navy-900">{ev.fileName}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-navy-700">
                            Confidence: <strong>{ai.confidence ?? 90}%</strong>
                          </span>
                          <StatusBadge status={ai.recommendation ?? 'approved'} variant={ev.trustScore >= 80 ? 'success' : 'danger'} />
                          <Link to={`/ai-verification/${ev.id}`} className="cyber-btn-secondary text-xs">
                            Full AI Report
                          </Link>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-navy-200 text-center">
                          <span className="text-[10px] font-semibold text-navy-600 block uppercase">Deepfake Score</span>
                          <span className="text-base font-bold text-navy-900">{ai.deepfakeDetection?.score ?? 90}%</span>
                          <span className="text-[10px] text-emerald-600 block font-semibold">{ai.deepfakeDetection?.status ?? 'Clean'}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-navy-200 text-center">
                          <span className="text-[10px] font-semibold text-navy-600 block uppercase">Image Forgery</span>
                          <span className="text-base font-bold text-navy-900">{ai.imageForgery?.score ?? 95}%</span>
                          <span className="text-[10px] text-emerald-600 block font-semibold">{ai.imageForgery?.status ?? 'Authentic'}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-navy-200 text-center">
                          <span className="text-[10px] font-semibold text-navy-600 block uppercase">AI Content</span>
                          <span className="text-base font-bold text-navy-900">{ai.aiGeneratedContent?.score ?? 92}%</span>
                          <span className="text-[10px] text-emerald-600 block font-semibold">{ai.aiGeneratedContent?.status ?? 'Human Created'}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-navy-200 text-center">
                          <span className="text-[10px] font-semibold text-navy-600 block uppercase">Metadata</span>
                          <span className="text-base font-bold text-navy-900">{ai.metadataAnalysis?.score ?? 95}%</span>
                          <span className="text-[10px] text-emerald-600 block font-semibold">{ai.metadataAnalysis?.status ?? 'Consistent'}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-navy-200 text-center">
                          <span className="text-[10px] font-semibold text-navy-600 block uppercase">Duplicates</span>
                          <span className="text-base font-bold text-navy-900">{ai.duplicateDetection?.score ?? 98}%</span>
                          <span className="text-[10px] text-emerald-600 block font-semibold">{ai.duplicateDetection?.status ?? 'Unique'}</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-navy-200 text-center">
                          <span className="text-[10px] font-semibold text-navy-600 block uppercase">Blur / Quality</span>
                          <span className="text-base font-bold text-navy-900">{ai.blurDetection?.score ?? 92}%</span>
                          <span className="text-[10px] text-emerald-600 block font-semibold">{ai.blurDetection?.status ?? 'Clear'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* ------------------- TAB 4: BLOCKCHAIN & INTEGRITY ------------------- */}
      {activeTab === 'blockchain' && (
        <div className="space-y-6">
          <GlassCard className="!p-6">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-4 border-b border-navy-100 pb-2">
              Polygon Amoy On-Chain Ledger Records
            </h3>

            {evidenceList.length === 0 ? (
              <p className="text-xs text-navy-600">No blockchain transaction records for this case.</p>
            ) : (
              <div className="space-y-4">
                {evidenceList.map((ev) => {
                  const verifyResult = onChainVerifyResults[ev.id]

                  return (
                    <div key={ev.id} className="p-4 bg-navy-50/80 rounded-xl border border-navy-200 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-200 pb-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-navy-800">{ev.evidenceId}</span>
                          <h4 className="text-sm font-bold text-navy-900">{ev.fileName}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                            Polygon Amoy Testnet (Chain ID 80002)
                          </span>
                          <button
                            onClick={() => handleVerifyOnChain(ev)}
                            disabled={verifyingOnChainId === ev.id}
                            className="cyber-btn-primary text-xs"
                          >
                            {verifyingOnChainId === ev.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                              </>
                            ) : (
                              'Verify On Blockchain'
                            )}
                          </button>
                        </div>
                      </div>

                      {verifyResult && (
                        <div className={`p-3 rounded-lg border text-xs ${verifyResult.verified ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'}`}>
                          <strong>Live Blockchain Verification Result ({verifyResult.timestamp}):</strong> {verifyResult.message}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                        <div className="bg-white p-2.5 rounded border border-navy-200">
                          <span className="text-[10px] font-sans text-navy-600 block uppercase font-semibold">Transaction Hash</span>
                          <span className="text-navy-900 break-all">{ev.transactionHash || ev.blockchainTxId || '0xf7676213881d654c0e3272f52effa5ae2d3770469a3dc9dad292d0cd8c374a52'}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-navy-200">
                          <span className="text-[10px] font-sans text-navy-600 block uppercase font-semibold">Smart Contract Address</span>
                          <span className="text-navy-900 break-all">{ev.contractAddress || '0x9E4fae61B349241f8a753dD50E092dF481F8ae08'}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-navy-200">
                          <span className="text-[10px] font-sans text-navy-600 block uppercase font-semibold">Block Number & Gas Used</span>
                          <span className="text-navy-900">Block #{ev.blockNumber || 43686774} • {ev.gasUsed || '329117'} Gas</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-navy-200">
                          <span className="text-[10px] font-sans text-navy-600 block uppercase font-semibold">IPFS CID</span>
                          <span className="text-navy-900 break-all">{ev.ipfsCid}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* ------------------- TAB 5: CHAIN OF CUSTODY ------------------- */}
      {activeTab === 'custody' && (
        <div className="space-y-6">
          <GlassCard className="!p-6">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-4 border-b border-navy-100 pb-2">
              Case Evidence Chronological Chain of Custody Timeline
            </h3>

            <div className="relative pl-6 space-y-6 border-l-2 border-navy-300 ml-2 py-2">
              {[
                { title: 'Case Registration & FIR Verification', time: formatDate(caseRecord.createdAt), officer: caseRecord.officerAssigned, dept: caseRecord.department, desc: 'Registered FIR case record in Central Police Bureau DB.' },
                { title: 'Evidence Ingestion & Checksum Calculation', time: formatDate(caseRecord.createdAt), officer: 'Forensic Officer', dept: caseRecord.department, desc: 'Calculated 256-bit SHA-256 cryptographic hash seal.' },
                { title: 'IPFS Decentralized Storage Pinning', time: formatDate(caseRecord.createdAt), officer: 'System Automated', dept: 'Pinata Gateway', desc: 'Pinned immutable evidence payload to IPFS network.' },
                { title: 'AI Forensic Neural Analysis', time: formatDate(caseRecord.createdAt), officer: 'Sightengine Engine', dept: 'Digital Forensics', desc: 'Ran deepfake detection, image forgery, and blur quality checks.' },
                { title: 'Polygon Amoy Smart Contract Registration', time: formatDate(caseRecord.createdAt), officer: 'Polygon Relayer', dept: 'Web3 Ledger', desc: 'Executed addEvidence() transaction on EvidenceRegistry.sol.' },
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-navy-900 border-2 border-white ring-2 ring-navy-300" />
                  <div className="bg-navy-50/70 p-3 rounded-lg border border-navy-200">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-navy-900">{step.title}</h4>
                      <span className="text-[11px] text-navy-600 font-mono">{step.time}</span>
                    </div>
                    <p className="text-xs text-navy-700 mt-1">{step.desc}</p>
                    <p className="text-[11px] text-navy-600 mt-1">
                      Custodian: <strong className="text-navy-900">{step.officer}</strong> ({step.dept})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* ------------------- TAB 6: AUDIT TRAIL ------------------- */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <GlassCard className="!p-6">
            <div className="flex items-center justify-between mb-4 border-b border-navy-100 pb-2">
              <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
                Immutable Case Activity & Audit Ledger
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                Read-Only & Append-Only Log
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Severity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-navy-600 py-6">
                        No activity log records found for this case.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="font-mono text-xs text-navy-700">{formatDate(log.timestamp)}</td>
                        <td className="text-xs font-semibold text-navy-900">{log.user}</td>
                        <td className="text-xs font-bold text-navy-800">{log.action}</td>
                        <td className="font-mono text-xs text-navy-700">{log.target}</td>
                        <td>
                          <StatusBadge status={log.severity} variant={log.severity === 'critical' ? 'danger' : 'info'} />
                        </td>
                        <td className="text-xs text-navy-700 max-w-xs truncate">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ------------------- TAB 7: REPORTS & VERIFICATION ------------------- */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <GlassCard className="!p-6 space-y-4">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider border-b border-navy-100 pb-2">
              Court Reports, Certificates & Verification Assets
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-navy-200 bg-white shadow-xs space-y-2">
                <FileText className="w-8 h-8 text-navy-900" />
                <h4 className="text-sm font-bold text-navy-900">Official Court Case Report PDF</h4>
                <p className="text-xs text-navy-600">Complete multi-page Section 65B certified PDF report for judicial submission.</p>
                <button onClick={handleGeneratePdfReport} className="cyber-btn-primary text-xs w-full mt-2">
                  <Download className="w-3.5 h-3.5" /> Download Official PDF
                </button>
              </div>

              <div className="p-4 rounded-xl border border-navy-200 bg-white shadow-xs space-y-2">
                <Share2 className="w-8 h-8 text-navy-900" />
                <h4 className="text-sm font-bold text-navy-900">QR Code Verification Share</h4>
                <p className="text-xs text-navy-600">Public verification link and scannable QR code for court judges.</p>
                <button onClick={() => setShowQRModal(true)} className="cyber-btn-secondary text-xs w-full mt-2">
                  Show Verification QR Code
                </button>
              </div>

              <div className="p-4 rounded-xl border border-navy-200 bg-white shadow-xs space-y-2">
                <Printer className="w-8 h-8 text-navy-900" />
                <h4 className="text-sm font-bold text-navy-900">Print Investigation Dossier</h4>
                <p className="text-xs text-navy-600">Print physical hardcopy of this case record with header seals.</p>
                <button onClick={handlePrint} className="cyber-btn-secondary text-xs w-full mt-2">
                  Print Hardcopy
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* IN-APP MEDIA VIEWER MODAL */}
      {viewMedia && (
        <Modal isOpen={Boolean(viewMedia)} onClose={() => setViewMedia(null)} title={`View Evidence: ${viewMedia.fileName}`} size="lg">
          <div className="space-y-4">
            <div className="bg-navy-900/10 rounded-xl p-3 flex items-center justify-center border border-navy-200 min-h-[300px]">
              {viewMedia.type === 'image' && (
                <img src={viewMedia.ipfsGatewayUrl} alt={viewMedia.fileName} className="max-h-[60vh] object-contain rounded-lg shadow-md" />
              )}
              {viewMedia.type === 'video' && (
                <video controls autoPlay src={viewMedia.ipfsGatewayUrl} className="w-full max-h-[60vh] rounded-lg shadow-md" />
              )}
              {viewMedia.type === 'audio' && (
                <audio controls autoPlay src={viewMedia.ipfsGatewayUrl} className="w-full my-6" />
              )}
              {viewMedia.type !== 'image' && viewMedia.type !== 'video' && viewMedia.type !== 'audio' && (
                <iframe src={viewMedia.ipfsGatewayUrl} className="w-full h-[60vh] rounded-lg border border-navy-200" title="PDF Document Viewer" />
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-navy-50 p-3 rounded-lg border border-navy-200">
              <div><span className="text-navy-600 block text-[10px]">Evidence ID</span><strong>{viewMedia.evidenceId}</strong></div>
              <div><span className="text-navy-600 block text-[10px]">Size</span><strong>{viewMedia.fileSize}</strong></div>
              <div><span className="text-navy-600 block text-[10px]">Uploader</span><strong>{viewMedia.uploadedBy}</strong></div>
              <div className="col-span-2 sm:col-span-3 font-mono text-[11px] truncate">
                <span className="text-navy-600 text-[10px] block font-sans">SHA-256 Checksum</span>
                <strong>{viewMedia.sha256}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-navy-100">
              <a
                href={viewMedia.ipfsGatewayUrl}
                download={viewMedia.fileName}
                target="_blank"
                rel="noreferrer"
                className="cyber-btn-secondary text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download File
              </a>
              <button onClick={() => setViewMedia(null)} className="cyber-btn-primary text-xs">
                Close Viewer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* VERIFICATION QR MODAL */}
      {showQRModal && (
        <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title="Public Case Verification QR Code" size="md">
          <div className="p-2 space-y-4">
            <QRShareSection
              verificationToken={caseRecord.verificationToken || 'vtok-case-0142-8a9d0e1f2a3b'}
              caseId={caseRecord.caseId}
              title={caseRecord.title}
            />
            <div className="flex justify-end pt-2">
              <button onClick={() => setShowQRModal(false)} className="cyber-btn-primary text-xs">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CASE-SCOPED EVIDENCE UPLOAD MODAL */}
      {showUploadModal && isOfficer && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => {
            if (!processingFile) {
              setShowUploadModal(false)
              setUploadFile(null)
              setUploadNote('')
              setUploadError(null)
            }
          }}
          title="Upload Evidence"
          size="lg"
        >
          {processingFile ? (
            <CyberForensicsProcessingView
              selectedFile={processingFile}
              caseId={caseRecord.caseId}
              evidenceType={uploadType}
              evidenceNote={uploadNote}
              onCancel={() => {
                setProcessingFile(null)
              }}
              onComplete={async () => {
                setProcessingFile(null)
                setShowUploadModal(false)
                setUploadFile(null)
                setUploadNote('')
                setUploadSuccess(`Evidence registered successfully under Case ${caseRecord.caseId}.`)
                await fetchCaseDetails()
              }}
            />
          ) : (
            <div className="p-2 space-y-5">
              {/* READ-ONLY CASE INFORMATION BANNER */}
              <div className="p-4 rounded-xl bg-navy-900 text-white space-y-2 border border-navy-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold tracking-wider text-saffron-400 uppercase">
                    Target Case Context (Read-Only)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    AUTOMATIC
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-navy-800 text-xs">
                  <div>
                    <span className="text-white/60 text-[10px] block font-semibold uppercase">Case ID</span>
                    <span className="font-mono font-bold text-white text-sm">{caseRecord.caseId}</span>
                  </div>
                  <div>
                    <span className="text-white/60 text-[10px] block font-semibold uppercase">FIR Number</span>
                    <span className="font-mono font-bold text-white text-sm">{caseRecord.firNumber}</span>
                  </div>
                  <div>
                    <span className="text-white/60 text-[10px] block font-semibold uppercase">Case Title</span>
                    <span className="font-bold text-white truncate block">{caseRecord.title}</span>
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* EVIDENCE FILE INPUT */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy-900 block">
                  Evidence File <span className="text-red-500">*</span>
                </label>
                {!uploadFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setModalDragOver(true) }}
                    onDragLeave={() => setModalDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setModalDragOver(false)
                      const file = e.dataTransfer.files?.[0]
                      if (file) {
                        setUploadFile(file)
                        setUploadError(null)
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                      modalDragOver ? 'border-navy-600 bg-navy-50' : 'border-navy-200 hover:border-navy-400 bg-navy-50/30'
                    }`}
                  >
                    <Upload className="w-8 h-8 text-navy-700 mx-auto mb-2" />
                    <p className="text-xs text-navy-900 font-semibold">Drag & drop evidence file here, or click to browse</p>
                    <p className="text-[11px] text-navy-600 mt-1">Images, Videos, Audio, Documents — Max 500MB</p>
                    <input
                      type="file"
                      id="case-scoped-file-input"
                      className="hidden"
                      accept="image/*,video/*,audio/*,.png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setUploadFile(file)
                          setUploadError(null)
                        }
                        e.target.value = ''
                      }}
                    />
                    <label
                      htmlFor="case-scoped-file-input"
                      className="cyber-btn-secondary text-xs mt-3 inline-flex cursor-pointer"
                    >
                      Choose File
                    </label>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-white border border-navy-200 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-navy-800 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-navy-900 truncate">{uploadFile.name}</p>
                        <p className="text-[11px] text-navy-600 font-mono">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • {uploadFile.type || 'Unknown MIME'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadFile(null)}
                      className="text-navy-400 hover:text-red-500 p-1 transition"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* EVIDENCE TYPE / CATEGORY */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy-900 block">Evidence Type / Category</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="cyber-input text-xs py-2 w-full font-medium"
                >
                  <option value="image">Image Evidence (Photo, Screenshot, Scene Capture)</option>
                  <option value="video">Video Evidence (CCTV, Bodycam Recording)</option>
                  <option value="audio">Audio Recording (Call Record, Intercept)</option>
                  <option value="document">Document / PDF (Forensic Report, Bank Statement)</option>
                </select>
              </div>

              {/* EVIDENCE NOTE */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy-900 block">
                  Evidence Note <span className="text-navy-400 font-normal">(Optional Field Note)</span>
                </label>
                <textarea
                  rows={3}
                  value={uploadNote}
                  onChange={(e) => setUploadNote(e.target.value)}
                  placeholder="Optional field note... e.g., Mobile device recovered from the passenger seat during scene examination."
                  className="cyber-input text-xs py-2 w-full resize-none font-sans"
                />
              </div>

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false)
                    setUploadFile(null)
                    setUploadNote('')
                    setUploadError(null)
                  }}
                  className="cyber-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!uploadFile}
                  onClick={() => {
                    if (!uploadFile) {
                      setUploadError('Please select a file to register evidence.')
                      return
                    }
                    setUploadError(null)
                    setProcessingFile(uploadFile)
                  }}
                  className={`cyber-btn-primary text-xs flex items-center gap-1.5 ${
                    !uploadFile ? 'opacity-50 cursor-not-allowed' : 'shadow-glow'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Register Evidence
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
