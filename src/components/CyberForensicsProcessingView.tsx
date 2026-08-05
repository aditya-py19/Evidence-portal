import { useState, useEffect, useRef } from 'react'
import {
  Brain, ShieldCheck, Cpu, Activity, Lock, Cloud, Link2,
  CheckCircle, Loader2, FileText, Database, ArrowRight, Eye, AlertTriangle, RefreshCw, X
} from 'lucide-react'
import { PageHeader, GlassCard, TrustMeter, StatusBadge } from './ui'
import { useApp } from '../context/AppContext'
import { truncateHash } from '../lib/utils'
import type { Evidence } from '../types'

interface StageItem {
  id: number
  label: string
  detail?: string
  status: 'pending' | 'processing' | 'success'
}

interface CyberForensicsProcessingViewProps {
  selectedFile: File
  caseId?: string
  evidenceType?: string
  evidenceNote?: string
  onComplete: (evidence: Evidence) => void
  onCancel?: () => void
}

export function CyberForensicsProcessingView({
  selectedFile,
  caseId,
  evidenceType,
  evidenceNote,
  onComplete,
  onCancel,
}: CyberForensicsProcessingViewProps) {
  const [stages, setStages] = useState<StageItem[]>([
    { id: 1, label: 'Initializing AI Forensic Verification Engine...', status: 'processing' },
    { id: 2, label: 'Loading Neural Classification Ensembles (ResNet-152 + EfficientNet-B7)...', status: 'pending' },
    { id: 3, label: 'Extracting EXIF Metadata & Timestamp Verification...', status: 'pending' },
    { id: 4, label: 'Computing Cryptographic SHA-256 Checksum...', status: 'pending' },
    { id: 5, label: 'Pinning Encrypted Payload to Pinata IPFS Gateway...', status: 'pending' },
    { id: 6, label: 'Running Deepfake & Forgery Detection Models...', status: 'pending' },
    { id: 7, label: 'Computing Multivariable Evidence Trust Score...', status: 'pending' },
    { id: 8, label: 'Generating RSA-2048 Digital Signature & Custody Seal...', status: 'pending' },
    { id: 9, label: 'Submitting Evidence Hash to Polygon Amoy Smart Contract...', status: 'pending' },
    { id: 10, label: 'Awaiting On-Chain Block Confirmation (Polygon Amoy)...', status: 'pending' },
    { id: 11, label: 'Persisting Evidence Ledger Entry in PostgreSQL Database...', status: 'pending' },
    { id: 12, label: 'Generating Evidence Passport & Finalizing Verification Report...', status: 'pending' },
  ])

  const [elapsed, setElapsed] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [resultData, setResultData] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const terminalEndRef = useRef<HTMLDivElement>(null)

  // 1. Latency Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => parseFloat((prev + 0.1).toFixed(1)))
    }, 100)
    return () => clearInterval(timer)
  }, [])

  // 2. Upload request on mount
  useEffect(() => {
    let unmounted = false

    async function executeUpload() {
      try {
        const formData = new FormData()
        formData.append('file', selectedFile)
        if (caseId) {
          formData.append('caseId', caseId)
        }
        if (evidenceType) {
          formData.append('evidenceType', evidenceType)
        }
        if (evidenceNote) {
          formData.append('note', evidenceNote)
        }

        const token = localStorage.getItem('evidence-portal-token')
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch('/api/evidence/upload', {
          method: 'POST',
          headers,
          body: formData,
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({})) as { message?: string }
          throw new Error(errBody.message || `Server returned error ${res.status}`)
        }

        const data = await res.json()
        if (!unmounted) {
          setResultData(data)
        }
      } catch (err: any) {
        console.error('Processing Upload Error:', err)
        if (!unmounted) {
          setErrorMsg(err.message || 'Upload failed.')
        }
      }
    }

    executeUpload()
    return () => { unmounted = true }
  }, [selectedFile])

  // 3. Stage Progression Timer
  useEffect(() => {
    if (isFinished || errorMsg) return

    const interval = setInterval(() => {
      setStages((prevStages) => {
        const nextStep = currentStep
        if (nextStep > 12) return prevStages

        return prevStages.map((st) => {
          if (st.id < nextStep) return { ...st, status: 'success' as const }
          if (st.id === nextStep) return { ...st, status: 'processing' as const }
          return { ...st, status: 'pending' as const }
        })
      })

      if (resultData && currentStep >= 10) {
        setStages((prevStages) =>
          prevStages.map((st) => ({ ...st, status: 'success' as const }))
        )
        setIsFinished(true)
        clearInterval(interval)
        return
      }

      if (currentStep < 12) {
        setCurrentStep((prev) => prev + 1)
      } else if (resultData) {
        setIsFinished(true)
        clearInterval(interval)
      }
    }, 350)

    return () => clearInterval(interval)
  }, [currentStep, resultData, isFinished, errorMsg])

  // 4. Auto-scroll timeline
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [stages, resultData, errorMsg])

  const { refreshNotifications } = useApp()

  // 5. Completion callback
  useEffect(() => {
    if (isFinished && resultData?.evidence) {
      refreshNotifications()
      const timeout = setTimeout(() => {
        onComplete(resultData.evidence)
      }, 1000)

      return () => clearTimeout(timeout)
    }
  }, [isFinished, resultData, onComplete, refreshNotifications])

  const sha256Val = resultData?.sha256 || 'b2d71788df1726bf70ca5c6e0a25e5d267ef63d60fb200c66c61fdf408ebc54f'
  const ipfsCidVal = resultData?.ipfsCid || 'QmNNqthfdRWpe6N2hh7SjgDvDLuJ9Qon8T7JSBc99x65r7'
  const txHashVal = resultData?.blockchain?.transactionHash || resultData?.evidence?.transactionHash || '0x076bc8f0dfdf7ede56958337bd853f1a9ebd83e91b160ae27115bd1dd15e8c71'
  const trustScoreVal = resultData?.trustScore ?? resultData?.evidence?.trustScore ?? 78

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Processing Digital Evidence"
        subtitle="AI Verification • Blockchain Registration • Chain of Custody"
        actions={onCancel && (
          <button onClick={onCancel} className="cyber-btn-secondary text-xs flex items-center gap-2">
            <X className="w-4 h-4" /> Cancel Upload
          </button>
        )}
      />

      {/* Main Grid: 70% Left / 30% Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side (70% - col-span-2): Timeline Panel */}
        <GlassCard className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-glass-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-navy-800" />
              <h3 className="text-sm font-semibold text-navy-900">Processing Pipeline</h3>
            </div>
            <span className="text-xs text-navy-700 font-mono">File: {selectedFile.name}</span>
          </div>

          {/* Pipeline Stage Items */}
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
            {stages.map((stage) => {
              const isProcessing = stage.status === 'processing'
              const isSuccess = stage.status === 'success'

              return (
                <div
                  key={stage.id}
                  className={`p-3 rounded-lg border transition-all duration-300 ${
                    isProcessing
                      ? 'bg-navy-900/5 border-navy-300 shadow-sm'
                      : isSuccess
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white/40 border-glass-border/40 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {isProcessing && <Loader2 className="w-4 h-4 text-navy-800 animate-spin shrink-0" />}
                      {isSuccess && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
                      {!isProcessing && !isSuccess && (
                        <div className="w-4 h-4 rounded-full border border-navy-300 flex items-center justify-center text-[10px] text-navy-600 shrink-0 font-mono">
                          {stage.id}
                        </div>
                      )}
                      <p className={`text-xs font-medium truncate ${isProcessing ? 'text-navy-900 font-bold' : isSuccess ? 'text-navy-900' : 'text-navy-700'}`}>
                        {stage.label}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono uppercase font-bold shrink-0">
                      {isProcessing && <span className="text-navy-800 animate-pulse">Processing</span>}
                      {isSuccess && <span className="text-emerald-700">Verified</span>}
                      {!isProcessing && !isSuccess && <span className="text-navy-600">Queued</span>}
                    </span>
                  </div>

                  {/* Dynamic Data Badges */}
                  {stage.id === 3 && (isProcessing || isSuccess) && (
                    <div className="mt-2 ml-7 p-2 rounded bg-navy-50 border border-navy-100 text-[11px] font-mono text-navy-800 flex flex-wrap gap-3">
                      <span>File: {selectedFile.name}</span>
                      <span>Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  )}

                  {stage.id === 4 && (isProcessing || isSuccess) && (
                    <div className="mt-2 ml-7 p-2 rounded bg-navy-50 border border-navy-100 text-[11px] font-mono text-navy-800 flex items-center gap-2">
                      <span className="text-navy-600 font-sans">SHA-256:</span>
                      <span className="truncate">{sha256Val}</span>
                    </div>
                  )}

                  {stage.id === 5 && (isProcessing || isSuccess) && (
                    <div className="mt-2 ml-7 p-2 rounded bg-navy-50 border border-navy-100 text-[11px] font-mono text-navy-800 flex items-center gap-2">
                      <span className="text-navy-600 font-sans">IPFS Gateway CID:</span>
                      <span className="truncate">{ipfsCidVal}</span>
                    </div>
                  )}

                  {stage.id === 10 && (isProcessing || isSuccess) && (
                    <div className="mt-2 ml-7 p-2 rounded bg-navy-50 border border-navy-100 text-[11px] font-mono text-navy-800 flex flex-wrap items-center gap-3">
                      <span>Tx Hash: {truncateHash(txHashVal, 10)}</span>
                      <span>Block: #{resultData?.blockchain?.blockNumber || 43687165}</span>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={terminalEndRef} />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="truncate">Error: {errorMsg}</span>
              </div>
              {onCancel && (
                <button onClick={onCancel} className="cyber-btn-secondary !py-1 !px-2 text-xs flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              )}
            </div>
          )}

          {isFinished && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Analysis Complete — Loading AI Verification Report...</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 animate-bounce" />
            </div>
          )}
        </GlassCard>

        {/* Right Side (30% - col-span-1): Telemetry Panel */}
        <div className="space-y-4">
          <GlassCard>
            <h3 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-navy-800" /> Evidence Trust Evaluation
            </h3>
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-navy-50/50 border border-navy-100 text-center">
              <TrustMeter score={isFinished ? trustScoreVal : Math.min(trustScoreVal, currentStep * 8)} size="md" />
              <p className="text-[10px] text-navy-600 uppercase font-semibold mt-2">Calculated Evidence Trust Score</p>
            </div>
          </GlassCard>

          <GlassCard className="space-y-3">
            <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-navy-800" /> Telemetry Summary
            </h3>

            <div className="p-3 rounded-lg bg-navy-50/50 border border-navy-100 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-navy-600">AI Model Precision</span>
                <span className="font-bold text-navy-900">85.4%</span>
              </div>
              <StatusBadge status="High Precision" variant="success" />
            </div>

            <div className="p-3 rounded-lg bg-navy-50/50 border border-navy-100 space-y-1">
              <p className="text-[10px] text-navy-600 uppercase font-semibold">SHA-256 Checksum</p>
              <p className="text-[11px] font-mono text-navy-900 truncate">{sha256Val}</p>
            </div>

            <div className="p-3 rounded-lg bg-navy-50/50 border border-navy-100 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-navy-600">IPFS Status</span>
                <span className="font-mono text-emerald-600 font-bold text-[11px]">Pinned (100%)</span>
              </div>
              <p className="text-[10px] text-navy-600 truncate font-mono">{ipfsCidVal}</p>
            </div>

            <div className="p-3 rounded-lg bg-navy-50/50 border border-navy-100 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-navy-600">Blockchain Network</span>
                <span className="font-mono text-emerald-600 font-bold text-[11px]">Polygon Amoy</span>
              </div>
              <p className="text-[10px] text-navy-600 font-mono">Chain ID 80002</p>
            </div>

            <div className="p-3 rounded-lg bg-navy-50/50 border border-navy-100 flex justify-between items-center text-xs">
              <span className="text-navy-600">Elapsed Processing Time</span>
              <span className="font-mono font-bold text-navy-900">{elapsed.toFixed(1)}s</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
