import { Link } from 'react-router-dom'
import {
  Upload, Brain, Shield, Link2, UserCheck, Eye, Gavel, AlertTriangle, Bell,
} from 'lucide-react'
import { PageHeader, GlassCard, StatusBadge } from '../components/ui'
import { useApp } from '../context/AppContext'
import { formatDate } from '../lib/utils'

const typeIcons: Record<string, React.ReactNode> = {
  upload: <Upload className="w-4 h-4" />,
  ai: <Brain className="w-4 h-4" />,
  trust: <Shield className="w-4 h-4" />,
  blockchain: <Link2 className="w-4 h-4" />,
  access: <UserCheck className="w-4 h-4" />,
  tampering: <AlertTriangle className="w-4 h-4" />,
  verify: <Gavel className="w-4 h-4" />,
}

const priorityColors: Record<string, string> = {
  low: 'border-slate-500/20',
  medium: 'border-navy-300',
  high: 'border-amber-500/20',
  critical: 'border-red-500/20 bg-red-500/5',
}

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllRead, unreadCount } = useApp()

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Notification Center"
        subtitle={`${unreadCount} unread notifications`}
        actions={
          unreadCount > 0 && (
            <button onClick={markAllRead} className="cyber-btn-secondary text-sm">
              Mark All Read
            </button>
          )
        }
      />

      <div className="space-y-3">
        {notifications.map((notif, i) => (
          <GlassCard
            key={notif.id}
            className={`!p-4 transition-all animate-in ${!notif.read ? priorityColors[notif.priority] : ''} ${notif.read ? 'opacity-60' : ''}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-lg flex-shrink-0 ${
                notif.priority === 'critical' ? 'bg-red-500/10 text-red-400' :
                notif.priority === 'high' ? 'bg-amber-500/10 text-amber-400' :
                'bg-navy-700/10 text-navy-800'
              }`}>
                {typeIcons[notif.type] || <Bell className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-navy-900">{notif.title}</h4>
                  {!notif.read && <span className="w-2 h-2 rounded-full bg-navy-700" />}
                  <StatusBadge status={notif.priority} variant={
                    notif.priority === 'critical' ? 'danger' :
                    notif.priority === 'high' ? 'warning' : 'info'
                  } />
                </div>
                <p className="text-sm text-navy-700 mt-1">{notif.message}</p>
                <p className="text-[10px] text-navy-600 mt-2">{formatDate(notif.timestamp)}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {!notif.read && (
                  <button onClick={() => markAsRead(notif.id)} className="cyber-btn-secondary text-xs py-1.5">
                    <Eye className="w-3.5 h-3.5" /> Read
                  </button>
                )}
                {notif.link && (
                  <Link to={notif.link} className="cyber-btn-primary text-xs py-1.5">View</Link>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
