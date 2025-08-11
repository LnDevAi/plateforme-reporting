import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'

// État initial
const initialState = {
  user: null,
  loading: true,
  error: null,
}

// Actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
}

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      }
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      }
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      }
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        loading: false,
        error: null,
      }
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      }
    
    default:
      return state
  }
}

// Context
const AuthContext = createContext()

// Provider
export default function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Démo mode: activé si VITE_DEMO_MODE=true ou si aucune URL d'API n'est définie
  const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE === 'true') || !import.meta.env.VITE_API_URL
  const demoUser = {
    id: 1,
    name: 'Admin Démo',
    email: 'demo@plateforme-epe.com',
    role: 'admin',
  }

  // Charger l'utilisateur depuis le localStorage au démarrage
  useEffect(() => {
    const initAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })

        // Bypass complet en mode démo
        if (DEMO_MODE) {
          localStorage.setItem('auth_token', 'demo-token')
          localStorage.setItem('user', JSON.stringify(demoUser))
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: demoUser })
          return
        }
        
        const token = localStorage.getItem('auth_token')
        if (!token) {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
          return
        }

        // Vérifier la validité du token en récupérant les infos utilisateur
        const response = await authAPI.getUser()
        if (response.success) {
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data })
          localStorage.setItem('user', JSON.stringify(response.data))
        } else {
          // Token invalide, nettoyer le localStorage
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        }
      } catch (error) {
        // Erreur lors de la récupération des infos utilisateur
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      }
    }

    initAuth()
  }, [])

  // Actions d'authentification
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      // Bypass login en mode démo: accepter toute combinaison
      if (DEMO_MODE) {
        localStorage.setItem('auth_token', 'demo-token')
        localStorage.setItem('user', JSON.stringify(demoUser))
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: demoUser })
        return { success: true }
      }

      const response = await authAPI.login(credentials)
      
      if (response.success) {
        const { user, token } = response.data
        
        // Stocker le token et les informations utilisateur
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user })
        
        return { success: true }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: response.message })
        return { success: false, message: response.message }
      }
    } catch (error) {
      const errorMessage = error.message || 'Erreur lors de la connexion'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
      return { success: false, message: errorMessage }
    }
  }

  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })

      // En mode démo, simuler une inscription réussie et connecter l'utilisateur
      if (DEMO_MODE) {
        localStorage.setItem('auth_token', 'demo-token')
        localStorage.setItem('user', JSON.stringify(demoUser))
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: demoUser })
        return { success: true }
      }

      const response = await authAPI.register(userData)
      
      if (response.success) {
        const { user, token } = response.data
        
        // Stocker le token et les informations utilisateur
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user })
        
        return { success: true }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: response.message })
        return { success: false, message: response.message }
      }
    } catch (error) {
      const errorMessage = error.message || 'Erreur lors de l\'inscription'
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage })
      return { success: false, message: errorMessage }
    }
  }

  const logout = async () => {
    try {
      // Appeler l'API pour déconnecter côté serveur (ignoré en mode démo)
      if (!DEMO_MODE) {
        await authAPI.logout()
      }
    } catch (error) {
      // Ignorer les erreurs de déconnexion côté serveur
      console.warn('Erreur lors de la déconnexion côté serveur:', error)
    } finally {
      // Nettoyer le localStorage et l'état local
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    }
  }

  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: updatedUser })
  }

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  // Vérifier les permissions
  const hasPermission = (permission) => {
    if (!state.user) return false
    
    // Les admins ont toutes les permissions
    if (state.user.role === 'admin') return true
    
    // Vérifier les permissions spécifiques selon le rôle
    switch (permission) {
      case 'create_reports':
        return ['admin', 'manager', 'analyst'].includes(state.user.role)
      case 'manage_users':
        return state.user.role === 'admin'
      case 'view_all_reports':
        return ['admin', 'manager'].includes(state.user.role)
      default:
        return false
    }
  }

  const isAdmin = () => {
    return state.user?.role === 'admin'
  }

  const isManager = () => {
    return ['admin', 'manager'].includes(state.user?.role)
  }

  // Valeur du contexte
  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasPermission,
    isAdmin,
    isManager,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook pour utiliser le contexte d'authentification
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}