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
  getStats: async (params = {}) => {
    if (DEMO_MODE) {
      await delay(200)
      const { scope = 'ensemble', ministryId, entityId } = params || {}
      // Base démo
      let multiplier = 1
      if (scope === 'ministere' && ministryId) multiplier = 0.6
      if (scope === 'entite' && entityId) multiplier = 0.25
      const round = (n) => Math.max(0, Math.round(n))
      const totalReports = round(demoReports.length * multiplier)
      return { success: true, data: {
        total_reports: totalReports,
        active_reports: Math.max(0, totalReports - 1),
        executions_today: round(12 * multiplier + Math.random()*3),
        total_executions: round(256 * multiplier),
        users_count: round(5 * (scope === 'ensemble' ? 1 : 0.5)),
        failed_executions: round(1 * multiplier),
      } }
    }
    return api.get('/dashboard/stats', { params })
  },
  getRecentExecutions: async (params = {}) => {
    if (DEMO_MODE) {
      await delay(200)
      const { scope = 'ensemble' } = params || {}
      const slice = scope === 'ensemble' ? 10 : scope === 'ministere' ? 6 : 4
      return { success: true, data: demoExecutions.slice(0, slice) }
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
      const { scope = 'ensemble' } = params || {}
      const scale = scope === 'ensemble' ? 1 : scope === 'ministere' ? 0.6 : 0.3
      const now = Date.now()
      const data = Array.from({ length: 7 }).map((_, i) => ({
        date: new Date(now - (6 - i) * 86400000).toLocaleDateString('fr-FR'),
        executions: Math.max(1, Math.floor((Math.random() * 20 + 5) * scale)),
      }))
      return { success: true, data }
    }
    return api.get('/dashboard/execution-charts', { params })
  },
  getKpis: async (params = {}) => {
    if (DEMO_MODE) {
      await delay(200)
      const { scope = 'ensemble', ministryId, entityId } = params || {}
      let scale = 1
      if (scope === 'ministere' && ministryId) scale = 0.65
      if (scope === 'entite' && entityId) scale = 0.35
      const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
      const rnd = (base, delta = 5) => base + Math.round((Math.random() - 0.5) * delta)
      const pct = (v) => clamp(Math.round(v), 0, 100)
      const money = (v) => Math.max(0, Math.round(v))
      const kpis = [
        { category: 'Budget', name: 'Taux d\'engagement', value: pct(rnd(72 * scale, 12)), unit: '%', note: 'Ligne budgétaire engagée / prévue' },
        { category: 'Budget', name: 'Taux d\'exécution', value: pct(rnd(58 * scale, 10)), unit: '%', note: 'Dépenses réalisées / crédits ouverts' },
        { category: 'PPM', name: 'Taux de passation', value: pct(rnd(64 * scale, 15)), unit: '%', note: 'Marchés attribués / prévus' },
        { category: 'PPM', name: 'Délai moyen de passation', value: clamp(rnd(62 * (1/scale + 0.2), 12), 15, 120), unit: 'jours', note: 'Avis à attribution' },
        { category: 'RH', name: 'Effectif', value: money(rnd(820 * scale * (scope==='entite'?1:10), 50)), unit: 'ETP', note: 'Effectif équivalent temps plein' },
        { category: 'Trésorerie', name: 'Jours de trésorerie', value: clamp(rnd(45 * scale, 8), 5, 120), unit: 'jours', note: 'Cash / dépenses quotidiennes' },
        { category: 'Gouvernance', name: 'Conformité CA/AG', value: pct(rnd(80 * scale, 10)), unit: '%', note: 'Tenue CA/AG et PV signés' },
        { category: 'Audit', name: 'Recommandations en cours', value: money(rnd(24 * scale, 6)), unit: 'actions', note: 'Recommandations non clôturées' },
      ]
      return { success: true, data: kpis }
    }
    return api.get('/dashboard/kpis', { params })
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
      const stored = JSON.parse(localStorage.getItem('projects') || '[]')
      const seed = [
        { id: 1, name: 'Programme Santé 2025', owner: { id: 1, name: 'Alice' }, objectives: ['Réduction mortalité','Couverture vaccinale'], team: [{id:2,name:'Bob'},{id:3,name:'Carla'}], ministryId: null },
        { id: 2, name: 'Réforme Éducation', owner: { id: 4, name: 'David' }, objectives: ['Qualité enseignement'], team: [{id:5,name:'Emma'}], ministryId: null },
      ]
      return { success: true, data: [...seed, ...stored] }
    }
    return api.get('/projects')
  },
  create: async (data) => {
    if (DEMO_MODE) {
      await delay(150)
      const id = Date.now()
      const owner = data.ownerName ? { id: id+1, name: data.ownerName } : null
      const objectives = (data.objectives || '').split(',').map(s=>s.trim()).filter(Boolean)
      const team = (data.teamNames || '').split(',').map((n,i)=>n.trim()).filter(Boolean).map((name,idx)=>({ id: id+100+idx, name }))
      const item = { id, name: data.name, owner, objectives, team, ministryId: data.ministryId || null }
      const list = JSON.parse(localStorage.getItem('projects') || '[]')
      list.push(item)
      localStorage.setItem('projects', JSON.stringify(list))
      return { success: true, data: item }
    }
    return api.post('/projects', data)
  },
}

