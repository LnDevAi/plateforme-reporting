# 🔑 Guide de Configuration - Clés API IA

## 📋 **Variables Requises dans `.env`**

Éditez le fichier `/workspace/backend/.env` et remplacez les valeurs suivantes :

### 🤖 **OpenAI (Recommandé - Provider Principal)**
```bash
# Clé API OpenAI (obligatoire pour GPT-4)
OPENAI_API_KEY=sk-your_actual_openai_key_here

# Configuration OpenAI
OPENAI_ORGANIZATION=your_org_id_optional
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
```

### 🔮 **Claude (Optionnel - Fallback)**
```bash
# Clé API Claude/Anthropic (optionnel mais recommandé)
CLAUDE_API_KEY=sk-ant-your_claude_key_here

# Configuration Claude
CLAUDE_MODEL=claude-3-sonnet-20240229
CLAUDE_MAX_TOKENS=2000
CLAUDE_API_VERSION=2023-06-01
```

### ⚙️ **Configuration Générale IA**
```bash
# Provider principal (openai ou claude)
AI_DEFAULT_PROVIDER=openai

# Fallback automatique si provider principal échoue
AI_FALLBACK_ENABLED=true

# Limite de requêtes par minute
AI_RATE_LIMIT_PER_MINUTE=60

# Durée de conservation des conversations (heures)
AI_CONVERSATION_TIMEOUT_HOURS=24
```

---

## 🔐 **Comment Obtenir les Clés API**

### 🤖 **OpenAI (GPT-4)**
1. **Créer un compte** : https://platform.openai.com/
2. **Aller dans API Keys** : https://platform.openai.com/api-keys
3. **Créer une nouvelle clé** : "Create new secret key"
4. **Copier la clé** : `sk-...` (commence par sk-)
5. **Ajouter du crédit** : https://platform.openai.com/billing

### 🔮 **Claude (Anthropic)**
1. **Créer un compte** : https://console.anthropic.com/
2. **Aller dans API Keys** : https://console.anthropic.com/settings/keys
3. **Créer une nouvelle clé** : "Create Key"
4. **Copier la clé** : `sk-ant-...` (commence par sk-ant-)
5. **Ajouter du crédit** : https://console.anthropic.com/billing

---

## 💰 **Coûts Estimés (Usage Modéré)**

### 🤖 **OpenAI GPT-4**
- **Prix** : ~$0.01-0.03 per 1K tokens
- **Usage typique** : 100 questions/mois = ~$5-15/mois
- **Recommandé pour** : Production, qualité premium

### 🔮 **Claude Sonnet**
- **Prix** : ~$0.003-0.015 per 1K tokens  
- **Usage typique** : 100 questions/mois = ~$3-10/mois
- **Recommandé pour** : Fallback, tests

---

## ⚡ **Configuration Minimale (Démarrage Rapide)**

Si vous voulez tester rapidement avec **une seule clé** :

```bash
# Configuration minimale (OpenAI uniquement)
OPENAI_API_KEY=sk-your_actual_key_here
AI_DEFAULT_PROVIDER=openai
AI_FALLBACK_ENABLED=false
```

OU

```bash
# Configuration alternative (Claude uniquement)  
CLAUDE_API_KEY=sk-ant-your_actual_key_here
AI_DEFAULT_PROVIDER=claude
AI_FALLBACK_ENABLED=false
```

---

## 🔍 **Test de Validation des Clés**

Après configuration, testez vos clés :

```bash
# Test OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Test Claude  
curl -H "x-api-key: $CLAUDE_API_KEY" \
  https://api.anthropic.com/v1/messages
```

---

## 🚨 **Sécurité - IMPORTANT**

### ✅ **Bonnes Pratiques**
- ❌ **NE JAMAIS** commiter `.env` dans Git
- ✅ **Utiliser** des clés API dédiées au projet
- ✅ **Limiter** les permissions aux modèles requis
- ✅ **Surveiller** l'usage et les coûts régulièrement
- ✅ **Révoquer** les clés en cas de compromission

### 🔒 **Variables Sensibles**
```bash
# Ajoutez au .gitignore (déjà fait)
.env
.env.local
.env.production
```

---

## ✅ **Vérification de Configuration**

Une fois configuré, votre `.env` devrait contenir :

```bash
# Base de données
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=reporting_platform
DB_USERNAME=root
DB_PASSWORD=

# IA Configuration ✅
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxx
AI_DEFAULT_PROVIDER=openai
AI_FALLBACK_ENABLED=true
```

**🎯 Une fois configuré, passez à l'étape suivante : Lancement des serveurs !**