import { useParams, Link } from 'react-router-dom'
import { Star, ArrowLeft, Shield, CheckCircle } from 'lucide-react'
import { PageHeader, GlassCard, TrustMeter } from '../components/ui'
import { evidenceList } from '../data/mockData'
import { getTrustLevelLabel, getTrustLevelColor, getTrustLevelBg, generateStars } from '../lib/utils'

const breakdownLabels: Record<string, string> = {
  aiVerification: 'AI Verification',
  metadataConsistency: 'Metadata Consistency',
  sha256Hash: 'SHA-256 Hash Verification',
  digitalSignature: 'Digital Signature',
  chainOfCustody: 'Chain of Custody Integrity',
  geolocation: 'Geolocation Verification',
  blockchain: 'Blockchain Verification',
}

export default function TrustScorePage() {
  const { id } = useParams()
  const evidence = id ? evidenceList.find((e) => e.id === id) : null
  const items = evidence ? [evidence] : evidenceList

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Dynamic Evidence Trust Score"
        subtitle="Multi-factor trust scoring based on AI, blockchain, and custody integrity"
        actions={id && (
          <Link to="/trust-score" className="cyber-btn-secondary">
            <ArrowLeft className="w-4 h-4" /> All Scores
          </Link>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {items.map((ev) => {
          const stars = generateStars(ev.trustScore)
          return (
            <GlassCard key={ev.id} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-navy-700/5 rounded-full blur-3xl" />
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <TrustMeter score={ev.trustScore} size="lg" />
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-mono text-navy-800 text-sm">{ev.evidenceId}</p>
                  <p className="text-navy-900 font-semibold mt-1">{ev.fileName}</p>
                  <div className="flex items-center gap-1 mt-2 justify-center sm:justify-start">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-navy-700'}`} />
                    ))}
                  </div>
                  <div className={`inline-block mt-3 px-4 py-1.5 rounded-lg border text-sm font-semibold ${getTrustLevelBg(ev.trustLevel)} ${getTrustLevelColor(ev.trustLevel)}`}>
                    {getTrustLevelLabel(ev.trustLevel)}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-semibold text-navy-700 uppercase tracking-wider">Score Breakdown</h4>
                {Object.entries(ev.trustBreakdown).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-navy-700">{breakdownLabels[key]}</span>
                      <span className={`font-mono font-medium ${value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                        {value}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-cyber-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-glass-border flex gap-2">
                <Link to={`/ai-verification/${ev.id}`} className="cyber-btn-secondary flex-1 text-xs">AI Report</Link>
                <Link to={`/blockchain/${ev.id}`} className="cyber-btn-secondary flex-1 text-xs">Blockchain</Link>
                <Link to={`/geolocation/${ev.id}`} className="cyber-btn-secondary flex-1 text-xs">Geolocation</Link>
              </div>
            </GlassCard>
          )
        })}
      </div>

      <GlassCard>
        <h3 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-navy-800" /> Trust Score Classification
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { range: '95–100', label: 'Highly Trusted', color: 'border-emerald-500/30 bg-emerald-500/5', text: 'text-emerald-400' },
            { range: '80–94', label: 'Trusted', color: 'border-navy-300 bg-navy-700/5', text: 'text-navy-800' },
            { range: '60–79', label: 'Needs Review', color: 'border-amber-500/30 bg-amber-500/5', text: 'text-amber-400' },
            { range: '< 60', label: 'High Risk', color: 'border-red-500/30 bg-red-500/5', text: 'text-red-400' },
          ].map((tier) => (
            <div key={tier.label} className={`p-4 rounded-lg border text-center ${tier.color}`}>
              <CheckCircle className={`w-5 h-5 mx-auto mb-2 ${tier.text}`} />
              <p className={`font-bold ${tier.text}`}>{tier.range}</p>
              <p className="text-xs text-navy-700 mt-1">{tier.label}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
