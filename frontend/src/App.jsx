import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, message } from 'antd'
import { useAuth } from './hooks/useAuth'
import AuthProvider from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/Layout/AppLayout'
import LoginPage from './pages/Auth/LoginPage'
import Dashboard from './pages/Dashboard/Dashboard'
import UsersList from './pages/Users/UsersList'
import ProfilePage from './pages/Profile/ProfilePage'
import SchedulesList from './pages/Schedules/SchedulesList'
import ScheduleCreate from './pages/Schedules/ScheduleCreate'
import ScheduleDetail from './pages/Schedules/ScheduleDetail'
import NotificationsPage from './pages/Notifications/NotificationsPage'
import AIAssistantPage from './pages/AIAssistant/AIAssistantPage'
import ProjectsList from './pages/Projects/ProjectsList'
import ProjectCreate from './pages/Projects/ProjectCreate'
import TemplatesList from './pages/Templates/TemplatesList'
import ValidationWorkflow from './pages/Workflow/ValidationWorkflow'
import AttachmentsManager from './pages/Attachments/AttachmentsManager'
import DocumentsElaboration from './pages/Documents/DocumentsElaboration'
import DocumentsExecution from './pages/Documents/DocumentsExecution'
import BudgetEditor from './pages/Documents/BudgetEditor'
import ActivitiesProgramEditor from './pages/Documents/ActivitiesProgramEditor'
import PPMEditor from './pages/Documents/PPMEditor'
import EntityCreate from './pages/Entities/EntityCreate'
import EntityDetail from './pages/Entities/EntityDetail'
import EntitySessions from './pages/Sessions/EntitySessions'

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
        
        {/* Gestion des planifications */}
        <Route path="schedules" element={<SchedulesList />} />
        <Route path="schedules/create" element={<ScheduleCreate />} />
        <Route path="schedules/:id" element={<ScheduleDetail />} />
        
        {/* Sections */}
        <Route path="projects" element={<ProjectsList />} />
        <Route path="projects/create" element={<ProjectCreate />} />
        <Route path="entities/create" element={<EntityCreate />} />
        <Route path="entities/:id" element={<EntityDetail />} />
        <Route path="entities/:id/sessions" element={<EntitySessions />} />
        <Route path="templates" element={<TemplatesList />} />
        <Route path="workflow" element={<ValidationWorkflow />} />
        <Route path="attachments" element={<AttachmentsManager />} />
        {/* Renamed: Documents -> Rapports */}
        <Route path="reports/elaboration" element={<DocumentsElaboration />} />
        <Route path="reports/execution" element={<DocumentsExecution />} />
        <Route path="reports/elaboration/budget/:id" element={<BudgetEditor />} />
        <Route path="reports/elaboration/programme/:id" element={<ActivitiesProgramEditor />} />
        <Route path="reports/elaboration/ppm/:id" element={<PPMEditor />} />
        
        {/* Gestion des utilisateurs (admin seulement) */}
        <Route path="users" element={<UsersList />} />
        
        {/* Notifications */}
        <Route path="notifications" element={<NotificationsPage />} />
        
        {/* Assistant IA */}
        <Route path="ai-assistant" element={<AIAssistantPage />} />
        
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