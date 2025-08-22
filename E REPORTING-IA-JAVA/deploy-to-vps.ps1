# Script PowerShell pour déployer vers le VPS Linux depuis Windows
param(
    [string]$VpsIp = "213.199.63.30",
    [string]$VpsUser = "root"
)

Write-Host "🚀 Déploiement vers VPS $VpsIp" -ForegroundColor Green

# Vérifier que nous sommes dans le bon dossier
$currentPath = Get-Location
$projectPath = "C:\Users\HP\Documents\GitHub\plateforme-reporting\plateforme-reporting\E REPORTING-IA-JAVA"

if ($currentPath.Path -ne $projectPath) {
    Write-Host "📂 Navigation vers le dossier projet..." -ForegroundColor Yellow
    Set-Location $projectPath
}

Write-Host "📍 Dossier actuel: $(Get-Location)" -ForegroundColor Cyan
Write-Host "📋 Contenu du dossier:" -ForegroundColor Cyan
Get-ChildItem | Format-Table Name, LastWriteTime -AutoSize

# Créer le script de déploiement pour le VPS
$deployScript = @"
#!/bin/bash
set -e

echo "🚀 Déploiement sur VPS Linux..."

# Variables
PROJECT_DIR="/opt/plateforme-reporting/E REPORTING-IA-JAVA"
BACKEND_DIR="`$PROJECT_DIR/backend"
FRONTEND_DIR="`$PROJECT_DIR/frontend"
WEB_ROOT="/var/www/reporting-ia"

echo "📂 Navigation vers `$PROJECT_DIR"
cd "`$PROJECT_DIR"

# Mettre à jour le code
echo "📥 Mise à jour du code..."
git pull origin main || git pull origin master || echo "⚠️ Git pull échoué"

# Arrêter les services
echo "🛑 Arrêt des services..."
systemctl stop reporting-backend 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true

# Build backend
echo "🔨 Build backend Spring Boot..."
cd "`$BACKEND_DIR"
mvn clean package -DskipTests

# Build frontend
echo "🔨 Build frontend Angular..."
cd "`$FRONTEND_DIR"
npm install
npm run build --prod

# Déployer frontend
echo "📦 Déploiement frontend..."
mkdir -p "`$WEB_ROOT"
cp -r dist/* "`$WEB_ROOT/"
chown -R www-data:www-data "`$WEB_ROOT"
chmod -R 755 "`$WEB_ROOT"

# Service backend
echo "⚙️ Configuration service backend..."
cat > /etc/systemd/system/reporting-backend.service << EOL
[Unit]
Description=Reporting Backend Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=`$BACKEND_DIR
ExecStart=/usr/bin/java -jar `$BACKEND_DIR/target/backend-0.0.1-SNAPSHOT.jar
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
cat > /etc/nginx/sites-available/reporting-ia.conf << EOL
server {
    listen 80;
    server_name _;
    
    root `$WEB_ROOT;
    index index.html;
    
    location / {
        try_files \`$uri \`$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host \`$host;
        proxy_set_header X-Real-IP \`$remote_addr;
        proxy_set_header X-Forwarded-For \`$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \`$scheme;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)`$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOL

# Activer le site
ln -sf /etc/nginx/sites-available/reporting-ia.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester la config Nginx
nginx -t

# Démarrer les services
echo "🚀 Démarrage des services..."
systemctl daemon-reload
systemctl enable reporting-backend
systemctl start reporting-backend
systemctl start nginx

# Vérification
echo "🔍 Vérification du déploiement..."
sleep 5

if curl -f http://localhost:8080/actuator/health >/dev/null 2>&1; then
    echo "✅ Backend accessible"
else
    echo "⚠️ Backend non accessible"
fi

if curl -f http://localhost/ >/dev/null 2>&1; then
    echo "✅ Frontend accessible"
else
    echo "⚠️ Frontend non accessible"
fi

echo ""
echo "🎉 Déploiement terminé!"
echo "🌐 Frontend: http://`$(hostname -I | awk '{print `$1}')"
echo "🔧 Backend: http://`$(hostname -I | awk '{print `$1}'):8080/actuator/health"
echo ""
echo "📊 Status des services:"
systemctl status reporting-backend --no-pager -l
systemctl status nginx --no-pager -l
"@

# Sauvegarder le script de déploiement
$deployScript | Out-File -FilePath ".\deploy\deploy-vps.sh" -Encoding UTF8
Write-Host "✅ Script de déploiement créé: .\deploy\deploy-vps.sh" -ForegroundColor Green

# Commandes pour exécuter sur le VPS
Write-Host ""
Write-Host "📋 Commandes à exécuter sur le VPS:" -ForegroundColor Yellow
Write-Host "ssh $VpsUser@$VpsIp" -ForegroundColor Cyan
Write-Host "cd /opt/plateforme-reporting/E\ REPORTING-IA-JAVA" -ForegroundColor Cyan
Write-Host "chmod +x deploy/deploy-vps.sh" -ForegroundColor Cyan
Write-Host "./deploy/deploy-vps.sh" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔗 URLs après déploiement:" -ForegroundColor Yellow
Write-Host "Frontend: http://$VpsIp" -ForegroundColor Cyan
Write-Host "Backend Health: http://$VpsIp:8080/actuator/health" -ForegroundColor Cyan
