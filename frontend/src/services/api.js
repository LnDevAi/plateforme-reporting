import axios from 'axios'

// Configuration de base d'Axios
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

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

// ----- DEMO MODE MOCKS -----
const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE === 'true') || !import.meta.env.VITE_API_URL

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const demoUser = {
  id: 1,
  name: 'Admin Démo',
  email: 'demo@plateforme-epe.com',
  role: 'admin',
}

const demoReports = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  name: `Rapport Démo ${i + 1}`,
  category: ['Finance', 'RH', 'Ventes', 'Opérations'][i % 4],
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
  status: 'active',
}))

const demoExecutions = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  report: { id: (i % 5) + 1, name: `Rapport Démo ${(i % 5) + 1}` },
  executor: { id: 1, name: 'Admin Démo' },
  status: ['completed', 'failed', 'running'][i % 3],
  execution_time: Math.floor(Math.random() * 15) + 5,
  created_at: new Date(Date.now() - i * 3600000).toISOString(),
}))

// Services d'authentification
export const authAPI = {
  login: async (credentials) => {
    if (DEMO_MODE) {
      await delay(300)
      return { success: true, data: { user: demoUser, token: 'demo-token' } }
    }
    return api.post('/auth/login', credentials)
  },
  register: async (userData) => {
    if (DEMO_MODE) {
      await delay(300)
      return { success: true, data: { user: demoUser, token: 'demo-token' } }
    }
    return api.post('/auth/register', userData)
  },
  logout: async () => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true }
    }
    return api.post('/auth/logout')
  },
  getUser: async () => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: demoUser }
    }
    return api.get('/auth/user')
  },
}

// Services pour les rapports
export const reportsAPI = {
  getAll: async (params = {}) => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: demoReports }
    }
    return api.get('/reports', { params })
  },
  getById: async (id) => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: demoReports.find(r => r.id === Number(id)) || demoReports[0] }
    }
    return api.get(`/reports/${id}`)
  },
  create: async (data) => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: { ...data, id: demoReports.length + 1 } }
    }
    return api.post('/reports', data)
  },
  update: async (id, data) => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: { ...data, id } }
    }
    return api.put(`/reports/${id}`, data)
  },
  delete: async (id) => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true }
    }
    return api.delete(`/reports/${id}`)
  },
  execute: async (id, params = {}) => {
    if (DEMO_MODE) {
      await delay(300)
      return { success: true, data: { rows: [{ id: 1, value: 'Résultat démo' }], columns: ['id','value'] } }
    }
    return api.post(`/reports/${id}/execute`, params)
  },
  getExecutions: async (id, params = {}) => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: demoExecutions }
    }
    return api.get(`/reports/${id}/executions`, { params })
  },
  getStatistics: async (id) => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: { total_executions: 42, avg_time: 8.3 } }
    }
    return api.get(`/reports/${id}/statistics`)
  },
  export: async (id, format) => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: new Blob([`Demo export ${format}`]) }
    }
    return api.get(`/reports/${id}/export/${format}`, { responseType: 'blob' })
  },
}

// Services pour le tableau de bord
export const dashboardAPI = {
  getStats: async () => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: {
        total_reports: demoReports.length,
        active_reports: demoReports.length - 1,
        executions_today: 12,
        total_executions: 256,
        users_count: 5,
        failed_executions: 1,
      } }
    }
    return api.get('/dashboard/stats')
  },
  getRecentExecutions: async (params = {}) => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: demoExecutions }
    }
    return api.get('/dashboard/recent-executions', { params })
  },
  getPopularReports: async (params = {}) => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: demoReports.slice(0, 5) }
    }
    return api.get('/dashboard/popular-reports', { params })
  },
  getExecutionCharts: async (params = {}) => {
    if (DEMO_MODE) {
      await delay(200)
      const now = Date.now()
      const data = Array.from({ length: 7 }).map((_, i) => ({
        date: new Date(now - (6 - i) * 86400000).toLocaleDateString('fr-FR'),
        executions: Math.floor(Math.random() * 20) + 5,
      }))
      return { success: true, data }
    }
    return api.get('/dashboard/execution-charts', { params })
  },
  getPerformanceMetrics: async () => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: { p95: 1200, p99: 1800 } }
    }
    return api.get('/dashboard/performance-metrics')
  },
  getUserActivity: async (params = {}) => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: [] }
    }
    return api.get('/dashboard/user-activity', { params })
  },
  getAlerts: async () => {
    if (DEMO_MODE) {
      await delay(150)
      return { success: true, data: [
        { title: 'Nouvelle version', message: 'Version 1.0 déployée en démo', type: 'info' },
      ] }
    }
    return api.get('/dashboard/alerts')
  },
}

