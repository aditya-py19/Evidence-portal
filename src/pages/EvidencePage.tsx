import { useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Upload, Image, Video, Music, FileText, Eye, Shield,
  Brain, Link2, X,
} from 'lucide-react'
import { PageHeader, GlassCard, SearchInput, StatusBadge, TrustMeter } from '../components/ui'
import { CyberForensicsProcessingView } from '../components/CyberForensicsProcessingView'
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
  const navigate = useNavigate()
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processingFile, setProcessingFile] = useState<File | null>(null)

  const fetchEvidence = useCallback(async () => {
    try {
      const token = localStorage.getItem('evidence-portal-token')
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch('/api/evidence', { headers })
      if (response.ok) {
        const body = await response.json() as { evidence?: Evidence[] }
        if (body.evidence && Array.isArray(body.evidence)) {
          setEvidence(body.evidence)
        }
      }
    } catch (err) {
      console.error('Failed to load evidence from server:', err)
    }
  }, [])

  useEffect(() => {
    fetchEvidence()
  }, [fetchEvidence])

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

  const handleUpload = () => {
    console.log('[DEBUG 1] handleUpload() triggered with file:', selectedFile?.name)
    if (!selectedFile) {
      console.warn('[DEBUG 1.1] handleUpload aborted because selectedFile is null')
      return
    }
    console.log('[DEBUG 2] Setting processingFile to:', selectedFile.name)
    setProcessingFile(selectedFile)
    setSelectedFile(null)
  }

  console.log('[DEBUG 3] EvidencePage rendering. processingFile =', processingFile?.name, '| selectedFile =', selectedFile?.name)

  if (processingFile) {
    console.log('[DEBUG 4] EvidencePage rendering CyberForensicsProcessingView!')
    return (
      <CyberForensicsProcessingView
        selectedFile={processingFile}
        onCancel={() => {
          console.log('[DEBUG CANCEL] Resetting processingFile to null')
          setProcessingFile(null)
        }}
        onComplete={(newEvidence) => {
          console.log('[DEBUG COMPLETE] Upload complete! Redirecting to:', newEvidence.id)
          setProcessingFile(null)
          setEvidence((prev) => [newEvidence, ...prev])
          navigate(`/ai-verification/${newEvidence.id}`, { state: { evidence: newEvidence } })
        }}
      />
    )
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
            accept="image/*,video/*,audio/*,.png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                console.log("Selected:", file.name)
                console.log("Type:", file.type)
                console.log("Size:", file.size)
                setSelectedFile(file)
              }
              e.target.value = ''
            }}
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
              <button onClick={() => setSelectedFile(null)} className="text-navy-700 hover:text-navy-900" title="Remove file">
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile}
              className="cyber-btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" /> Upload & Launch Cyber Forensics Engine
            </button>

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
