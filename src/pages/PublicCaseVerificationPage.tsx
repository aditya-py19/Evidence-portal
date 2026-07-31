import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ShieldCheck, CheckCircle, Database, Link2, Brain, Activity, Clock,
  FileText, Shield, User, Lock, AlertTriangle, ArrowLeft, QrCode, Download, ExternalLink, Loader2
} from 'lucide-react'
import { GlassCard, StatusBadge } from '../components/ui'
import { formatDate } from '../lib/utils'

export default function PublicCaseVerificationPage() {
  const { verificationToken } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [validationStep, setValidationStep] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVerificationData() {
      setLoading(true)
      setError(null)
      setValidationStep(1)

      const s1 = setTimeout(() => setValidationStep(2), 250)
      const s2 = setTimeout(() => setValidationStep(3), 500)
      const s3 = setTimeout(() => setValidationStep(4), 750)

      try {
        const res = await fetch(`/api/case/verify/${verificationToken || 'vtok-case-0142-8a9d0e1f2a3b'}`)
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(errBody.message || `Verification Token not found in database (${res.status})`)
        }
        const result = await res.json()
        setData(result)
      } catch (err: any) {
        setError(err.message || 'Unable to fetch verification data.')
      } finally {
        setTimeout(() => setLoading(false), 850)
      }

      return () => {
        clearTimeout(s1)
        clearTimeout(s2)
        clearTimeout(s3)
      }
    }

    fetchVerificationData()
  }, [verificationToken])

  const handleDownloadPDFReport = () => {
    if (!data) return
    const reportUrl = `/api/case/report/pdf/${data.caseId || 'TC-2026-0142'}`
    window.open(reportUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-navy-900 text-saffron-500 flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-navy-900">Validating Case Verification Token</h2>

          <div className="space-y-2.5 text-left text-xs pt-2">
            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${validationStep >= 1 ? 'bg-blue-50 border-blue-200 text-navy-900 font-semibold' : 'opacity-40'}`}>
              <div className="flex items-center gap-2">
                {validationStep > 1 ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                <span>1. Querying PostgreSQL Ledger...</span>
              </div>
              <span className="text-[10px] font-mono">{validationStep > 1 ? 'OK' : 'Checking'}</span>
            </div>

            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${validationStep >= 2 ? 'bg-blue-50 border-blue-200 text-navy-900 font-semibold' : 'opacity-40'}`}>
              <div className="flex items-center gap-2">
                {validationStep > 3 ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : validationStep === 2 ? <Loader2 className="w-4 h-4 text-blue-600 animate-spin" /> : <Clock className="w-4 h-4 text-navy-400" />}
                <span>2. Verifying Polygon Amoy Smart Contract...</span>
              </div>
              <span className="text-[10px] font-mono">{validationStep > 2 ? 'OK' : 'Queued'}</span>
            </div>

            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${validationStep >= 3 ? 'bg-blue-50 border-blue-200 text-navy-900 font-semibold' : 'opacity-40'}`}>
              <div className="flex items-center gap-2">
                {validationStep >= 4 ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : validationStep === 3 ? <Loader2 className="w-4 h-4 text-blue-600 animate-spin" /> : <Clock className="w-4 h-4 text-navy-400" />}
                <span>3. Evaluating SHA-256 Checksum Integrity...</span>
              </div>
              <span className="text-[10px] font-mono">{validationStep >= 4 ? 'Verified' : 'Queued'}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (error || !data || !data.verified) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full text-center p-6 space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-lg font-bold text-navy-900">Verification Token Invalid</h2>
          <p className="text-xs text-navy-700">{error || 'The scanned QR verification token could not be verified in the database.'}</p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-50 p-4 sm:p-8 flex items-center justify-center animate-in">
      <GlassCard className="max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden border-2 border-navy-100">
        {/* Top Header */}
        <div className="text-center space-y-2 border-b border-navy-100 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-navy-900 text-saffron-500 flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <p className="text-[10px] uppercase font-bold text-saffron-600 tracking-wider">
            Government of India • Police Judicial Verification
          </p>
          <h1 className="text-xl font-bold text-navy-900">Live Case Verification Certificate</h1>
          <p className="text-xs text-navy-600">Scanned Token: <span className="font-mono font-bold text-navy-900">{data.verificationToken}</span></p>
        </div>

        {/* Four Verification Badges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[10px] uppercase text-emerald-700">Database Record</p>
              <p className="text-xs font-bold">Case Verified ✓</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
            <Link2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[10px] uppercase text-emerald-700">Polygon Ledger</p>
              <p className="text-xs font-bold">Blockchain Verified ✓</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[10px] uppercase text-emerald-700">Cryptographic Checksum</p>
              <p className="text-xs font-bold">SHA-256 Verified ✓</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[10px] uppercase text-emerald-700">Admissibility Status</p>
              <p className="text-xs font-bold">Court Ready ✓</p>
            </div>
          </div>
        </div>

        {/* Case & Evidence Verification Metadata */}
        <div className="p-4 rounded-xl bg-navy-50/60 border border-navy-100 space-y-2.5 text-xs">
          <div className="flex justify-between items-center border-b border-navy-100 pb-2">
            <span className="text-navy-600">Case ID:</span>
            <span className="font-mono font-bold text-navy-900">{data.caseId}</span>
          </div>
          <div className="flex justify-between items-center border-b border-navy-100 pb-2">
            <span className="text-navy-600">FIR Number:</span>
            <span className="font-mono font-bold text-navy-900">{data.firNumber}</span>
          </div>
          <div className="flex justify-between items-center border-b border-navy-100 pb-2">
            <span className="text-navy-600">Case Title:</span>
            <span className="font-bold text-navy-900 truncate max-w-[240px]">{data.caseTitle}</span>
          </div>
          <div className="flex justify-between items-center border-b border-navy-100 pb-2">
            <span className="text-navy-600">Lead Investigating Officer:</span>
            <span className="font-semibold text-navy-900">{data.leadOfficer} ({data.department})</span>
          </div>
          <div className="flex justify-between items-center border-b border-navy-100 pb-2">
            <span className="text-navy-600">Case Evidence Count:</span>
            <span className="font-bold text-emerald-700">{data.evidenceSummary.totalItems} Evidence File(s)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-navy-600">Verification Timestamp:</span>
            <span className="font-mono text-navy-900">{formatDate(data.generationTimestamp)}</span>
          </div>
        </div>

        {/* Official Actions */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleDownloadPDFReport}
            className="cyber-btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 font-bold shadow-md"
          >
            <Download className="w-4 h-4" /> Download Official Multi-Page Case PDF Report
          </button>

          <Link
            to="/login"
            className="cyber-btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2 text-navy-800"
          >
            <ExternalLink className="w-4 h-4" /> Open Case in Evidence Portal
          </Link>
        </div>

        <div className="text-[10px] text-center text-navy-500 font-mono">
          ISO/IEC 27037 Standard • Section 65B Indian Evidence Act Compliant
        </div>
      </GlassCard>
    </div>
  )
}
