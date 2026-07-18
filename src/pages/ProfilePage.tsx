import { User, Shield, FolderOpen, FileSearch, Clock, Activity } from 'lucide-react'
import { PageHeader, GlassCard, StatCard } from '../components/ui'
import { useAuth } from '../context/AppContext'
import { ROLE_LABELS } from '../types'
import { recentActivities } from '../data/mockData'
import { formatDate } from '../lib/utils'

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="User Profile" subtitle="Officer details, activity history, and assigned cases" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 shadow-glow">
            {user.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-navy-900">{user.name}</h2>
          <p className="text-sm text-navy-800 mt-1">{ROLE_LABELS[user.role]}</p>
          <p className="text-xs text-navy-700 mt-2">{user.department}</p>
          <div className="mt-4 pt-4 border-t border-glass-border space-y-2 text-left">
            {[
              { label: 'Badge Number', value: user.badgeNumber },
              { label: 'Email', value: user.email },
              { label: 'Username', value: user.username },
              { label: 'Last Login', value: user.lastLogin ? formatDate(user.lastLogin) : 'N/A' },
            ].map((field) => (
              <div key={field.label} className="flex justify-between text-xs">
                <span className="text-navy-600">{field.label}</span>
                <span className="text-navy-800 font-mono">{field.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="Assigned Cases"
              value={user.assignedCases}
              icon={<FolderOpen className="w-5 h-5 text-navy-800" />}
              color="cyan"
            />
            <StatCard
              label="Evidence Uploaded"
              value={user.evidenceUploaded}
              icon={<FileSearch className="w-5 h-5 text-emerald-400" />}
              color="emerald"
            />
          </div>

          <GlassCard>
            <h3 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-navy-800" /> Activity Timeline
            </h3>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-cyber-800/30 border border-glass-border/50">
                  <div className="w-2 h-2 rounded-full bg-navy-700" />
                  <div className="flex-1">
                    <p className="text-sm text-navy-800">{activity.action}</p>
                    <p className="text-xs text-navy-600">{activity.target}</p>
                  </div>
                  <span className="text-[10px] text-navy-600">{activity.time}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-navy-800" /> Verification History
            </h3>
            <div className="space-y-2">
              {[
                { action: 'Court Verification', target: 'EVD-TC-2026-0142-001', date: '2026-07-12', result: 'Passed' },
                { action: 'AI Review Approval', target: 'EVD-TC-2026-0142-005', date: '2026-07-05', result: 'Approved' },
                { action: 'Evidence Upload', target: 'EVD-TC-2026-0160-001', date: '2026-07-12', result: 'Pending' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-cyber-800/30 border border-glass-border/50">
                  <div>
                    <p className="text-sm text-navy-900">{item.action}</p>
                    <p className="text-xs text-navy-800 font-mono">{item.target}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${item.result === 'Passed' || item.result === 'Approved' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {item.result}
                    </p>
                    <p className="text-[10px] text-navy-600 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" /> {item.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
