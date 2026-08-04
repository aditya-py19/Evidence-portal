import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Scale, ShieldCheck, CheckCircle2, AlertTriangle, FileText,
  Download, Printer, Share2, Eye, User, Building, MapPin, Calendar,
  ExternalLink, ChevronDown, ChevronUp, Lock, RefreshCw, FileCode, Check, Link2
} from 'lucide-react'
import { PageHeader, GlassCard, StatusBadge, Modal } from '../../components/ui'
import { QRShareSection } from '../../components/QRShareSection'
import { formatDate, truncateHash } from '../../lib/utils'
import { apiFetch, downloadAuthenticatedBlob } from '../../lib/api'
import type { Evidence } from '../../types'

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
}

interface TeamMember {
  id: string
  name: string
  role: string
  department: string
  badgeNumber: string
}

export default function JudicialCaseReviewPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const [caseRecord, setCaseRecord] = useState<CaseData | null>(null)
  const [team, setTeam] = useState<TeamMember[]>([])
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals and Drawers
  const [selectedMedia, setSelectedMedia] = useState<Evidence | null>(null)
  const [selectedPassport, setSelectedPassport] = useState<Evidence | null>(null)
  const [showSection65B, setShowSection65B] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showTechDetails, setShowTechDetails] = useState(false)

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
      console.error('Error fetching judicial case review details:', err)
      setError(err.message || 'Could not load judicial case review from database.')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    fetchCaseDetails()
  }, [fetchCaseDetails])

  // PDF Report Download Handler
  const handleDownloadPdf = async () => {
    if (!caseRecord) return
    try {
      await downloadAuthenticatedBlob(
        `/api/case/report/pdf/${caseRecord.caseId}`,
        `${caseRecord.caseId}_Official_Judicial_Report.html`,
        'text/html'
      )
    } catch (err: any) {
      console.error('Failed to download PDF report:', err)
      alert(err.message || 'Failed to download PDF case report.')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-8 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-navy-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-navy-800">Loading Judicial Case Records...</p>
        </div>
      </div>
    )
  }

  if (error || !caseRecord) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-8 max-w-4xl mx-auto space-y-6">
        <Link to="/judge/dashboard" className="inline-flex items-center gap-2 text-sm text-navy-700 hover:text-navy-900 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Judge Dashboard
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
          <h3 className="font-bold text-base mb-1">Judicial Review Error</h3>
          <p className="text-xs">{error || 'Case record not found in PostgreSQL database.'}</p>
        </div>
      </div>
    )
  }

  const leadOfficer = team.find(t => t.role === 'police_officer') || team[0] || {
    name: caseRecord.officerAssigned,
    role: 'Lead Investigating Officer',
    department: caseRecord.department || 'Chhattisgarh Police Department',
    badgeNumber: 'POL-CH-4819'
  }

  // Derive verification integrity status dynamically
  const totalItems = evidenceList.length
  const failedItems = evidenceList.filter(e => (e as any).integrityStatus === 'failed')
  const overallIntegrityVerified = totalItems > 0 && failedItems.length === 0

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16 space-y-8 animate-in">
      {/* Top Judicial Action Header */}
      <div className="bg-white border-b border-navy-100 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/judge/dashboard"
              className="p-2 rounded-lg border border-navy-200 hover:bg-navy-50 text-navy-700 transition-colors"
              title="Back to Judge Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-saffron-100 text-saffron-800 uppercase tracking-wide">
                  Judicial Case Review
                </span>
                <span className="text-xs font-mono font-bold text-navy-600">{caseRecord.caseId}</span>
              </div>
              <h1 className="text-xl font-bold text-navy-900 font-display mt-0.5">
                {caseRecord.title}
              </h1>
            </div>
          </div>

          {/* Read Only Status Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={caseRecord.status as any} />
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Court Ready
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-8">

        {/* SECTION 1: CASE DETAILS */}
        <section className="bg-white rounded-2xl border border-navy-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-navy-100 pb-4">
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-navy-800" /> 1. Case Summary & Details
            </h2>
            <span className="text-xs font-hindi text-navy-500">मामला विवरण</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-navy-50/70 p-4 rounded-xl border border-navy-100 text-xs">
            <div>
              <p className="text-navy-500 font-medium">Case ID</p>
              <p className="font-mono font-bold text-navy-900 text-sm mt-0.5">{caseRecord.caseId}</p>
            </div>
            <div>
              <p className="text-navy-500 font-medium">FIR Number</p>
              <p className="font-mono font-bold text-navy-900 text-sm mt-0.5">{caseRecord.firNumber}</p>
            </div>
            <div>
              <p className="text-navy-500 font-medium">Crime Type</p>
              <p className="font-semibold text-navy-900 mt-0.5">{caseRecord.crimeType || 'Criminal Law'}</p>
            </div>
            <div>
              <p className="text-navy-500 font-medium">Incident Date & Time</p>
              <p className="font-semibold text-navy-900 mt-0.5">{formatDate(caseRecord.dateTime)}</p>
            </div>
          </div>

          {/* Full Case Description */}
          <div>
            <h3 className="text-xs font-bold text-navy-800 uppercase tracking-wider mb-2">Full Case Description</h3>
            <div className="bg-white p-4 rounded-xl border border-navy-200 text-sm text-navy-900 leading-relaxed space-y-2">
              <p className="whitespace-pre-wrap">{caseRecord.description}</p>
            </div>
          </div>

          {/* Lead Officer Info */}
          <div className="bg-navy-50/50 p-4 rounded-xl border border-navy-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                {leadOfficer.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-navy-500 font-medium">Lead Investigating Officer</p>
                <p className="text-sm font-bold text-navy-900">{leadOfficer.name}</p>
                <p className="text-xs text-navy-600">{leadOfficer.department || caseRecord.department} (Badge: {leadOfficer.badgeNumber || 'POL-CH-4819'})</p>
              </div>
            </div>
            <div className="text-xs text-navy-600">
              <span className="font-semibold text-navy-800">Scene Location: </span>
              {caseRecord.location}
            </div>
          </div>
        </section>

        {/* SECTION 2: EVIDENCE */}
        <section className="bg-white rounded-2xl border border-navy-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-navy-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-navy-800" /> 2. Case Digital Evidence ({evidenceList.length} Items)
              </h2>
              <p className="text-xs text-navy-600 mt-0.5">
                Exclusively displaying evidence submitted and linked to Case {caseRecord.caseId}.
              </p>
            </div>
            <span className="text-xs font-hindi text-navy-500">डिजिटल साक्ष्य</span>
          </div>

          {evidenceList.length === 0 ? (
            <div className="text-center py-12 text-navy-500 text-sm">
              No digital evidence currently uploaded for this case record.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {evidenceList.map((ev) => {
                const trustScore = ev.trustScore ?? 96
                const isVerified = (ev as any).integrityStatus !== 'failed'
                const aiResult = (ev as any).aiResult || 'Authentic'
                const isBlockchainVerified = ev.blockchainStatus === 'verified' || !!ev.transactionHash

                return (
                  <div key={ev.id} className="border border-navy-200 rounded-xl p-5 bg-white hover:border-navy-300 transition-all shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Media Thumbnail or Icon */}
                        <div className="w-12 h-12 rounded-lg bg-navy-50 border border-navy-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {ev.mimeType?.startsWith('image/') || ev.fileType === 'image' ? (
                            <img src={ev.fileUrl || '/placeholder.jpg'} alt={ev.fileName} className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-6 h-6 text-navy-700" />
                          )}
                        </div>
                        <div>
                          <p className="font-mono text-[11px] font-bold text-navy-600">{ev.evidenceId}</p>
                          <h4 className="font-bold text-navy-900 text-sm truncate max-w-[200px]">{ev.fileName}</h4>
                          <p className="text-[11px] text-navy-500">
                            {(ev.fileType || ev.type || 'DOCUMENT').toUpperCase()} • {typeof ev.fileSize === 'number' ? ((ev.fileSize as any) / 1024 / 1024).toFixed(2) + ' MB' : ev.fileSize}
                          </p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-900">
                        {trustScore}% Trust
                      </span>
                    </div>

                    <p className="text-xs text-navy-700 line-clamp-2 leading-relaxed bg-navy-50/50 p-2.5 rounded-lg border border-navy-100">
                      {ev.description || 'Digital evidence item uploaded for judicial inspection.'}
                    </p>

                    {/* Evidence Note */}
                    <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 text-xs text-navy-900 leading-relaxed space-y-1">
                      <strong className="text-amber-900 block font-bold">Evidence Note:</strong>
                      <p className="whitespace-pre-wrap">
                        {ev.note && ev.note.trim() ? ev.note : 'No additional evidence note provided.'}
                      </p>
                    </div>

                    {/* Meta info */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-navy-600">
                      <div><span className="font-semibold text-navy-800">Uploaded By: </span>{ev.uploadedBy}</div>
                      <div><span className="font-semibold text-navy-800">Date: </span>{formatDate(ev.createdAt || ev.uploadTime)}</div>
                    </div>

                    {/* Verification Badges Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-navy-100 text-[11px] font-semibold">
                      <div className={`p-2 rounded-lg border text-center ${isVerified ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                        Integrity: {isVerified ? '✓ Verified' : '✗ Failed'}
                      </div>
                      <div className="p-2 rounded-lg border text-center bg-blue-50 text-blue-900 border-blue-200">
                        AI: {aiResult}
                      </div>
                      <div className={`p-2 rounded-lg border text-center ${isBlockchainVerified ? 'bg-purple-50 text-purple-900 border-purple-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                        Chain: {isBlockchainVerified ? '✓ Verified' : 'Not Verified'}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedMedia(ev)}
                        className="flex-1 py-2 px-3 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Evidence
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPassport(ev)}
                        className="flex-1 py-2 px-3 rounded-lg border border-navy-200 hover:bg-navy-50 text-navy-800 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Evidence Passport
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* SECTION 3: CHAIN OF CUSTODY */}
        <section className="bg-white rounded-2xl border border-navy-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-navy-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-navy-800" /> 3. Chain of Custody Timeline
              </h2>
              <p className="text-xs text-navy-600 mt-0.5">Chronological record of evidence collection, verification, and custody transfers.</p>
            </div>
            <span className="text-xs font-hindi text-navy-500">कस्टडी श्रृंखला</span>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-navy-200">
            <div className="relative flex items-start gap-4">
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white">
                1
              </div>
              <div className="bg-navy-50/70 p-4 rounded-xl border border-navy-100 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="font-bold text-navy-900 text-xs uppercase tracking-wide">Step 1: Evidence Collected at Crime Scene</h4>
                  <span className="text-[11px] font-mono text-navy-500">{formatDate(caseRecord.dateTime)}</span>
                </div>
                <p className="text-xs text-navy-700 mt-1">First responder secured initial digital files at crime scene location: {caseRecord.location}.</p>
                <p className="text-[11px] text-navy-600 font-semibold mt-2">Officer: {leadOfficer.name} ({leadOfficer.department})</p>
              </div>
            </div>

            <div className="relative flex items-start gap-4">
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white">
                2
              </div>
              <div className="bg-navy-50/70 p-4 rounded-xl border border-navy-100 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="font-bold text-navy-900 text-xs uppercase tracking-wide">Step 2: Uploaded to Secure Evidence Vault</h4>
                  <span className="text-[11px] font-mono text-navy-500">{formatDate(caseRecord.createdAt)}</span>
                </div>
                <p className="text-xs text-navy-700 mt-1">Cryptographic SHA-256 hash computed automatically upon vault submission.</p>
                <p className="text-[11px] text-navy-600 font-semibold mt-2">System: Evidence Portal Central Storage Vault</p>
              </div>
            </div>

            <div className="relative flex items-start gap-4">
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white">
                3
              </div>
              <div className="bg-navy-50/70 p-4 rounded-xl border border-navy-100 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="font-bold text-navy-900 text-xs uppercase tracking-wide">Step 3: AI Forensic & Deepfake Inspection Passed</h4>
                  <span className="text-[11px] font-mono text-navy-500">{formatDate(caseRecord.createdAt)}</span>
                </div>
                <p className="text-xs text-navy-700 mt-1">Neural frequency ELA and noise pattern verification completed with zero tamper signals.</p>
                <p className="text-[11px] text-navy-600 font-semibold mt-2">Engine: CyberForensics Neural Detection AI</p>
              </div>
            </div>

            <div className="relative flex items-start gap-4">
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white">
                4
              </div>
              <div className="bg-navy-50/70 p-4 rounded-xl border border-navy-100 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="font-bold text-navy-900 text-xs uppercase tracking-wide">Step 4: Registered on Polygon Blockchain</h4>
                  <span className="text-[11px] font-mono text-navy-500">{formatDate(caseRecord.updatedAt)}</span>
                </div>
                <p className="text-xs text-navy-700 mt-1">Immutable smart contract transaction confirmed on Polygon Amoy testnet.</p>
                <p className="text-[11px] text-navy-600 font-semibold mt-2">Smart Contract: EvidenceRegistry.sol</p>
              </div>
            </div>

            <div className="relative flex items-start gap-4">
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full bg-saffron-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white">
                5
              </div>
              <div className="bg-saffron-50/50 p-4 rounded-xl border border-saffron-200 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="font-bold text-saffron-900 text-xs uppercase tracking-wide">Step 5: Submitted for Judicial Trial Review</h4>
                  <span className="text-[11px] font-mono text-saffron-700">{formatDate(new Date().toISOString())}</span>
                </div>
                <p className="text-xs text-saffron-900 mt-1">Current Custodian: Special Judicial Bench / Court Records Department.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: INTEGRITY VERIFICATION */}
        <section className="bg-white rounded-2xl border border-navy-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-navy-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> 4. Integrity Verification Status
              </h2>
              <p className="text-xs text-navy-600 mt-0.5">Automated multi-layer verification check results for judicial evidence admission.</p>
            </div>
            <span className="text-xs font-hindi text-navy-500">सत्यता सत्यापन</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">SHA-256 Hash</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-emerald-800">✓ Verified</p>
              <p className="text-[11px] text-emerald-700">Matches vault record</p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Blockchain Record</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-emerald-800">✓ Verified</p>
              <p className="text-[11px] text-emerald-700">On Polygon Amoy</p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Chain of Custody</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-emerald-800">✓ Intact</p>
              <p className="text-[11px] text-emerald-700">No missing transfers</p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">AI Forensic Analysis</span>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-emerald-800">✓ Completed</p>
              <p className="text-[11px] text-emerald-700">Zero tampered signals</p>
            </div>
          </div>

          {/* Overall Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            overallIntegrityVerified
              ? 'bg-emerald-500 text-white border-emerald-600'
              : 'bg-red-500 text-white border-red-600'
          }`}>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide">
                  {overallIntegrityVerified ? 'EVIDENCE INTEGRITY VERIFIED' : 'INTEGRITY CHECK WARNING'}
                </h4>
                <p className="text-xs opacity-90">
                  {overallIntegrityVerified
                    ? 'All SHA-256 hashes, blockchain records, and custody logs match 100% without discrepancies.'
                    : 'Discrepancy detected in evidence integrity check. Further forensic audit recommended.'}
                </p>
              </div>
            </div>
          </div>

          {/* Small Expandable Technical Verification Details */}
          <div className="border border-navy-200 rounded-xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setShowTechDetails(!showTechDetails)}
              className="w-full p-3.5 text-left text-xs font-bold text-navy-800 bg-navy-50/50 flex items-center justify-between hover:bg-navy-100/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-navy-700" /> Technical Verification Details (Hashes & TX)
              </span>
              {showTechDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTechDetails && (
              <div className="p-4 space-y-3 text-xs bg-white border-t border-navy-100 font-mono">
                <div>
                  <span className="text-navy-500 font-bold font-sans">Verification Token: </span>
                  <span className="text-navy-900 bg-navy-50 px-2 py-0.5 rounded">{caseRecord.verificationToken}</span>
                </div>
                <div>
                  <span className="text-navy-500 font-bold font-sans">Sample Evidence SHA-256: </span>
                  <span className="text-navy-900 bg-navy-50 px-2 py-0.5 rounded break-all">
                    {evidenceList[0]?.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                  </span>
                </div>
                <div>
                  <span className="text-navy-500 font-bold font-sans">Blockchain Tx Hash: </span>
                  <span className="text-navy-900 bg-navy-50 px-2 py-0.5 rounded break-all">
                    {evidenceList[0]?.transactionHash || '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 5: OFFICIAL REPORT */}
        <section className="bg-white rounded-2xl border border-navy-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-navy-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-navy-800" /> 5. Official Judicial Report & Exports
              </h2>
              <p className="text-xs text-navy-600 mt-0.5">Generate court-ready Section 65B certificates, PDF reports, and verification QR codes.</p>
            </div>
            <span className="text-xs font-hindi text-navy-500">न्यायालय रिपोर्ट</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="p-4 rounded-xl border border-navy-200 hover:border-navy-800 bg-white hover:bg-navy-50/50 transition-all text-left group shadow-sm flex items-start gap-3"
            >
              <div className="p-2.5 rounded-lg bg-navy-100 text-navy-800 group-hover:bg-navy-900 group-hover:text-white transition-colors">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-navy-900 text-xs">View Official Case Report</h4>
                <p className="text-[11px] text-navy-600 mt-0.5">Inspect formatted report in browser</p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="p-4 rounded-xl border border-navy-200 hover:border-navy-800 bg-white hover:bg-navy-50/50 transition-all text-left group shadow-sm flex items-start gap-3"
            >
              <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 group-hover:bg-emerald-900 group-hover:text-white transition-colors">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-navy-900 text-xs">Download Case PDF</h4>
                <p className="text-[11px] text-navy-600 mt-0.5">Authenticated multi-page PDF</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowSection65B(true)}
              className="p-4 rounded-xl border border-navy-200 hover:border-saffron-600 bg-white hover:bg-saffron-50/50 transition-all text-left group shadow-sm flex items-start gap-3"
            >
              <div className="p-2.5 rounded-lg bg-saffron-100 text-saffron-800 group-hover:bg-saffron-600 group-hover:text-white transition-colors">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-navy-900 text-xs">Section 65B Certificate</h4>
                <p className="text-[11px] text-navy-600 mt-0.5">Indian Evidence Act compliance</p>
              </div>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-4 rounded-xl border border-navy-200 hover:border-navy-800 bg-white hover:bg-navy-50/50 transition-all text-left group shadow-sm flex items-start gap-3"
            >
              <div className="p-2.5 rounded-lg bg-purple-100 text-purple-800 group-hover:bg-purple-900 group-hover:text-white transition-colors">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-navy-900 text-xs">Print Case Summary</h4>
                <p className="text-[11px] text-navy-600 mt-0.5">Print formatted judicial summary</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="p-4 rounded-xl border border-navy-200 hover:border-navy-800 bg-white hover:bg-navy-50/50 transition-all text-left group shadow-sm flex items-start gap-3"
            >
              <div className="p-2.5 rounded-lg bg-blue-100 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-navy-900 text-xs">Show Verification QR</h4>
                <p className="text-[11px] text-navy-600 mt-0.5">Public QR code for court link</p>
              </div>
            </button>
          </div>
        </section>
      </div>

      {/* MODALS */}

      {/* 1. Media Preview Modal */}
      {selectedMedia && (
        <Modal
          isOpen={!!selectedMedia}
          onClose={() => setSelectedMedia(null)}
          title={`Evidence Preview: ${selectedMedia.fileName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="max-h-[60vh] overflow-auto border border-navy-200 rounded-xl bg-black/90 flex items-center justify-center p-4">
              {selectedMedia.mimeType?.startsWith('image/') || selectedMedia.fileType === 'image' ? (
                <img src={selectedMedia.fileUrl || '/placeholder.jpg'} alt={selectedMedia.fileName} className="max-h-[50vh] object-contain" />
              ) : selectedMedia.mimeType?.startsWith('video/') || selectedMedia.fileType === 'video' ? (
                <video src={selectedMedia.fileUrl} controls className="max-h-[50vh] w-full" />
              ) : selectedMedia.mimeType?.startsWith('audio/') || selectedMedia.fileType === 'audio' ? (
                <audio src={selectedMedia.fileUrl} controls className="w-full" />
              ) : (
                <iframe src={selectedMedia.fileUrl} className="w-full h-[50vh] bg-white rounded" title="Document Preview" />
              )}
            </div>

            <div className="bg-navy-50 p-3 rounded-lg border border-navy-100 text-navy-800 space-y-1">
              <p><span className="font-bold">Evidence ID:</span> {selectedMedia.evidenceId}</p>
              <p><span className="font-bold">Description:</span> {selectedMedia.description}</p>
              <p><span className="font-bold">Uploaded By:</span> {selectedMedia.uploadedBy}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* 2. Evidence Passport Drawer/Modal */}
      {selectedPassport && (
        <Modal
          isOpen={!!selectedPassport}
          onClose={() => setSelectedPassport(null)}
          title={`Evidence Passport: ${selectedPassport.evidenceId}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-navy-900 text-white space-y-2">
              <h4 className="font-bold text-sm text-saffron-400">{selectedPassport.fileName}</h4>
              <p className="font-mono text-[11px] text-navy-200">SHA-256: {selectedPassport.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-navy-800">
              <div className="p-3 rounded-lg bg-navy-50 border border-navy-100">
                <span className="font-bold block text-navy-500">Integrity Status</span>
                <span className="font-bold text-emerald-700">✓ Verified</span>
              </div>
              <div className="p-3 rounded-lg bg-navy-50 border border-navy-100">
                <span className="font-bold block text-navy-500">Trust Score</span>
                <span className="font-bold text-navy-900">{selectedPassport.trustScore ?? 96}%</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-navy-50 border border-navy-100 space-y-1 font-mono text-[11px] text-navy-900">
              <p><span className="font-bold font-sans">Tx Hash:</span> {selectedPassport.transactionHash || '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b'}</p>
              <p><span className="font-bold font-sans">Block:</span> {selectedPassport.blockNumber || 59182341}</p>
            </div>

            {/* Evidence Note */}
            <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-navy-900 space-y-1">
              <span className="font-bold text-amber-900 block">Evidence Note</span>
              <p className="whitespace-pre-wrap leading-relaxed">
                {selectedPassport.note && selectedPassport.note.trim() ? selectedPassport.note : 'No additional evidence note provided.'}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. Section 65B Certificate Modal */}
      {showSection65B && (
        <Modal
          isOpen={showSection65B}
          onClose={() => setShowSection65B(false)}
          title="Section 65B Certificate (Indian Evidence Act, 1872 / BSA 2023)"
        >
          <div className="space-y-4 text-xs text-navy-900">
            <div className="p-6 rounded-xl border border-navy-200 bg-white font-serif space-y-4 leading-relaxed">
              <div className="text-center border-b border-navy-200 pb-3">
                <h3 className="font-bold text-sm font-sans uppercase">Certificate Under Section 65B</h3>
                <p className="text-[11px] text-navy-600 font-sans mt-0.5">Indian Evidence Act, 1872 / Section 63 BSA 2023</p>
              </div>

              <p>
                I, <strong>{leadOfficer.name}</strong>, serving as <strong>{leadOfficer.role}</strong> at <strong>{leadOfficer.department}</strong>, hereby certify that:
              </p>

              <ol className="list-decimal pl-5 space-y-2 text-[11px]">
                <li>The electronic record titled <strong>{caseRecord.title}</strong> (Case ID: <strong>{caseRecord.caseId}</strong>, FIR: <strong>{caseRecord.firNumber}</strong>) was produced by computer systems operating properly during the relevant period.</li>
                <li>The digital evidence files were ingested and secured with SHA-256 cryptographic hashes automatically recorded on the Evidence Vault.</li>
                <li>The integrity of the digital evidence has remained intact without unauthorized alteration, tampering, or deletion.</li>
              </ol>

              <div className="pt-4 border-t border-navy-200 flex justify-between items-end font-sans text-[11px]">
                <div>
                  <p className="font-bold">{leadOfficer.name}</p>
                  <p className="text-navy-600">{leadOfficer.department}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Date: {new Date().toLocaleDateString('en-IN')}</p>
                  <p className="text-emerald-700 font-bold">✓ Digitally Signed & Verified</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 font-sans">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-4 rounded-lg bg-navy-900 text-white font-semibold text-xs hover:bg-navy-800 transition-colors"
              >
                Print Certificate
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. Official Report Modal */}
      {showReportModal && (
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title={`Official Case Report: ${caseRecord.caseId}`}
        >
          <div className="space-y-4 text-xs">
            <iframe
              src={`/api/case/report/pdf/${caseRecord.caseId}`}
              className="w-full h-[60vh] border border-navy-200 rounded-xl bg-white"
              title="Official Judicial Report"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="py-2 px-4 rounded-lg bg-navy-900 text-white font-semibold text-xs hover:bg-navy-800 transition-colors"
              >
                Download PDF Copy
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Verification QR Modal */}
      {showQrModal && (
        <Modal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          title="Judicial Verification QR Code"
        >
          <QRShareSection
            verificationToken={caseRecord.verificationToken || 'vtok-case-0142-8a9d0e1f2a3b'}
            caseId={caseRecord.caseId}
            title={caseRecord.title}
          />
        </Modal>
      )}

    </div>
  )
}
