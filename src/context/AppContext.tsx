import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, Notification } from '../types'
import { notifications as initialNotifications } from '../data/mockData'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (identifier: string, password: string, portal?: 'officer' | 'judge') => Promise<{ success: boolean; message?: string }>
  logout: () => void
}

interface AppContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllRead: () => void
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

  const logout = useCallback(() => {
    localStorage.removeItem('evidence-portal-token')
    localStorage.removeItem('evidence-portal-user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), [])

  return (
    <AppContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllRead, sidebarOpen, toggleSidebar }}
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
