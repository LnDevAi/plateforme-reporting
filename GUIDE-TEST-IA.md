# 🚀 Guide de Test - Assistant IA Expert EPE

## 🎯 **Vue d'Ensemble**

Votre assistant IA est maintenant alimenté par **vos formations expertes** et peut répondre à des questions avancées sur :

### 📚 **Domaines d'Expertise**
- ✅ **Gouvernance EPE** - Documents Burkina Faso + Formations terrain
- ✅ **Missions Administrateurs** - Formation PowerPoint complète
- ✅ **Audit & Finance** - Formation analyse états financiers (16MB)
- ✅ **Réglementation OHADA/UEMOA** - Base de connaissances intégrée

---

## 🛠️ **Méthodes de Test**

### 🌐 **1. Interface Web (Recommandé)**

**Démarrage :**
```bash
# Backend
cd backend
php artisan serve

# Frontend (nouveau terminal)
cd frontend
npm start
```

**Accès :**
- 📱 Interface : `http://localhost:3000/ai-assistant`
- 🔑 Connectez-vous avec vos identifiants
- 🤖 Cliquez sur "Assistant IA" dans le menu

### 💻 **2. Script de Test Automatisé**

**Exécution :**
```bash
# Installer axios si nécessaire
npm install axios

# Lancer les tests
node test-ai-assistant.js
```

**Options :**
- **Mode 1** : Suite complète (16 questions préprogrammées)
- **Mode 2** : Interactif (vos propres questions)

### 🔧 **3. Test API Direct**

**Endpoint :** `POST /api/ai/chat`

**Exemple avec curl :**
```bash
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Quelles sont mes responsabilités en tant qu'"'"'administrateur d'"'"'EPE ?",
    "conversation_id": null
  }'
```

---

## 🎓 **Questions de Test Expertes**

### 🏛️ **Administrateurs EPE**
```
❓ "Quelles sont mes responsabilités fiduciaires en tant qu'administrateur d'EPE ?"
❓ "Comment préparer efficacement une réunion de conseil d'administration ?"
❓ "Que faire en cas de conflit d'intérêts au sein du CA ?"
❓ "Quels documents dois-je examiner avant chaque réunion du CA ?"
```

### 🔍 **Audit & Finance**
```
❓ "Comment analyser la rentabilité d'une société d'État ?"
❓ "Quels ratios financiers sont cruciaux pour surveiller une EPE ?"
❓ "Comment détecter des anomalies dans les états financiers d'une EPE ?"
❓ "Quelle méthodologie d'audit appliquer spécifiquement aux EPE ?"
```

### ⚖️ **Réglementation OHADA/UEMOA**
```
❓ "Quelles sont les obligations OHADA pour le CA d'une société d'État ?"
❓ "Comment appliquer les directives UEMOA dans la gestion d'une EPE ?"
❓ "Quels sont les critères de convergence UEMOA pertinents pour les EPE ?"
❓ "Comment organiser une AG conforme aux exigences OHADA ?"
```

### 🎯 **Gouvernance Générale**
```
❓ "Quelles sont les bonnes pratiques de gouvernance spécifiques aux EPE du Burkina Faso ?"
❓ "Comment structurer efficacement un conseil d'administration d'EPE ?"
❓ "Quels sont les principes fondamentaux de transparence pour les entreprises publiques ?"
```

---

## 🎛️ **Configuration Requise**

### 🔑 **Variables d'Environnement (.env)**
```bash
# IA Services (au moins un requis)
OPENAI_API_KEY=your_openai_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here

# Configuration IA
AI_DEFAULT_PROVIDER=openai
AI_FALLBACK_ENABLED=true
AI_RATE_LIMIT_PER_MINUTE=60
```

### 🗄️ **Base de Données**
```bash
# Migrations
php artisan migrate

# Seeders (optionnel)
php artisan db:seed --class=CoursesSeeder
```

---

## 📊 **Ce que Vous Devriez Voir**

### ✅ **Réponses Expertes Attendues**

**Question :** *"Quelles sont mes responsabilités en tant qu'administrateur ?"*

**Réponse IA typique :**
```
En tant qu'administrateur d'une EPE au Burkina Faso, vos responsabilités principales incluent :

📋 RESPONSABILITÉS FIDUCIAIRES
• Agir dans l'intérêt supérieur de l'entreprise
• Exercer un devoir de diligence et de loyauté
• Surveiller la gestion de la direction générale

🎯 MISSIONS SPÉCIFIQUES (basé sur votre formation)
• Participer aux réunions du conseil d'administration
• Examiner et approuver les états financiers
• Valider la stratégie et les investissements majeurs
• Superviser la conformité réglementaire

⚖️ CADRE LÉGAL OHADA
• Respecter l'Acte uniforme sur les sociétés commerciales
• Assurer la transparence des décisions
• Prévenir les conflits d'intérêts

[Suggestions basées sur vos formations...]
```

### 🚀 **Fonctionnalités Avancées**

- **Suggestions contextuelles** basées sur vos documents
- **Personnalisation** selon le rôle utilisateur
- **Citations** de vos formations
- **Conseils pratiques** terrain
- **Conformité** OHADA/UEMOA automatique

---

## 🛠️ **Troubleshooting**

### ❌ **Problèmes Fréquents**

**1. "Limite d'abonnement atteinte"**
```bash
# Vérifier les limites dans SubscriptionPlan
php artisan tinker
>>> App\Models\SubscriptionPlan::all()
```

**2. "Erreur API IA"**
```bash
# Tester la connectivité
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

**3. "Documents non indexés"**
```bash
# Vérifier les documents
find docs/knowledge-base -name "*.pdf" -o -name "*.pptx"
```

---

## 🎯 **Prochaines Étapes**

1. **🔧 Configurer** les clés API dans `.env`
2. **🚀 Lancer** le backend + frontend
3. **🎓 Tester** avec les questions expertes
4. **📊 Analyser** la qualité des réponses
5. **📚 Ajouter** plus de formations si nécessaire

---

## 🏆 **Objectifs de Test**

### ✅ **Validation Réussie Si :**
- L'IA cite vos formations spécifiques
- Les réponses sont contextuelles au Burkina Faso
- La conformité OHADA/UEMOA est mentionnée
- Les suggestions sont pertinentes et pratiques
- Les conversations sont fluides et naturelles

**🎉 Votre assistant IA expert est prêt à révolutionner la gouvernance EPE !** 🚀🤖