import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Scale, Eye, FolderCheck, ShieldCheck, CheckCircle2, Clock, Play, FileText, Search, RefreshCw } from 'lucide-react'
import { PageHeader, GlassCard, StatCard } from '../../components/ui'
import { useAuth } from '../../context/AppContext'
import { formatDate } from '../../lib/utils'
import { apiFetch } from '../../lib/api'
import type { Case } from '../../types'

export default function JudgeDashboardPage() {
  const { user } = useAuth()
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchCases = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/cases')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.cases)) {
          setCases(data.cases)
        }
      }
    } catch (err) {
      console.error('Failed to fetch cases for Judge Dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [])

  const handleUpdateStatus = async (caseId: string, status: 'UNDER_REVIEW' | 'REVIEWED') => {
    setActionLoadingId(caseId)
    try {
      const res = await apiFetch(`/api/judge/cases/${encodeURIComponent(caseId)}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        await fetchCases()
      }
    } catch (err) {
      console.error('Failed to update judicial status:', err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const judgeName = user?.name || 'V. K. Sharma'
  const judgeDesignation = user?.department || 'Special Judicial Bench / High Court of Chhattisgarh'

  const filteredCases = cases.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.caseId.toLowerCase().includes(search.toLowerCase()) ||
    c.firNumber.toLowerCase().includes(search.toLowerCase())
  )

  const pendingReviewCases = cases.filter((c) => !c.judicialStatus || c.judicialStatus === 'PENDING_REVIEW')
  const underReviewCases = cases.filter((c) => c.judicialStatus === 'UNDER_REVIEW')
  const reviewedCases = cases.filter((c) => c.judicialStatus === 'REVIEWED')

  return (
    <div className="space-y-6 animate-in">
      {/* JUDICIAL HEADER */}
      <div className="bg-white border border-navy-100 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-sm">
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wide">
                Judicial Review Bench
              </span>
              <span className="text-xs font-hindi text-navy-500">न्यायिक समीक्षा पीठ</span>
            </div>
            <h1 className="text-xl font-bold text-navy-900 mt-1 font-display">
              {judgeName.startsWith("Hon'ble") ? judgeName : `Hon'ble ${judgeName}`}
            </h1>
            <p className="text-xs text-navy-600 font-medium mt-0.5">{judgeDesignation}</p>
          </div>
        </div>

        <button
          onClick={fetchCases}
          className="cyber-btn-secondary text-xs flex items-center gap-1.5"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Roster
        </button>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Assigned Cases"
          value={cases.length}
          icon={<FolderCheck className="w-5 h-5 text-navy-800" />}
          color="cyan"
        />
        <StatCard
          label="Pending Review"
          value={pendingReviewCases.length}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          color="amber"
        />
        <StatCard
          label="Under Review"
          value={underReviewCases.length}
          icon={<Play className="w-5 h-5 text-blue-600" />}
          color="purple"
        />
        <StatCard
          label="Reviewed"
          value={reviewedCases.length}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          color="emerald"
        />
      </div>

      {/* CASES REQUIRING REVIEW */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-navy-800" /> Cases Requiring Judicial Review
            </h2>
            <p className="text-xs text-navy-600 mt-0.5">
              Inspect evidence, verify chain of custody, and record judicial status
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-navy-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Case ID, FIR, Title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-800 bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-navy-600 text-xs">Loading judicial case roster from PostgreSQL...</div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-12 text-navy-600 text-xs">No cases found matching your search.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-navy-100 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-navy-50 border-b border-navy-100 font-bold text-navy-900">
                  <th className="p-3.5">Case ID</th>
                  <th className="p-3.5">FIR Number</th>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Evidence Count</th>
                  <th className="p-3.5">Judicial Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 font-sans">
                {filteredCases.map((c) => {
                  const evCount = c.evidenceCount ?? 1
                  const statusStr = c.judicialStatus || 'PENDING_REVIEW'

                  return (
                    <tr key={c.id} className="hover:bg-navy-50/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-navy-900">{c.caseId}</td>
                      <td className="p-3.5 font-mono text-navy-700">{c.firNumber}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-navy-900">{c.title}</p>
                        <p className="text-[11px] text-navy-500">{c.crimeType}</p>
                      </td>
                      <td className="p-3.5 font-bold text-navy-800">{evCount} Evidence File(s)</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                            statusStr === 'REVIEWED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : statusStr === 'UNDER_REVIEW'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {statusStr.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {statusStr === 'PENDING_REVIEW' && (
                            <button
                              onClick={() => handleUpdateStatus(c.caseId, 'UNDER_REVIEW')}
                              disabled={actionLoadingId === c.caseId}
                              className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-bold transition-colors"
                            >
                              Start Review
                            </button>
                          )}
                          {statusStr === 'UNDER_REVIEW' && (
                            <button
                              onClick={() => handleUpdateStatus(c.caseId, 'REVIEWED')}
                              disabled={actionLoadingId === c.caseId}
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-bold shadow transition-colors"
                            >
                              Mark Complete
                            </button>
                          )}
                          <Link
                            to={`/judge/cases/${c.caseId}`}
                            className="cyber-btn-primary text-xs py-1 px-3 inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect Case
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* RECENTLY REVIEWED CASES */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-bold text-navy-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recently Reviewed Cases
        </h3>

        {reviewedCases.length === 0 ? (
          <p className="text-xs text-navy-600 py-4 text-center">No cases marked as Reviewed yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reviewedCases.slice(0, 6).map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-navy-900">{c.caseId}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-900">REVIEWED</span>
                </div>
                <p className="font-bold text-navy-900 truncate">{c.title}</p>
                <div className="flex justify-between items-center text-[10px] text-navy-600 pt-1 border-t border-emerald-100">
                  <span>Last Reviewed: {c.reviewCompletedAt ? formatDate(c.reviewCompletedAt) : 'Recently'}</span>
                  <Link to={`/judge/cases/${c.caseId}`} className="font-bold text-navy-900 hover:underline">
                    Open Case →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
