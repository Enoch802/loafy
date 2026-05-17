import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useEffect, useState } from 'react'
import { getSettings } from './lib/supabase'
import { getCachedSettings } from './lib/db'

// Deliverer pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import SearchPage from './pages/SearchPage'
import CustomerPage from './pages/CustomerPage'
import NewTransactionPage from './pages/NewTransactionPage'
import SummaryPage from './pages/SummaryPage'
import AccountPage from './pages/AccountPage'
import AddCustomerPage from './pages/AddCustomerPage'

// Admin pages
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminCustomerDetail from './pages/admin/AdminCustomerDetail'
import AdminFinancials from './pages/admin/AdminFinancials'
import AdminInsights from './pages/admin/AdminInsights'
import AdminNotifications from './pages/admin/AdminNotifications'

function LoadingScreen() {
  return (
    <div className="loading-page">
      <div className="loading-logo">🍞</div>
      <div className="spinner" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { loading } = useAuth()
  const [setupChecked, setSetupChecked] = useState(false)
  const [setupComplete, setSetupComplete] = useState(true)

  useEffect(() => {
    async function checkSetup() {
      try {
        let settings = null
        if (navigator.onLine) {
          settings = await getSettings()
        } else {
          settings = await getCachedSettings()
        }
        setSetupComplete(settings?.setup_complete === true)
      } catch {
        setSetupComplete(false)
      } finally {
        setSetupChecked(true)
      }
    }
    checkSetup()
  }, [])

  if (loading || !setupChecked) return <LoadingScreen />

  if (!setupComplete) {
    return (
      <Routes>
        <Route path="/setup" element={<OnboardingPage onComplete={() => setSetupComplete(true)} />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/customers" element={<AdminCustomers />} />
      <Route path="/admin/customers/:id" element={<AdminCustomerDetail />} />
      <Route path="/admin/financials" element={<AdminFinancials />} />
      <Route path="/admin/insights" element={<AdminInsights />} />
      <Route path="/admin/notifications" element={<AdminNotifications />} />

      {/* Deliverer */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/customer/:id" element={<ProtectedRoute><CustomerPage /></ProtectedRoute>} />
      <Route path="/customer/:id/transaction" element={<ProtectedRoute><NewTransactionPage /></ProtectedRoute>} />
      <Route path="/summary" element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
      <Route path="/add-customer" element={<ProtectedRoute><AddCustomerPage /></ProtectedRoute>} />

      {/* Default */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