// === Modèles de rapports ===
export const templatesAPI = {
  getAll: async () => {
    if (DEMO_MODE) {
      await delay(120)
      // Modèles génériques (Plateforme) — pas de fichiers exposés, références internes uniquement
      const manifest = [
        { id: 'plat-bud-elab', name: 'Budget prévisionnel (Plateforme)', type: 'Budget', session: 'budgetaire', phase: 'elaboration', url: null, source: 'platform' },
        { id: 'plat-pta-elab', name: "Programme d'Activités (Plateforme)", type: "Programme d'Activités", session: 'budgetaire', phase: 'elaboration', url: null, source: 'platform' },
        { id: 'plat-ppm-elab', name: 'Plan de Passation des Marchés (Plateforme)', type: 'PPM', session: 'budgetaire', phase: 'elaboration', url: null, source: 'platform' },
        { id: 'plat-bud-exec', name: 'Suivi exécution budgétaire (Plateforme)', type: 'Budget', session: 'budgetaire', phase: 'execution', url: null, source: 'platform' },
        { id: 'plat-close-ca', name: "Ordre du jour - Session d'arrêt des comptes (Plateforme)", type: 'Clôture', session: 'cloture', phase: 'elaboration', url: null, source: 'platform' },
        { id: 'plat-close-rg', name: 'Rapport de gestion (Plateforme)', type: 'Rapport', session: 'cloture', phase: 'elaboration', url: null, source: 'platform' },
      ]
      // Ajouter des gabarits génériques existants
      const generics = [
        { id: 'g-act', name: "Rapport d'activités (gabarit)", type: 'Activités', session: 'generique', phase: 'n/a', url: null, sections: ["Contexte","Réalisation","Difficultés","Perspectives"] },
        { id: 'g-bud', name: 'Rapport budgétaire (gabarit)', type: 'Budget', session: 'generique', phase: 'n/a', url: null, sections: ["Prévisions","Exécution","Écarts","Justifications"] },
        { id: 'g-ppm', name: 'PPM (gabarit)', type: 'PPM', session: 'generique', phase: 'n/a', url: null, sections: ["Procédures","Contrats","Délais","Conformité"] },
        { id: 'g-rh', name: 'Bilan social / RH (gabarit)', type: 'Social', session: 'generique', phase: 'n/a', url: null, sections: ["Effectifs","Recrutements","Formation","Climat social"] },
      ]
      return { success: true, data: [...manifest, ...generics] }
    }
    return api.get('/templates')
  },
  getById: async (id) => {
    if (DEMO_MODE) {
      await delay(80)
      const contents = {
        'plat-close-ca': `# 📊 MODÈLES SESSION D'ARRÊT DES COMPTES\n## EPE et Sociétés d'État - Conseil d'Administration\n\n---\n\n# 📋 **1. ORDRE DU JOUR - SESSION D'ARRÊT DES COMPTES**\n\n## CONSEIL D'ADMINISTRATION\n### [NOM DE LA SOCIÉTÉ/EPE]\n**Session d'Arrêt des Comptes - Exercice [ANNÉE]**\n\n...`,
        'plat-close-rg': `# 📋 RAPPORT DE GESTION - MODÈLE\n## Exercice clos le 31 décembre [ANNÉE]\n\n### I. PRÉSENTATION DE LA SOCIÉTÉ\n...`,
        'plat-bud-elab': `# 💰 MODÈLE DE BUDGET PRÉVISIONNEL\n## Exercice [ANNÉE] - [NOM DE LA SOCIÉTÉ/EPE]\n\n### Synthèse budgétaire\n| Rubriques | Réalisé N-1 | Budget N | Variation | % |\n|---|---|---|---|---|\n...`,
        "plat-pta-elab": `# 📅 PROGRAMME D'ACTIVITÉS - SESSION BUDGÉTAIRE\n## Conseil d'Administration\n\n### Planning prévisionnel\n- J-30 : Préparation\n- J-7 : Préparatifs finaux\n- Jour J : Déroulement\n\n### Documents à préparer\n- Note de synthèse\n- Budget détaillé\n- PPM\n...`,
        'plat-ppm-elab': `# 📋 PLAN DE PASSATION DES MARCHÉS\n## Exercice [ANNÉE] - [NOM DE LA SOCIÉTÉ/EPE]\n\n### I. Présentation générale\n- Cadre juridique\n- Organes de passation\n\n### II. Marchés\n| N° | Désignation | Montant estimé | Mode | Calendrier |\n|---|---|---|---|---|\n...`,
        'plat-bud-exec': `# 📊 SUIVI D'EXÉCUTION BUDGÉTAIRE\n## Exercice [ANNÉE]\n\n### Tableaux de suivi\n| Rubrique | Budget | Réalisé | Écart | % |\n|---|---|---|---|---|\n...`
      }
      const catalog = (await templatesAPI.getAll()).data
      const item = catalog.find(t => t.id === id)
      if (!item) return { success: false, message: 'Modèle introuvable' }
      return { success: true, data: { ...item, format: 'markdown', content: contents[id] || '# Modèle (à compléter)\n' } }
    }
    return api.get(`/templates/${id}`)
  },
}

