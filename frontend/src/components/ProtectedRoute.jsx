import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spin } from 'antd'

function ProtectedRoute({ children, requiredPermission = null }) {
  const { user, loading, hasPermission } = useAuth()
  const location = useLocation()

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="Chargement..." />
      </div>
    )
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Vérifier les permissions spécifiques si requises
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h2>Accès refusé</h2>
        <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      </div>
    )
  }

  return children
}

export default ProtectedRoute