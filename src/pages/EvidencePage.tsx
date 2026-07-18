import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload, Image, Video, Music, FileText, Eye, Shield,
  Brain, Link2, X,
} from 'lucide-react'
import { PageHeader, GlassCard, SearchInput, StatusBadge, TrustMeter } from '../components/ui'
import { evidenceList as initialEvidence } from '../data/mockData'
import { formatDate, getTrustLevelBg } from '../lib/utils'
import type { Evidence, EvidenceType } from '../types'

const typeIcons: Record<EvidenceType, React.ReactNode> = {
  image: <Image className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  audio: <Music className="w-5 h-5" />,
  document: <FileText className="w-5 h-5" />,
}

const statusVariant = (s: string) => {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    approved: 'success', ai_review: 'info', needs_review: 'warning', high_risk: 'danger', pending: 'info',
  }
  return map[s] || 'info'
}

export default function EvidencePage() {
  const [evidence, setEvidence] = useState(initialEvidence)
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const filtered = evidence.filter((e) =>
    e.evidenceId.toLowerCase().includes(search.toLowerCase()) ||
    e.fileName.toLowerCase().includes(search.toLowerCase()) ||
    e.caseId.toLowerCase().includes(search.toLowerCase())
  )

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setUploadProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const token = localStorage.getItem('evidence-portal-token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      setUploadProgress(30)
      const response = await fetch('/api/evidence/upload', {
        method: 'POST',
        headers,
        body: formData,
      })

      setUploadProgress(70)
      if (!response.ok) {
        const errorData = await response.json() as { message?: string }
        throw new Error(errorData.message || 'Failed to upload to IPFS.')
      }

      const data = await response.json() as {
        ipfsCid: string
        sha256: string
        fileName: string
        fileSize: string
        message?: string
        aiAnalysis?: {
          available: boolean
          message: string
          aiGenerated: number
          deepfake: number
          weapon: number
          gore: number
          imageQuality: number
          riskScore: number
          recommendation: 'approved' | 'needs_manual_review' | 'high_risk'
        }
      }

      setUploadProgress(100)

      const liveAnalysis = data.aiAnalysis
      const liveStatus = liveAnalysis?.available ? 'Sightengine Live' : 'Not Analysed'
      const riskScore = liveAnalysis?.riskScore ?? 0

      const newEvidence: Evidence = {
        id: `EVD-${String(evidence.length + 1).padStart(3, '0')}`,
        evidenceId: `EVD-TC-2026-NEW-${String(evidence.length + 1).padStart(3, '0')}`,
        caseId: 'TC-2026-0142',
        caseTitle: 'Cyber Fraud – UPI Payment Scam',
        type: selectedFile.type.startsWith('image/')
          ? 'image'
          : selectedFile.type.startsWith('video/')
          ? 'video'
          : selectedFile.type.startsWith('audio/')
          ? 'audio'
          : 'document',
        fileName: data.fileName,
        fileSize: data.fileSize,
        uploadTime: new Date().toISOString(),
        uploadedBy: 'Rajesh Kumar',
        uploadedById: 'USR-001',
        status: 'ai_review',
        trustScore: 78,
        trustLevel: 'needs_review',
        sha256: data.sha256,
        ipfsCid: data.ipfsCid,
        blockchainTxId: 'tx_' + Math.random().toString(36).substring(2, 15),
        blockNumber: 2849100 + evidence.length,
        digitalSignature: 'sig_RSA_2048_' + data.sha256.substring(0, 16),
        currentOwner: 'Rajesh Kumar',
        currentDepartment: 'Cyber Crime Cell, Delhi Police',
        lastAccess: new Date().toISOString(),
        aiAnalysis: {
          deepfakeDetection: { score: liveAnalysis ? 100 - liveAnalysis.deepfake : 0, status: liveAnalysis ? liveStatus : 'Not Analysed' },
          imageForgery: { score: liveAnalysis ? 100 - Math.max(liveAnalysis.aiGenerated, liveAnalysis.deepfake) : 0, status: liveAnalysis ? liveStatus : 'Not Analysed' },
          videoTampering: { score: 90, status: 'Intact' },
          metadataAnalysis: { score: 95, status: 'Consistent' },
          duplicateDetection: { score: 98, status: 'Unique' },
          blurDetection: { score: liveAnalysis?.available ? liveAnalysis.imageQuality : 0, status: liveAnalysis?.available ? liveStatus : 'Not Analysed' },
          aiGeneratedContent: { score: liveAnalysis ? 100 - liveAnalysis.aiGenerated : 0, status: liveAnalysis ? liveStatus : 'Not Analysed' },
          riskScore,
          confidence: liveAnalysis?.available ? Math.max(0, 100 - Math.round(riskScore / 2)) : 0,
          recommendation: liveAnalysis?.recommendation ?? 'needs_manual_review',
        },
        trustBreakdown: {
          aiVerification: 88,
          metadataConsistency: 95,
          sha256Hash: 100,
          digitalSignature: 95,
          chainOfCustody: 90,
          geolocation: 100,
          blockchain: 100,
        },
        geoStatus: 'verified',
        geoDistance: 0.5,
        allowedRadius: 5,
        crimeLocation: { lat: 28.6315, lng: 77.2167, address: 'Connaught Place, New Delhi' },
        uploadLocation: { lat: 28.6289, lng: 77.2065, address: 'Cyber Crime Cell HQ, Delhi' },
      }

      setEvidence([newEvidence, ...evidence])
      setUploading(false)
      setSelectedFile(null)
      alert(data.message || `Successfully uploaded to IPFS! CID: ${data.ipfsCid}`)
    } catch (err: unknown) {
      setUploading(false)
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      alert(`Upload failed: ${errorMsg}`)
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Evidence Management"
        subtitle="Upload, preview, and manage digital evidence with chain of custody"
      />

      <GlassCard>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragOver ? 'border-navy-600 bg-navy-700/5' : 'border-glass-border hover:border-navy-400'
          }`}
        >
          <Upload className="w-10 h-10 text-navy-800 mx-auto mb-3" />
          <p className="text-navy-900 font-medium">Drag & Drop Evidence Files</p>
          <p className="text-xs text-navy-700 mt-1">Images, Videos, Audio, Documents — Max 500MB</p>
          <input
            type="file"
            className="hidden"
            id="file-upload"
            onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
          />
          <label htmlFor="file-upload" className="cyber-btn-secondary mt-4 inline-flex cursor-pointer">
            Browse Files
          </label>
        </div>

        {selectedFile && (
          <div className="mt-4 p-4 rounded-lg bg-cyber-800/50 border border-glass-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-navy-800" />
                <div>
                  <p className="text-sm text-navy-900 font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-navy-700">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={() => setSelectedFile(null)} className="text-navy-700 hover:text-navy-900">
                <X className="w-4 h-4" />
              </button>
            </div>
            {uploading ? (
              <div>
                <div className="flex justify-between text-xs text-navy-700 mb-1">
                  <span>Uploading & Encrypting...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-cyber-900 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200 rounded-full" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <button onClick={handleUpload} className="cyber-btn-primary w-full">
                <Upload className="w-4 h-4" /> Upload to Secure Storage
              </button>
            )}
          </div>
        )}
      </GlassCard>

      <GlassCard className="!p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search evidence by ID, filename, or case..." />
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((ev) => (
          <GlassCard key={ev.id} hover className="!p-0 overflow-hidden">
            <div className="p-4 border-b border-glass-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyber-800/50 text-navy-800">
                  {typeIcons[ev.type]}
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-900 truncate max-w-[180px]">{ev.fileName}</p>
                  <p className="text-[10px] font-mono text-navy-800">{ev.evidenceId}</p>
                </div>
              </div>
              <TrustMeter score={ev.trustScore} size="sm" showLabel={false} />
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-navy-600">Case</span>
                <span className="text-navy-800 font-mono">{ev.caseId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-navy-600">Uploaded By</span>
                <span className="text-navy-800">{ev.uploadedBy}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-navy-600">Upload Time</span>
                <span className="text-navy-800">{formatDate(ev.uploadTime)}</span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-navy-600">Status</span>
                <StatusBadge status={ev.status.replace('_', ' ')} variant={statusVariant(ev.status)} />
              </div>
              <div className={`text-center py-1.5 rounded-lg border text-xs font-medium ${getTrustLevelBg(ev.trustLevel)}`}>
                {ev.trustLevel.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <div className="p-3 border-t border-glass-border flex gap-2">
              <Link to={`/ai-verification/${ev.id}`} state={{ evidence: ev }} className="cyber-btn-secondary flex-1 text-xs py-2">
                <Brain className="w-3.5 h-3.5" /> AI
              </Link>
              <Link to={`/trust-score/${ev.id}`} className="cyber-btn-secondary flex-1 text-xs py-2">
                <Shield className="w-3.5 h-3.5" /> Trust
              </Link>
              <Link to={`/chain-of-custody/${ev.id}`} className="cyber-btn-secondary flex-1 text-xs py-2">
                <Link2 className="w-3.5 h-3.5" /> Chain
              </Link>
              <Link to={`/evidence-passport/${ev.id}`} className="cyber-btn-secondary flex-1 text-xs py-2">
                <Eye className="w-3.5 h-3.5" /> View
              </Link>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