// === Workflow de validation ===
export const workflowAPI = {
  get: async () => {
    if (DEMO_MODE) {
      await delay(100)
      const stored = localStorage.getItem('workflow_definition')
      if (stored) {
        return { success: true, data: JSON.parse(stored) }
      }
      const data = { steps: [ { role: 'Éditeur', note: 'Prépare le rapport' }, { role: 'Manager', note: 'Validation niveau 1' }, { role: 'Validateur', note: 'Approbation finale' } ] }
      localStorage.setItem('workflow_definition', JSON.stringify(data))
      return { success: true, data }
    }
    return api.get('/workflow')
  },
  update: async (wf) => {
    if (DEMO_MODE) {
      await delay(100)
      localStorage.setItem('workflow_definition', JSON.stringify(wf))
      return { success: true }
    }
    return api.put('/workflow', wf)
  },
  getInstance: async (type, id) => {
    if (DEMO_MODE) {
      await delay(80)
      const key = `wf_instance_${type}_${id}`
      const stored = localStorage.getItem(key)
      if (stored) return { success: true, data: JSON.parse(stored) }
      return { success: true, data: { status: 'not_started', currentStepIndex: -1, steps: [] } }
    }
    return api.get(`/workflow/instances/${type}/${id}`)
  },
  submit: async (type, id) => {
    if (DEMO_MODE) {
      await delay(120)
      const def = JSON.parse(localStorage.getItem('workflow_definition') || '{"steps":[]}')
      const instance = {
        status: 'in_progress',
        currentStepIndex: 0,
        steps: def.steps.map((s, idx) => ({ role: s.role, note: s.note, status: idx === 0 ? 'awaiting' : 'pending', comment: '' })),
      }
      localStorage.setItem(`wf_instance_${type}_${id}`, JSON.stringify(instance))
      return { success: true, data: instance }
    }
    return api.post(`/workflow/instances/${type}/${id}/submit`)
  },
  approve: async (type, id, comment = '') => {
    if (DEMO_MODE) {
      await delay(120)
      const key = `wf_instance_${type}_${id}`
      const instance = JSON.parse(localStorage.getItem(key) || '{"steps":[]}')
      if (!instance.steps?.length) return { success: false, message: 'Instance introuvable' }
      const idx = instance.currentStepIndex
      instance.steps[idx].status = 'approved'
      instance.steps[idx].comment = comment
      if (idx + 1 < instance.steps.length) {
        instance.currentStepIndex = idx + 1
        instance.steps[idx + 1].status = 'awaiting'
        instance.status = 'in_progress'
      } else {
        instance.status = 'approved'
      }
      localStorage.setItem(key, JSON.stringify(instance))
      return { success: true, data: instance }
    }
    return api.post(`/workflow/instances/${type}/${id}/approve`, { comment })
  },
  reject: async (type, id, comment = '') => {
    if (DEMO_MODE) {
      await delay(120)
      const key = `wf_instance_${type}_${id}`
      const instance = JSON.parse(localStorage.getItem(key) || '{"steps":[]}')
      if (!instance.steps?.length) return { success: false, message: 'Instance introuvable' }
      const idx = instance.currentStepIndex
      instance.steps[idx].status = 'rejected'
      instance.steps[idx].comment = comment
      instance.status = 'rejected'
      localStorage.setItem(key, JSON.stringify(instance))
      return { success: true, data: instance }
    }
    return api.post(`/workflow/instances/${type}/${id}/reject`, { comment })
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
        { key: 'programme_activites', title: "Programme d'Activités", items: [ { id: 2, title: 'PA 2025', status: 'Soumis', updated_at: '2025-02-02 09:15' } ] },
        { key: 'ppm', title: 'Plan de Passation des Marchés (PPM)', items: [ { id: 3, title: 'PPM 2025', status: 'Validé', updated_at: '2025-02-20 14:00' } ] },
        { key: 'autres_elab', title: 'Autres documents', items: [] },
        { key: 'avis_audit', title: "Avis du Comité d'audit", items: [] },
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
        { key: 'budget_execution', title: "Rapport d'exécution du Budget", items: [ { id: 11, title: 'Exécution Budget 2025 S1', status: 'Soumis', updated_at: '2025-07-10 11:00' } ] },
        { key: 'rapport_activites', title: "Rapport d'activités", items: [ { id: 12, title: 'Rapport semestriel 2025', status: 'Brouillon', updated_at: '2025-07-18 08:45' } ] },
        { key: 'ppm_execution', title: "Rapport d'exécution du PPM", items: [] },
        { key: 'etats_financiers', title: 'États financiers', items: [] },
        { key: 'bilan_social', title: 'Bilan social', items: [] },
        { key: 'rapport_gestion', title: 'Rapport de gestion', items: [] },
        { key: 'comites_audit', title: "Rapports des comités d'audit", items: [] },
        { key: 'commissaire_comptes', title: 'Rapports du Commissaire aux comptes', items: [] },
        { key: 'sejour_pca', title: 'Rapports du séjour du PCA', items: [] },
        { key: 'rapport_ca_comptes', title: "Rapport du CA sur la session d'arrêt des comptes", items: [] },
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
      if (type === 'ppm') {
        const data = {
          id, title: `PPM ${id}`, status: 'Brouillon',
          notes: '',
          lines: [
            { subject: 'Achat véhicules', procedure: 'AO', amount: 150000000, status: 'Planifié', planned_date: '2025-02-01', actual_date: '' },
            { subject: 'Fournitures IT', procedure: 'DRP', amount: 25000000, status: 'Planifié', planned_date: '2025-03-15', actual_date: '' },
          ],
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
      data.locked = true
      localStorage.setItem(key, JSON.stringify(data))
      return { success: true }
    }
    return api.post(`/documents/elaboration/${type}/${id}/validate`)
  },
  // Délibérations associées aux documents (Élaboration)
  addElaborationDeliberation: async (type, id, delib) => {
    if (DEMO_MODE) {
      await delay(80)
      const key = `elab_${type}_${id}`
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      data.deliberations = data.deliberations || []
      const item = {
        id: Date.now(),
        title: delib.title || 'Délibération',
        decision: delib.decision || 'Adoptée', // Adoptée | Rejetée | Ajournée
        text: delib.text || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      data.deliberations.push(item)
      localStorage.setItem(key, JSON.stringify(data))
      return { success: true, data: item }
    }
    return api.post(`/documents/elaboration/${type}/${id}/deliberations`, delib)
  },
  updateElaborationDeliberation: async (type, id, deliberationId, delib) => {
    if (DEMO_MODE) {
      await delay(80)
      const key = `elab_${type}_${id}`
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      data.deliberations = data.deliberations || []
      const d = data.deliberations.find(x => String(x.id) === String(deliberationId))
      if (!d) return { success: false }
      Object.assign(d, delib, { updated_at: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify(data))
      return { success: true, data: d }
    }
    return api.put(`/documents/elaboration/${type}/${id}/deliberations/${deliberationId}`, delib)
  },
  removeElaborationDeliberation: async (type, id, deliberationId) => {
    if (DEMO_MODE) {
      await delay(60)
      const key = `elab_${type}_${id}`
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      data.deliberations = (data.deliberations || []).filter(x => String(x.id) !== String(deliberationId))
      localStorage.setItem(key, JSON.stringify(data))
      return { success: true }
    }
    return api.delete(`/documents/elaboration/${type}/${id}/deliberations/${deliberationId}`)
  },
  // --- AUTRES DOCUMENTS (liste + items) ---
  getOthers: async () => {
    if (DEMO_MODE) {
      await delay(80)
      const list = JSON.parse(localStorage.getItem('others_index') || '[]')
      return { success: true, data: list }
    }
    return api.get('/documents/others')
  },
  createOther: async (payload = {}) => {
    if (DEMO_MODE) {
      await delay(80)
      const list = JSON.parse(localStorage.getItem('others_index') || '[]')
      const id = Date.now()
      const item = { id, title: payload.title || `Autre ${list.length+1}`, status: 'Brouillon', updated_at: new Date().toLocaleString('fr-FR') }
      list.push(item)
      localStorage.setItem('others_index', JSON.stringify(list))
      const key = `other_${id}`
      const data = { id, title: item.title, category: payload.category || '', summary: '', content: '', status: 'Brouillon' }
      localStorage.setItem(key, JSON.stringify(data))
      return { success: true, data: item }
    }
    return api.post('/documents/others', payload)
  },
  getOtherItem: async (id) => {
    if (DEMO_MODE) {
      await delay(60)
      const key = `other_${id}`
      const raw = localStorage.getItem(key)
      const data = raw ? JSON.parse(raw) : { id, title: `Autre ${id}`, category: '', summary: '', content: '', status: 'Brouillon' }
      if (!raw) localStorage.setItem(key, JSON.stringify(data))
      return { success: true, data }
    }
    return api.get(`/documents/others/${id}`)
  },
  saveOtherItem: async (id, payload) => {
    if (DEMO_MODE) {
      await delay(80)
      const key = `other_${id}`
      localStorage.setItem(key, JSON.stringify(payload))
      // update index updated_at and title/status if present
      const list = JSON.parse(localStorage.getItem('others_index') || '[]')
      const idx = list.findIndex(x => String(x.id) === String(id))
      if (idx >= 0) {
        list[idx].title = payload.title || list[idx].title
        list[idx].status = payload.status || list[idx].status
        list[idx].updated_at = new Date().toLocaleString('fr-FR')
        localStorage.setItem('others_index', JSON.stringify(list))
      }
      return { success: true }
    }
    return api.put(`/documents/others/${id}`, payload)
  },
  submitOtherItem: async (id) => {
    if (DEMO_MODE) {
      await delay(60)
      const key = `other_${id}`
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      data.status = 'Soumis'
      localStorage.setItem(key, JSON.stringify(data))
      return { success: true }
    }
    return api.post(`/documents/others/${id}/submit`)
  },
  validateOtherItem: async (id) => {
    if (DEMO_MODE) {
      await delay(60)
      const key = `other_${id}`
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      data.status = 'Validé'
      data.locked = true
      localStorage.setItem(key, JSON.stringify(data))
      return { success: true }
    }
    return api.post(`/documents/others/${id}/validate`)
  },
  addOtherDeliberation: async (id, delib) => {
    if (DEMO_MODE) {
      await delay(60)
      const key = `other_${id}`
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      data.deliberations = data.deliberations || []
      const item = { id: Date.now(), title: delib.title || 'Délibération', decision: delib.decision || 'Adoptée', text: delib.text || '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      data.deliberations.push(item)
      localStorage.setItem(key, JSON.stringify(data))
      return { success: true, data: item }
    }
    return api.post(`/documents/others/${id}/deliberations`, delib)
  },
  removeOtherDeliberation: async (id, deliberationId) => {
    if (DEMO_MODE) {
      await delay(40)
      const key = `other_${id}`
      const data = JSON.parse(localStorage.getItem(key) || '{}')
      data.deliberations = (data.deliberations || []).filter(x => String(x.id) !== String(deliberationId))
      localStorage.setItem(key, JSON.stringify(data))
      return { success: true }
    }
    return api.delete(`/documents/others/${id}/deliberations/${deliberationId}`)
  },
  updateOtherDeliberation: async (id, deliberationId, data) => {
    if (DEMO_MODE) {
      await delay(50)
      const key = `other_${id}`
      const doc = JSON.parse(localStorage.getItem(key) || '{}')
      const d = (doc.deliberations||[]).find(x=> String(x.id) === String(deliberationId))
      if (!d) return { success: false }
      Object.assign(d, data, { updated_at: new Date().toISOString() })
      localStorage.setItem(key, JSON.stringify(doc))
      return { success: true, data: d }
    }
    return api.put(`/documents/others/${id}/deliberations/${deliberationId}`, data)
  },
}

// API pour la collaboration documentaire
export const documentCollaborationAPI = {
  // Gestion des versions
  getCurrentVersion: (reportId) => api.get(`/documents/${reportId}/current`),
  getVersionHistory: (reportId) => api.get(`/documents/versions`),
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
  generateMinutes: async (sessionId) => {
    await delay(80)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    const delibsBlock = (s.deliberations||[]).length
      ? `\n\nDélibérations:\n${(s.deliberations||[]).map(d=>`- ${d.title} [${d.decision}] ${d.text?(' — '+d.text.slice(0,120)+'...'):''}`).join('\n')}`
      : ''
    const signatureBlock = s.minutes?.signature
      ? `\n\nSignature: ${s.minutes.signature.name} — ${new Date(s.minutes.signature.at).toLocaleString('fr-FR')} — ID: ${s.minutes.signature.id}`
      : ''
    const content = `Procès-verbal\nSession: ${s.title}\nType: ${s.type}\nDate: ${new Date().toLocaleString('fr-FR')}\n\nParticipants présents: ${(s.participants||[]).filter(p=>p.present).map(p=>p.name).join(', ') || 'N/A'}\n\nOrdre du jour:\n${(s.agenda||[]).map((a,i)=>`${i+1}. ${a.title} [${a.done?'Clôturé':'Ouvert'}]`).join('\n')}\n\nVotes:\n${(s.votes||[]).map(v=>`- ${v.question} => ${v.options.map(o=>o.text+': '+(o.count||0)).join(', ')}`).join('\n')}${delibsBlock}${signatureBlock}`
    s.minutes = { content, generated_at: new Date().toISOString(), locked: s.status === 'ended' }
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true, data: s.minutes }
  },
  saveMinutes: async (sessionId, content) => {
    await delay(40)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    if (!s.minutes) s.minutes = { content: '', generated_at: new Date().toISOString(), locked: false }
    if (s.minutes.locked) return { success: false, message: 'PV verrouillé' }
    s.minutes.content = content
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true }
  },
  signMinutes: async (sessionId, signerName = 'Utilisateur') => {
    await delay(30)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    s.minutes = s.minutes || { content: '', generated_at: new Date().toISOString(), locked: false }
    s.minutes.signature = { name: signerName, at: new Date().toISOString(), id: `SIG-${sessionId}-${Date.now()}` }
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true, data: s.minutes.signature }
  },
  // Invitations
  sendInvitations: async (sessionId, emails = []) => {
    await delay(60)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    const now = new Date().toISOString()
    emails.forEach(email => s.invitations.push({ id: Date.now()+Math.random(), email, sent_at: now, accepted: false }))
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true, data: s.invitations }
  },
  acceptInvitation: async (sessionId, email) => {
    await delay(20)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    const inv = s.invitations.find(i => i.email === email)
    if (inv) inv.accepted = true
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true }
  },
  sendReminders: async (sessionId) => {
    await delay(30)
    return { success: true }
  },
  // Recording flags (métadonnées)
  startRecordingMeta: async (sessionId) => {
    await delay(10)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    s.recordings.push({ id: Date.now(), started_at: new Date().toISOString(), stopped_at: null })
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true }
  },
  stopRecordingMeta: async (sessionId) => {
    await delay(10)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    const rec = [...s.recordings].reverse().find(r => !r.stopped_at)
    if (rec) rec.stopped_at = new Date().toISOString()
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true }
  },
  // Délibérations
  addDeliberation: async (sessionId, data) => {
    await delay(60)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    if (!s.deliberations) s.deliberations = []
    const item = {
      id: Date.now(),
      title: data.title || 'Délibération',
      agendaItemId: data.agendaItemId || null,
      documentName: data.documentName || '',
      decision: data.decision || 'Adoptée', // Adoptée | Rejetée | Ajournée
      text: data.text || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    s.deliberations.push(item)
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true, data: item }
  },
  updateDeliberation: async (sessionId, deliberationId, data) => {
    await delay(50)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    const d = (s.deliberations || []).find(x => String(x.id) === String(deliberationId))
    if (!d) return { success: false }
    Object.assign(d, data, { updated_at: new Date().toISOString() })
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true, data: d }
  },
  removeDeliberation: async (sessionId, deliberationId) => {
    await delay(40)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    s.deliberations = (s.deliberations || []).filter(x => String(x.id) !== String(deliberationId))
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true }
  },
}

