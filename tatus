import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AppContext'
import { AppLayout } from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import PortalSelectionPage from './pages/PortalSelectionPage'
import DashboardPage from './pages/DashboardPage'
import CasesPage from './pages/CasesPage'
import EvidencePage from './pages/EvidencePage'
import AIVerificationPage from './pages/AIVerificationPage'
import TrustScorePage from './pages/TrustScorePage'
import ChainOfCustodyPage from './pages/ChainOfCustodyPage'
import EvidencePassportPage from './pages/EvidencePassportPage'
import GeolocationPage from './pages/GeolocationPage'
import BlockchainPage from './pages/BlockchainPage'
import CourtVerificationPage from './pages/CourtVerificationPage'
import AuditLogsPage from './pages/AuditLogsPage'
import NotificationsPage from './pages/NotificationsPage'
import AccessControlPage from './pages/AccessControlPage'
import UsersPage from './pages/UsersPage'
import SecurityPage from './pages/SecurityPage'
import ProfilePage from './pages/ProfilePage'

function JudgeRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== 'judge') return <Navigate to="/dashboard" replace />
  return <AppLayout>{children}</AppLayout>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <PortalSelectionPage />} />
      <Route path="/officer-login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage portal="officer" />} />
      <Route path="/judge-login" element={isAuthenticated ? <Navigate to="/judge-portal" replace /> : <LoginPage portal="judge" />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/cases" element={<ProtectedRoute><CasesPage /></ProtectedRoute>} />
      <Route path="/evidence" element={<ProtectedRoute><EvidencePage /></ProtectedRoute>} />
      <Route path="/ai-verification" element={<ProtectedRoute><AIVerificationPage /></ProtectedRoute>} />
      <Route path="/ai-verification/:id" element={<ProtectedRoute><AIVerificationPage /></ProtectedRoute>} />
      <Route path="/trust-score" element={<ProtectedRoute><TrustScorePage /></ProtectedRoute>} />
      <Route path="/trust-score/:id" element={<ProtectedRoute><TrustScorePage /></ProtectedRoute>} />
      <Route path="/chain-of-custody" element={<ProtectedRoute><ChainOfCustodyPage /></ProtectedRoute>} />
      <Route path="/chain-of-custody/:id" element={<ProtectedRoute><ChainOfCustodyPage /></ProtectedRoute>} />
      <Route path="/evidence-passport" element={<ProtectedRoute><EvidencePassportPage /></ProtectedRoute>} />
      <Route path="/evidence-passport/:id" element={<ProtectedRoute><EvidencePassportPage /></ProtectedRoute>} />
      <Route path="/geolocation" element={<ProtectedRoute><GeolocationPage /></ProtectedRoute>} />
      <Route path="/geolocation/:id" element={<ProtectedRoute><GeolocationPage /></ProtectedRoute>} />
      <Route path="/blockchain" element={<ProtectedRoute><BlockchainPage /></ProtectedRoute>} />
      <Route path="/blockchain/:id" element={<ProtectedRoute><BlockchainPage /></ProtectedRoute>} />
      <Route path="/judge-portal" element={<JudgeRoute><CourtVerificationPage /></JudgeRoute>} />
      <Route path="/court-verification" element={<ProtectedRoute><CourtVerificationPage /></ProtectedRoute>} />
      <Route path="/audit-logs" element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/access-control" element={<ProtectedRoute><AccessControlPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/security" element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  )
}
