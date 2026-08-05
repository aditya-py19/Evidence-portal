import { useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Upload, Image, Video, Music, FileText, Eye, Shield,
  Brain, Link2, X, FolderPlus, CheckCircle2, AlertTriangle, Search
} from 'lucide-react'
import { PageHeader, GlassCard, SearchInput, StatusBadge, TrustMeter } from '../components/ui'
import { CyberForensicsProcessingView } from '../components/CyberForensicsProcessingView'
import { formatDate, getTrustLevelBg, isInvestigationRole } from '../lib/utils'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AppContext'
import type { Evidence, EvidenceType, Case } from '../types'

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
  const { user } = useAuth()
  const isInvestigationOfficer = isInvestigationRole(user?.role)
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [evidenceNote, setEvidenceNote] = useState('')
  const [processingFile, setProcessingFile] = useState<File | null>(null)

  // Case Assignment Modal State
  const [assigningEvidence, setAssigningEvidence] = useState<Evidence | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState<string>('')
  const [caseSearch, setCaseSearch] = useState<string>('')
  const [assigningLoading, setAssigningLoading] = useState<boolean>(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const fetchEvidence = useCallback(async () => {
    try {
      const response = await apiFetch('/api/evidence')
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

  const fetchCases = useCallback(async () => {
    try {
      const response = await apiFetch('/api/cases')
      if (response.ok) {
        const body = await response.json() as { cases?: Case[] }
        if (body.cases && Array.isArray(body.cases)) {
          setCases(body.cases)
        }
      }
    } catch (err) {
      console.error('Failed to load cases from server:', err)
    }
  }, [])

  useEffect(() => {
    fetchEvidence()
    fetchCases()
  }, [fetchEvidence, fetchCases])

  const handleAssignToCase = async () => {
    if (!assigningEvidence || !selectedCaseId) return
    setAssigningLoading(true)
    setAssignError(null)

    try {
      const response = await apiFetch(`/api/evidence/${assigningEvidence.id}/assign-case`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: selectedCaseId }),
      })

      if (response.ok) {
        setAssigningEvidence(null)
        setSelectedCaseId('')
        await fetchEvidence()
      } else {
        const errData = await response.json() as { message?: string }
        setAssignError(errData.message || 'Failed to assign evidence to case.')
      }
    } catch (err) {
      setAssignError('Network error while assigning case.')
    } finally {
      setAssigningLoading(false)
    }
  }

  const filtered = evidence.filter((e) => {
    const isUnassigned = e.assignmentStatus === 'UNASSIGNED' || !e.caseId || e.caseId === 'Unassigned'
    if (activeTab === 'assigned' && isUnassigned) return false
    if (activeTab === 'unassigned' && !isUnassigned) return false

    const searchLower = search.toLowerCase()
    return (
      e.evidenceId.toLowerCase().includes(searchLower) ||
      e.fileName.toLowerCase().includes(searchLower) ||
      (e.caseId && e.caseId.toLowerCase().includes(searchLower)) ||
      (e.note && e.note.toLowerCase().includes(searchLower))
    )
  })

  const unassignedCount = evidence.filter(
    (e) => e.assignmentStatus === 'UNASSIGNED' || !e.caseId || e.caseId === 'Unassigned'
  ).length

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }, [])

  const handleUpload = () => {
    if (!selectedFile) return
    setProcessingFile(selectedFile)
  }

  if (processingFile) {
    return (
      <CyberForensicsProcessingView
        selectedFile={processingFile}
        evidenceNote={evidenceNote}
        onCancel={() => {
          setProcessingFile(null)
        }}
        onComplete={(newEvidence) => {
          setProcessingFile(null)
          setEvidenceNote('')
          setSelectedFile(null)
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

      {isInvestigationOfficer && (
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
            <div className="mt-4 p-4 rounded-xl bg-white border border-navy-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-navy-800" />
                  <div>
                    <p className="text-sm text-navy-900 font-bold">{selectedFile.name}</p>
                    <p className="text-xs text-navy-600">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedFile(null); setEvidenceNote('') }}
                  className="text-navy-500 hover:text-navy-900 p-1 rounded hover:bg-navy-50"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-navy-100">
                <div className="flex items-center justify-between">
                  <label htmlFor="evidence-note" className="block text-xs font-bold text-navy-900">
                    Evidence Note (Optional)
                  </label>
                  <span className="text-[11px] font-mono font-semibold text-navy-500">
                    {evidenceNote.length} / 2000
                  </span>
                </div>
                <textarea
                  id="evidence-note"
                  rows={2}
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  placeholder="Optional field note... e.g., Mobile device recovered from scene examination."
                  className="cyber-input text-xs py-2 w-full resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-navy-100">
                <button
                  onClick={() => { setSelectedFile(null); setEvidenceNote('') }}
                  className="cyber-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="cyber-btn-primary text-xs flex items-center gap-1.5 shadow-glow"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Evidence
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Tabs & Search Filter */}
      <GlassCard className="!p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 border-b sm:border-b-0 border-navy-100 pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'all'
                ? 'bg-navy-900 text-white'
                : 'text-navy-600 hover:bg-navy-100'
            }`}
          >
            All Evidence ({evidence.length})
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'assigned'
                ? 'bg-navy-900 text-white'
                : 'text-navy-600 hover:bg-navy-100'
            }`}
          >
            Assigned
          </button>
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'unassigned'
                ? 'bg-amber-600 text-white'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            Unassigned / Rapid ({unassignedCount})
          </button>
        </div>

        <div className="w-full sm:w-64">
          <SearchInput value={search} onChange={setSearch} placeholder="Search evidence..." />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((ev) => {
          const isUnassigned = ev.assignmentStatus === 'UNASSIGNED' || !ev.caseId || ev.caseId === 'Unassigned'

          return (
            <GlassCard key={ev.id} hover className="!p-0 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-glass-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-cyber-800/50 text-navy-800">
                      {typeIcons[ev.type]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-900 truncate max-w-[170px]">{ev.fileName}</p>
                      <p className="text-[10px] font-mono text-navy-800">{ev.evidenceId}</p>
                    </div>
                  </div>
                  <TrustMeter score={ev.trustScore} size="sm" showLabel={false} />
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-navy-600">Assignment</span>
                    {isUnassigned ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        UNASSIGNED
                      </span>
                    ) : (
                      <span className="text-navy-800 font-mono font-bold">{ev.caseId}</span>
                    )}
                  </div>

                  {ev.note && (
                    <div className="p-2 rounded bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 italic line-clamp-2">
                      <span className="font-semibold not-italic text-amber-800">Note: </span>
                      {ev.note}
                    </div>
                  )}

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
              </div>

              <div>
                {isUnassigned && isInvestigationOfficer && (
                  <div className="px-4 pb-3">
                    <button
                      onClick={() => {
                        setAssigningEvidence(ev)
                        setSelectedCaseId('')
                        setAssignError(null)
                      }}
                      className="w-full cyber-btn-primary text-xs py-2 bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5"
                    >
                      <FolderPlus className="w-3.5 h-3.5" /> Assign to Case
                    </button>
                  </div>
                )}

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
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* ASSIGN TO CASE MODAL */}
      {assigningEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-navy-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in">
            <div className="flex items-center justify-between border-b border-navy-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-navy-900 text-base">Assign Evidence to Case</h3>
              </div>
              <button
                onClick={() => setAssigningEvidence(null)}
                className="text-navy-400 hover:text-navy-900 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Evidence Summary Header */}
            <div className="p-3 rounded-lg bg-navy-50 border border-navy-100 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-navy-600">Evidence ID:</span>
                <span className="font-mono font-bold text-navy-900">{assigningEvidence.evidenceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-600">Captured By:</span>
                <span className="font-bold text-navy-900">{assigningEvidence.uploadedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-600">Capture Time:</span>
                <span className="text-navy-800">{formatDate(assigningEvidence.uploadTime)}</span>
              </div>
            </div>

            {assignError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{assignError}</span>
              </div>
            )}

            {/* Case Selection Search */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-navy-900">
                Select Investigation Case
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-navy-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  placeholder="Filter cases by Case ID or title..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-800"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-navy-200 rounded-lg divide-y divide-navy-100">
                {cases
                  .filter((c) =>
                    c.caseId.toLowerCase().includes(caseSearch.toLowerCase()) ||
                    c.title.toLowerCase().includes(caseSearch.toLowerCase())
                  )
                  .map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCaseId(c.caseId)}
                      className={`p-3 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                        selectedCaseId === c.caseId
                          ? 'bg-navy-900 text-white'
                          : 'hover:bg-navy-50 text-navy-900'
                      }`}
                    >
                      <div>
                        <span className="font-mono font-bold">{c.caseId}</span>
                        <p className={`text-[11px] truncate max-w-[240px] ${selectedCaseId === c.caseId ? 'text-navy-200' : 'text-navy-600'}`}>
                          {c.title}
                        </p>
                      </div>
                      {selectedCaseId === c.caseId && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                  ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2 border-t border-navy-100">
              <button
                type="button"
                onClick={() => setAssigningEvidence(null)}
                className="cyber-btn-secondary flex-1 text-xs py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignToCase}
                disabled={!selectedCaseId || assigningLoading}
                className="cyber-btn-primary flex-1 text-xs py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {assigningLoading ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
