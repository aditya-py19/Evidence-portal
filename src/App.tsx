import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AppContext'
import { AppLayout } from './components/layout/AppLayout'
import { AdminLayout } from './components/layout/AdminLayout'
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
import AuditLogsPage from './pages/AuditLogsPage'
import NotificationsPage from './pages/NotificationsPage'
import AccessControlPage from './pages/AccessControlPage'
import UsersPage from './pages/UsersPage'
import SecurityPage from './pages/SecurityPage'
import ProfilePage from './pages/ProfilePage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminOfficersPage from './pages/admin/AdminOfficersPage'
import AdminActivityLogsPage from './pages/admin/AdminActivityLogsPage'
import OfficerRequestsPage from './pages/admin/OfficerRequestsPage'
import AccessRecordsPage from './pages/admin/AccessRecordsPage'
import PublicCaseVerificationPage from './pages/PublicCaseVerificationPage'

import CaseDetailsPage from './pages/CaseDetailsPage'
import JudgeDashboardPage from './pages/judge/JudgeDashboardPage'
import JudicialCaseReviewPage from './pages/judge/JudicialCaseReviewPage'

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/admin-login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <AdminLayout>{children}</AdminLayout>
}

function JudgeRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/judge-login" replace />
  if (user?.role !== 'judge') return <Navigate to="/dashboard" replace />
  return <AppLayout>{children}</AppLayout>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'judge') return <Navigate to="/judge/dashboard" replace />
  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  const { isAuthenticated, isAdmin, user } = useAuth()

  return (
    <Routes>
      <Route path="/verify/:verificationToken" element={<PublicCaseVerificationPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'judge' ? '/judge/dashboard' : '/dashboard'} replace /> : <PortalSelectionPage />} />
      <Route path="/officer-login" element={isAuthenticated ? <Navigate to={user?.role === 'judge' ? '/judge/dashboard' : '/dashboard'} replace /> : <LoginPage portal="officer" />} />
      <Route path="/judge-login" element={isAuthenticated ? <Navigate to="/judge/dashboard" replace /> : <LoginPage portal="judge" />} />
      <Route path="/admin-login" element={isAuthenticated && isAdmin ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/admin/requests" element={<AdminRoute><OfficerRequestsPage /></AdminRoute>} />
      <Route path="/admin/access-records" element={<AdminRoute><AccessRecordsPage /></AdminRoute>} />
      <Route path="/admin/officers" element={<AdminRoute><AdminOfficersPage /></AdminRoute>} />
      <Route path="/admin/activity-logs" element={<AdminRoute><AdminActivityLogsPage /></AdminRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/cases" element={<ProtectedRoute><CasesPage /></ProtectedRoute>} />
      <Route path="/cases/:caseId" element={<ProtectedRoute><CaseDetailsPage /></ProtectedRoute>} />
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
      <Route path="/judge-portal" element={<Navigate to="/judge/dashboard" replace />} />
      <Route path="/judge/dashboard" element={<JudgeRoute><JudgeDashboardPage /></JudgeRoute>} />
      <Route path="/judge/cases/:caseId" element={<JudgeRoute><JudicialCaseReviewPage /></JudgeRoute>} />
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
