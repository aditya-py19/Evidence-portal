import { useState } from 'react'
import { Gavel, CheckCircle, XCircle, Download, Upload, Shield, FileSearch } from 'lucide-react'
import { PageHeader, GlassCard, TrustMeter, StatusBadge } from '../components/ui'
import { evidenceList } from '../data/mockData'
import { truncateHash } from '../lib/utils'

export default function CourtVerificationPage() {
  const [selectedEvidence, setSelectedEvidence] = useState(evidenceList[0])
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)

  const runVerification = () => {
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      setVerified(true)
    }, 2500)
  }

  const checks = [
    { label: 'SHA-256 Hash Match', status: true, detail: `Local: ${truncateHash(selectedEvidence.sha256, 10)} ↔ Chain: ${truncateHash(selectedEvidence.sha256, 10)}` },
    { label: 'Blockchain Hash Match', status: true, detail: `TX: ${truncateHash(selectedEvidence.blockchainTxId, 10)}` },
    { label: 'IPFS CID Match', status: true, detail: `CID: ${truncateHash(selectedEvidence.ipfsCid, 10)}` },
    { label: 'Metadata Integrity', status: selectedEvidence.trustBreakdown.metadataConsistency >= 80, detail: `Consistency Score: ${selectedEvidence.trustBreakdown.metadataConsistency}%` },
    { label: 'Chain of Custody Complete', status: true, detail: '12 events recorded, no gaps detected' },
    { label: 'AI Report Status', status: selectedEvidence.aiAnalysis.recommendation !== 'high_risk', detail: `Risk Score: ${selectedEvidence.aiAnalysis.riskScore}` },
  ]

  const allPassed = checks.every((c) => c.status)

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Court Verification Portal"
        subtitle="Judge-facing evidence verification with blockchain hash comparison and certificate generation"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard>
          <h3 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-navy-800" /> Select Evidence
          </h3>
          <div className="space-y-2">
            {evidenceList.map((ev) => (
              <button
                key={ev.id}
                onClick={() => { setSelectedEvidence(ev); setVerified(false) }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedEvidence.id === ev.id
                    ? 'border-navy-300 bg-navy-700/5'
                    : 'border-glass-border hover:border-navy-300'
                }`}
              >
                <p className="text-xs font-mono text-navy-800">{ev.evidenceId}</p>
                <p className="text-sm text-navy-900 truncate">{ev.fileName}</p>
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="lg:col-span-2 space-y-4">
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <Gavel className="w-6 h-6 text-navy-800" />
              <div>
                <h3 className="text-navy-900 font-semibold">Verification Panel</h3>
                <p className="text-xs text-navy-700">{selectedEvidence.evidenceId} — {selectedEvidence.fileName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg bg-cyber-800/30 border border-glass-border/50">
                <TrustMeter score={selectedEvidence.trustScore} size="sm" />
              </div>
              <div className="p-4 rounded-lg bg-cyber-800/30 border border-glass-border/50">
                <p className="text-[10px] text-navy-600 uppercase">Hash Match</p>
                <StatusBadge status={checks[0].status ? 'Match' : 'Mismatch'} variant={checks[0].status ? 'success' : 'danger'} />
              </div>
              <div className="p-4 rounded-lg bg-cyber-800/30 border border-glass-border/50">
                <p className="text-[10px] text-navy-600 uppercase">Blockchain Match</p>
                <StatusBadge status={checks[1].status ? 'Match' : 'Mismatch'} variant={checks[1].status ? 'success' : 'danger'} />
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {checks.map((check) => (
                <div key={check.label} className="flex items-center gap-3 p-3 rounded-lg bg-cyber-800/20 border border-glass-border/30">
                  {check.status ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-navy-900">{check.label}</p>
                    <p className="text-xs text-navy-700 font-mono">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {verifying && (
              <div className="text-center py-4">
                <div className="w-8 h-8 border-2 border-navy-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-navy-800">Running court verification...</p>
              </div>
            )}

            {verified && (
              <div className={`p-4 rounded-lg border text-center ${allPassed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <Shield className={`w-8 h-8 mx-auto mb-2 ${allPassed ? 'text-emerald-400' : 'text-red-400'}`} />
                <p className={`font-bold ${allPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {allPassed ? 'VERIFICATION PASSED' : 'VERIFICATION FAILED'}
                </p>
                <p className="text-xs text-navy-700 mt-1">
                  {allPassed ? 'Evidence integrity confirmed for court proceedings' : 'Evidence requires further review before court acceptance'}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={runVerification} disabled={verifying} className="cyber-btn-primary flex-1">
                <FileSearch className="w-4 h-4" /> Run Verification
              </button>
              {verified && allPassed && (
                <button className="cyber-btn-success flex-1">
                  <Download className="w-4 h-4" /> Download Certificate
                </button>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
