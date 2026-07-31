import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, Notification } from '../types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (identifier: string, password: string, portal?: 'officer' | 'judge') => Promise<{ success: boolean; message?: string }>
  adminLogin: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  adminLogout: () => Promise<void>
}

interface AppContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
  sidebarOpen: boolean
  toggleSidebar: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)
const AppContext = createContext<AppContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('evidence-portal-user')
    return stored ? JSON.parse(stored) as User : null
  })

  const login = useCallback(async (identifier: string, password: string, portal: 'officer' | 'judge' = 'officer') => {
    try {
      const response = await fetch(portal === 'judge' ? '/api/auth/judge/login' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })
      const body = await response.json() as { token?: string; user?: User; message?: string }
      if (!response.ok || !body.token || !body.user) return { success: false, message: body.message ?? 'Login failed.' }

      const loggedInUser: User = { ...body.user, assignedCases: 0, evidenceUploaded: 0 }
      localStorage.setItem('evidence-portal-token', body.token)
      localStorage.setItem('evidence-portal-user', JSON.stringify(loggedInUser))
      setUser(loggedInUser)
      return { success: true }
    } catch {
      return { success: false, message: 'Unable to reach the secure login server.' }
    }
  }, [])

  const adminLogin = useCallback(async (identifier: string, password: string) => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })
      const body = await response.json() as { token?: string; user?: User; message?: string }
      if (!response.ok || !body.token || !body.user) return { success: false, message: body.message ?? 'Admin login failed.' }

      const loggedInUser: User = { ...body.user, assignedCases: 0, evidenceUploaded: 0 }
      localStorage.setItem('evidence-portal-token', body.token)
      localStorage.setItem('evidence-portal-user', JSON.stringify(loggedInUser))
      setUser(loggedInUser)
      return { success: true }
    } catch {
      return { success: false, message: 'Unable to reach the admin login server.' }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('evidence-portal-token')
    localStorage.removeItem('evidence-portal-user')
    setUser(null)
  }, [])

  const adminLogout = useCallback(async () => {
    localStorage.removeItem('evidence-portal-token')
    localStorage.removeItem('evidence-portal-user')
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'administrator'

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isAdmin, login, adminLogin, logout, adminLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const refreshNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('evidence-portal-token')
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/notifications', { headers })
      if (res.ok) {
        const data = await res.json() as { notifications: Notification[] }
        setNotifications(data.notifications)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }, [])

  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    try {
      const token = localStorage.getItem('evidence-portal-token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers,
      })
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      const token = localStorage.getItem('evidence-portal-token')
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers,
      })
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }, [])

  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), [])

  return (
    <AppContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllRead, refreshNotifications, sidebarOpen, toggleSidebar }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
