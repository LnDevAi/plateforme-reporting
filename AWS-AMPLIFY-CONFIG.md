# 🔧 CONFIGURATION MANUELLE AWS AMPLIFY

## ⚙️ **PARAMÈTRES À CONFIGURER DANS AWS AMPLIFY CONSOLE**

### **1. Build Settings (App Settings → Build settings)**

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
        - cd frontend && npm install
    build:
      commands:
        - cd frontend && npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

### **2. Paramètres du Build**

Dans **AWS Amplify Console** → **App Settings** → **Build settings** :

- **Build command :** `npm run build`
- **Output directory :** `frontend/dist`
- **Node.js version :** `18` (ou la dernière)

### **3. Variables d'Environnement**

Dans **App Settings** → **Environment variables** :

```
NODE_VERSION=18
NPM_VERSION=8
```

### **4. Si ça ne marche toujours pas...**

**Option Alternative - Déploiement Direct :**

1. **Buildez localement :**
   ```bash
   cd frontend
   npm run build
   ```

2. **Zippez le dossier dist :**
   ```bash
   cd dist
   zip -r ../plateforme-epe-frontend.zip .
   ```

3. **Déployez sur :**
   - **Netlify** (drag & drop)
   - **Vercel** (import GitHub)
   - **AWS S3 + CloudFront** (upload manuel)

### **5. Test de Vérification**

Si le build réussit, vous devriez avoir une URL comme :
```
https://main.xxxxx.amplifyapp.com
```

## 🎯 **RÉSOLUTION ALTERNATIVE**

Si AWS Amplify continue d'échouer, le problème peut être :
- Version Node.js incompatible
- Timeout de build (>15 min)
- Mémoire insuffisante
- Dépendances manquantes

**→ Essayez Vercel ou Netlify comme alternative !**