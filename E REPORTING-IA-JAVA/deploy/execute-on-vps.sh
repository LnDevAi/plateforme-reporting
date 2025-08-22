#!/bin/bash
# Script à exécuter directement sur le VPS 213.199.63.30

echo "🚀 Déploiement automatique - $(date)"
echo "📍 Dossier actuel: $(pwd)"

# Naviguer vers le bon dossier
cd "/opt/plateforme-reporting/E REPORTING-IA-JAVA" || {
    echo "❌ Erreur: Impossible d'accéder au dossier projet"
    exit 1
}

echo "✅ Dans le dossier: $(pwd)"

# Arrêter les services existants
echo "🛑 Arrêt des services..."
sudo systemctl stop reporting-backend 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# Mise à jour du code
echo "📥 Mise à jour du code..."
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || echo "⚠️ Git pull échoué"

# Build backend
echo "🔨 Build backend..."
cd backend
mvn clean package -DskipTests -q
if [ $? -eq 0 ]; then
    echo "✅ Backend buildé avec succès"
else
    echo "❌ Erreur build backend"
    exit 1
fi

# Build frontend
echo "🔨 Build frontend..."
cd ../frontend
npm install --silent
npm run build --prod
if [ $? -eq 0 ]; then
    echo "✅ Frontend buildé avec succès"
else
    echo "❌ Erreur build frontend"
    exit 1
fi

# Déployer frontend
echo "📦 Déploiement frontend..."
sudo mkdir -p /var/www/reporting-ia
sudo cp -r dist/* /var/www/reporting-ia/
sudo chown -R www-data:www-data /var/www/reporting-ia
echo "✅ Frontend déployé"

# Configuration service backend
echo "⚙️ Configuration service backend..."
sudo tee /etc/systemd/system/reporting-backend.service > /dev/null << 'EOL'
[Unit]
Description=Reporting Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/plateforme-reporting/E REPORTING-IA-JAVA/backend
ExecStart=/usr/bin/java -jar /opt/plateforme-reporting/E REPORTING-IA-JAVA/backend/target/backend-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL

# Configuration Nginx
echo "⚙️ Configuration Nginx..."
sudo tee /etc/nginx/sites-available/reporting-ia.conf > /dev/null << 'EOL'
server {
    listen 80;
    server_name _;
    root /var/www/reporting-ia;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOL

# Activer la configuration
sudo ln -sf /etc/nginx/sites-available/reporting-ia.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Tester la configuration Nginx
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erreur configuration Nginx"
    exit 1
fi

# Redémarrer les services
echo "🔄 Redémarrage des services..."
sudo systemctl daemon-reload
sudo systemctl enable reporting-backend
sudo systemctl start reporting-backend
sudo systemctl restart nginx

# Vérifier les services
echo "🔍 Vérification des services..."
sleep 5

# Status backend
if sudo systemctl is-active --quiet reporting-backend; then
    echo "✅ Service backend: ACTIF"
else
    echo "❌ Service backend: INACTIF"
    sudo systemctl status reporting-backend --no-pager -l
fi

# Status nginx
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Service nginx: ACTIF"
else
    echo "❌ Service nginx: INACTIF"
    sudo systemctl status nginx --no-pager -l
fi

# Test de connectivité
echo "🌐 Tests de connectivité..."
LOCAL_IP=$(hostname -I | awk '{print $1}')

# Test backend health
if curl -s http://localhost:8080/actuator/health > /dev/null; then
    echo "✅ Backend health: OK"
else
    echo "❌ Backend health: ÉCHEC"
fi

# Test frontend
if curl -s http://localhost/ > /dev/null; then
    echo "✅ Frontend: OK"
else
    echo "❌ Frontend: ÉCHEC"
fi

echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Application: http://$LOCAL_IP"
echo "🔧 Backend Health: http://$LOCAL_IP:8080/actuator/health"
echo "👤 Identifiants admin:"
echo "   📧 Email: admin@demo.local"
echo "   🔑 Mot de passe: admin123"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
