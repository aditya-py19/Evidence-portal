import { useParams, Link } from 'react-router-dom'
import { QrCode, ArrowLeft, Copy, Shield, Link2, Clock } from 'lucide-react'
import { PageHeader, GlassCard, TrustMeter, StatusBadge } from '../components/ui'
import { evidenceList } from '../data/mockData'
import { formatDate, truncateHash, getTrustLevelLabel, getTrustLevelBg, getTrustLevelColor } from '../lib/utils'

export default function EvidencePassportPage() {
  const { id } = useParams()
  const evidence = id ? evidenceList.find((e) => e.id === id) : evidenceList[0]

  if (!evidence) return <div className="text-center py-20 text-navy-700">Evidence not found</div>

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text)

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Evidence Digital Passport"
        subtitle="Immutable identity document for verified digital evidence"
        actions={id && (
          <Link to="/evidence-passport" className="cyber-btn-secondary">
            <ArrowLeft className="w-4 h-4" /> All Passports
          </Link>
        )}
      />

      {!id && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {evidenceList.map((ev) => (
            <Link key={ev.id} to={`/evidence-passport/${ev.id}`} className="glass-card-hover !p-4">
              <p className="font-mono text-navy-800 text-xs">{ev.evidenceId}</p>
              <p className="text-navy-900 font-medium text-sm mt-1 truncate">{ev.fileName}</p>
              <p className="text-xs text-navy-700 mt-1">Trust: {ev.trustScore}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500" />
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-navy-800" />
            <div>
              <h2 className="text-lg font-bold text-navy-900">Digital Evidence Passport</h2>
              <p className="text-xs text-navy-700">Issued by Evidence Portal • Government of India</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Evidence ID', value: evidence.evidenceId },
              { label: 'Case ID', value: evidence.caseId },
              { label: 'Current Owner', value: evidence.currentOwner },
              { label: 'Department', value: evidence.currentDepartment },
              { label: 'Status', value: evidence.status.replace('_', ' ') },
              { label: 'File Name', value: evidence.fileName },
              { label: 'Upload Date', value: formatDate(evidence.uploadTime) },
              { label: 'Last Access', value: formatDate(evidence.lastAccess) },
            ].map((field) => (
              <div key={field.label} className="p-3 rounded-lg bg-cyber-800/30 border border-glass-border/50">
                <p className="text-[10px] text-navy-600 uppercase tracking-wider">{field.label}</p>
                <p className="text-sm text-navy-900 mt-0.5 font-medium">{field.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {[
              { label: 'SHA-256 Hash', value: evidence.sha256 },
              { label: 'IPFS CID', value: evidence.ipfsCid },
              { label: 'Blockchain TX', value: evidence.blockchainTxId },
            ].map((field) => (
              <div key={field.label} className="flex items-center justify-between p-3 rounded-lg bg-cyber-900/50 border border-glass-border/50">
                <div>
                  <p className="text-[10px] text-navy-600 uppercase">{field.label}</p>
                  <p className="text-xs font-mono text-navy-800 mt-0.5">{truncateHash(field.value, 16)}</p>
                </div>
                <button onClick={() => copyToClipboard(field.value)} className="p-2 rounded hover:bg-cyber-800 text-navy-700 hover:text-navy-800">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="text-center">
            <TrustMeter score={evidence.trustScore} size="md" />
            <div className={`mt-3 inline-block px-3 py-1 rounded-lg border text-sm font-semibold ${getTrustLevelBg(evidence.trustLevel)} ${getTrustLevelColor(evidence.trustLevel)}`}>
              {getTrustLevelLabel(evidence.trustLevel)}
            </div>
          </GlassCard>

          <GlassCard className="text-center">
            <div className="w-32 h-32 mx-auto bg-white rounded-lg p-2 flex items-center justify-center">
              <QrCode className="w-full h-full text-cyber-900" />
            </div>
            <p className="text-xs text-navy-700 mt-3">Scan to verify evidence authenticity</p>
          </GlassCard>

          <GlassCard>
            <h4 className="text-xs font-semibold text-navy-700 uppercase mb-3">Blockchain Status</h4>
            <StatusBadge status="Registered on Hyperledger Fabric" variant="success" />
            <div className="mt-3 flex items-center gap-2 text-xs text-navy-700">
              <Link2 className="w-3.5 h-3.5" />
              Block #{evidence.blockNumber.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-navy-700">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(evidence.uploadTime)}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
