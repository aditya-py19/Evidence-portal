import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ScrollText, LogOut, ChevronLeft, ChevronRight, Menu,
  ShieldCheck, FileCheck, User
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth, useApp } from '../../context/AppContext'
import { ROLE_LABELS } from '../../types'
import { PoliceLogo, AshokaEmblem } from '../brand/Logos'

const adminNavItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/requests', label: 'Officer Requests', icon: FileCheck },
  { path: '/admin/access-records', label: 'Access Records', icon: ShieldCheck },
  { path: '/admin/activity-logs', label: 'Audit Logs', icon: ScrollText },
  { path: '/admin/officers', label: 'Officers / Users', icon: Users },
  { path: '/profile', label: 'Profile', icon: User },
]

function AdminSidebar() {
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
      <div className="shrink-0 h-16 flex flex-col justify-between border-b border-navy-100">
        <div className="tricolor-line" />
        <div className="flex-1 flex items-center gap-2.5 px-3">
          <div className="w-10 h-10 rounded-full bg-white ring-1 ring-navy-100 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
            <PoliceLogo size={36} className="h-full w-full object-contain" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden min-w-0">
              <h1 className="text-sm font-bold text-navy-900 leading-tight">Evidence Portal</h1>
              <p className="text-[10px] text-saffron-600 font-semibold font-hindi truncate">प्रशासक पोर्टल</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {adminNavItems.map((item) => {
          const isActive = location.pathname === item.path
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
            Administrator Portal
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

function AdminTopBar() {
  const { user, adminLogout } = useAuth()
  const { sidebarOpen, toggleSidebar } = useApp()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await adminLogout()
    navigate('/admin-login')
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 flex flex-col justify-between',
        'bg-white/95 backdrop-blur-md border-b border-navy-100 shadow-sm transition-all duration-300',
        sidebarOpen ? 'left-64' : 'left-[72px]'
      )}
    >
      <div className="tricolor-line" />
      <div className="flex-1 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-navy-50 text-navy-700">
            <Menu className="w-5 h-5" />
          </button>
          <AshokaEmblem size={32} className="hidden sm:block flex-shrink-0" />
          <div className="hidden md:block min-w-0">
            <p className="text-sm font-semibold text-navy-900 truncate">Administrator Dashboard</p>
            <p className="text-[11px] text-navy-700 truncate font-hindi">प्रशासक · Officer & Activity Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 pl-3 border-l border-navy-100">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-navy-900 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-saffron-600 font-medium">{user ? ROLE_LABELS[user.role] : ''}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-navy-900 flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 text-navy-700 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useApp()

  return (
    <div className="min-h-screen bg-navy-50 relative">
      <div
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden"
        aria-hidden
      >
        <AshokaEmblem size={640} className="opacity-[0.035] ml-32" />
      </div>

      <AdminSidebar />
      <AdminTopBar />
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