// === Entités & Sessions (DEMO adapters) ===
// Simple demo-layer used by UI pages expecting these names
export const entitiesAPI = {
  getAll: async () => {
    await delay(80)
    const raw = localStorage.getItem('entities')
    const list = raw ? JSON.parse(raw) : []
    return { success: true, data: list }
  },
  getCatalog: async () => {
    await delay(20)
    const list = JSON.parse(localStorage.getItem('entities') || '[]')
    const storedCatalog = JSON.parse(localStorage.getItem('entities_catalog') || '{"epe":[],"se":[]}')
    const epeFromEntities = list.filter(e => (e.type || 'EPE') === 'EPE').map(e => e.name).filter(Boolean)
    const seFromEntities = list.filter(e => (e.type || '') !== 'EPE').map(e => e.name).filter(Boolean)
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)))
    const catalog = { epe: uniq([...(storedCatalog.epe||[]), ...epeFromEntities]), se: uniq([...(storedCatalog.se||[]), ...seFromEntities]) }
    return { success: true, data: catalog }
  },
  importCatalog: async (catalog) => {
    await delay(20)
    const current = JSON.parse(localStorage.getItem('entities_catalog') || '{"epe":[],"se":[]}')
    const merge = (a=[], b=[]) => Array.from(new Set([...(a||[]), ...(b||[])]))
    const next = { epe: merge(current.epe, catalog?.epe), se: merge(current.se, catalog?.se) }
    localStorage.setItem('entities_catalog', JSON.stringify(next))
    return { success: true, data: next }
  },
  exportCatalog: async () => {
    await delay(10)
    const stored = JSON.parse(localStorage.getItem('entities_catalog') || '{"epe":[],"se":[]}')
    return { success: true, data: stored }
  },
  bulkImport: async (items=[]) => {
    if (!Array.isArray(items)) return { success:false }
    await delay(80)
    const list = JSON.parse(localStorage.getItem('entities') || '[]')
    const next = [...list]
    items.forEach((e, idx)=>{
      const id = e.id || Date.now()+idx
      const entity = {
        id,
        name: e.name || e.Nom || e.Entity || `Entité ${id}`,
        type: e.type || e.Type || 'EPE',
        ministryId: e.ministryId || null,
        tutelle: e.tutelle || { technique: e.tutelleTechnique || '', financier: e.tutelleFinancier || '' },
        contact: e.contact || { adresse: e.adresse || '', telephone: e.telephone || '', email: e.email || '' },
        identification: e.identification || { ifu: e.ifu || '', cnss: e.cnss || '', rccm: e.rccm || '' },
        autresInformations: e.autresInformations || '',
        documentsCreation: e.documentsCreation || [],
        created_at: new Date().toISOString(),
        structure: e.structure || { directionGenerale: { roles: { DG: null, DFC: null, PRM: null, DRH: null, CG: null, AI: null }, autresDirections: [] }, conseilAdministration: { ministeres: Array.from({ length: 10 }).map((_, i) => ({ slot: `Ministère ${i+1}`, ministryId: null, membre: null })), observateurs: [null, null], repPersonnel: null, commissaireComptes: null }, assembleeGenerale: { notes: '' } },
      }
      next.push(entity)
    })
    localStorage.setItem('entities', JSON.stringify(next))
    return { success: true, data: next }
  },
  create: async (payload) => {
    await delay(80)
    const raw = localStorage.getItem('entities')
    const list = raw ? JSON.parse(raw) : []
    const id = Date.now()
    const entity = {
      id,
      name: payload?.name || 'Sans nom',
      type: payload?.type || 'EPE',
      ministryId: payload?.ministryId || null,
      tutelle: payload?.tutelle || { technique: '', financier: '' },
      contact: payload?.contact || { adresse: '', telephone: '', email: '' },
      identification: payload?.identification || { ifu: '', cnss: '', rccm: '' },
      autresInformations: payload?.autresInformations || '',
      documentsCreation: payload?.documentsCreation || [],
      created_at: new Date().toISOString(),
    }
    list.push(entity)
    localStorage.setItem('entities', JSON.stringify(list))
    return { success: true, data: entity }
  },
  getById: async (id) => {
    await delay(60)
    const list = JSON.parse(localStorage.getItem('entities') || '[]')
    const entity = list.find(e => String(e.id) === String(id)) || null
    return { success: true, data: entity }
  },
  saveById: async (id, data) => {
    await delay(80)
    const list = JSON.parse(localStorage.getItem('entities') || '[]')
    const idx = list.findIndex(e => String(e.id) === String(id))
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...data }
      localStorage.setItem('entities', JSON.stringify(list))
      return { success: true, data: list[idx] }
    }
    return { success: false, message: 'Entité introuvable' }
  },
}

