#!/bin/bash

# Script de mise à jour pour VPS existant avec corrections
# Usage: ./update-existing-vps.sh

set -e

echo "🔄 Mise à jour du VPS existant avec les corrections..."

# Variables
PROJECT_DIR="/opt/plateforme-reporting"
BACKEND_DIR="$PROJECT_DIR/E REPORTING-IA-JAVA/backend"
FRONTEND_DIR="$PROJECT_DIR/E REPORTING-IA-JAVA/frontend"
DEPLOY_DIR="$PROJECT_DIR/E REPORTING-IA-JAVA/deploy"

# Vérifier que le projet existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Erreur: Projet non trouvé dans $PROJECT_DIR"
    echo "Veuillez d'abord cloner le projet ou ajuster PROJECT_DIR"
    exit 1
fi

echo "📁 Projet trouvé dans $PROJECT_DIR"

# Arrêter les services existants
echo "🛑 Arrêt des services existants..."
sudo systemctl stop reporting-backend 2>/dev/null || echo "Service reporting-backend non trouvé"
sudo systemctl stop nginx 2>/dev/null || echo "Nginx déjà arrêté"

# Sauvegarder les anciennes configurations
echo "💾 Sauvegarde des configurations existantes..."
sudo cp /etc/nginx/sites-available/reporting-ia.conf /tmp/nginx-backup.conf 2>/dev/null || echo "Pas de config nginx existante"
sudo cp /etc/systemd/system/reporting-backend.service /tmp/systemd-backup.service 2>/dev/null || echo "Pas de service systemd existant"

# Mise à jour du code depuis GitHub
echo "📥 Récupération des dernières corrections..."
cd "$PROJECT_DIR"
git stash 2>/dev/null || true  # Sauvegarder les modifications locales
git pull origin main

# Appliquer les corrections si elles ne sont pas encore présentes
echo "🔧 Application des corrections..."

# 1. Vérifier et corriger pom.xml
if ! grep -q "spring-boot-starter-data-jpa" "$BACKEND_DIR/pom.xml"; then
    echo "⚠️  pom.xml nécessite une mise à jour manuelle"
    echo "Ajoutez les dépendances JPA et H2 comme dans le nouveau pom.xml"
fi

# 2. Vérifier application.properties
if [ $(wc -l < "$BACKEND_DIR/src/main/resources/application.properties") -lt 10 ]; then
    echo "⚠️  application.properties sera mis à jour"
    # Le git pull devrait avoir mis à jour ce fichier
fi

# 3. Créer les fichiers d'environnement Angular s'ils n'existent pas
mkdir -p "$FRONTEND_DIR/src/environments"
if [ ! -f "$FRONTEND_DIR/src/environments/environment.ts" ]; then
    cat > "$FRONTEND_DIR/src/environments/environment.ts" << 'EOF'
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
EOF
    echo "✅ Fichier environment.ts créé"
fi

if [ ! -f "$FRONTEND_DIR/src/environments/environment.prod.ts" ]; then
    cat > "$FRONTEND_DIR/src/environments/environment.prod.ts" << 'EOF'
export const environment = {
  production: true,
  apiUrl: '/api'
};
EOF
    echo "✅ Fichier environment.prod.ts créé"
fi

# Build du backend avec les nouvelles dépendances
echo "🔨 Build du backend..."
cd "$BACKEND_DIR"
mvn clean package -DskipTests -q

if [ ! -f "target/backend-0.0.1-SNAPSHOT.jar" ]; then
    echo "❌ Erreur: Build backend échoué"
    exit 1
fi

# Build du frontend avec la configuration de production
echo "🔨 Build du frontend..."
cd "$FRONTEND_DIR"
npm ci --silent
npm run build

if [ ! -d "dist/reporting-frontend" ]; then
    echo "❌ Erreur: Build frontend échoué"
    exit 1
fi

# Configuration du service systemd avec les corrections
echo "⚙️  Configuration du service backend..."
sudo cp "$DEPLOY_DIR/reporting-backend.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable reporting-backend

# Déploiement du frontend
echo "📦 Déploiement du frontend..."
sudo mkdir -p /var/www/reporting-ia
sudo rsync -a --delete "$FRONTEND_DIR/dist/reporting-frontend/" /var/www/reporting-ia/
sudo chown -R www-data:www-data /var/www/reporting-ia

# Configuration Nginx avec le port corrigé
echo "🌐 Configuration Nginx..."
sudo cp "$DEPLOY_DIR/nginx-site.conf" /etc/nginx/sites-available/reporting-ia.conf
sudo ln -sf /etc/nginx/sites-available/reporting-ia.conf /etc/nginx/sites-enabled/reporting-ia.conf

# Supprimer le site par défaut
sudo rm -f /etc/nginx/sites-enabled/default

# Test de la configuration
sudo nginx -t

# Démarrage des services
echo "🚀 Démarrage des services..."
sudo systemctl start reporting-backend
sleep 5
sudo systemctl start nginx

# Vérification
echo "🔍 Vérification..."
if sudo systemctl is-active --quiet reporting-backend; then
    echo "✅ Backend démarré"
else
    echo "❌ Problème backend - vérifiez les logs:"
    sudo journalctl -u reporting-backend --no-pager -n 10
fi

if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx démarré"
else
    echo "❌ Problème Nginx"
fi

# Tests de connectivité
echo "🧪 Tests..."
sleep 3

if curl -f http://localhost:8080/actuator/health >/dev/null 2>&1; then
    echo "✅ Backend accessible (port 8080)"
else
    echo "⚠️  Backend non accessible"
fi

if curl -f http://localhost/ >/dev/null 2>&1; then
    echo "✅ Frontend accessible (port 80)"
else
    echo "⚠️  Frontend non accessible"
fi

echo ""
echo "🎉 Mise à jour terminée!"
echo "📍 Application: http://123.199.63.30"
echo "📊 Health: http://123.199.63.30:8080/actuator/health"
echo ""
echo "📝 Si problèmes:"
echo "   sudo journalctl -u reporting-backend -f"
echo "   sudo systemctl status reporting-backend nginx"
