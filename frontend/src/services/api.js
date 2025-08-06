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

// API pour les sessions en ligne
export const sessionAPI = {
  // Gestion des sessions
  getSessions: (params) => api.get('/sessions', { params }),
  getSession: (sessionId) => api.get(`/sessions/${sessionId}`),
  createSession: (data) => api.post('/sessions', data),
  updateSession: (sessionId, data) => api.put(`/sessions/${sessionId}`, data),
  deleteSession: (sessionId) => api.delete(`/sessions/${sessionId}`),
  
  // Contrôle des sessions
  startSession: (sessionId) => api.post(`/sessions/${sessionId}/start`),
  completeSession: (sessionId) => api.post(`/sessions/${sessionId}/complete`),
  cancelSession: (sessionId, data) => api.post(`/sessions/${sessionId}/cancel`, data),
  postponeSession: (sessionId, data) => api.post(`/sessions/${sessionId}/postpone`, data),
  
  // Gestion des participants
  getParticipants: (sessionId) => api.get(`/sessions/${sessionId}/participants`),
  addParticipant: (sessionId, data) => api.post(`/sessions/${sessionId}/participants`, data),
  updateParticipant: (sessionId, participantId, data) => 
    api.put(`/sessions/${sessionId}/participants/${participantId}`, data),
  removeParticipant: (sessionId, participantId) => 
    api.delete(`/sessions/${sessionId}/participants/${participantId}`),
  
  // Participation en session
  joinSession: (data) => api.post(`/sessions/${data.sessionId}/join`, data),
  leaveSession: (sessionId) => api.post(`/sessions/${sessionId}/leave`),
  markPresent: (sessionId, participantId) => 
    api.post(`/sessions/${sessionId}/participants/${participantId}/present`),
  markAbsent: (sessionId, participantId, data) => 
    api.post(`/sessions/${sessionId}/participants/${participantId}/absent`, data),
  
  // Système de vote
  getVotes: (sessionId) => api.get(`/sessions/${sessionId}/votes`),
  createVote: (sessionId, data) => api.post(`/sessions/${sessionId}/votes`, data),
  startVote: (voteId) => api.post(`/votes/${voteId}/start`),
  closeVote: (voteId, data) => api.post(`/votes/${voteId}/close`, data),
  castVote: (data) => api.post(`/votes/${data.voteId}/cast`, data),
  getVoteResults: (voteId) => api.get(`/votes/${voteId}/results`),
  verifyVoteIntegrity: (voteId) => api.get(`/votes/${voteId}/verify`),
  
  // Chat et interventions
  getChatMessages: (sessionId) => api.get(`/sessions/${sessionId}/chat`),
  sendChatMessage: (data) => api.post(`/sessions/${data.sessionId}/chat`, data),
  getInterventions: (sessionId) => api.get(`/sessions/${sessionId}/interventions`),
  addIntervention: (sessionId, data) => api.post(`/sessions/${sessionId}/interventions`, data),
  
  // Documents de session
  getSessionDocuments: (sessionId) => api.get(`/sessions/${sessionId}/documents`),
  uploadSessionDocument: (sessionId, formData) => 
    api.post(`/sessions/${sessionId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  downloadSessionDocument: (sessionId, documentId) => 
    api.get(`/sessions/${sessionId}/documents/${documentId}`, { responseType: 'blob' }),
  
  // Ordre du jour
  getAgendaItems: (sessionId) => api.get(`/sessions/${sessionId}/agenda`),
  addAgendaItem: (sessionId, data) => api.post(`/sessions/${sessionId}/agenda`, data),
  updateAgendaItem: (sessionId, itemId, data) => 
    api.put(`/sessions/${sessionId}/agenda/${itemId}`, data),
  deleteAgendaItem: (sessionId, itemId) => 
    api.delete(`/sessions/${sessionId}/agenda/${itemId}`),
  markAgendaItemCompleted: (sessionId, itemId) => 
    api.post(`/sessions/${sessionId}/agenda/${itemId}/complete`),
  
  // Procès-verbaux
  getSessionMinutes: (sessionId) => api.get(`/sessions/${sessionId}/minutes`),
  generateMinutes: (sessionId) => api.post(`/sessions/${sessionId}/minutes/generate`),
  approveMinutes: (sessionId, minutesId) => 
    api.post(`/sessions/${sessionId}/minutes/${minutesId}/approve`),
  exportMinutes: (sessionId, format = 'pdf') => 
    api.get(`/sessions/${sessionId}/minutes/export?format=${format}`, { responseType: 'blob' }),
  
  // Enregistrement et diffusion
  startRecording: (sessionId) => api.post(`/sessions/${sessionId}/recording/start`),
  stopRecording: (sessionId) => api.post(`/sessions/${sessionId}/recording/stop`),
  getRecording: (sessionId) => api.get(`/sessions/${sessionId}/recording`),
  downloadRecording: (sessionId) => 
    api.get(`/sessions/${sessionId}/recording/download`, { responseType: 'blob' }),
  
  // Statistiques et métriques
  getSessionMetrics: (sessionId) => api.get(`/sessions/${sessionId}/metrics`),
  getParticipationStats: (sessionId) => api.get(`/sessions/${sessionId}/stats/participation`),
  getComplianceStatus: (sessionId) => api.get(`/sessions/${sessionId}/compliance`),
  
  // Invitations et notifications
  sendInvitations: (sessionId) => api.post(`/sessions/${sessionId}/invitations/send`),
  sendReminders: (sessionId) => api.post(`/sessions/${sessionId}/reminders/send`),
  respondToInvitation: (sessionId, response, data) => 
    api.post(`/sessions/${sessionId}/invitation/respond`, { response, ...data }),
  
  // Délégation de pouvoirs
  delegateVotingRights: (sessionId, participantId, data) => 
    api.post(`/sessions/${sessionId}/participants/${participantId}/delegate`, data),
  revokeDelegation: (sessionId, participantId) => 
    api.delete(`/sessions/${sessionId}/participants/${participantId}/delegate`),
  
  // Templates et types de sessions
  getSessionTypes: () => api.get('/sessions/types'),
  getSessionTemplates: (type) => api.get(`/sessions/templates?type=${type}`),
  createFromTemplate: (templateId, data) => 
    api.post(`/sessions/templates/${templateId}/create`, data),
}

// API pour les entités/structures
export const entityAPI = {
  // CRUD entités
  getEntities: (params) => api.get('/entities', { params }),
  getEntity: (entityId) => api.get(`/entities/${entityId}`),
  createEntity: (data) => api.post('/entities', data),
  updateEntity: (entityId, data) => api.put(`/entities/${entityId}`, data),
  deleteEntity: (entityId) => api.delete(`/entities/${entityId}`),
  
  // Types et métadonnées
  getStructureTypes: () => api.get('/entities/types'),
  getSectors: () => api.get('/entities/sectors'),
  
  // KPI et statistiques spécifiques entité
  getEntityKpis: (entityId) => api.get(`/entities/${entityId}/kpis`),
  getEntityReports: (entityId, params) => api.get(`/entities/${entityId}/reports`, { params }),
  getEntitySessions: (entityId, params) => api.get(`/entities/${entityId}/sessions`, { params }),
  
  // Validation et conformité
  validateEntity: (entityId) => api.post(`/entities/${entityId}/validate`),
  getComplianceStatus: (entityId) => api.get(`/entities/${entityId}/compliance`),
  getRequiredReports: (entityId) => api.get(`/entities/${entityId}/required-reports`),
  
  // Import/Export
  exportEntities: (format = 'excel') => 
    api.get(`/entities/export?format=${format}`, { responseType: 'blob' }),
  importEntities: (formData) =>
    api.post('/entities/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
}

// API pour les ministères
export const ministryAPI = {
  // CRUD ministères
  getMinistries: (params) => api.get('/ministries', { params }),
  getMinistry: (ministryId) => api.get(`/ministries/${ministryId}`),
  createMinistry: (data) => api.post('/ministries', data),
  updateMinistry: (ministryId, data) => api.put(`/ministries/${ministryId}`, data),
  deleteMinistry: (ministryId) => api.delete(`/ministries/${ministryId}`),
  
  // Relations de tutelle
  getTutelageEntities: (ministryId, type = 'all') => 
    api.get(`/ministries/${ministryId}/entities?tutelage_type=${type}`),
  assignTutelage: (ministryId, entityId, data) =>
    api.post(`/ministries/${ministryId}/entities/${entityId}/tutelage`, data),
  removeTutelage: (ministryId, entityId, type) =>
    api.delete(`/ministries/${ministryId}/entities/${entityId}/tutelage?type=${type}`),
  
  // KPI ministériels
  getMinistryKpis: (ministryId) => api.get(`/ministries/${ministryId}/kpis`),
  getSupervisionDashboard: (ministryId) => api.get(`/ministries/${ministryId}/dashboard`),
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

// Document Template API
export const documentTemplateAPI = {
  // Récupérer les templates
  getTemplates: (params = {}) => api.get('/document-templates', { params }),
  getTemplate: (templateKey) => api.get(`/document-templates/${templateKey}`),
  getCategories: () => api.get('/document-templates/categories'),
  getStatistics: () => api.get('/document-templates/statistics'),
  getTemplatesForEntity: (entityId) => api.get(`/state-entities/${entityId}/templates`),

  // Génération de documents
  generateDocument: (data) => api.post('/document-templates/generate', data),
  generateCustomDocument: (data) => api.post('/document-templates/generate-custom', data),
  previewDocument: (data) => api.post('/document-templates/preview', data),

  // Validation
  validateTemplateData: (data) => api.post('/document-templates/validate', data),

  // Téléchargement
  downloadDocument: (path) => api.get('/documents/download', { params: { path } }),
}

// AI Writing Assistant API
export const aiWritingAssistantAPI = {
  // Génération de contenu
  generateContent: (data) => api.post('/ai-assistant/generate-content', data),
  improveContent: (data) => api.post('/ai-assistant/improve-content', data),
  generateAdaptiveContent: (data) => api.post('/ai-assistant/adaptive-content', data),

  // Suggestions et aide
  getSuggestions: (data) => api.post('/ai-assistant/suggestions', data),
  generateExecutiveSummary: (data) => api.post('/ai-assistant/executive-summary', data),

  // Analyse et conformité
  analyzeCompliance: (data) => api.post('/ai-assistant/analyze-compliance', data),

  // Configuration et test
  getContexts: () => api.get('/ai-assistant/contexts'),
  testConnectivity: () => api.get('/ai-assistant/test-connectivity'),
}

export default api