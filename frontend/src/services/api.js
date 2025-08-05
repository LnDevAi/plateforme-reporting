import axios from 'axios'

// Configuration de base d'Axios
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les réponses et erreurs
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    // Gestion des erreurs réseau
    if (!error.response) {
      throw new Error('Erreur de connexion au serveur')
    }
    
    // Retourner l'erreur avec un format standardisé
    throw {
      message: error.response.data?.message || 'Une erreur est survenue',
      errors: error.response.data?.errors || {},
      status: error.response.status,
    }
  }
)

// Services d'authentification
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getUser: () => api.get('/auth/user'),
}

// Services pour les rapports
export const reportsAPI = {
  getAll: (params = {}) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  create: (data) => api.post('/reports', data),
  update: (id, data) => api.put(`/reports/${id}`, data),
  delete: (id) => api.delete(`/reports/${id}`),
  execute: (id, params = {}) => api.post(`/reports/${id}/execute`, params),
  getExecutions: (id, params = {}) => api.get(`/reports/${id}/executions`, { params }),
  getStatistics: (id) => api.get(`/reports/${id}/statistics`),
  export: (id, format) => api.get(`/reports/${id}/export/${format}`, { responseType: 'blob' }),
}

// Services pour le tableau de bord
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentExecutions: (params = {}) => api.get('/dashboard/recent-executions', { params }),
  getPopularReports: (params = {}) => api.get('/dashboard/popular-reports', { params }),
  getExecutionCharts: (params = {}) => api.get('/dashboard/execution-charts', { params }),
  getPerformanceMetrics: () => api.get('/dashboard/performance-metrics'),
  getUserActivity: (params = {}) => api.get('/dashboard/user-activity', { params }),
  getAlerts: () => api.get('/dashboard/alerts'),
}

// Services pour les utilisateurs
export const usersAPI = {
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleStatus: (id) => api.put(`/users/${id}/toggle-status`),
}

// Services pour les métadonnées
export const metaAPI = {
  getCategories: () => api.get('/meta/categories'),
  getReportTypes: () => api.get('/meta/report-types'),
  getDepartments: () => api.get('/meta/departments'),
}

// Service pour vérifier la santé de l'API
export const healthAPI = {
  check: () => api.get('/health'),
}

// Fonction utilitaire pour télécharger des fichiers
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Fonction utilitaire pour formater les erreurs
export const formatApiError = (error) => {
  if (typeof error === 'string') {
    return error
  }
  
  if (error.errors && Object.keys(error.errors).length > 0) {
    // Retourner la première erreur de validation
    const firstField = Object.keys(error.errors)[0]
    return error.errors[firstField][0]
  }
  
  return error.message || 'Une erreur est survenue'
}

export default api