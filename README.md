# Plateforme de Reporting d'Exécution

Une plateforme complète de reporting développée avec Laravel (backend) et React (frontend) permettant de créer, gérer et exécuter des rapports de données avec une interface moderne et intuitive.

## 🚀 Fonctionnalités

### 📊 Tableau de bord
- **Vue d'ensemble en temps réel** : Statistiques principales de la plateforme
- **Graphiques interactifs** : Évolution des exécutions, répartition par catégories
- **Rapports populaires** : Liste des rapports les plus utilisés
- **Exécutions récentes** : Historique des dernières exécutions
- **Alertes intelligentes** : Notifications sur les rapports en échec ou lents

### 📋 Gestion des rapports
- **Création guidée** : Assistant en 3 étapes avec éditeur SQL intégré
- **Types de rapports** : Tableaux, graphiques, tableaux de bord, exports
- **Catégorisation** : Organisation par départements (Finance, RH, Ventes, etc.)
- **Test de requêtes** : Validation SQL avant sauvegarde
- **Configuration avancée** : Paramètres, filtres, visualisations

### ⚡ Exécution et performance
- **Exécution en temps réel** : Suivi des performances et du statut
- **Historique complet** : Traçabilité de toutes les exécutions
- **Exports multiples** : JSON, Excel, PDF
- **Gestion des erreurs** : Logs détaillés et notifications
- **Optimisation** : Détection des rapports lents

### 👥 Gestion des utilisateurs
- **Authentification sécurisée** : JWT tokens avec Laravel Sanctum
- **Rôles et permissions** : Admin, Manager, Analyst, Viewer
- **Gestion par départements** : Organisation hiérarchique
- **Profils utilisateurs** : Informations personnalisables

## 🏗️ Architecture technique

### Backend (Laravel 10)
```
backend/
├── app/
│   ├── Http/Controllers/Api/
│   │   ├── AuthController.php       # Authentification
│   │   ├── ReportController.php     # Gestion des rapports
│   │   └── DashboardController.php  # Tableau de bord
│   └── Models/
│       ├── User.php                 # Utilisateurs
│       ├── Report.php               # Rapports
│       ├── ReportExecution.php      # Exécutions
│       └── ReportData.php           # Données
├── database/migrations/             # Migrations de base de données
├── routes/api.php                   # Routes API
└── composer.json                    # Dépendances PHP
```

### Frontend (React 18)
```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout/                  # Composants de mise en page
│   │   └── ProtectedRoute.jsx       # Protection des routes
│   ├── pages/
│   │   ├── Dashboard/               # Tableau de bord
│   │   ├── Reports/                 # Gestion des rapports
│   │   ├── Users/                   # Gestion des utilisateurs
│   │   └── Auth/                    # Authentification
│   ├── services/api.js              # Services API
│   ├── contexts/AuthContext.jsx     # Contexte d'authentification
│   └── hooks/useAuth.js             # Hook d'authentification
└── package.json                     # Dépendances Node.js
```

## 🛠️ Technologies utilisées

### Backend
- **Laravel 10** : Framework PHP moderne
- **Laravel Sanctum** : Authentification API
- **MySQL** : Base de données relationnelle
- **Maatwebsite/Excel** : Export Excel
- **Barryvdh/DomPDF** : Export PDF

### Frontend
- **React 18** : Bibliothèque UI moderne
- **React Router** : Navigation côté client
- **Ant Design** : Composants UI élégants
- **React Query** : Gestion d'état et cache
- **Recharts** : Graphiques interactifs
- **Axios** : Client HTTP
- **Ace Editor** : Éditeur SQL intégré

## 📦 Installation

### Prérequis
- PHP 8.1+
- Node.js 18+
- MySQL 8.0+
- Composer
- npm/yarn

### Backend (Laravel)
```bash
cd backend

# Installation des dépendances
composer install

# Configuration de l'environnement
cp .env.example .env
php artisan key:generate

# Configuration de la base de données dans .env
DB_DATABASE=reporting_platform
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Migration de la base de données
php artisan migrate

# Démarrage du serveur
php artisan serve
```

### Frontend (React)
```bash
cd frontend

# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev
```

## 🚦 Utilisation

### Accès à l'application
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8000/api

### Comptes de démonstration
- **Admin** : admin@demo.com / password
- **Manager** : manager@demo.com / password
- **Analyst** : analyst@demo.com / password

### Création d'un rapport
1. Naviguer vers "Rapports" → "Nouveau rapport"
2. Remplir les informations générales
3. Écrire la requête SQL et la tester
4. Configurer les paramètres avancés
5. Sauvegarder et exécuter

## 🔧 Configuration

### Variables d'environnement (Backend)
```env
APP_NAME="Plateforme de Reporting"
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_DATABASE=reporting_platform
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

### Configuration (Frontend)
```env
VITE_API_URL=http://localhost:8000/api
```

## 📊 Modèle de données

### Tables principales
- **users** : Utilisateurs et authentification
- **reports** : Définition des rapports
- **report_executions** : Historique des exécutions
- **report_data** : Données résultantes

### Relations
- Un utilisateur peut créer plusieurs rapports
- Un rapport peut avoir plusieurs exécutions
- Une exécution contient plusieurs lignes de données

## 🔒 Sécurité

- **Authentification JWT** avec Laravel Sanctum
- **Validation des entrées** côté serveur
- **Protection CSRF** activée
- **Rôles et permissions** granulaires
- **Sanitisation SQL** pour éviter les injections

## 🎨 Interface utilisateur

### Design system
- **Couleurs** : Palette moderne avec bleu principal (#1890ff)
- **Typographie** : Segoe UI pour une lisibilité optimale
- **Composants** : Ant Design pour la cohérence
- **Responsive** : Adaptation mobile et tablette
- **Accessibilité** : Respect des standards WCAG

### Fonctionnalités UX
- **Navigation intuitive** avec menu latéral
- **Recherche et filtres** avancés
- **Feedback visuel** pour toutes les actions
- **Gestion d'erreurs** avec messages clairs
- **Chargements** avec indicateurs de progression

## 🚀 Déploiement

### Production
```bash
# Backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend
npm run build
```

### Docker (optionnel)
Un Dockerfile et docker-compose.yml peuvent être ajoutés pour faciliter le déploiement.

## 📈 Roadmap

### Fonctionnalités futures
- [ ] **Planification automatique** des rapports
- [ ] **Notifications email** personnalisées
- [ ] **API REST publique** pour intégrations
- [ ] **Visualisations avancées** avec D3.js
- [ ] **Mode hors ligne** avec cache intelligent
- [ ] **Audit trail** complet des actions
- [ ] **Thèmes personnalisables** sombre/clair

### Améliorations techniques
- [ ] **Tests automatisés** (PHPUnit, Jest)
- [ ] **Documentation API** avec Swagger
- [ ] **Monitoring** avec Sentry
- [ ] **Cache Redis** pour les performances
- [ ] **Queue system** pour les gros rapports

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteurs

- **Équipe de développement** - Plateforme de Reporting

## 📞 Support

Pour toute question ou problème :
- **Issues** : Ouvrir un ticket sur GitHub
- **Documentation** : Consulter le wiki du projet
- **Email** : support@reporting-platform.com

---

**Plateforme de Reporting d'Exécution** - Une solution moderne et complète pour tous vos besoins de reporting ! 🚀