export const sessionsAPI = {
  list: async (entityId) => {
    await delay(60)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    return { success: true, data: all.filter(s => String(s.entityId) === String(entityId)) }
  },
  create: async (entityId, payload) => {
    await delay(80)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const room = `pr-${entityId}-${Date.now()}`
    const session = {
      id: Date.now(), entityId, type: payload.type, title: payload.title,
      status: 'planned', created_at: new Date().toISOString(), room,
      messages: [],
      participants: [],
      agenda: [],
      votes: [],
      minutes: null,
      invitations: [],
      recordings: [],
      deliberations: [],
    }
    all.push(session)
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true, data: session }
  },
  start: async (sessionId) => {
    await delay(50)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (s) { s.status = 'live'; localStorage.setItem('sessions', JSON.stringify(all)); return { success: true, data: s } }
    return { success: false }
  },
  end: async (sessionId) => {
    await delay(50)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (s) { s.status = 'ended'; if (s.minutes) s.minutes.locked = true; localStorage.setItem('sessions', JSON.stringify(all)); return { success: true, data: s } }
    return { success: false }
  },
  postMessage: async (sessionId, author, text) => {
    await delay(20)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (s) {
      s.messages.push({ id: Date.now(), author, text, at: new Date().toISOString() })
      localStorage.setItem('sessions', JSON.stringify(all))
      return { success: true, data: s }
    }
    return { success: false }
  },
  // Participants
  addParticipant: async (sessionId, participant) => {
    await delay(40)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    const p = { id: Date.now(), present: false, ...participant }
    s.participants.push(p)
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true, data: p }
  },
  removeParticipant: async (sessionId, participantId) => {
    await delay(40)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    s.participants = s.participants.filter(p => String(p.id) !== String(participantId))
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true }
  },
  markPresent: async (sessionId, participantId, present) => {
    await delay(30)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    const p = s.participants.find(p => String(p.id) === String(participantId))
    if (p) p.present = !!present
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true }
  },
  // Agenda
  addAgendaItem: async (sessionId, title) => {
    await delay(40)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    const item = { id: Date.now(), title, done: false, documents: [] }
    s.agenda.push(item)
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true, data: item }
  },
  toggleAgendaItem: async (sessionId, itemId, done) => {
    await delay(30)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    const it = s.agenda.find(a => String(a.id) === String(itemId))
    if (it) it.done = !!done
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true }
  },
  attachDocument: async (sessionId, itemId, doc) => {
    await delay(30)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    const it = s.agenda.find(a => String(a.id) === String(itemId))
    if (!it) return { success: false }
    it.documents.push({ id: Date.now(), name: doc.name, url: doc.url || '#' })
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true }
  },
  // Votes
  createVote: async (sessionId, question, options) => {
    await delay(50)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    const vote = { id: Date.now(), question, options: options.map((t, idx)=>({ id: idx+1, text: t, count: 0 })), open: true }
    s.votes.push(vote)
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true, data: vote }
  },
  castVote: async (sessionId, voteId, optionId) => {
    await delay(30)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    const v = s.votes.find(v => String(v.id) === String(voteId))
    if (!v || !v.open) return { success: false }
    const opt = v.options.find(o => String(o.id) === String(optionId))
    if (opt) opt.count = (opt.count || 0) + 1
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true, data: v }
  },
  closeVote: async (sessionId, voteId) => {
    await delay(20)
    const all = JSON.parse(localStorage.getItem('sessions') || '[]')
    const s = all.find(x => String(x.id) === String(sessionId))
    if (!s) return { success: false }
    const v = s.votes.find(v => String(v.id) === String(voteId))
    if (v) v.open = false
    localStorage.setItem('sessions', JSON.stringify(all))
    return { success: true }
  },
  // PV
  generateMinutes: async (sessionId) => sessionAPI.generateMinutes(sessionId),
  saveMinutes: async (sessionId, content) => sessionAPI.saveMinutes(sessionId, content),
  signMinutes: async (sessionId, signerName) => sessionAPI.signMinutes(sessionId, signerName),
  // Invitations
  sendInvitations: async (sessionId, emails=[]) => sessionAPI.sendInvitations(sessionId, emails),
  acceptInvitation: async (sessionId, email) => sessionAPI.acceptInvitation(sessionId, email),
  sendReminders: async (sessionId) => sessionAPI.sendReminders(sessionId),
  // Enregistrement (métadonnées)
  startRecordingMeta: async (sessionId) => sessionAPI.startRecordingMeta(sessionId),
  stopRecordingMeta: async (sessionId) => sessionAPI.stopRecordingMeta(sessionId),
  // Délibérations
  addDeliberation: async (sessionId, data) => sessionAPI.addDeliberation(sessionId, data),
  updateDeliberation: async (sessionId, deliberationId, data) => sessionAPI.updateDeliberation(sessionId, deliberationId, data),
  removeDeliberation: async (sessionId, deliberationId) => sessionAPI.removeDeliberation(sessionId, deliberationId),
}

