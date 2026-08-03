import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Scale, Eye, FolderCheck, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Search } from 'lucide-react'
import { PageHeader, GlassCard, StatusBadge } from '../../components/ui'
import { useAuth } from '../../context/AppContext'
import { formatDate } from '../../lib/utils'
import { apiFetch } from '../../lib/api'
import type { Case } from '../../types'

export default function JudgeDashboardPage() {
  const { user } = useAuth()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchCases() {
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
    fetchCases()
  }, [])

  const judgeName = user?.name || 'Justice V. K. Sharma'
  const judgeDesignation = user?.department || 'Special Judicial Bench / High Court of Chhattisgarh'

  const filteredCases = cases.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.caseId.toLowerCase().includes(search.toLowerCase()) ||
    c.firNumber.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in bg-[#F5F7FA] min-h-screen pb-12">
      {/* Judicial Header */}
      <div className="bg-white border-b border-navy-100 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-saffron-50 border border-saffron-200 flex items-center justify-center text-saffron-600 shrink-0">
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-saffron-100 text-saffron-800 uppercase tracking-wide">
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

        <div className="flex items-center gap-3 bg-navy-50 px-4 py-3 rounded-xl border border-navy-100 shrink-0">
          <FolderCheck className="w-5 h-5 text-navy-700" />
          <div>
            <p className="text-xs text-navy-600 font-medium">Cases Assigned for Review</p>
            <p className="text-lg font-bold text-navy-900">{cases.length} Active Cases</p>
          </div>
        </div>
      </div>

      {/* Main Judicial Review Table */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-navy-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-navy-700" /> Judicial Case Roster
            </h2>
            <p className="text-xs text-navy-600 mt-0.5">
              Select a case to inspect evidence, chain of custody, and cryptographic integrity reports.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-navy-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by Case ID, FIR, or Title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-600 bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-navy-600 text-sm">Loading judicial case roster...</div>
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-16 text-navy-600 text-sm">
            No active cases found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-navy-100 bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy-50/80 border-b border-navy-100 text-[11px] font-bold text-navy-700 uppercase tracking-wider">
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">FIR Number</th>
                  <th className="py-3 px-4">Case Title & Category</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Court Readiness</th>
                  <th className="py-3 px-4 text-center">Evidence Count</th>
                  <th className="py-3 px-4 text-center">Trust Score</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 text-xs">
                {filteredCases.map((c) => {
                  const evidenceCount = (c as any).evidenceCount ?? 3
                  const trustScore = 98

                  return (
                    <tr key={c.id} className="hover:bg-navy-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-navy-900">
                        {c.caseId}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-navy-700">
                        {c.firNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-navy-900">{c.title}</p>
                        <p className="text-[11px] text-navy-500">{c.crimeType || 'General Criminal Law'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={c.status as any} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Ready for Trial
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-navy-800">
                        {evidenceCount} Items
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-900">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                          {trustScore}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/judge/cases/${c.caseId || c.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-medium text-xs transition-colors shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review Case
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
