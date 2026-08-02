import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, ScrollText, ShieldCheck, Activity } from 'lucide-react'
import { PageHeader, StatCard, GlassCard } from '../../components/ui'
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

import { apiFetch } from '../../lib/api'

export default function AdminDashboardPage() {
  const [officerCount, setOfficerCount] = useState(0)
  const [activeOfficers, setActiveOfficers] = useState(0)
  const [recentLogs, setRecentLogs] = useState<ActivityLogRow[]>([])

  useEffect(() => {
    apiFetch('/api/admin/officers')
      .then(async (response) => {
        const body = await response.json() as { officers?: { isActive: boolean }[] }
        if (response.ok && body.officers) {
          setOfficerCount(body.officers.length)
          setActiveOfficers(body.officers.filter((o) => o.isActive).length)
        }
      })
      .catch(() => undefined)

    apiFetch('/api/admin/activity-logs')
      .then(async (response) => {
        const body = await response.json() as { logs?: ActivityLogRow[] }
        if (response.ok && body.logs) setRecentLogs(body.logs.slice(0, 8))
      })
      .catch(() => undefined)
  }, [])

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Admin Dashboard"
        subtitle="प्रशासक डैशबोर्ड · Manage officers and monitor portal activity"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Officers"
          value={officerCount}
          icon={<Users className="w-5 h-5 text-navy-800" />}
          color="cyan"
        />
        <StatCard
          label="Active Officers"
          value={activeOfficers}
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
          color="emerald"
        />
        <StatCard
          label="Inactive Officers"
          value={officerCount - activeOfficers}
          icon={<Activity className="w-5 h-5 text-amber-600" />}
          color="amber"
        />
        <StatCard
          label="Recent Events"
          value={recentLogs.length}
          icon={<ScrollText className="w-5 h-5 text-violet-600" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Quick Actions</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/admin/officers" className="cyber-btn-primary flex-1 justify-center">
              <Users className="w-4 h-4" /> Officer Management
            </Link>
            <Link to="/admin/activity-logs" className="cyber-btn-secondary flex-1 justify-center">
              <ScrollText className="w-4 h-4" /> Activity Logs
            </Link>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Recent Activity</h3>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-navy-600">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-navy-50 border border-navy-100">
                  <div>
                    <p className="text-sm font-medium text-navy-900">{log.activity}</p>
                    <p className="text-xs text-navy-700">{log.username} · {ROLE_LABELS[log.role]}</p>
                  </div>
                  <span className="text-[10px] text-navy-600 whitespace-nowrap">{formatDate(log.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
