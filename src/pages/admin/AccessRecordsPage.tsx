import { useState, useEffect } from 'react'
import {
  ShieldCheck, Search, Filter, RefreshCw, Database, Lock, Eye, Download, ShieldAlert, CheckCircle, AlertTriangle
} from 'lucide-react'
import { PageHeader, GlassCard } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { apiFetch } from '../../lib/api'
import type { AccessRecord } from '../../types'

export default function AccessRecordsPage() {
  const [records, setRecords] = useState<AccessRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedActionFilter, setSelectedActionFilter] = useState('ALL')
  const [selectedResultFilter, setSelectedResultFilter] = useState('ALL')

  const fetchAccessRecords = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/access-records')
      const data = (await res.json()) as { records?: AccessRecord[] }
      setRecords(data.records || [])
    } catch (err: any) {
      console.error('Failed to fetch access records:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccessRecords()
  }, [])

  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      r.officer.toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q) ||
      r.accessType.toLowerCase().includes(q) ||
      r.details.toLowerCase().includes(q) ||
      r.ipAddress.includes(q)

    const matchesAction = selectedActionFilter === 'ALL' || r.action.toLowerCase().includes(selectedActionFilter.toLowerCase())
    const matchesResult = selectedResultFilter === 'ALL' || (selectedResultFilter === 'SUCCESS' ? r.result === 'Success' : r.result !== 'Success')

    return matchesSearch && matchesAction && matchesResult
  })

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Access Records Ledger"
        subtitle="History of actual officer system activity, evidence accesses, downloads, and security events"
        actions={
          <button
            onClick={fetchAccessRecords}
            className="cyber-btn-secondary text-xs flex items-center gap-1.5"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Ledger
          </button>
        }
      />

      {/* FILTERS */}
      <GlassCard className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-navy-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search officer, action, target, IP..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-800 bg-white"
            />
          </div>

          <div>
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-800 bg-white text-navy-900 font-semibold"
            >
              <option value="ALL">All Access Actions</option>
              <option value="Evidence">Evidence Access / View</option>
              <option value="Case">Case Access / View</option>
              <option value="Login">Authentication / Login</option>
              <option value="Access Request">Access Request Actions</option>
              <option value="Export">Data Exports</option>
            </select>
          </div>

          <div>
            <select
              value={selectedResultFilter}
              onChange={(e) => setSelectedResultFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-800 bg-white text-navy-900 font-semibold"
            >
              <option value="ALL">All Results</option>
              <option value="SUCCESS">Success Only</option>
              <option value="DENIED">Denied / Failed Only</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* RECORDS TABLE */}
      <GlassCard className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-navy-600 font-semibold space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-navy-800" />
            <p className="text-xs">Loading access records from PostgreSQL audit ledger...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-navy-300 mx-auto" />
            <h3 className="text-sm font-bold text-navy-900">No Access Records Found</h3>
            <p className="text-xs text-navy-600">No activity records match your current filter parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-50 text-navy-900 font-bold border-b border-navy-100">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Officer / User</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Target / Resource</th>
                  <th className="p-3.5">Result</th>
                  <th className="p-3.5">IP Address</th>
                  <th className="p-3.5">Authorization Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 font-sans">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-navy-50/50 transition-colors">
                    <td className="p-3.5 font-mono text-navy-600 whitespace-nowrap">
                      {formatDate(rec.timestamp)}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-navy-900">{rec.officer}</div>
                      <div className="text-[10px] text-navy-600 capitalize">{rec.role.replace('_', ' ')}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-navy-900">
                      {rec.action}
                    </td>
                    <td className="p-3.5 font-mono text-navy-800">
                      {rec.accessType}
                    </td>
                    <td className="p-3.5">
                      {rec.result === 'Success' ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Success
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-red-800 border border-red-200 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Denied
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-navy-600">
                      {rec.ipAddress}
                    </td>
                    <td className="p-3.5 text-navy-700 font-medium text-[11px]">
                      {rec.authorizationSource}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
