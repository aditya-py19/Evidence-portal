import { useParams, Link } from 'react-router-dom'
import { Link2, Copy, ExternalLink, Shield, Hash, ArrowLeft, CheckCircle } from 'lucide-react'
import { PageHeader, GlassCard, StatusBadge } from '../components/ui'
import { evidenceList } from '../data/mockData'
import { formatDate, truncateHash } from '../lib/utils'

export default function BlockchainPage() {
  const { id } = useParams()
  const evidence = id ? evidenceList.find((e) => e.id === id) : evidenceList[0]

  if (!evidence) return <div className="text-center py-20 text-navy-700">Evidence not found</div>

  const fields = [
    { label: 'Evidence Hash (SHA-256)', value: evidence.sha256, icon: Hash },
    { label: 'IPFS Content ID (CID)', value: evidence.ipfsCid, icon: Link2 },
    { label: 'Blockchain Transaction ID', value: evidence.blockchainTxId, icon: Link2 },
    { label: 'Digital Signature', value: evidence.digitalSignature, icon: Shield },
    { label: 'Block Number', value: `#${evidence.blockNumber.toLocaleString()}`, icon: Hash },
    { label: 'Timestamp', value: formatDate(evidence.uploadTime), icon: Link2 },
  ]

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Blockchain Module"
        subtitle="Hyperledger Fabric immutable evidence registration and verification"
        actions={id && (
          <Link to="/blockchain" className="cyber-btn-secondary">
            <ArrowLeft className="w-4 h-4" /> All Records
          </Link>
        )}
      />

      {!id && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {evidenceList.map((ev) => (
            <Link key={ev.id} to={`/blockchain/${ev.id}`} className="glass-card-hover !p-4">
              <p className="font-mono text-navy-800 text-xs">{ev.evidenceId}</p>
              <p className="text-xs text-navy-700 mt-1 font-mono">{truncateHash(ev.blockchainTxId, 10)}</p>
              <p className="text-xs text-navy-600 mt-1">Block #{ev.blockNumber}</p>
            </Link>
          ))}
        </div>
      )}

      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-navy-700/10 border border-navy-300">
              <Link2 className="w-6 h-6 text-navy-800" />
            </div>
            <div>
              <h3 className="text-navy-900 font-semibold">{evidence.evidenceId}</h3>
              <p className="text-xs text-navy-700">{evidence.fileName}</p>
            </div>
          </div>
          <StatusBadge status="Verified on Chain" variant="success" />
        </div>

        <div className="space-y-3">
          {fields.map((field) => {
            const Icon = field.icon
            return (
              <div key={field.label} className="flex items-center justify-between p-4 rounded-lg bg-cyber-800/30 border border-glass-border/50 group hover:border-navy-300 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Icon className="w-4 h-4 text-navy-800 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-navy-600 uppercase">{field.label}</p>
                    <p className="text-sm font-mono text-navy-900 mt-0.5 truncate">{field.value}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(field.value)}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-cyber-700 text-navy-700 hover:text-navy-800 transition-all"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-sm text-emerald-400 font-medium">Verification Status: Valid</p>
            <p className="text-xs text-navy-700">Hash integrity confirmed • Digital signature valid • No tampering detected</p>
          </div>
        </div>

        <button className="cyber-btn-primary w-full mt-4">
          <ExternalLink className="w-4 h-4" /> View Blockchain Transaction
        </button>
      </GlassCard>

      <GlassCard>
        <h3 className="text-sm font-semibold text-navy-900 mb-4">Network Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Network', value: 'Hyperledger Fabric' },
            { label: 'Channel', value: 'evidence-channel' },
            { label: 'Chaincode', value: 'evidence-portal-v2' },
            { label: 'Consensus', value: 'Raft (CFT)' },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-lg bg-cyber-800/30 border border-glass-border/50 text-center">
              <p className="text-[10px] text-navy-600 uppercase">{item.label}</p>
              <p className="text-sm text-navy-800 font-medium mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
