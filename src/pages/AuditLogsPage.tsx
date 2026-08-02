import { useState, useEffect } from 'react'
import { ScrollText, Filter, Clock, Lock, ShieldCheck, Download, Printer, FileSpreadsheet, FileText } from 'lucide-react'
import { PageHeader, GlassCard, SearchInput, StatusBadge, TabGroup } from '../components/ui'
import { formatDate, formatRelativeTime } from '../lib/utils'
import type { AuditLog } from '../types'

const severityVariant = (s: string) => {
  const map: Record<string, 'info' | 'warning' | 'danger'> = {
    info: 'info',
    warning: 'warning',
    critical: 'danger',
  }
  return map[s] || 'info'
}

import { apiFetch, downloadAuthenticatedBlob } from '../lib/api'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState('table')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    async function fetchAuditLogs() {
      try {
        const res = await apiFetch('/api/audit-logs')
        if (res.ok) {
          const data = await res.json() as { logs: AuditLog[] }
          setLogs(data.logs)
        }
      } catch (err) {
        console.error('Failed to fetch audit logs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAuditLogs()
  }, [])

  const handleExportCSV = async () => {
    try {
      await downloadAuthenticatedBlob('/api/audit-logs/export/csv', 'forensic_audit_trail.csv', 'text/csv')
    } catch (err) {
      console.error('Failed to export CSV:', err)
    }
  }

  const handleExportPDF = async () => {
    try {
      await downloadAuthenticatedBlob('/api/audit-logs/export/pdf', 'forensic_audit_report.txt', 'text/plain')
    } catch (err) {
      console.error('Failed to export PDF:', err)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const actions = ['all', ...new Set(logs.map((l) => l.action))]

  const filtered = logs
    .filter((l) => actionFilter === 'all' || l.action === actionFilter)
    .filter((l) =>
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="space-y-6 animate-in">
      {/* Header Banner */}
      <PageHeader
        title="Audit Logs & Compliance Ledger"
        subtitle="ISO/IEC 27037 & Section 65B Compliant Immutable Digital Evidence Trail"
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={handleExportCSV} className="cyber-btn-secondary text-xs flex items-center gap-1.5" title="Download CSV">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={handleExportPDF} className="cyber-btn-secondary text-xs flex items-center gap-1.5" title="Download PDF/Report">
              <FileText className="w-3.5 h-3.5" /> Export PDF Report
            </button>
            <button onClick={handlePrint} className="cyber-btn-primary text-xs flex items-center gap-1.5" title="Print Audit Trail">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        }
      />

      {/* Compliance Integrity Banner */}
      <GlassCard className="!p-4 bg-sky-50/70 border-sky-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-navy-900 text-white shrink-0">
              <Lock className="w-5 h-5 text-saffron-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-navy-900 flex items-center gap-1.5">
                  Immutable Audit Trail
                </h4>
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-mono font-bold uppercase tracking-wide">
                  Append-Only
                </span>
              </div>
              <p className="text-xs text-navy-700 mt-0.5" title="Audit records cannot be edited or deleted to preserve forensic integrity.">
                Audit records cannot be edited or deleted to preserve forensic integrity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-navy-800 bg-white/80 px-3 py-1.5 rounded-lg border border-navy-100 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ISO 27037 Verified</span>
          </div>
        </div>
      </GlassCard>

      {/* Filter and Search Bar */}
      <GlassCard className="!p-4 print:hidden">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search user, action, target or hash..." className="flex-1 max-w-md" />
          <div className="flex gap-2 items-center flex-wrap">
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="cyber-input w-auto text-sm">
              {actions.map((a) => (
                <option key={a} value={a}>{a === 'all' ? 'All Actions' : a}</option>
              ))}
            </select>
            <TabGroup
              tabs={[
                { id: 'table', label: 'Table' },
                { id: 'timeline', label: 'Timeline' },
              ]}
              active={view}
              onChange={setView}
            />
          </div>
        </div>
      </GlassCard>

      {/* Data Presentation */}
      {loading ? (
        <GlassCard className="p-8 text-center text-navy-600">
          Loading immutable audit trail...
        </GlassCard>
      ) : view === 'table' ? (
        <GlassCard className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Target</th>
                  <th>IP Address</th>
                  <th>Severity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs text-navy-700 font-mono whitespace-nowrap">
                      <div>{formatDate(log.timestamp)}</div>
                      <div className="text-[10px] text-navy-600 font-sans">{formatRelativeTime(log.timestamp)}</div>
                    </td>
                    <td><StatusBadge status={log.action} variant="info" /></td>
                    <td className="text-sm font-semibold text-navy-900">{log.user}</td>
                    <td className="text-xs text-navy-700 capitalize">{log.role.replace('_', ' ')}</td>
                    <td className="text-xs font-mono text-navy-800">{log.target}</td>
                    <td className="text-xs font-mono text-navy-700">{log.ip}</td>
                    <td><StatusBadge status={log.severity} variant={severityVariant(log.severity)} /></td>
                    <td className="text-xs text-navy-700 max-w-[280px] truncate" title={log.details}>{log.details}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-navy-600">
                      No activity logs match the search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-navy-200" />
            <div className="space-y-4">
              {filtered.map((log, i) => (
                <div key={log.id} className="relative flex gap-4 pl-10 animate-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="absolute left-2.5 w-3 h-3 rounded-full bg-navy-900 border-2 border-white ring-2 ring-navy-100" />
                  <div className="flex-1 p-3.5 rounded-xl bg-white border border-navy-100 shadow-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ScrollText className="w-4 h-4 text-navy-800" />
                        <span className="text-sm font-bold text-navy-900">{log.action}</span>
                        <StatusBadge status={log.severity} variant={severityVariant(log.severity)} />
                      </div>
                      <span className="text-[11px] font-mono text-navy-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {formatRelativeTime(log.timestamp)} ({formatDate(log.timestamp)})
                      </span>
                    </div>
                    <p className="text-xs text-navy-700">
                      <span className="font-semibold text-navy-900">{log.user}</span> ({log.role.replace('_', ' ')}) → Target: <span className="font-mono text-navy-900 font-bold">{log.target}</span> | IP: <span className="font-mono">{log.ip}</span>
                    </p>
                    <p className="text-xs text-navy-600 bg-navy-50/50 p-2 rounded border border-navy-100">{log.details}</p>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-navy-600">
                  No activity logs match the search query.
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
