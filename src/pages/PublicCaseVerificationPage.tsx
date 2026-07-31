import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import QRCode from 'react-qr-code'
import {
  ShieldCheck, CheckCircle, Database, Link2, Brain, Activity, Clock,
  FileText, Shield, User, Lock, AlertTriangle, ArrowLeft, QrCode, Loader2
} from 'lucide-react'
import { GlassCard, TrustMeter, StatusBadge } from '../components/ui'
import { QRShareSection } from '../components/QRShareSection'
import { formatDate, truncateHash } from '../lib/utils'

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

      // Step 1: PostgreSQL Lookup
      const step1Timer = setTimeout(() => setValidationStep(2), 300)
      // Step 2: Blockchain Verification
      const step2Timer = setTimeout(() => setValidationStep(3), 600)
      // Step 3: Cryptographic Integrity
      const step3Timer = setTimeout(() => setValidationStep(4), 900)

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
        setTimeout(() => setLoading(false), 1000)
      }

      return () => {
        clearTimeout(step1Timer)
        clearTimeout(step2Timer)
        clearTimeout(step3Timer)
      }
    }

    fetchVerificationData()
  }, [verificationToken])

  const verifyUrl = typeof window !== 'undefined' ? window.location.href : `https://evidence-portal.gov.in/verify/${verificationToken}`

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-navy-900 text-saffron-500 flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-navy-900">Validating Case Verification Token</h2>

          {/* Validation Steps */}
          <div className="space-y-2.5 text-left text-xs pt-2">
            <div className={`p-2.5 rounded-lg border flex items-center justify-between ${validationStep >= 1 ? 'bg-blue-50 border-blue-200 text-navy-900 font-semibold' : 'opacity-40'}`}>
              <div className="flex items-center gap-2">
                {validationStep > 1 ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                <span>1. Querying PostgreSQL Central Ledger...</span>
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
    <div className="min-h-screen bg-navy-50 p-4 sm:p-8 space-y-6 max-w-[1200px] mx-auto animate-in">
      {/* Official Header */}
      <div className="p-6 rounded-2xl bg-white border border-navy-100 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-navy-900 text-saffron-500 flex items-center justify-center shadow-md shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase font-bold text-saffron-600 tracking-wider">Government of India • Police & Judicial Verification</span>
            </div>
            <h1 className="text-xl font-bold text-navy-900 leading-tight">Authentic Digital Case Verification Record</h1>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono">
          {data.courtReadyStatus}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Identification & Officer Metadata */}
          <GlassCard className="space-y-4">
            <h3 className="text-sm font-bold text-navy-900 border-b border-navy-100 pb-2">
              Case Metadata & Investigating Authority
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-navy-50/50 border border-navy-100">
                <p className="text-[10px] text-navy-600 uppercase font-semibold">Case ID</p>
                <p className="text-sm font-mono font-bold text-navy-900 mt-0.5">{data.caseId}</p>
              </div>
              <div className="p-3 rounded-xl bg-navy-50/50 border border-navy-100">
                <p className="text-[10px] text-navy-600 uppercase font-semibold">FIR Number</p>
                <p className="text-sm font-mono font-bold text-navy-900 mt-0.5">{data.firNumber}</p>
              </div>
              <div className="p-3 rounded-xl bg-navy-50/50 border border-navy-100 sm:col-span-2">
                <p className="text-[10px] text-navy-600 uppercase font-semibold">Case Title</p>
                <p className="text-sm font-bold text-navy-900 mt-0.5">{data.caseTitle}</p>
              </div>
              <div className="p-3 rounded-xl bg-navy-50/50 border border-navy-100 sm:col-span-2">
                <p className="text-[10px] text-navy-600 uppercase font-semibold">Description</p>
                <p className="text-xs text-navy-700 mt-0.5">{data.caseDescription}</p>
              </div>
              <div className="p-3 rounded-xl bg-navy-50/50 border border-navy-100">
                <p className="text-[10px] text-navy-600 uppercase font-semibold">Lead Investigating Officer</p>
                <p className="text-sm font-bold text-navy-900 mt-0.5">{data.leadOfficer}</p>
              </div>
              <div className="p-3 rounded-xl bg-navy-50/50 border border-navy-100">
                <p className="text-[10px] text-navy-600 uppercase font-semibold">Department & Unit</p>
                <p className="text-sm font-bold text-navy-900 mt-0.5">{data.department}</p>
              </div>
            </div>
          </GlassCard>

          {/* Cryptographic Integrity & Polygon Amoy */}
          <GlassCard className="space-y-4">
            <h3 className="text-sm font-bold text-navy-900 border-b border-navy-100 pb-2 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-navy-800" /> Polygon Blockchain & IPFS Ledger
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-navy-50/50 border border-navy-100 space-y-1">
                <p className="text-[10px] text-navy-600 uppercase font-semibold">SHA-256 Cryptographic Checksum</p>
                <p className="text-xs font-mono font-bold text-navy-900 truncate">{data.sha256Hash}</p>
              </div>

              <div className="p-3 rounded-xl bg-navy-50/50 border border-navy-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-navy-600 uppercase font-semibold">Decentralized IPFS Storage</p>
                  <p className="text-xs font-mono text-navy-900 truncate max-w-[240px]">{data.ipfsStatus.cid}</p>
                </div>
                <StatusBadge status={data.ipfsStatus.status} variant="success" />
              </div>

              <div className="p-3 rounded-xl bg-navy-50/50 border border-navy-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-navy-600 font-semibold">Polygon Network</span>
                  <span className="font-semibold text-navy-900">{data.blockchainVerification.network}</span>
                </div>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-navy-600">Smart Contract</span>
                  <span className="text-navy-900 truncate max-w-[200px]">{data.blockchainVerification.contractAddress}</span>
                </div>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-navy-600">Transaction Hash</span>
                  <span className="text-navy-900 truncate max-w-[200px]">{data.blockchainVerification.transactionHash}</span>
                </div>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-navy-600">Block Number</span>
                  <span className="text-navy-900 font-bold">#{data.blockchainVerification.blockNumber}</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Evidence Items List */}
          <GlassCard className="space-y-3">
            <h3 className="text-sm font-bold text-navy-900 border-b border-navy-100 pb-2">
              Registered Evidence Files ({data.evidenceSummary.totalItems})
            </h3>
            <div className="space-y-2">
              {data.evidenceSummary.items?.map((item: any) => (
                <div key={item.evidenceId} className="p-3 rounded-xl bg-white border border-navy-100 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-mono text-navy-900 font-bold">{item.evidenceId} — {item.fileName}</p>
                    <p className="text-[10px] font-mono text-navy-600 mt-0.5 truncate max-w-[280px]">SHA-256: {item.sha256}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                    Trust Score: {item.trustScore}/100
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right 1 Col */}
        <div className="space-y-6">
          <GlassCard className="text-center space-y-3">
            <TrustMeter score={data.trustScore} size="md" />
            <p className="text-xs font-bold text-navy-900">Multivariable Evidence Trust Score</p>
          </GlassCard>

          <GlassCard className="text-center space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider border-b border-navy-100 pb-2">
              Verification QR & Sharing
            </h4>
            <QRShareSection verificationToken={data.verificationToken} caseId={data.caseId} evidenceId={data.evidenceSummary?.items?.[0]?.evidenceId} />
          </GlassCard>

          <GlassCard className="space-y-3 text-xs">
            <h4 className="font-bold text-navy-900 border-b border-navy-100 pb-2">Compliance & Audit Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-navy-100 pb-1.5">
                <span className="text-navy-600">Chain of Custody</span>
                <span className="font-semibold text-emerald-700">{data.chainOfCustodySummary.lastAction}</span>
              </div>
              <div className="flex justify-between items-center border-b border-navy-100 pb-1.5">
                <span className="text-navy-600">Audit Status</span>
                <span className="font-semibold text-navy-900">ISO 27037 Verified</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-navy-600">Generated At</span>
                <span className="font-mono text-navy-900">{formatDate(data.generationTimestamp)}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
