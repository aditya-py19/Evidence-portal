import { useState } from 'react'
import { User as UserIcon, Shield, FolderOpen, FileSearch, Clock, Activity, Scale, CheckCircle2 } from 'lucide-react'
import { PageHeader, GlassCard, StatCard } from '../components/ui'
import { useAuth } from '../context/AppContext'
import { ROLE_LABELS } from '../types'
import { recentActivities } from '../data/mockData'
import { formatDate } from '../lib/utils'

export default function ProfilePage() {
  const { user } = useAuth()
  const isJudge = user?.role === 'judge'

  if (!user) return null

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title={isJudge ? 'Judicial Officer Profile' : 'User Profile'}
        subtitle={isJudge ? 'Authenticated Judge account information and judicial bench assignment' : 'Officer details, activity history, and assigned cases'}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <GlassCard className="text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 shadow-md ${
            isJudge ? 'bg-gradient-to-br from-amber-600 to-amber-900 ring-4 ring-amber-100' : 'bg-gradient-to-br from-navy-800 to-navy-950 ring-4 ring-navy-100'
          }`}>
            {user.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-navy-900">
            {isJudge && !user.name.startsWith("Hon'ble") ? `Hon'ble ${user.name}` : user.name}
          </h2>
          <p className="text-xs font-bold text-saffron-600 uppercase tracking-wider mt-1">
            {ROLE_LABELS[user.role]}
          </p>
          <p className="text-xs text-navy-700 mt-1 font-medium">{user.department}</p>

          <div className="mt-4 pt-4 border-t border-navy-100 space-y-2 text-left">
            {[
              { label: isJudge ? 'Judicial Designation' : 'Badge Number', value: user.badgeNumber || 'High Court Judicial Officer' },
              { label: 'Official Email', value: user.email },
              { label: 'System Username', value: user.username },
              { label: 'Account Status', value: user.isActive ? 'Active (Verified)' : 'Inactive' },
              { label: 'Last Login', value: user.lastLogin ? formatDate(user.lastLogin) : 'Active Session' },
            ].map((field) => (
              <div key={field.label} className="flex justify-between text-xs py-1 border-b border-navy-50 last:border-0">
                <span className="text-navy-600 font-medium">{field.label}:</span>
                <span className="text-navy-900 font-mono font-semibold">{field.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Right Details Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label={isJudge ? 'Assigned Cases for Review' : 'Assigned Cases'}
              value={user.assignedCases || 3}
              icon={isJudge ? <Scale className="w-5 h-5 text-amber-600" /> : <FolderOpen className="w-5 h-5 text-navy-800" />}
              color="amber"
            />
            <StatCard
              label={isJudge ? 'Judicial Reviews Completed' : 'Evidence Uploaded'}
              value={isJudge ? 2 : user.evidenceUploaded}
              icon={isJudge ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <FileSearch className="w-5 h-5 text-emerald-400" />}
              color="emerald"
            />
          </div>

          <GlassCard>
            <h3 className="text-sm font-bold text-navy-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-navy-800" /> Activity Timeline
            </h3>
            <div className="space-y-3">
              {(isJudge
                ? [
                    { id: '1', action: 'Completed Judicial Review', target: 'Case TC-2026-0138', time: '2 hours ago' },
                    { id: '2', action: 'Maintained Private Judicial Note', target: 'Case TC-2026-0142', time: '1 day ago' },
                    { id: '3', action: 'Signed Section 65B Certificate', target: 'Evidence EVD-TC-2026-0142-001', time: '3 days ago' },
                  ]
                : recentActivities
              ).map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl bg-navy-50/60 border border-navy-100">
                  <div className="w-2 h-2 rounded-full bg-navy-800" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-navy-900">{activity.action}</p>
                    <p className="text-[11px] text-navy-600 font-mono">{activity.target}</p>
                  </div>
                  <span className="text-[10px] text-navy-500 font-mono">{activity.time}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-bold text-navy-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-navy-800" /> Security & Account Credentials
            </h3>
            <div className="p-4 rounded-xl bg-navy-50 border border-navy-100 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-navy-700">Role Authorization:</span>
                <span className="font-bold text-navy-900">{ROLE_LABELS[user.role]} (RBAC Secured)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-navy-700">Authentication Method:</span>
                <span className="font-mono text-emerald-700 font-semibold">JWT Bearer Token + RSA-2048</span>
              </div>
              <p className="text-[11px] text-navy-500 italic pt-2 border-t border-navy-200">
                Administrative roles and permissions can only be modified through the Administrator Portal.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
