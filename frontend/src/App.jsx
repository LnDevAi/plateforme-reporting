import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, message } from 'antd'
import { useAuth } from './hooks/useAuth'
import AuthProvider from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/Layout/AppLayout'
import LoginPage from './pages/Auth/LoginPage'
import Dashboard from './pages/Dashboard/Dashboard'
import ReportsList from './pages/Reports/ReportsList'
import ReportDetail from './pages/Reports/ReportDetail'
import ReportCreate from './pages/Reports/ReportCreate'
import ReportEdit from './pages/Reports/ReportEdit'
import ReportExecution from './pages/Reports/ReportExecution'
import UsersList from './pages/Users/UsersList'
import ProfilePage from './pages/Profile/ProfilePage'

const { Content } = Layout

// Configuration des messages globaux
message.config({
  top: 100,
  duration: 3,
  maxCount: 3,
})

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div>Chargement...</div>
        </Content>
      </Layout>
    )
  }

  return (
    <Routes>
      {/* Route de connexion */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      
      {/* Routes protégées */}
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Tableau de bord */}
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Gestion des rapports */}
        <Route path="reports" element={<ReportsList />} />
        <Route path="reports/create" element={<ReportCreate />} />
        <Route path="reports/:id" element={<ReportDetail />} />
        <Route path="reports/:id/edit" element={<ReportEdit />} />
        <Route path="reports/:id/execute" element={<ReportExecution />} />
        
        {/* Gestion des utilisateurs (admin seulement) */}
        <Route path="users" element={<UsersList />} />
        
        {/* Profil utilisateur */}
        <Route path="profile" element={<ProfilePage />} />
        
        {/* Route par défaut */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      
      {/* Redirect vers login si non authentifié */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <div className="app-layout">
        <AppRoutes />
      </div>
    </AuthProvider>
  )
}

export default App