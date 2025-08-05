# 🚀 Guide de Déploiement - Plateforme de Reporting

Ce guide vous explique comment déployer la plateforme de reporting pour la voir en action.

## 📋 Prérequis

- Docker et Docker Compose (recommandé)
- OU PHP 8.1+, Node.js 18+, MySQL 8.0+

## 🐳 Option 1 : Déploiement avec Docker (Recommandé)

### Démarrage rapide
```bash
# 1. Cloner le projet
git clone <votre-repo> reporting-platform
cd reporting-platform

# 2. Générer la clé d'application Laravel
docker run --rm -v $(pwd)/backend:/app composer/composer:latest composer install
docker run --rm -v $(pwd)/backend:/app php:8.2-cli php /app/artisan key:generate

# 3. Démarrer tous les services
docker-compose up -d

# 4. Exécuter les migrations
docker exec reporting_backend php artisan migrate --seed

# 5. Accéder à l'application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api
```

### Services inclus
- **MySQL** : Base de données (port 3306)
- **Redis** : Cache et queues (port 6379)
- **Backend Laravel** : API (port 8000)
- **Queue Worker** : Traitement des tâches
- **Frontend React** : Interface (port 3000)
- **Nginx** : Reverse proxy (port 80)

## 💻 Option 2 : Installation locale

### Backend (Laravel)
```bash
cd backend

# Installation des dépendances
composer install

# Configuration
cp .env.example .env
php artisan key:generate

# Base de données (modifier .env avec vos paramètres)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=reporting_platform
DB_USERNAME=root
DB_PASSWORD=

# Migration
php artisan migrate --seed

# Démarrage
php artisan serve
# API disponible sur: http://localhost:8000
```

### Frontend (React)
```bash
cd frontend

# Installation
npm install

# Configuration (créer .env.local)
echo "VITE_API_URL=http://localhost:8000/api" > .env.local

# Démarrage
npm run dev
# App disponible sur: http://localhost:3000
```

## ☁️ Option 3 : Déploiement cloud

### 3.1 Vercel + PlanetScale (Gratuit)

#### Frontend sur Vercel
```bash
# 1. Connecter votre repo GitHub à Vercel
# 2. Configurer les variables d'environnement:
VITE_API_URL=https://votre-backend.railway.app/api

# 3. Déployer automatiquement
```

#### Backend sur Railway
```bash
# 1. Connecter Railway à votre repo GitHub
# 2. Configurer les variables d'environnement:
APP_NAME="Plateforme de Reporting"
APP_ENV=production
APP_DEBUG=false
DB_CONNECTION=mysql
DB_HOST=<planetscale-host>
DB_DATABASE=<planetscale-db>
DB_USERNAME=<planetscale-user>
DB_PASSWORD=<planetscale-password>

# 3. Ajouter le buildpack PHP
# 4. Déployer
```

#### Base de données PlanetScale
```bash
# 1. Créer un compte PlanetScale
# 2. Créer une base de données
# 3. Obtenir les credentials de connexion
# 4. Configurer les migrations automatiques
```

### 3.2 DigitalOcean App Platform

```yaml
# .do/app.yaml
name: reporting-platform
services:
- name: api
  source_dir: /backend
  github:
    repo: votre-username/reporting-platform
    branch: main
  run_command: php artisan serve --host=0.0.0.0 --port=$PORT
  environment_slug: php
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: APP_ENV
    value: production
  - key: APP_KEY
    value: base64:your-app-key
  - key: DB_CONNECTION
    value: mysql
  
- name: web
  source_dir: /frontend
  github:
    repo: votre-username/reporting-platform
    branch: main
  build_command: npm run build
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs

databases:
- name: reporting-db
  engine: MYSQL
  version: "8"
```

### 3.3 AWS avec Laravel Vapor

```bash
# 1. Installer Vapor CLI
composer require laravel/vapor-cli

# 2. Configurer vapor.yml
php artisan vendor:publish --tag=vapor-config

# 3. Déployer
vapor deploy production
```

## 🔧 Configuration avancée

### Variables d'environnement essentielles

#### Backend (.env)
```env
APP_NAME="Plateforme de Reporting"
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://votre-domaine.com

DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_PORT=3306
DB_DATABASE=reporting_platform
DB_USERNAME=your-username
DB_PASSWORD=your-password

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

REDIS_HOST=your-redis-host
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=notifications@votre-domaine.com
MAIL_FROM_NAME="Plateforme de Reporting"

SANCTUM_STATEFUL_DOMAINS=votre-frontend-domaine.com
```

#### Frontend (.env.production)
```env
VITE_API_URL=https://votre-backend-domaine.com/api
```

### Configuration de production

#### Optimisations Laravel
```bash
# Cache de configuration
php artisan config:cache

# Cache des routes
php artisan route:cache

# Cache des vues
php artisan view:cache

# Optimisation de l'autoloader
composer install --optimize-autoloader --no-dev

# Exécution des queues
php artisan queue:work --daemon
```

#### Tâches planifiées (Cron)
```bash
# Ajouter dans crontab:
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## 🔒 Configuration SSL/HTTPS

### Avec Nginx
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name votre-domaine.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Monitoring et logs

### Logs Laravel
```bash
# Voir les logs en temps réel
tail -f storage/logs/laravel.log

# Logs des queues
php artisan queue:work --verbose
```

### Monitoring avec Sentry (optionnel)
```bash
# Installer Sentry
composer require sentry/sentry-laravel

# Configuration dans .env
SENTRY_LARAVEL_DSN=your-sentry-dsn
```

## 🧪 Comptes de test

Une fois déployé, utilisez ces comptes pour tester :

- **Admin** : admin@demo.com / password
- **Manager** : manager@demo.com / password
- **Analyst** : analyst@demo.com / password

## 🛠️ Dépannage

### Erreurs courantes

#### "Key not found" 
```bash
php artisan key:generate
```

#### "Permission denied" sur les fichiers
```bash
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/
```

#### "Connection refused" à la base de données
- Vérifier les credentials dans .env
- S'assurer que le service MySQL est démarré
- Tester la connexion : `php artisan tinker` puis `DB::connection()->getPdo()`

#### Les emails ne s'envoient pas
- Vérifier la configuration MAIL_* dans .env
- Tester avec Mailtrap en développement
- Utiliser SendGrid, Mailgun ou SES en production

### Performance

#### Optimisations recommandées
```bash
# Redis pour cache et sessions
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Compression Gzip
# OPcache PHP activé
# CDN pour les assets statiques
```

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifier les logs** : `storage/logs/laravel.log`
2. **Mode debug** : `APP_DEBUG=true` temporairement
3. **Tester les APIs** : `/api/health` pour vérifier le backend
4. **Issues GitHub** : Ouvrir un ticket avec les détails

---

🎉 **Votre plateforme de reporting est maintenant déployée !**

Accédez à l'interface web et connectez-vous avec les comptes de démonstration pour explorer toutes les fonctionnalités.