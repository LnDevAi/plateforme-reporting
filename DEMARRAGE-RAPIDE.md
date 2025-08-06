# 🚀 DÉMARRAGE RAPIDE - Assistant IA Expert EPE

## ⚡ **LANCEMENT EN 3 ÉTAPES**

### 🔑 **ÉTAPE 1 : Configuration des Clés API (5 min)**

```bash
# 1. Éditez le fichier de configuration
nano backend/.env

# 2. Remplacez ces lignes :
OPENAI_API_KEY=sk-your_actual_openai_key_here
CLAUDE_API_KEY=sk-ant-your_claude_key_here  # Optionnel
AI_DEFAULT_PROVIDER=openai
```

📖 **Guide détaillé :** `CONFIGURATION-IA.md`

---

### ⚡ **ÉTAPE 2 : Lancement des Serveurs (2 min)**

```bash
# Script automatisé
./start-servers.sh

# OU manuellement :
# Terminal 1 - Backend
cd backend && php artisan serve

# Terminal 2 - Frontend  
cd frontend && npm start
```

**🌐 Accès :** http://localhost:3000/ai-assistant

---

### 🎓 **ÉTAPE 3 : Test avec Questions Expertes (10 min)**

**Questions de validation immédiate :**

1. **"Quelles sont mes responsabilités en tant qu'administrateur d'EPE ?"**
2. **"Comment analyser la rentabilité d'une société d'État ?"** 
3. **"Quelles sont les obligations OHADA pour le CA d'une société d'État ?"**

📖 **36 questions expertes :** `QUESTIONS-TEST-EXPERTES.md`

---

## 🎯 **VALIDATION RÉUSSIE SI :**

✅ L'IA **cite vos formations** spécifiques  
✅ Réponses **contextualisées** au Burkina Faso  
✅ **Conformité OHADA/UEMOA** mentionnée  
✅ Conseils **pratiques** et applicables  
✅ **Suggestions pertinentes** de suivi  

---

## 🆘 **TROUBLESHOOTING RAPIDE**

### ❌ **"Erreur clés API"**
```bash
# Vérifiez votre configuration
grep -n "API_KEY" backend/.env
```

### ❌ **"Serveur ne démarre pas"**
```bash
# Vérifiez les dépendances
node --version    # Node.js 18+
php --version     # PHP 8.1+
```

### ❌ **"Interface non accessible"**
```bash
# Vérifiez les ports
netstat -tlnp | grep :3000
netstat -tlnp | grep :8000
```

---

## 🏆 **SUCCÈS ! Votre Assistant IA Expert EPE est opérationnel !**

**🤖 Alimenté par vos formations expertes**  
**📚 16 documents dans la base de connaissances**  
**⚖️ Conforme OHADA/UEMOA/SYSCOHADA**  
**🎓 Spécialisé EPE Burkina Faso**

**🎉 Félicitations ! Testez maintenant avec vos questions expertes !** ✨