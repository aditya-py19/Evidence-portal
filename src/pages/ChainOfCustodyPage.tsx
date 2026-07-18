import { useParams, Link } from 'react-router-dom'
import {
  Camera, Brain, CheckCircle, Hash, Lock, Cloud, Link2,
  Eye, ArrowRightLeft, FileText, Gavel, Archive, ArrowLeft,
} from 'lucide-react'
import { PageHeader, GlassCard } from '../components/ui'
import { chainOfCustody, evidenceList } from '../data/mockData'
import { formatDate, truncateHash } from '../lib/utils'

const iconMap: Record<string, React.ReactNode> = {
  camera: <Camera className="w-4 h-4" />,
  brain: <Brain className="w-4 h-4" />,
  check: <CheckCircle className="w-4 h-4" />,
  hash: <Hash className="w-4 h-4" />,
  lock: <Lock className="w-4 h-4" />,
  cloud: <Cloud className="w-4 h-4" />,
  link: <Link2 className="w-4 h-4" />,
  eye: <Eye className="w-4 h-4" />,
  transfer: <ArrowRightLeft className="w-4 h-4" />,
  file: <FileText className="w-4 h-4" />,
  gavel: <Gavel className="w-4 h-4" />,
  archive: <Archive className="w-4 h-4" />,
}

export default function ChainOfCustodyPage() {
  const { id } = useParams()
  const evidence = id ? evidenceList.find((e) => e.id === id) : evidenceList[0]
  const events = chainOfCustody.filter((e) => e.evidenceId === evidence?.evidenceId)

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Live Chain of Custody"
        subtitle="Interactive timeline tracking every evidence interaction and transfer"
        actions={id && (
          <Link to="/chain-of-custody" className="cyber-btn-secondary">
            <ArrowLeft className="w-4 h-4" /> All Chains
          </Link>
        )}
      />

      {evidence && (
        <GlassCard className="!p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-[10px] text-navy-600 uppercase">Evidence</p>
              <p className="font-mono text-navy-800 text-sm">{evidence.evidenceId}</p>
            </div>
            <div>
              <p className="text-[10px] text-navy-600 uppercase">Case</p>
              <p className="text-sm text-navy-900">{evidence.caseId}</p>
            </div>
            <div>
              <p className="text-[10px] text-navy-600 uppercase">Current Owner</p>
              <p className="text-sm text-navy-900">{evidence.currentOwner}</p>
            </div>
            <div>
              <p className="text-[10px] text-navy-600 uppercase">Department</p>
              <p className="text-sm text-navy-900">{evidence.currentDepartment}</p>
            </div>
            <div>
              <p className="text-[10px] text-navy-600 uppercase">Events</p>
              <p className="text-sm text-navy-800 font-bold">{events.length}</p>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-cyan-500/20 to-transparent" />

          <div className="space-y-0">
            {events.map((event, i) => (
              <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0 animate-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-cyber-800 border-2 border-navy-300 flex items-center justify-center text-navy-800 shadow-glow">
                  {iconMap[event.icon] || <CheckCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1 pt-1">
                  <div className="glass-card !p-4 hover:border-navy-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-navy-900">{event.action}</h4>
                      <span className="text-[10px] text-navy-600 font-mono">{formatDate(event.timestamp)}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      <div>
                        <p className="text-[10px] text-navy-600 uppercase">Officer</p>
                        <p className="text-xs text-navy-800">{event.officerName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-navy-600 uppercase">Department</p>
                        <p className="text-xs text-navy-800">{event.department}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-navy-600 uppercase">Location</p>
                        <p className="text-xs text-navy-800">{event.location}</p>
                      </div>
                      {event.blockchainTxId && (
                        <div>
                          <p className="text-[10px] text-navy-600 uppercase">Blockchain TX</p>
                          <p className="text-xs text-navy-800 font-mono">{truncateHash(event.blockchainTxId, 8)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