// API pour les ministères (réintroduit)
export const ministryAPI = {
  getCatalog: async () => {
    // Catalogue démo (peut être remplacé par import JSON)
    await delay(20)
    return {
      success: true,
      data: [
        { name: "Ministre d'État, Ministre de la Défense et des Anciens Combattants", ministerFullName: 'Célestin Simporé' },
        { name: "Ministre d'État, Ministre de l'Administration Territoriale et de la Mobilité", ministerFullName: 'Émile Zerbo' },
        { name: "Ministre d'État, Ministre de l'Agriculture, des Ressources Animales et Halieutiques", ministerFullName: 'Ismaël Sombié' },
        { name: "Ministre de l'Économie et des Finances", ministerFullName: 'Aboubacar Nacanabo' },
        { name: 'Ministre de la Justice et des Droits Humains, chargé des Relations avec les Institutions, Garde des Sceaux', ministerFullName: 'Edasso Rodrigue Bayala' },
        { name: 'Ministre de la Fonction Publique, du Travail et de la Protection Sociale', ministerFullName: 'Mathias Traoré' },
        { name: 'Ministre de la Sécurité', ministerFullName: 'Mahamadou Sana' },
        { name: 'Ministre de l\'Action Humanitaire et de la Solidarité Nationale', ministerFullName: 'Passowendé Pélagie Kabré' },
        { name: "Ministre des Infrastructures et du Désenclavement", ministerFullName: 'Adama Luc Sorgho' },
        { name: "Ministre des Affaires Étrangères, de la Coopération Régionale et des Burkinabè de l'Extérieur", ministerFullName: 'Karamoko Jean-Marie Traoré' },
        { name: "Ministre de l'Enseignement de Base, de l'Alphabétisation et de la Promotion des Langues Nationales", ministerFullName: 'Jacques Sosthène Dingara' },
        { name: "Ministre de l'Enseignement Secondaire et de la Formation Professionnelle et Technique", ministerFullName: 'Boubakar Savadogo' },
        { name: "Ministre de l'Enseignement Supérieur, de la Recherche et de l'Innovation", ministerFullName: 'Adjima Thiombiano' },
        { name: "Ministre de l'Énergie, des Mines et des Carrières", ministerFullName: 'Yacouba Zabré Gouba' },
        { name: 'Ministre de la Santé', ministerFullName: 'Robert Lucien Jean-Claude Kargougou' },
        { name: 'Ministre des Sports, de la Jeunesse et de l\'Emploi', ministerFullName: 'Anuuyirtole Roland Somda' },
        { name: 'Ministre de la Transition Digitale, des Postes et des Communications Électroniques', ministerFullName: 'Aminata Zerbo Sabané' },
        { name: "Ministre de l'Industrie, du Commerce et de l'Artisanat", ministerFullName: 'Serge Gnaniodem Poda' },
        { name: "Ministre de l'Urbanisme et de l'Habitat", ministerFullName: 'Mikaïlou Sidibé' },
        { name: "Ministre de l'Environnement, de l'Eau et de l'Assainissement", ministerFullName: 'Roger Baro' },
        { name: 'Ministre de la Communication, de la Culture, des Arts et du Tourisme, Porte-Parole du Gouvernement', ministerFullName: 'Pingdwendé Gilbert Ouédraogo' },
        { name: 'Ministre Délégué chargé des Ressources Animales', ministerFullName: 'Amadou Dicko' },
        { name: 'Ministre Délégué chargé du Budget', ministerFullName: 'Fatoumata Bako' },
        { name: 'Ministre Délégué chargé de la Coopération Régionale', ministerFullName: 'Bebgnasgnan Stella Eldine Kabré' },
      ]
    }
  },
  getMinistries: async (params) => {
    if (DEMO_MODE) {
      await delay(60)
      const list = JSON.parse(localStorage.getItem('ministries') || '[]')
      return { success: true, data: list }
    }
    return api.get('/ministries', { params })
  },
  getMinistry: async (ministryId) => {
    if (DEMO_MODE) {
      await delay(40)
      const list = JSON.parse(localStorage.getItem('ministries') || '[]')
      return { success: true, data: list.find(m => String(m.id) === String(ministryId)) || null }
    }
    return api.get(`/ministries/${ministryId}`)
  },
  createMinistry: async (data) => {
    if (DEMO_MODE) {
      await delay(80)
      const list = JSON.parse(localStorage.getItem('ministries') || '[]')
      const item = { id: Date.now(), name: data.name, code: data.code || '', address: data.address || '', minister: data.minister || { firstName: '', lastName: '' }, contact: data.contact || { email: '', phone: '' }, decrees: data.decrees || '', documents: data.documents || [], created_at: new Date().toISOString() }
      list.push(item)
      localStorage.setItem('ministries', JSON.stringify(list))
      return { success: true, data: item }
    }
    return api.post('/ministries', data)
  },
  updateMinistry: async (ministryId, data) => {
    if (DEMO_MODE) {
      await delay(80)
      const list = JSON.parse(localStorage.getItem('ministries') || '[]')
      const idx = list.findIndex(m => String(m.id) === String(ministryId))
      if (idx < 0) return { success: false, message: 'Ministère introuvable' }
      list[idx] = { ...list[idx], ...data }
      localStorage.setItem('ministries', JSON.stringify(list))
      return { success: true, data: list[idx] }
    }
    return api.put(`/ministries/${ministryId}`, data)
  },
  deleteMinistry: async (ministryId) => {
    if (DEMO_MODE) {
      await delay(60)
      const list = JSON.parse(localStorage.getItem('ministries') || '[]')
      const next = list.filter(m => String(m.id) !== String(ministryId))
      localStorage.setItem('ministries', JSON.stringify(next))
      return { success: true }
    }
    return api.delete(`/ministries/${ministryId}`)
  },
  getTutelageEntities: (ministryId, type = 'all') => api.get(`/ministries/${ministryId}/entities?tutelage_type=${type}`),
  // Import en masse (démo)
  bulkImport: async (items = []) => {
    if (!Array.isArray(items)) return { success: false }
    await delay(80)
    const normalized = items.map((m, idx) => ({
      id: m.id || Date.now() + idx,
      name: m.name || m.Intitulé || m.title || 'Ministère',
      code: m.code || m.SIGLE || '',
      address: m.address || m.Adresse || '',
      minister: m.minister || { firstName: m.ministerFirstName || '', lastName: m.ministerLastName || '' },
      contact: m.contact || { email: m.email || '', phone: m.phone || '' },
      documents: m.documents || [],
      decrees: m.decrees || '',
      created_at: new Date().toISOString(),
    }))
    localStorage.setItem('ministries', JSON.stringify(normalized))
    return { success: true, data: normalized }
  },
}

// === E-LEARNING (démo, laboratoire de métiers) ===
const LEARNING_KEY = 'learning_tracks'
const LEARNING_PROGRESS_KEY = 'learning_progress'

