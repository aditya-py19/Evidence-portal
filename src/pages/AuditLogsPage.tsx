import { useState } from 'react'
import { ScrollText, Filter, Clock } from 'lucide-react'
import { PageHeader, GlassCard, SearchInput, StatusBadge, TabGroup } from '../components/ui'
import { auditLogs } from '../data/mockData'
import { formatDate } from '../lib/utils'

const severityVariant = (s: string) => {
  const map: Record<string, 'info' | 'warning' | 'danger'> = {
    info: 'info', warning: 'warning', critical: 'danger',
  }
  return map[s] || 'info'
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [view, setView] = useState('table')
  const [actionFilter, setActionFilter] = useState('all')

  const actions = ['all', ...new Set(auditLogs.map((l) => l.action))]

  const filtered = auditLogs
    .filter((l) => actionFilter === 'all' || l.action === actionFilter)
    .filter((l) =>
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Audit Logs"
        subtitle="Comprehensive activity tracking for compliance and forensic accountability"
      />

      <GlassCard className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Search logs..." className="flex-1 max-w-md" />
          <div className="flex gap-2 items-center">
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
            <button className="cyber-btn-secondary"><Filter className="w-4 h-4" /></button>
          </div>
        </div>
      </GlassCard>

      {view === 'table' ? (
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
                    <td className="text-xs text-navy-600 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    <td><StatusBadge status={log.action} variant="info" /></td>
                    <td className="text-sm text-navy-900">{log.user}</td>
                    <td className="text-xs text-navy-700">{log.role.replace('_', ' ')}</td>
                    <td className="text-xs font-mono text-navy-800">{log.target}</td>
                    <td className="text-xs font-mono">{log.ip}</td>
                    <td><StatusBadge status={log.severity} variant={severityVariant(log.severity)} /></td>
                    <td className="text-xs text-navy-700 max-w-[200px] truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-navy-700/20" />
            <div className="space-y-4">
              {filtered.map((log, i) => (
                <div key={log.id} className="relative flex gap-4 pl-10 animate-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="absolute left-2.5 w-3 h-3 rounded-full bg-navy-700 border-2 border-cyber-900" />
                  <div className="flex-1 p-3 rounded-lg bg-cyber-800/30 border border-glass-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ScrollText className="w-4 h-4 text-navy-800" />
                        <span className="text-sm font-medium text-navy-900">{log.action}</span>
                        <StatusBadge status={log.severity} variant={severityVariant(log.severity)} />
                      </div>
                      <span className="text-[10px] text-navy-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-navy-700 mt-1">
                      <span className="text-navy-800">{log.user}</span> → {log.target}
                    </p>
                    <p className="text-xs text-navy-600 mt-1">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}