// Services pour les utilisateurs
export const usersAPI = {
  getAll: async (params = {}) => {
    if (DEMO_MODE) {
      await delay(150)
      return { success: true, data: [demoUser] }
    }
    return api.get('/users', { params })
  },
  getById: async (id) => {
    if (DEMO_MODE) {
      await delay(150)
      return { success: true, data: demoUser }
    }
    return api.get(`/users/${id}`)
  },
  create: async (data) => {
    if (DEMO_MODE) {
      await delay(150)
      return { success: true, data: { ...data, id: 2 } }
    }
    return api.post('/users', data)
  },
  update: async (id, data) => {
    if (DEMO_MODE) {
      await delay(150)
      return { success: true, data: { ...demoUser, ...data } }
    }
    return api.put(`/users/${id}`, data)
  },
  delete: async (id) => {
    if (DEMO_MODE) {
      await delay(150)
      return { success: true }
    }
    return api.delete(`/users/${id}`)
  },
  toggleStatus: async (id) => {
    if (DEMO_MODE) {
      await delay(100)
      return { success: true }
    }
    return api.put(`/users/${id}/toggle-status`)
  },
}

// Services pour les notifications
export const notificationAPI = {
  getAll: async (params = {}) => {
    if (DEMO_MODE) {
      await delay(100)
      return { success: true, data: [
        { id: 1, title: 'Bienvenue', message: 'Mode démo activé', read: false },
      ] }
    }
    return api.get('/notifications', { params })
  },
  getUnreadCount: async () => {
    if (DEMO_MODE) {
      await delay(80)
      return { success: true, data: 1 }
    }
    return api.get('/notifications/unread-count')
  },
  markAsRead: async (data) => {
    if (DEMO_MODE) {
      await delay(80)
      return { success: true }
    }
    return api.post('/notifications/mark-as-read', data)
  },
  markAllAsRead: async () => {
    if (DEMO_MODE) {
      await delay(80)
      return { success: true }
    }
    return api.post('/notifications/mark-all-as-read')
  },
  createTest: async (data) => {
    if (DEMO_MODE) {
      await delay(80)
      return { success: true }
    }
    return api.post('/notifications/test', data)
  },
}

// Services pour la planification
export const scheduleAPI = {
  getAll: async (params = {}) => {
    if (DEMO_MODE) {
      await delay(100)
      return { success: true, data: [] }
    }
    return api.get('/schedules', { params })
  },
  getById: async (id) => {
    if (DEMO_MODE) {
      await delay(100)
      return { success: true, data: null }
    }
    return api.get(`/schedules/${id}`)
  },
  create: async (data) => {
    if (DEMO_MODE) {
      await delay(100)
      return { success: true, data: { ...data, id: 1 } }
    }
    return api.post('/schedules', data)
  },
  update: async (id, data) => {
    if (DEMO_MODE) {
      await delay(100)
      return { success: true, data: { ...data, id } }
    }
    return api.put(`/schedules/${id}`, data)
  },
  delete: async (id) => {
    if (DEMO_MODE) {
      await delay(100)
      return { success: true }
    }
    return api.delete(`/schedules/${id}`)
  },
  toggleStatus: async (id) => {
    if (DEMO_MODE) {
      await delay(100)
      return { success: true }
    }
    return api.put(`/schedules/${id}/toggle-status`)
  },
  executeNow: async (id) => {
    if (DEMO_MODE) {
      await delay(150)
      return { success: true }
    }
    return api.post(`/schedules/${id}/execute-now`)
  },
  getDue: async () => {
    if (DEMO_MODE) {
      await delay(100)
      return { success: true, data: [] }
    }
    return api.get('/schedules/due')
  },
  getFrequencies: async () => {
    if (DEMO_MODE) {
      await delay(80)
      return { success: true, data: ['daily','weekly','monthly'] }
    }
    return api.get('/schedules/frequencies')
  },
  getTimezones: async () => {
    if (DEMO_MODE) {
      await delay(80)
      return { success: true, data: ['UTC','Europe/Paris'] }
    }
    return api.get('/schedules/timezones')
  },
}