function bootDemoLearning() {
  const exists = localStorage.getItem(LEARNING_KEY)
  if (exists) return
  const tracks = [
    {
      id: 'gov-dg',
      title: "Certification Management des ECP (Directeurs Généraux)",
      domain: 'Gouvernance ECP',
      audience: 'DG actuels et futurs',
      description: "Programme pratique: gouvernance, stratégie, finances, audit, PPM, sessions CA/AG.",
      competencies: ['Gouvernance', 'Stratégie', 'Pilotage financier', 'Audit & Contrôle', 'Procédures PPM'],
      modules: [
        {
          id: 'gov-1',
          title: 'Cadre de gouvernance et responsabilités',
          lessons: [
            {
              id: 'gov-1-1',
              title: 'Théorie & cas: responsabilités du DG',
              theory: 'Rôles et responsabilités du DG, charte de gouvernance, interactions CA/AG, conformité réglementaire.',
              scenarios: [
                { title: 'Crise de trésorerie', description: 'DG face à un déficit inattendu, prioriser et communiquer.' }
              ],
              tasks: [
                { id: 't1', title: 'Cartographier les responsabilités clés' },
                { id: 't2', title: "Plan d'action court terme" }
              ],
              resources: [
                { title: 'Documents gouvernance des ECP (Burkina)', url: 'https://github.com/LnDevAi/plateforme-reporting/blob/main/docs/knowledge-base/formations/modules-gouvernance/Documents%20relatifs%20%C3%A0%20la%20gouvernance%20des%20entit%C3%A9s%20%C3%A0%20capitaux%20publics%20-%20Burkina%20Faso.pdf' },
                { title: 'Code BPGSE (bonnes pratiques)', url: 'https://github.com/LnDevAi/plateforme-reporting/blob/main/docs/knowledge-base/epe-burkina/modeles-documents/Code%20BPGSE%20adopt%C3%A9%20AGSE%2030%20juin%202015.pdf' }
              ],
              quiz: {
                passScore: 70,
                questions: [
                  { id: 'q1', prompt: 'Quel est le rôle du DG vis-à-vis du CA ?', options: [ {id:'a', text:'Exécuter les orientations du CA', correct:true}, {id:'b', text:'Se substituer au CA', correct:false} ] },
                  { id: 'q2', prompt: 'La charte de gouvernance sert à…', options: [ {id:'a', text:'Définir les règles de fonctionnement', correct:true}, {id:'b', text:'Fixer les salaires', correct:false} ] },
                  { id: 'q3', prompt: 'Qui valide les grandes orientations stratégiques ?', options: [ {id:'a', text:"Le Conseil d'Administration", correct:true}, {id:'b', text:'Le Chef comptable', correct:false} ] }
                ]
              }
            }
          ]
        },
        {
          id: 'gov-2',
          title: 'Pilotage financier et performance',
          lessons: [
            {
              id: 'gov-2-1',
              title: 'Budget & KPI',
              theory: 'Prévisions/Exécution, tableaux de bord, KPI stratégiques.',
              scenarios: [ { title: 'Écart budgétaire majeur', description: 'Analyser les causes et proposer des mesures.' } ],
              tasks: [ { id: 't1', title: 'Construire un KPI SMART' }, { id: 't2', title: 'Note de synthèse sur les écarts' } ],
              resources: [
                { title: 'AUSGIE (OHADA) — comptabilité', url: 'https://github.com/LnDevAi/plateforme-reporting/blob/main/docs/knowledge-base/epe-burkina/modeles-documents/AUSGIE-REVISE-OHADA-fr(1).pdf' },
                { title: "Modèles docs EPE (Burkina)", url: "https://github.com/LnDevAi/plateforme-reporting/blob/main/docs/knowledge-base/epe-burkina/modeles-documents/Mod%C3%A8les%20de%20documents%20des%20EPE_Soci%C3%A9t%C3%A9s%20d'%C3%89tat%20-%20Burkina%20Faso.pdf" }
              ],
              quiz: {
                passScore: 70,
                questions: [
                  { id: 'q1', prompt: 'Un KPI SMART est…', options: [ {id:'a', text:'Spécifique, Mesurable, Atteignable, Réaliste, Temporel', correct:true}, {id:'b', text:'Simple et aléatoire', correct:false} ] }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      id: 'gov-admin',
      title: "Certification Administrateur d'ECP",
      domain: 'Gouvernance ECP',
      audience: 'Administrateurs CA',
      description: "Pratiques du Conseil d'Administration: supervision, audits, sessions, décisions.",
      competencies: ['Supervision', 'Audit', 'Décision'],
      modules: [
        {
          id: 'ca-1',
          title: 'Rôle du CA',
          lessons: [
            {
              id: 'ca-1-1',
              title: 'Fondamentaux du CA',
              theory: 'Missions, comités, doctrine de décision.',
              scenarios: [ { title: "Conflit d'intérêt", description: 'Identifier et mitiger.' } ],
              tasks: [ { id:'t1', title:'Procédure de gestion des conflits' } ],
              resources: [
                { title: "Formation Administrateurs — Missions & attributions (slides)", url: "https://github.com/LnDevAi/plateforme-reporting/blob/main/docs/knowledge-base/formations/modules-gouvernance/administrateurs/FORMATION%20MISSIONS%20ET%20ATTRIBUTIONS%20DE%20L'ADMINISTRATEUR.pptx" },
                { title: "Décret organisation AG-SE", url: "https://github.com/LnDevAi/plateforme-reporting/blob/main/docs/knowledge-base/epe-burkina/modeles-documents/d%C3%A9cret%20portant%20organisation%20de%20l'AG-SE.pdf" }
              ],
              quiz: {
                passScore: 60,
                questions: [
                  { id:'q1', prompt:'Le CA...', options:[ {id:'a', text:'Supervise la direction', correct:true}, {id:'b', text:'Gère au quotidien', correct:false} ] },
                  { id:'q2', prompt:"Qui préside l'AG-SE ?", options:[ {id:'a', text:'Le PCA', correct:true}, {id:'b', text:'Le Chef de service achats', correct:false} ] }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      id: 'acc-assistant',
      title: 'Certification Assistant Comptable',
      domain: 'Comptabilité privée',
      audience: 'Agents comptables ECP',
      description: 'Pratique SYSCOHADA: journalisation, rapprochements, TVA.',
      competencies: ['Journalisation', 'Rapprochement', 'Fiscalité indirecte'],
      modules: [
        {
          id: 'acc-1',
          title: 'Journalisation',
          lessons: [
            {
              id: 'acc-1-1',
              title: 'Écritures de base',
              theory: 'Achats, ventes, immobilisations.',
              scenarios: [ { title:'Facture achat', description:'Enregistrer avec TVA.' } ],
              tasks: [ { id:'t1', title:'Écriture achat matériel' } ],
              resources: [ { title: 'AUSGIE OHADA (référence)', url: 'https://github.com/LnDevAi/plateforme-reporting/blob/main/docs/knowledge-base/epe-burkina/modeles-documents/AUSGIE-REVISE-OHADA-fr(1).pdf' } ],
              quiz: { passScore: 60, questions: [ { id:'q1', prompt:'Le débit/crédit...', options:[ {id:'a', text:'Actif augmente au débit', correct:true}, {id:'b', text:'Passif augmente au débit', correct:false} ] } ] }
            }
          ]
        }
      ]
    },
    {
      id: 'acc-responsable',
      title: 'Certification Responsable Comptable',
      domain: 'Comptabilité privée',
      audience: 'DF/DFC et assimilés',
      description: 'Clôture, états financiers, analyse et contrôle interne.',
      competencies: ['Clôture', 'États financiers', 'Contrôle interne'],
      modules: [
        {
          id: 'acc-2',
          title: 'Clôture et EF',
          lessons: [
            {
              id: 'acc-2-1',
              title: 'Cycle de clôture',
              theory: 'Inventaires, provisions, cut-off.',
              scenarios: [ { title:'Provision litige', description:'Évaluer et comptabiliser.' } ],
              tasks: [ { id:'t1', title:'Feuille de travail provisions' } ],
              resources: [ { title: "Modèles d'EF EPE (Burkina)", url: "https://github.com/LnDevAi/plateforme-reporting/blob/main/docs/knowledge-base/epe-burkina/modeles-documents/Mod%C3%A8les%20de%20documents%20des%20EPE_Soci%C3%A9t%C3%A9s%20d'%C3%89tat%20-%20Burkina%20Faso.pdf" } ],
              quiz: { passScore: 70, questions: [ { id:'q1', prompt:'Une provision est...', options:[ {id:'a', text:'Une dette probable', correct:true}, {id:'b', text:'Un produit certain', correct:false} ] } ] }
            }
          ]
        }
      ]
    }
  ]
  localStorage.setItem(LEARNING_KEY, JSON.stringify(tracks))
}

function readTracks() {
  bootDemoLearning()
  return JSON.parse(localStorage.getItem(LEARNING_KEY) || '[]')
}

function readProgress() {
  return JSON.parse(localStorage.getItem(LEARNING_PROGRESS_KEY) || '{}')
}

function writeProgress(progress) {
  localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(progress))
}

export const learningAPI = {
  getTracks: async () => {
    await delay(50)
    const tracks = readTracks()
    const progress = readProgress()
    const withProgress = tracks.map(t => {
      const tp = progress[t.id] || {}
      const doneTasks = Object.values(tp.tasks || {}).filter(Boolean).length
      const totalTasks = tracks
        .find(x=>x.id===t.id).modules.flatMap(m=>m.lessons).flatMap(l=>l.tasks||[]).length
      return { ...t, progress: totalTasks ? Math.round((doneTasks/totalTasks)*100) : 0 }
    })
    return { success: true, data: withProgress }
  },
  getTrack: async (trackId) => {
    await delay(40)
    const t = readTracks().find(t => t.id === trackId)
    return { success: true, data: t || null }
  },
  getProgress: async (trackId) => {
    await delay(20)
    const tp = readProgress()[trackId] || { tasks: {}, quizzes: {} }
    // calcul d'éligibilité certificat (simple): 70% tasks done + tous quiz >= passScore
    const track = readTracks().find(t=>t.id===trackId)
    const allTasks = track.modules.flatMap(m=>m.lessons).flatMap(l=>l.tasks||[])
    const totalTasks = allTasks.length
    const doneTasks = Object.values(tp.tasks||{}).filter(Boolean).length
    const tasksOk = totalTasks === 0 ? true : (doneTasks/totalTasks) >= 0.7
    const allLessons = track.modules.flatMap(m=>m.lessons)
    const quizzesOk = allLessons.every(l => {
      const attempt = tp.quizzes?.[l.id]
      if (!l.quiz) return true
      return attempt && attempt.score >= (l.quiz.passScore || 60)
    })
    const eligible = tasksOk && quizzesOk
    return { success: true, data: { ...tp, eligible } }
  },
  markTask: async (trackId, lessonId, taskId, done) => {
    await delay(10)
    const progress = readProgress()
    progress[trackId] = progress[trackId] || { tasks: {}, quizzes: {} }
    progress[trackId].tasks[`${lessonId}:${taskId}`] = !!done
    writeProgress(progress)
    return { success: true }
  },
  submitQuiz: async (trackId, lessonId, answers) => {
    await delay(30)
    const track = readTracks().find(t=>t.id===trackId)
    const lesson = track.modules.flatMap(m=>m.lessons).find(l=>l.id===lessonId)
    const total = (lesson.quiz?.questions || []).length || 1
    const correct = (lesson.quiz?.questions || []).reduce((acc, q) => {
      const picked = answers[q.id]
      const opt = (q.options||[]).find(o=>o.id===picked)
      return acc + (opt?.correct ? 1 : 0)
    }, 0)
    const score = Math.round((correct/total)*100)
    const progress = readProgress()
    progress[trackId] = progress[trackId] || { tasks: {}, quizzes: {} }
    progress[trackId].quizzes[lessonId] = { score, at: new Date().toISOString() }
    writeProgress(progress)
    return { success: true, data: { score } }
  },
}

// Boot démo: crée un ministère, un projet et une entité si absents
export function bootDemoSeed() {
  try {
    const ministries = JSON.parse(localStorage.getItem('ministries') || '[]')
    if (!ministries.length) {
      const item = { id: Date.now(), name: "Ministère de la Santé", code: "MSAN", address: "Ouagadougou", minister: { firstName: "Robert", lastName: "Kargougou" }, contact: { email: "contact@msan.gov", phone: "+226" }, documents: [], created_at: new Date().toISOString() }
      localStorage.setItem('ministries', JSON.stringify([item]))
    }
  } catch {}
  try {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]')
    if (!projects.length) {
      const ms = JSON.parse(localStorage.getItem('ministries') || '[]')
      const pid = Date.now()+1
      const item = { id: pid, name: 'Projet Démo Santé 2025', owner: { id: pid+1, name: 'Responsable Démo' }, objectives: ['Objectif 1','Objectif 2'], team: [{id:pid+2,name:'Alice'},{id:pid+3,name:'Bob'}], ministryId: ms[0]?.id || null }
      localStorage.setItem('projects', JSON.stringify([item]))
    }
  } catch {}
  try {
    const entities = JSON.parse(localStorage.getItem('entities') || '[]')
    if (!entities.length) {
      const ms = JSON.parse(localStorage.getItem('ministries') || '[]')
      const eid = Date.now()+2
      const entity = {
        id: eid,
        name: 'Entité Démo',
        type: 'EPE',
        ministryId: ms[0]?.id || null,
        tutelle: { technique: 'Tutelle technique', financier: 'Tutelle financier', techniqueId: ms[0]?.id || null, financierId: null },
        contact: { adresse: 'Adresse démo', telephone: '+226', email: 'entity@demo.local' },
        identification: { ifu: '', cnss: '', rccm: '' },
        autresInformations: '',
        documentsCreation: [],
        created_at: new Date().toISOString(),
        structure: {
          directionGenerale: { roles: { DG: null, DFC: null, PRM: null, DRH: null, CG: null, AI: null }, autresDirections: [] },
          conseilAdministration: { ministeres: Array.from({ length: 10 }).map((_, i) => ({ slot: `Ministère ${i+1}`, ministryId: null, membre: null })), observateurs: [null, null], repPersonnel: null, commissaireComptes: null },
          assembleeGenerale: { notes: '' },
        },
      }
      localStorage.setItem('entities', JSON.stringify([entity]))
    }
  } catch {}
  try {
    const raw = localStorage.getItem('entities_catalog') || ''
    const current = raw ? JSON.parse(raw) : null
    const isEmpty = !current || ((current.epe || []).length === 0 && (current.se || []).length === 0)
    if (isEmpty) {
      const defaultCatalog = {
        epe: [
          "Office National de l'Eau et de l'Assainissement (ONEA)",
          "Société Nationale d'Electricité du Burkina (SONABEL)",
        ],
        se: [
          "Société Nationale Burkinabè d'Hydrocarbures (SONABHY)",
          "Loterie Nationale Burkinabè (LONAB)",
        ],
      }
      localStorage.setItem('entities_catalog', JSON.stringify(defaultCatalog))
    }
  } catch {}
}

export default api