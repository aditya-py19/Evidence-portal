import { useParams, Link } from 'react-router-dom'
import {
  Brain, CheckCircle, AlertTriangle, XCircle, ArrowLeft,
  Eye, Fingerprint, Copy, Video, Image, FileSearch,
} from 'lucide-react'
import { PageHeader, GlassCard, StatusBadge } from '../components/ui'
import { evidenceList } from '../data/mockData'

const analysisItems = [
  { key: 'deepfakeDetection', label: 'Deepfake Detection', icon: Video },
  { key: 'imageForgery', label: 'Image Forgery Detection', icon: Image },
  { key: 'videoTampering', label: 'Video Tampering Detection', icon: Video },
  { key: 'metadataAnalysis', label: 'Metadata Analysis', icon: FileSearch },
  { key: 'duplicateDetection', label: 'Duplicate Evidence Detection', icon: Copy },
  { key: 'blurDetection', label: 'Blur Detection', icon: Eye },
  { key: 'aiGeneratedContent', label: 'AI Generated Content', icon: Brain },
] as const

const recConfig = {
  approved: { label: 'Approved', variant: 'success' as const, icon: CheckCircle, color: 'text-emerald-400' },
  needs_manual_review: { label: 'Needs Manual Review', variant: 'warning' as const, icon: AlertTriangle, color: 'text-amber-400' },
  high_risk: { label: 'High Risk', variant: 'danger' as const, icon: XCircle, color: 'text-red-400' },
}

export default function AIVerificationPage() {
  const { id } = useParams()
  const routedEvidence = (window.history.state?.usr as { evidence?: typeof evidenceList[number] } | undefined)?.evidence
  const evidence = id ? (routedEvidence?.id === id ? routedEvidence : evidenceList.find((e) => e.id === id)) : null
  const items = evidence ? [evidence] : evidenceList

  if (id && !evidence) {
    return <div className="text-center py-20 text-navy-700">Evidence not found</div>
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="AI Verification Module"
        subtitle="Automated deepfake, forgery, and tampering detection powered by Evidence Portal AI"
        actions={id && (
          <Link to="/ai-verification" className="cyber-btn-secondary">
            <ArrowLeft className="w-4 h-4" /> All Evidence
          </Link>
        )}
      />

      {items.map((ev) => {
        const ai = ev.aiAnalysis
        const rec = recConfig[ai.recommendation]
        const RecIcon = rec.icon

        return (
          <div key={ev.id} className="space-y-4">
            <GlassCard className="!p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-navy-800 text-sm">{ev.evidenceId}</p>
                  <p className="text-navy-900 font-medium">{ev.fileName}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-navy-900">{ai.riskScore}</p>
                    <p className="text-[10px] text-navy-700 uppercase">Risk Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-navy-800">{ai.confidence}%</p>
                    <p className="text-[10px] text-navy-700 uppercase">Confidence</p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${rec.color} bg-cyber-800/50`}>
                    <RecIcon className="w-5 h-5" />
                    <span className="font-medium text-sm">{rec.label}</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {analysisItems.map((item) => {
                const data = ai[item.key]
                const Icon = item.icon
                const isGood = data.score >= 80
                return (
                  <GlassCard key={item.key} className="relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl ${isGood ? 'bg-emerald-500/10' : 'bg-red-500/10'}`} />
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`w-4 h-4 ${isGood ? 'text-emerald-400' : 'text-red-400'}`} />
                      <h4 className="text-xs font-semibold text-navy-900">{item.label}</h4>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className={`text-2xl font-bold ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>{data.score}%</p>
                        <StatusBadge status={data.status} variant={isGood ? 'success' : 'danger'} />
                      </div>
                      <div className="w-16 h-16">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(56,189,248,0.1)" strokeWidth="3" />
                          <circle
                            cx="18" cy="18" r="15" fill="none"
                            stroke={isGood ? '#34d399' : '#f87171'}
                            strokeWidth="3"
                            strokeDasharray={`${data.score * 0.94} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </GlassCard>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <GlassCard className="lg:col-span-2">
                <h4 className="text-sm font-semibold text-navy-900 mb-3 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-navy-800" /> AI Analysis Summary
                </h4>
                <div className="space-y-2 text-sm text-navy-800">
                  <p>File analyzed using Evidence Portal Neural Verification Engine v3.2</p>
                  <p>Model ensemble: ResNet-152 + EfficientNet-B7 + Temporal CNN + Metadata Parser</p>
                  <p>Processing time: 4.2 seconds | GPU: NVIDIA A100 Cluster</p>
                  {ai.recommendation === 'high_risk' && (
                    <p className="text-red-400 font-medium mt-2">
                      ⚠ Multiple tampering indicators detected. Manual forensic review strongly recommended.
                    </p>
                  )}
                </div>
              </GlassCard>
              <GlassCard>
                <h4 className="text-sm font-semibold text-navy-900 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Link to={`/trust-score/${ev.id}`} className="cyber-btn-primary w-full text-sm">View Trust Score</Link>
                  <Link to={`/chain-of-custody/${ev.id}`} className="cyber-btn-secondary w-full text-sm">Chain of Custody</Link>
                  <Link to={`/blockchain/${ev.id}`} className="cyber-btn-secondary w-full text-sm">Blockchain Record</Link>
                </div>
              </GlassCard>
            </div>
          </div>
        )
      })}
    </div>
  )
}
