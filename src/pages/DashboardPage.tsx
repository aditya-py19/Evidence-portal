import { Link } from 'react-router-dom'
import {
  FolderOpen, FileSearch, Brain, AlertTriangle, ShieldCheck,
  Link2, Activity, TrendingUp, Star, Bell,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { StatCard, GlassCard, PageHeader } from '../components/ui'
import {
  dashboardStats, uploadTrendData, riskDistributionData,
  caseStatusData, aiDetectionData, recentActivities, notifications,
} from '../data/mockData'

const statCards = [
  { label: 'Total Cases', value: dashboardStats.totalCases, icon: <FolderOpen className="w-5 h-5 text-navy-800" />, color: 'cyan', trend: '+12% this month', trendUp: true },
  { label: 'Active Cases', value: dashboardStats.activeCases, icon: <Activity className="w-5 h-5 text-blue-600" />, color: 'blue', trend: '8 critical', trendUp: false },
  { label: 'Evidence Uploaded', value: dashboardStats.evidenceUploaded.toLocaleString(), icon: <FileSearch className="w-5 h-5 text-emerald-600" />, color: 'emerald', trend: '+89 this week', trendUp: true },
  { label: 'Pending AI Reviews', value: dashboardStats.pendingAIReviews, icon: <Brain className="w-5 h-5 text-violet-600" />, color: 'purple', trend: '3 urgent', trendUp: false },
  { label: 'High Risk Evidence', value: dashboardStats.highRiskEvidence, icon: <AlertTriangle className="w-5 h-5 text-red-600" />, color: 'red', trend: '+2 today', trendUp: false },
  { label: 'Verified Evidence', value: dashboardStats.verifiedEvidence.toLocaleString(), icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />, color: 'emerald' },
  { label: 'Avg Trust Score', value: dashboardStats.averageTrustScore, icon: <Star className="w-5 h-5 text-amber-600" />, color: 'amber', trend: '+2.1 pts', trendUp: true },
  { label: 'Tampering Alerts', value: dashboardStats.tamperingAlerts, icon: <AlertTriangle className="w-5 h-5 text-red-600" />, color: 'red' },
  { label: 'Blockchain Txs', value: dashboardStats.blockchainTransactions.toLocaleString(), icon: <Link2 className="w-5 h-5 text-navy-800" />, color: 'cyan' },
]

const chartTooltipStyle = {
  contentStyle: { background: '#ffffff', border: '1px solid #D9E2EC', borderRadius: '8px', fontSize: '12px', color: '#102A43' },
  labelStyle: { color: '#627D98' },
}

export default function DashboardPage() {
  const unreadNotifications = notifications.filter((n) => !n.read).slice(0, 5)

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Police Operations Dashboard"
        subtitle="भारत पुलिस · Real-time digital evidence status for investigations & courts"
        actions={
          <div className="flex items-center gap-2 text-xs text-navy-700">
            <TrendingUp className="w-4 h-4 text-india-green" />
            Last synced: Just now
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} delay={i * 50} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Evidence Upload Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={uploadTrendData}>
              <defs>
                <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#486581" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#486581" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,42,67,0.08)" />
              <XAxis dataKey="month" stroke="#829AB1" fontSize={11} />
              <YAxis stroke="#829AB1" fontSize={11} />
              <Tooltip {...chartTooltipStyle} />
              <Area type="monotone" dataKey="uploads" stroke="#1A365D" fill="url(#uploadGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Risk Score Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={riskDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {riskDistributionData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#627D98' }} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-navy-900 mb-4">Case Status Analytics</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={caseStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,42,67,0.08)" />
              <XAxis dataKey="status" stroke="#829AB1" fontSize={11} />
              <YAxis stroke="#829AB1" fontSize={11} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="count" fill="#334E68" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-navy-900 mb-4">AI Detection Statistics</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={aiDetectionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,42,67,0.08)" />
              <XAxis type="number" stroke="#829AB1" fontSize={11} />
              <YAxis dataKey="type" type="category" stroke="#829AB1" fontSize={11} width={80} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="detected" fill="#DC2626" name="Detected" radius={[0, 4, 4, 0]} stackId="a" />
              <Bar dataKey="clean" fill="#138808" name="Clean" radius={[0, 4, 4, 0]} stackId="a" />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#627D98' }} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-navy-900">Recent Activities</h3>
            <Link to="/audit-logs" className="text-xs text-saffron-600 hover:text-saffron-700 font-medium">View All</Link>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-navy-50 border border-navy-100">
                <div className="w-2 h-2 rounded-full bg-navy-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy-700">
                    <span className="text-navy-900 font-semibold">{activity.user}</span> — {activity.action}
                  </p>
                  <p className="text-xs text-navy-700 truncate">{activity.target}</p>
                </div>
                <span className="text-[10px] text-navy-700 flex-shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-saffron-600" />
              Recent Notifications
            </h3>
            <Link to="/notifications" className="text-xs text-saffron-600 hover:text-saffron-700 font-medium">View All</Link>
          </div>
          <div className="space-y-3">
            {unreadNotifications.map((notif) => (
              <Link
                key={notif.id}
                to={notif.link || '/notifications'}
                className="flex items-start gap-3 p-3 rounded-lg bg-navy-50 border border-navy-100 hover:border-saffron-300 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  notif.priority === 'critical' ? 'bg-red-500' :
                  notif.priority === 'high' ? 'bg-amber-500' : 'bg-navy-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900">{notif.title}</p>
                  <p className="text-xs text-navy-700 truncate">{notif.message}</p>
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