// === Projets / Entités ===
export const projectsAPI = {
  getAll: async () => {
    if (DEMO_MODE) {
      await delay(150)
      return { success: true, data: [
        { id: 1, name: 'Programme Santé 2025', owner: { id: 1, name: 'Alice' }, objectives: ['Réduction mortalité','Couverture vaccinale'], team: [{id:2,name:'Bob'},{id:3,name:'Carla'}] },
        { id: 2, name: 'Réforme Éducation', owner: { id: 4, name: 'David' }, objectives: ['Qualité enseignement'], team: [{id:5,name:'Emma'}] },
      ]}
    }
    return api.get('/projects')
  },
  create: async (data) => {
    if (DEMO_MODE) {
      await delay(150)
      return { success: true, data: { id: Math.floor(Math.random()*1000), ...data } }
    }
    return api.post('/projects', data)
  },
}

// === Modèles de rapports ===
export const templatesAPI = {
  getAll: async () => {
    if (DEMO_MODE) {
      await delay(120)
      return { success: true, data: [
        { id: 1, name: 'Rapport d’activités', type: 'Activités', sections: ['Contexte','Réalisation','Difficultés','Perspectives'] },
        { id: 2, name: 'Rapport budgétaire', type: 'Budget', sections: ['Prévisions','Exécution','Écarts','Justifications'] },
        { id: 3, name: 'Passation des marchés', type: 'PM', sections: ['Procédures','Contrats','Délais','Conformité'] },
        { id: 4, name: 'Bilan social / RH', type: 'Social', sections: ['Effectifs','Recrutements','Formation','Climat social'] },
      ]}
    }
    return api.get('/templates')
  },
}

// === Workflow de validation ===
export const workflowAPI = {
  get: async () => {
    if (DEMO_MODE) {
      await delay(100)
      return { success: true, data: { steps: [ { role: 'Éditeur', note: 'Prépare le rapport' }, { role: 'Manager', note: 'Valide niveau 1' }, { role: 'Validateur', note: 'Approbation finale' } ] } }
    }
    return api.get('/workflow')
  },
  update: async (wf) => {
    if (DEMO_MODE) {
      await delay(100)
      return { success: true }
    }
    return api.put('/workflow', wf)
  },
}

// === Pièces justificatives ===
export const attachmentsAPI = {
  list: async () => {
    if (DEMO_MODE) {
      await delay(120)
      return { success: true, data: [
        { id: 1, name: 'facture_001.pdf', type: 'PDF', status: 'validé' },
        { id: 2, name: 'bordereau.xlsx', type: 'Excel', status: 'en attente' },
      ] }
    }
    return api.get('/attachments')
  },
  upload: async (file) => {
    if (DEMO_MODE) {
      await delay(200)
      return { success: true, data: { id: Math.floor(Math.random()*1000), name: file.name, type: 'Fichier', status: 'en attente' } }
    }
    const form = new FormData()
    form.append('file', file)
    return api.post('/attachments', form)
  },
}

