#!/bin/bash

# 🚀 Script de Démarrage - Assistant IA Expert EPE
# Lance automatiquement le backend Laravel et le frontend React

set -e

echo "🎯 === DÉMARRAGE ASSISTANT IA EXPERT EPE ==="
echo ""

# Configuration des couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage avec couleurs
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier la configuration
check_requirements() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé. Installez Node.js 18+ pour continuer."
        exit 1
    fi
    
    # Vérifier NPM
    if ! command -v npm &> /dev/null; then
        log_error "NPM n'est pas installé. Installez NPM pour continuer."
        exit 1
    fi
    
    # Vérifier PHP (si disponible)
    if command -v php &> /dev/null; then
        log_success "PHP détecté: $(php --version | head -n1)"
    else
        log_warning "PHP non détecté. Le backend nécessitera une installation séparée."
    fi
    
    # Vérifier la structure du projet
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        log_error "Structure de projet invalide. Assurez-vous d'être dans le répertoire racine."
        exit 1
    fi
    
    log_success "Prérequis validés"
}

# Fonction de préparation du backend
prepare_backend() {
    log_info "Préparation du backend Laravel..."
    
    cd backend
    
    # Vérifier .env
    if [ ! -f ".env" ]; then
        log_warning "Fichier .env manquant. Copie depuis .env.example..."
        cp .env.example .env
    fi
    
    # Vérifier les clés IA
    if grep -q "your_openai_api_key_here" .env && grep -q "your_claude_api_key_here" .env; then
        log_warning "🔑 ATTENTION: Configurez vos clés API IA dans backend/.env"
        log_warning "   Voir CONFIGURATION-IA.md pour les instructions détaillées"
    fi
    
    # Installer les dépendances (si Composer disponible)
    if command -v composer &> /dev/null; then
        log_info "Installation des dépendances PHP..."
        composer install --no-dev --optimize-autoloader
        log_success "Dépendances PHP installées"
    else
        log_warning "Composer non détecté. Installation manuelle requise."
    fi
    
    # Générer la clé d'application (si PHP disponible)
    if command -v php &> /dev/null; then
        if ! grep -q "APP_KEY=" .env || grep -q "APP_KEY=$" .env; then
            log_info "Génération de la clé d'application..."
            php artisan key:generate
        fi
        
        # Migrations (si DB configurée)
        log_info "Tentative de migration de la base de données..."
        php artisan migrate --force 2>/dev/null || log_warning "Migrations échouées - configurez d'abord la base de données"
        
        log_success "Backend Laravel préparé"
    else
        log_warning "PHP non disponible. Configuration manuelle du backend requise."
    fi
    
    cd ..
}

# Fonction de préparation du frontend
prepare_frontend() {
    log_info "Préparation du frontend React..."
    
    cd frontend
    
    # Installer les dépendances
    if [ ! -d "node_modules" ]; then
        log_info "Installation des dépendances NPM..."
        npm install
        log_success "Dépendances NPM installées"
    else
        log_success "Dépendances NPM déjà installées"
    fi
    
    cd ..
}

# Fonction de démarrage
start_servers() {
    log_info "Démarrage des serveurs..."
    
    # Créer les fichiers de log
    mkdir -p logs
    
    # Démarrer le backend (si PHP disponible)
    if command -v php &> /dev/null; then
        log_info "Démarrage du backend Laravel sur http://localhost:8000..."
        cd backend
        php artisan serve --host=0.0.0.0 --port=8000 > ../logs/backend.log 2>&1 &
        BACKEND_PID=$!
        cd ..
        
        # Attendre que le backend démarre
        sleep 3
        
        if ps -p $BACKEND_PID > /dev/null; then
            log_success "Backend démarré (PID: $BACKEND_PID)"
            echo $BACKEND_PID > logs/backend.pid
        else
            log_error "Échec du démarrage du backend"
            cat logs/backend.log
            exit 1
        fi
    else
        log_warning "Backend non démarré - PHP non disponible"
    fi
    
    # Démarrer le frontend
    log_info "Démarrage du frontend React sur http://localhost:3000..."
    cd frontend
    
    # Définir les variables d'environnement React
    export REACT_APP_API_URL="http://localhost:8000/api"
    export BROWSER=none  # Éviter l'ouverture automatique du navigateur
    
    npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Attendre que le frontend démarre
    sleep 5
    
    if ps -p $FRONTEND_PID > /dev/null; then
        log_success "Frontend démarré (PID: $FRONTEND_PID)"
        echo $FRONTEND_PID > logs/frontend.pid
    else
        log_error "Échec du démarrage du frontend"
        cat logs/frontend.log
        exit 1
    fi
}

# Fonction d'affichage des informations de connexion
show_access_info() {
    echo ""
    echo "🎉 === SERVEURS DÉMARRÉS AVEC SUCCÈS ==="
    echo ""
    log_success "🌐 Application Web: http://localhost:3000"
    log_success "🔧 API Backend: http://localhost:8000"
    log_success "🤖 Assistant IA: http://localhost:3000/ai-assistant"
    echo ""
    log_info "📊 Logs en temps réel :"
    log_info "   Backend: tail -f logs/backend.log"
    log_info "   Frontend: tail -f logs/frontend.log"
    echo ""
    log_info "🛑 Arrêter les serveurs :"
    log_info "   ./stop-servers.sh"
    echo ""
    log_warning "🔑 N'oubliez pas de configurer vos clés API IA dans backend/.env"
    log_warning "📖 Voir CONFIGURATION-IA.md pour les détails"
    echo ""
}

# Fonction principale
main() {
    echo "🚀 Démarrage de l'Assistant IA Expert EPE..."
    echo "📁 Répertoire: $(pwd)"
    echo ""
    
    check_requirements
    prepare_backend
    prepare_frontend
    start_servers
    show_access_info
    
    # Garder le script actif
    log_info "Appuyez sur Ctrl+C pour arrêter les serveurs"
    
    # Gestionnaire de signal pour arrêt propre
    trap 'log_info "Arrêt des serveurs..."; ./stop-servers.sh 2>/dev/null; exit 0' INT TERM
    
    # Boucle infinie pour garder le script actif
    while true; do
        sleep 1
    done
}

# Exécution
main "$@"