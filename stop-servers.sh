#!/bin/bash

# 🛑 Script d'Arrêt - Assistant IA Expert EPE
# Arrête proprement le backend Laravel et le frontend React

echo "🛑 Arrêt des serveurs Assistant IA Expert EPE..."

# Configuration des couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "ℹ️  $1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Arrêter le backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        log_info "Arrêt du backend Laravel (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        log_success "Backend arrêté"
    else
        log_warning "Backend déjà arrêté"
    fi
    rm -f logs/backend.pid
else
    log_warning "Fichier PID backend non trouvé"
fi

# Arrêter le frontend
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        log_info "Arrêt du frontend React (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        log_success "Frontend arrêté"
    else
        log_warning "Frontend déjà arrêté"
    fi
    rm -f logs/frontend.pid
else
    log_warning "Fichier PID frontend non trouvé"
fi

# Nettoyer les processus restants
log_info "Nettoyage des processus restants..."
pkill -f "php artisan serve" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

log_success "Tous les serveurs ont été arrêtés"
echo "🎯 Assistant IA Expert EPE arrêté avec succès"