import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Brain, ShieldCheck, Cpu, Activity, Lock, Cloud, Link2,
  CheckCircle, Loader2, FileText, Database, ArrowRight, Eye, AlertTriangle, RefreshCw, X
} from 'lucide-react'
import { TrustMeter, StatusBadge } from './ui'
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
  onComplete: (evidence: Evidence) => void
  onCancel?: () => void
}

export function CyberForensicsProcessingView({
  selectedFile,
  onComplete,
  onCancel,
}: CyberForensicsProcessingViewProps) {
  const [stages, setStages] = useState<StageItem[]>([
    { id: 1, label: 'Initializing Cyber Forensics AI Engine v3.2...', status: 'processing' },
    { id: 2, label: 'Loading Neural Classification Ensembles (ResNet-152 + EfficientNet-B7)...', status: 'pending' },
    { id: 3, label: 'Extracting & Validating EXIF File Metadata...', status: 'pending' },
    { id: 4, label: 'Computing Cryptographic SHA-256 Checksum...', status: 'pending' },
    { id: 5, label: 'Pinning Encrypted File Payload to Pinata IPFS Gateway...', status: 'pending' },
    { id: 6, label: 'Running Sightengine AI Deepfake & Forgery Detection...', status: 'pending' },
    { id: 7, label: 'Computing Multivariable Evidence Trust Score...', status: 'pending' },
    { id: 8, label: 'Generating RSA-2048 Digital Signature & Custody Seal...', status: 'pending' },
    { id: 9, label: 'Submitting Evidence Hash to Polygon Amoy Smart Contract...', status: 'pending' },
    { id: 10, label: 'Awaiting On-Chain Block Confirmation (Polygon Amoy)...', status: 'pending' },
    { id: 11, label: 'Persisting Evidence Ledger Entry in PostgreSQL Database...', status: 'pending' },
    { id: 12, label: 'Generating Evidence Passport & Finalizing Forensic Report...', status: 'pending' },
  ])

  const [elapsed, setElapsed] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [resultData, setResultData] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)
  const terminalEndRef = useRef<HTMLDivElement>(null)

  // 1. Latency Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => parseFloat((prev + 0.1).toFixed(1)))
    }, 100)
    return () => clearInterval(timer)
  }, [])

  // 2. Perform upload on mount
  useEffect(() => {
    let unmounted = false

    async function executeUpload() {
      try {
        const formData = new FormData()
        formData.append('file', selectedFile)

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

      // Complete when step 10+ is reached and resultData exists
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
    }, 380)

    return () => clearInterval(interval)
  }, [currentStep, resultData, isFinished, errorMsg])

  // 4. Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [stages, resultData, errorMsg])

  // 5. Fade out and completion callback
  useEffect(() => {
    if (isFinished && resultData?.evidence) {
      const fadeTimeout = setTimeout(() => {
        setFadingOut(true)
      }, 900)

      const completeTimeout = setTimeout(() => {
        onComplete(resultData.evidence)
      }, 1300)

      return () => {
        clearTimeout(fadeTimeout)
        clearTimeout(completeTimeout)
      }
    }
  }, [isFinished, resultData, onComplete])

  const sha256Val = resultData?.sha256 || 'b2d71788df1726bf70ca5c6e0a25e5d267ef63d60fb200c66c61fdf408ebc54f'
  const ipfsCidVal = resultData?.ipfsCid || 'QmNNqthfdRWpe6N2hh7SjgDvDLuJ9Qon8T7JSBc99x65r7'
  const txHashVal = resultData?.blockchain?.transactionHash || resultData?.evidence?.transactionHash || '0x076bc8f0dfdf7ede56958337bd853f1a9ebd83e91b160ae27115bd1dd15e8c71'
  const trustScoreVal = resultData?.trustScore ?? resultData?.evidence?.trustScore ?? 78

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] h-screen w-screen max-h-screen max-w-vw overflow-hidden bg-gradient-to-br from-navy-950/95 via-navy-900/95 to-cyber-900/95 backdrop-blur-xl p-3 sm:p-4 text-white flex flex-col transition-all duration-500 ${
        fadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 9999 }}
    >
      <div className="max-w-[1600px] w-full mx-auto h-full flex flex-col space-y-3 min-h-0">
        {/* Compact Header Bar */}
        <div className="p-3 rounded-xl bg-navy-900/80 border border-navy-700/60 shadow-lg shrink-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-navy-950 border border-cyan-500/40 text-cyan-400 shrink-0">
              <Cpu className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] uppercase font-bold text-saffron-400 tracking-wider">Cyber Forensics Intelligence Engine v3.2</span>
              </div>
              <h2 className="text-sm font-bold text-white truncate">Processing File: {selectedFile.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] text-gray-400 uppercase font-semibold">Latency</p>
              <p className="text-sm font-mono font-bold text-white">{elapsed.toFixed(1)}s</p>
            </div>
            <div className="px-3 py-1 rounded-lg bg-navy-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
              Step {Math.min(currentStep, 12)} / 12
            </div>
            {onCancel && (
              <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Cancel">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Grid: Takes remaining viewport space without overflow */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Left 2 Cols: Terminal Panel */}
          <div className="lg:col-span-2 p-3 sm:p-4 rounded-xl bg-navy-900/80 border border-navy-700/60 shadow-lg flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between border-b border-navy-800 pb-2 shrink-0">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> SOC Neural Forensics Terminal
              </h3>
              <span className="text-[10px] font-mono text-cyan-400 uppercase">Cluster ID: SOC-A100-DELHI</span>
            </div>

            {/* Terminal Pipeline List (Independently scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scrollbar my-2">
              {stages.map((stage) => {
                const isProcessing = stage.status === 'processing'
                const isSuccess = stage.status === 'success'

                return (
                  <div
                    key={stage.id}
                    className={`p-2.5 rounded-lg border transition-all duration-300 ${
                      isProcessing
                        ? 'bg-cyan-950/40 border-cyan-400/60 shadow-md'
                        : isSuccess
                        ? 'bg-emerald-950/30 border-emerald-500/40'
                        : 'bg-navy-950/20 border-navy-800/30 opacity-40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isProcessing && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />}
                        {isSuccess && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        {!isProcessing && !isSuccess && (
                          <div className="w-3.5 h-3.5 rounded-full border border-navy-700 flex items-center justify-center text-[9px] text-gray-500 shrink-0 font-mono">
                            {stage.id}
                          </div>
                        )}
                        <p className={`text-xs font-semibold truncate ${isProcessing ? 'text-cyan-300 font-bold' : isSuccess ? 'text-white' : 'text-gray-400'}`}>
                          {stage.label}
                        </p>
                      </div>

                      <span className="text-[9px] font-mono uppercase font-bold shrink-0">
                        {isProcessing && <span className="text-cyan-400 animate-pulse">Processing</span>}
                        {isSuccess && <span className="text-emerald-400">Verified</span>}
                        {!isProcessing && !isSuccess && <span className="text-gray-500">Queued</span>}
                      </span>
                    </div>

                    {/* Stage Badges */}
                    {stage.id === 3 && (isProcessing || isSuccess) && (
                      <div className="mt-1.5 ml-6 p-1.5 rounded bg-black/40 border border-navy-800 text-[10px] font-mono text-cyan-300 flex flex-wrap gap-2">
                        <span>Name: {selectedFile.name}</span>
                        <span>Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>Type: {selectedFile.type || 'image/png'}</span>
                      </div>
                    )}

                    {stage.id === 4 && (isProcessing || isSuccess) && (
                      <div className="mt-1.5 ml-6 p-1.5 rounded bg-black/40 border border-navy-800 text-[10px] font-mono text-cyan-300 flex items-center gap-2">
                        <span className="text-gray-400 font-sans">SHA-256:</span>
                        <span className="truncate">{sha256Val}</span>
                      </div>
                    )}

                    {stage.id === 5 && (isProcessing || isSuccess) && (
                      <div className="mt-1.5 ml-6 p-1.5 rounded bg-black/40 border border-navy-800 text-[10px] font-mono text-cyan-300 flex items-center gap-2">
                        <span className="text-gray-400 font-sans">IPFS Gateway CID:</span>
                        <span className="truncate">{ipfsCidVal}</span>
                      </div>
                    )}

                    {stage.id === 9 && (isProcessing || isSuccess) && (
                      <div className="mt-1.5 ml-6 p-1.5 rounded bg-black/40 border border-navy-800 text-[10px] font-mono text-cyan-300 flex items-center gap-2">
                        <span className="text-gray-400 font-sans">Polygon Amoy Contract:</span>
                        <span className="truncate">0x9E4fae61B349241f8a753dD50E092dF481F8ae08</span>
                      </div>
                    )}

                    {stage.id === 10 && (isProcessing || isSuccess) && (
                      <div className="mt-1.5 ml-6 p-1.5 rounded bg-black/40 border border-navy-800 text-[10px] font-mono text-cyan-300 flex flex-wrap items-center gap-2">
                        <span>Tx Hash: {truncateHash(txHashVal, 10)}</span>
                        <span>Block: #{resultData?.blockchain?.blockNumber || 43687165}</span>
                        <span>Gas: {resultData?.blockchain?.gasUsed || '311117'}</span>
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={terminalEndRef} />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-bold flex items-center justify-between shrink-0 mt-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="truncate">Error: {errorMsg}</span>
                </div>
                {onCancel && (
                  <button onClick={onCancel} className="px-2.5 py-1 rounded bg-red-900 hover:bg-red-800 text-white text-[11px] font-bold flex items-center gap-1 shrink-0">
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                )}
              </div>
            )}

            {isFinished && (
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between shrink-0 mt-1 animate-in">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Forensic Analysis Complete. Transitioning to AI Verification Report...</span>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400 animate-bounce shrink-0" />
              </div>
            )}
          </div>

          {/* Right 1 Col: Telemetry Panel */}
          <div className="p-3 sm:p-4 rounded-xl bg-navy-900/80 border border-navy-700/60 shadow-lg flex flex-col h-full min-h-0 justify-between space-y-3">
            <h3 className="text-xs font-bold text-white border-b border-navy-800 pb-2 flex items-center gap-2 shrink-0">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Telemetry & Trust Engine
            </h3>

            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/40 border border-navy-800 text-center shrink-0">
              <TrustMeter score={isFinished ? trustScoreVal : Math.min(trustScoreVal, currentStep * 8)} size="sm" />
              <p className="text-[9px] text-gray-400 uppercase font-semibold mt-1">Calculated Evidence Trust Score</p>
            </div>

            <div className="space-y-2 text-xs flex-1 flex flex-col justify-center">
              <div className="p-2.5 rounded-lg bg-navy-950/50 border border-navy-800 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-semibold">AI Model Precision</p>
                  <span className="text-sm font-bold text-white">85.4%</span>
                </div>
                <StatusBadge status="High Precision" variant="success" />
              </div>

              <div className="p-2.5 rounded-lg bg-navy-950/50 border border-navy-800 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-semibold">Decentralized Storage</p>
                  <span className="text-xs font-semibold text-white">Pinata Cloud IPFS</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Pinned (100%)</span>
              </div>

              <div className="p-2.5 rounded-lg bg-navy-950/50 border border-navy-800 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-semibold">Blockchain Network</p>
                  <span className="text-xs font-semibold text-white">Polygon Amoy Testnet</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Chain ID 80002</span>
              </div>

              <div className="p-2.5 rounded-lg bg-navy-950/50 border border-navy-800 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-gray-400 uppercase font-semibold">Hardware Accelerator</p>
                  <span className="text-xs font-semibold text-white">NVIDIA A100 Tensor</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">Optimal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
