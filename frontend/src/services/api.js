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

// Services pour les notifications
export const notificationAPI = {
  getAll: (params = {}) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (data) => api.post('/notifications/mark-as-read', data),
  markAllAsRead: () => api.post('/notifications/mark-all-as-read'),
  createTest: (data) => api.post('/notifications/test', data),
}

// Services pour la planification
export const scheduleAPI = {
  getAll: (params = {}) => api.get('/schedules', { params }),
  getById: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
  toggleStatus: (id) => api.put(`/schedules/${id}/toggle-status`),
  executeNow: (id) => api.post(`/schedules/${id}/execute-now`),
  getDue: () => api.get('/schedules/due'),
  getFrequencies: () => api.get('/schedules/frequencies'),
  getTimezones: () => api.get('/schedules/timezones'),
}

// API pour la collaboration documentaire
export const documentCollaborationAPI = {
  // Gestion des versions
  getCurrentVersion: (reportId) => api.get(`/documents/${reportId}/current`),
  getVersionHistory: (reportId) => api.get(`/documents/${reportId}/versions`),
  createVersion: (reportId, data) => api.post(`/documents/${reportId}/versions`, data),
  
  // Édition de contenu
  updateContent: (data) => api.put(`/documents/versions/${data.versionId}/content`, data),
  lockDocument: (data) => api.post(`/documents/versions/${data.versionId}/lock`, data),
  unlockDocument: (versionId) => api.delete(`/documents/versions/${versionId}/lock`),
  
  // Gestion des collaborateurs
  addCollaborator: (data) => api.post(`/documents/versions/${data.versionId}/collaborators`, data),
  updateCollaboratorPermissions: (versionId, userId, data) => 
    api.put(`/documents/versions/${versionId}/collaborators/${userId}`, data),
  removeCollaborator: (versionId, userId) => 
    api.delete(`/documents/versions/${versionId}/collaborators/${userId}`),
  
  // Commentaires
  getComments: (versionId) => api.get(`/documents/versions/${versionId}/comments`),
  addComment: (data) => api.post(`/documents/versions/${data.versionId}/comments`, data),
  resolveComment: (commentId, data) => api.put(`/documents/comments/${commentId}/resolve`, data),
  
  // Workflow d'approbation
  submitForApproval: (versionId) => api.post(`/documents/versions/${versionId}/submit-approval`),
  approveDocument: (data) => api.post(`/documents/versions/${data.versionId}/approve`, data),
  rejectDocument: (data) => api.post(`/documents/versions/${data.versionId}/reject`, data),
  
  // Historique et traçabilité
  getChangeHistory: (versionId) => api.get(`/documents/versions/${versionId}/changes`),
}

// API pour les KPI multi-niveaux
export const kpiAPI = {
  // KPI globaux (super-administrateurs/ministères)
  getGlobalKpis: (params) => api.get('/kpis/global', { params }),
  
  // KPI par entité/structure
  getEntityKpis: (entityId, params) => api.get(`/kpis/entities/${entityId}`, { params }),
  
  // KPI par document
  getDocumentKpis: (documentId, params) => api.get(`/kpis/documents/${documentId}`, { params }),
  
  // KPI par ministère
  getMinistryKpis: (ministryId, params) => api.get(`/kpis/ministries/${ministryId}`, { params }),
  
  // Tableau de bord utilisateur
  getUserDashboardKpis: () => api.get('/kpis/dashboard'),
  
  // Export de rapports KPI
  exportKpiReport: (data) => api.post('/kpis/export', data),
}

// API pour les templates et génération de documents
export const templateAPI = {
  // Générer un document selon un template
  generateDocument: (templateType, data, format = 'pdf') => 
    api.post('/templates/generate', { templateType, data, format }),
  
  // Créer un document avec template pré-rempli
  createFromTemplate: (templateType, reportId, entityId, parameters = {}) =>
    api.post('/templates/create', { templateType, reportId, entityId, parameters }),
  
  // Télécharger un document dans un format spécifique
  downloadDocument: (documentVersionId, format = 'pdf') =>
    api.get(`/templates/download/${documentVersionId}?format=${format}`, { responseType: 'blob' }),
  
  // Obtenir la liste des templates disponibles
  getAvailableTemplates: () => api.get('/templates/available'),
  
  // Prévisualiser un template
  previewTemplate: (templateType, data) =>
    api.post('/templates/preview', { templateType, data }),
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