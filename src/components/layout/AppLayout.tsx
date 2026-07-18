import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, FileSearch, Brain, Shield, Link2,
  MapPin, Gavel, ScrollText, Bell, Users, Settings, User,
  ChevronLeft, ChevronRight, ShieldCheck, LogOut, Menu,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth, useApp } from '../../context/AppContext'
import { ROLE_LABELS } from '../../types'
import { PoliceLogo, AshokaEmblem } from '../brand/Logos'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/cases', label: 'Case Management', icon: FolderOpen },
  { path: '/evidence', label: 'Evidence', icon: FileSearch },
  { path: '/ai-verification', label: 'AI Verification', icon: Brain },
  { path: '/trust-score', label: 'Trust Score', icon: Shield },
  { path: '/chain-of-custody', label: 'Chain of Custody', icon: Link2 },
  { path: '/evidence-passport', label: 'Evidence Passport', icon: ShieldCheck },
  { path: '/geolocation', label: 'Geolocation', icon: MapPin },
  { path: '/blockchain', label: 'Blockchain', icon: Link2 },
  { path: '/court-verification', label: 'Court Portal', icon: Gavel },
  { path: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/access-control', label: 'Access Control', icon: Shield },
  { path: '/users', label: 'User Management', icon: Users },
  { path: '/security', label: 'Security Settings', icon: Settings },
  { path: '/profile', label: 'My Profile', icon: User },
]

export function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, toggleSidebar } = useApp()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300',
        'bg-white border-r border-navy-100 shadow-sm',
        sidebarOpen ? 'w-64' : 'w-[72px]'
      )}
    >
      <div className="shrink-0">
        <div className="tricolor-line" />
        <div className="flex items-center gap-2.5 px-3 h-16 border-b border-navy-100">
          <PoliceLogo size={sidebarOpen ? 42 : 36} className="flex-shrink-0 rounded-full ring-1 ring-navy-100" />
          {sidebarOpen && (
            <div className="overflow-hidden min-w-0">
              <h1 className="text-sm font-bold text-navy-900 leading-tight">Evidence Portal</h1>
              <p className="text-[10px] text-saffron-600 font-semibold font-hindi truncate">छत्तीसगढ़ पुलिस</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
              )}
              title={!sidebarOpen ? item.label : undefined}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {sidebarOpen && (
        <div className="px-3 py-3 border-t border-navy-100 flex items-center gap-2">
          <AshokaEmblem size={28} className="opacity-80" />
          <p className="text-[9px] text-navy-700 leading-snug">
            सत्यमेव जयते
            <br />
            Digital Evidence System
          </p>
        </div>
      )}

      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-11 border-t border-navy-100 text-navy-700 hover:text-navy-800 hover:bg-navy-50 transition-colors"
      >
        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </aside>
  )
}

export function TopBar() {
  const { user, logout } = useAuth()
  const { unreadCount, sidebarOpen, toggleSidebar } = useApp()

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6',
        'bg-white/95 backdrop-blur-md border-b border-navy-100 shadow-sm transition-all duration-300',
        sidebarOpen ? 'left-64' : 'left-[72px]'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-navy-50 text-navy-700">
          <Menu className="w-5 h-5" />
        </button>
        <AshokaEmblem size={36} className="hidden sm:block flex-shrink-0" />
        <div className="hidden md:block min-w-0">
          <p className="text-sm font-semibold text-navy-900 truncate">
            Digital Evidence Trust Platform
          </p>
          <p className="text-[11px] text-navy-700 truncate font-hindi">
            छत्तीसगढ़ पुलिस · Forensics · Courts
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-green-50 border border-green-200">
          <div className="w-1.5 h-1.5 rounded-full bg-india-green" />
          <span className="text-[10px] text-india-green font-semibold">System Online</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg hover:bg-navy-50 text-navy-700 hover:text-navy-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-saffron-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2.5 pl-3 border-l border-navy-100">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-navy-900 leading-tight">{user?.name}</p>
            <p className="text-[10px] text-saffron-600 font-medium">{user ? ROLE_LABELS[user.role] : ''}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-navy-900 flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-50 text-navy-700 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useApp()

  return (
    <div className="min-h-screen bg-navy-50 relative">
      {/* Subtle Ashoka watermark on all authenticated pages */}
      <div
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
        aria-hidden
      >
        <AshokaEmblem size={640} className="opacity-[0.035] ml-32" />
      </div>

      <Sidebar />
      <TopBar />
      <main
        className={cn(
          'relative z-10 min-h-screen transition-all duration-300 pt-20 px-4 sm:px-6 pb-8',
          sidebarOpen ? 'ml-64' : 'ml-[72px]'
        )}
      >
        <div className="max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  )
}
