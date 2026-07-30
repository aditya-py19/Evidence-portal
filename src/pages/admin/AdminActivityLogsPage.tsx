import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { PageHeader, GlassCard, SearchInput, StatusBadge } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { ROLE_LABELS } from '../../types'
import type { UserRole } from '../../types'

type ActivityLogRow = {
  id: string
  activity: string
  username: string
  role: UserRole
  ipAddress: string
  details?: string | null
  timestamp: string
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogRow[]>([])
  const [search, setSearch] = useState('')
  const [activityFilter, setActivityFilter] = useState('all')

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem('evidence-portal-token') ?? ''}`,
  })

  useEffect(() => {
    fetch('/api/admin/activity-logs', { headers: headers() })
      .then(async (response) => {
        const body = await response.json() as { logs?: ActivityLogRow[] }
        if (response.ok && body.logs) setLogs(body.logs)
      })
      .catch(() => undefined)
  }, [])

  const activities = ['all', ...new Set(logs.map((log) => log.activity))]

  const filtered = logs
    .filter((log) => activityFilter === 'all' || log.activity === activityFilter)
    .filter((log) =>
      log.username.toLowerCase().includes(search.toLowerCase()) ||
      log.activity.toLowerCase().includes(search.toLowerCase()) ||
      (log.details ?? '').toLowerCase().includes(search.toLowerCase())
    )

  const handleDownloadCsv = async () => {
    const response = await fetch('/api/admin/activity-logs/export', { headers: headers() })
    if (!response.ok) return
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'activity-logs.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Activity Logs"
        subtitle="Comprehensive audit trail for administrator and officer actions"
        actions={
          <button onClick={handleDownloadCsv} className="cyber-btn-primary">
            <Download className="w-4 h-4" /> Download CSV
          </button>
        }
      />

      <GlassCard className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by username, activity, or details..."
            className="flex-1 max-w-md"
          />
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="cyber-input w-auto text-sm"
          >
            {activities.map((activity) => (
              <option key={activity} value={activity}>
                {activity === 'all' ? 'All Activities' : activity}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Username</th>
                <th>Role</th>
                <th>Activity</th>
                <th>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td className="text-xs text-navy-600 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                  <td className="text-sm text-navy-900">{log.username}</td>
                  <td className="text-xs text-navy-700">{ROLE_LABELS[log.role]}</td>
                  <td><StatusBadge status={log.activity} variant="info" /></td>
                  <td className="text-xs font-mono">{log.ipAddress}</td>
                  <td className="text-xs text-navy-700 max-w-[220px] truncate">{log.details ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
