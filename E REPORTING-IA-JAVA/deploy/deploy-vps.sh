#!/bin/bash

# Script de déploiement automatisé pour VPS
# Usage: ./deploy-vps.sh

set -e

echo "🚀 Début du déploiement de la plateforme de reporting..."

# Variables
PROJECT_DIR="/opt/plateforme-reporting"
BACKEND_DIR="$PROJECT_DIR/E REPORTING-IA-JAVA/backend"
FRONTEND_DIR="$PROJECT_DIR/E REPORTING-IA-JAVA/frontend"
DEPLOY_DIR="$PROJECT_DIR/E REPORTING-IA-JAVA/deploy"

# Vérifier les prérequis
echo "📋 Vérification des prérequis..."
command -v java >/dev/null 2>&1 || { echo "❌ Java 17 requis"; exit 1; }
command -v mvn >/dev/null 2>&1 || { echo "❌ Maven requis"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js requis"; exit 1; }
command -v nginx >/dev/null 2>&1 || { echo "❌ Nginx requis"; exit 1; }

# Arrêter les services existants
echo "🛑 Arrêt des services..."
sudo systemctl stop reporting-backend 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# Mise à jour du code
echo "📥 Mise à jour du code..."
cd "$PROJECT_DIR"
git pull origin main

# Build du backend
echo "🔨 Build du backend Spring Boot..."
cd "$BACKEND_DIR"
mvn clean package -DskipTests -q

# Vérifier que le JAR existe
if [ ! -f "target/backend-0.0.1-SNAPSHOT.jar" ]; then
    echo "❌ Erreur: JAR du backend non trouvé"
    exit 1
fi

# Build du frontend
echo "🔨 Build du frontend Angular..."
cd "$FRONTEND_DIR"
npm install
npm run build --prod

# Déployer frontend
echo "📦 Déploiement frontend..."
WEB_ROOT="/var/www/reporting-ia"
sudo mkdir -p "$WEB_ROOT"
sudo cp -r dist/* "$WEB_ROOT/"
sudo chown -R www-data:www-data "$WEB_ROOT"
sudo chmod -R 755 "$WEB_ROOT"

# Service backend
echo "⚙️ Configuration service backend..."
sudo tee /etc/systemd/system/reporting-backend.service > /dev/null << EOL
[Unit]
Description=Reporting Backend Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$BACKEND_DIR
ExecStart=/usr/bin/java -jar $BACKEND_DIR/target/backend-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=reporting-backend

[Install]
WantedBy=multi-user.target
EOL

# Configuration Nginx
echo "⚙️ Configuration Nginx..."
sudo tee /etc/nginx/sites-available/reporting-ia.conf > /dev/null << EOL
server {
    listen 80;
    server_name _;
    
    root $WEB_ROOT;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOL
# Activer le site
sudo ln -sf /etc/nginx/sites-available/reporting-ia.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test de la configuration Nginx
sudo nginx -t

# Démarrage des services
echo "🚀 Démarrage des services..."
sudo systemctl start reporting-backend
sudo systemctl start nginx

# Vérification du statut
echo "🔍 Vérification du statut..."
sleep 5

if sudo systemctl is-active --quiet reporting-backend; then
    echo "✅ Backend démarré avec succès"
else
    echo "❌ Erreur: Backend non démarré"
    sudo journalctl -u reporting-backend --no-pager -n 20
    exit 1
fi

if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx démarré avec succès"
else
    echo "❌ Erreur: Nginx non démarré"
    exit 1
fi

# Test de connectivité
echo "🧪 Test de connectivité..."
if curl -f http://localhost:8080/actuator/health >/dev/null 2>&1; then
    echo "✅ Backend accessible sur le port 8080"
else
    echo "⚠️ Backend non accessible sur le port 8080"
fi

if curl -f http://localhost/ >/dev/null 2>&1; then
    echo "✅ Frontend accessible sur le port 80"
else
    echo "⚠️ Frontend non accessible sur le port 80"
fi

echo ""
echo "🎉 Déploiement terminé!"
echo "📍 Application accessible sur: http://$(hostname -I | awk '{print $1}')"
echo "📊 Health check backend: http://$(hostname -I | awk '{print $1}'):8080/actuator/health"
echo ""
echo "📝 Commandes utiles:"
echo "   - Logs backend: sudo journalctl -u reporting-backend -f"
echo "   - Redémarrer backend: sudo systemctl restart reporting-backend"
echo "   - Redémarrer nginx: sudo systemctl restart nginx"