// === Documents (Elaboration / Exécution) ===
export const documentsAPI = {
  getElaboration: async () => {
    if (DEMO_MODE) {
      await delay(120)
      return { success: true, data: [
        { key: 'budget_prevision', title: 'Budget prévisionnel', items: [ { id: 1, title: 'Budget 2025', status: 'Brouillon', updated_at: '2025-01-15 10:30' } ] },
        { key: 'programme_activites', title: 'Programme d’Activités', items: [ { id: 2, title: 'PA 2025', status: 'Soumis', updated_at: '2025-02-02 09:15' } ] },
        { key: 'ppm', title: 'Plan de Passation des Marchés (PPM)', items: [ { id: 3, title: 'PPM 2025', status: 'Validé', updated_at: '2025-02-20 14:00' } ] },
        { key: 'autres_elab', title: 'Autres documents', items: [] },
        { key: 'avis_audit', title: 'Avis du Comité d’audit', items: [] },
        { key: 'avis_commissaire', title: 'Avis du Commissaire aux Comptes', items: [] },
        { key: 'rapport_ca_budget', title: 'Rapport du CA sur la session budgétaire', items: [] },
      ]}
    }
    return api.get('/documents/elaboration')
  },
  getExecution: async () => {
    if (DEMO_MODE) {
      await delay(120)
      return { success: true, data: [
        { key: 'budget_execution', title: 'Rapport d’exécution du Budget', items: [ { id: 11, title: 'Exécution Budget 2025 S1', status: 'Soumis', updated_at: '2025-07-10 11:00' } ] },
        { key: 'rapport_activites', title: 'Rapport d’activités', items: [ { id: 12, title: 'Rapport semestriel 2025', status: 'Brouillon', updated_at: '2025-07-18 08:45' } ] },
        { key: 'ppm_execution', title: 'Rapport d’exécution du PPM', items: [] },
        { key: 'etats_financiers', title: 'États financiers', items: [] },
        { key: 'bilan_social', title: 'Bilan social', items: [] },
        { key: 'rapport_gestion', title: 'Rapport de gestion', items: [] },
        { key: 'comites_audit', title: 'Rapports des comités d’audit', items: [] },
        { key: 'commissaire_comptes', title: 'Rapports du Commissaire aux comptes', items: [] },
        { key: 'sejour_pca', title: 'Rapports du séjour du PCA', items: [] },
        { key: 'rapport_ca_comptes', title: 'Rapport du CA sur la session d’arrêt des comptes', items: [] },
        { key: 'autres_exec', title: 'Autres documents', items: [] },
      ]}
    }
    return api.get('/documents/execution')
  },
  // --- DEMO detail editors (localStorage persistence) ---
  getElaborationItem: async (type, id) => {
    if (DEMO_MODE) {
      await delay(100)
      const key = `elab_${type}_${id}`
      const stored = localStorage.getItem(key)
      if (stored) return { success: true, data: JSON.parse(stored) }
      // default skeletons
      if (type === 'budget') {
        const data = {
          id, title: `Budget ${id}`, status: 'Brouillon',
          hypotheses: '',
          lines: [ { chapter: 'Fonctionnement', item: 'Fournitures', amount: 100000 }, { chapter: 'Investissement', item: 'Matériel', amount: 250000 } ],
          summary: { total: 350000, notes: '' },
        }
        localStorage.setItem(key, JSON.stringify(data))
        return { success: true, data }
      }
      if (type === 'programme') {
        const data = {
          id, title: `Programme ${id}`, status: 'Brouillon',
          goals: '',
          activities: [ { activity: 'Formation des équipes', period: 'T1', budget: 50000 }, { activity: 'Campagne terrain', period: 'T2', budget: 120000 } ],
          indicators: [ { name: 'Bénéficiaires', target: 1000 } ],
        }
        localStorage.setItem(key, JSON.stringify(data))
        return { success: true, data }
      }
      return { success: false, message: 'Type inconnu' }
    }
    return api.get(`/documents/elaboration/${type}/${id}`)
  },
  saveElaborationItem: async (type, id, payload) => {
    if (DEMO_MODE) {
      await delay(100)
      const key = `elab_${type}_${id}`
      localStorage.setItem(key, JSON.stringify(payload))
      return { success: true }
    }
    return api.put(`/documents/elaboration/${type}/${id}`, payload)
  },
  submitElaborationItem: async (type, id) => {
    if (DEMO_MODE) {
      await delay(100)
      const key = `elab_${type}_${id}`
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      data.status = 'Soumis'
      localStorage.setItem(key, JSON.stringify(data))
      return { success: true }
    }
    return api.post(`/documents/elaboration/${type}/${id}/submit`)
  },
  validateElaborationItem: async (type, id) => {
    if (DEMO_MODE) {
      await delay(100)
      const key = `elab_${type}_${id}`
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      data.status = 'Validé'
      localStorage.setItem(key, JSON.stringify(data))
      return { success: true }
    }
    return api.post(`/documents/elaboration/${type}/${id}/validate`)
  },
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