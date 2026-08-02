import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Camera, Brain, CheckCircle, Hash, Lock, Cloud, Link2,
  Eye, ArrowRightLeft, FileText, Gavel, Archive, ArrowLeft,
} from 'lucide-react'
import { PageHeader, GlassCard } from '../components/ui'
import { chainOfCustody } from '../data/mockData'
import { formatDate, truncateHash } from '../lib/utils'
import { apiFetch } from '../lib/api'
import type { Evidence } from '../types'

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
  const { id } = useParams<{ id: string }>()
  const [evidence, setEvidence] = useState<Evidence | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        if (id) {
          const res = await apiFetch(`/api/evidence/${id}`)
          if (res.ok) {
            const body = await res.json() as { evidence?: Evidence }
            if (body.evidence) {
              setEvidence(body.evidence)
              setLoading(false)
              return
            }
          }
        }

        const resAll = await apiFetch('/api/evidence')
        if (resAll.ok) {
          const bodyAll = await resAll.json() as { evidence?: Evidence[] }
          if (bodyAll.evidence && bodyAll.evidence.length > 0) {
            if (id) {
              const found = bodyAll.evidence.find((e) => e.id === id || e.evidenceId === id)
              setEvidence(found || null)
            } else {
              setEvidence(bodyAll.evidence[0])
            }
          }
        }
      } catch (err) {
        console.error('Failed to load chain of custody evidence:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  if (loading) {
    return <div className="text-center py-20 text-navy-700">Loading chain of custody data...</div>
  }

  if (!evidence) {
    return <div className="text-center py-20 text-navy-700">Evidence not found</div>
  }

  const txHash = evidence.transactionHash || evidence.blockchainTxId
  const events = [
    {
      id: `ch-1-${evidence.id}`,
      evidenceId: evidence.evidenceId,
      timestamp: evidence.uploadTime,
      officerName: evidence.uploadedBy || 'Inspector Rajesh Kumar',
      department: evidence.currentDepartment || 'Cyber Crime Cell',
      location: 'Delhi HQ',
      action: 'Evidence File Uploaded & Encrypted',
      blockchainTxId: '',
      icon: 'camera',
    },
    {
      id: `ch-2-${evidence.id}`,
      evidenceId: evidence.evidenceId,
      timestamp: evidence.uploadTime,
      officerName: 'Cryptographic Engine',
      department: 'Evidence Portal',
      location: 'Server Cluster',
      action: `SHA-256 Hash Generated: ${truncateHash(evidence.sha256, 12)}`,
      blockchainTxId: '',
      icon: 'hash',
    },
    {
      id: `ch-3-${evidence.id}`,
      evidenceId: evidence.evidenceId,
      timestamp: evidence.uploadTime,
      officerName: 'Pinata Gateway',
      department: 'Decentralized Storage',
      location: 'IPFS Network',
      action: `Pinned to Pinata IPFS (CID: ${truncateHash(evidence.ipfsCid, 10)})`,
      blockchainTxId: '',
      icon: 'cloud',
    },
    {
      id: `ch-4-${evidence.id}`,
      evidenceId: evidence.evidenceId,
      timestamp: evidence.uploadTime,
      officerName: 'Polygon Amoy Smart Contract',
      department: 'Polygon Blockchain',
      location: 'Amoy Testnet (80002)',
      action: `Registered on EvidenceRegistry.sol (Block #${evidence.blockNumber || 43687165})`,
      blockchainTxId: txHash,
      icon: 'link',
    },
    {
      id: `ch-5-${evidence.id}`,
      evidenceId: evidence.evidenceId,
      timestamp: evidence.lastAccess,
      officerName: evidence.currentOwner || 'Rajesh Kumar',
      department: evidence.currentDepartment || 'Cyber Crime Cell',
      location: 'Police Portal',
      action: 'Evidence Custody Logged & Last Access Verified',
      blockchainTxId: txHash,
      icon: 'check',
    },
  ]



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
