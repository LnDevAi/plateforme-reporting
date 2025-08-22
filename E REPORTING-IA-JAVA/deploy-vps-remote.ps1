# Script PowerShell pour déployer automatiquement sur le VPS via SSH
param(
    [string]$VpsIp = "213.199.63.30",
    [string]$VpsUser = "root"
)

Write-Host "🚀 Déploiement automatique sur VPS $VpsIp" -ForegroundColor Green

# Commandes à exécuter sur le VPS
$deployCommands = @"
#!/bin/bash
set -e

echo "🔍 Navigation vers le dossier du projet..."
cd "/opt/plateforme-reporting/E REPORTING-IA-JAVA"

echo "📍 Dossier actuel: `$(pwd)"

# Créer le dossier deploy s'il n'existe pas
mkdir -p deploy

# Arrêter les services
echo "🛑 Arrêt des services..."
sudo systemctl stop reporting-backend 2>/dev/null || true

# Mise à jour du code
echo "📥 Mise à jour du code..."
git pull origin main || git pull origin master || echo "⚠️ Git pull échoué"

# Build backend
echo "🔨 Build backend..."
cd backend
mvn clean package -DskipTests -q

# Build frontend
echo "🔨 Build frontend..."
cd ../frontend
npm install --silent
npm run build --prod

# Déployer frontend
echo "📦 Déploiement frontend..."
sudo mkdir -p /var/www/reporting-ia
sudo cp -r dist/* /var/www/reporting-ia/
sudo chown -R www-data:www-data /var/www/reporting-ia

# Configuration service backend
echo "⚙️ Configuration service backend..."
sudo tee /etc/systemd/system/reporting-backend.service > /dev/null << EOL
[Unit]
Description=Reporting Backend Service
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
sudo tee /etc/nginx/sites-available/reporting-ia.conf > /dev/null << EOL
server {
    listen 80;
    server_name _;
    
    root /var/www/reporting-ia;
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
}
EOL

# Activer le site
sudo ln -sf /etc/nginx/sites-available/reporting-ia.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test config Nginx
sudo nginx -t

# Redémarrer les services
echo "🚀 Redémarrage des services..."
sudo systemctl daemon-reload
sudo systemctl enable reporting-backend
sudo systemctl start reporting-backend
sudo systemctl restart nginx

# Vérification
echo "🔍 Vérification..."
sleep 3

if sudo systemctl is-active --quiet reporting-backend; then
    echo "✅ Backend démarré"
else
    echo "❌ Backend non démarré"
    sudo journalctl -u reporting-backend --no-pager -n 10
fi

if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx démarré"
else
    echo "❌ Nginx non démarré"
fi

echo ""
echo "🎉 Déploiement terminé!"
echo "🌐 Application: http://`$(hostname -I | awk '{print `$1}')"
echo ""
echo "👤 Identifiants admin:"
echo "   Email: admin@demo.local"
echo "   Mot de passe: admin123"
"@

# Sauvegarder les commandes dans un fichier temporaire
$tempScript = "C:\temp\vps-deploy.sh"
$deployCommands | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "📝 Script de déploiement créé: $tempScript" -ForegroundColor Yellow

# Exécuter via SSH
Write-Host "🔗 Connexion SSH au VPS..." -ForegroundColor Cyan

try {
    # Utiliser plink (PuTTY) si disponible, sinon ssh natif
    if (Get-Command plink -ErrorAction SilentlyContinue) {
        Write-Host "Utilisation de plink..." -ForegroundColor Yellow
        $deployCommands | plink -ssh -batch $VpsUser@$VpsIp
    } elseif (Get-Command ssh -ErrorAction SilentlyContinue) {
        Write-Host "Utilisation de ssh natif..." -ForegroundColor Yellow
        $deployCommands | ssh $VpsUser@$VpsIp 'bash -s'
    } else {
        Write-Host "❌ SSH non disponible. Installez OpenSSH ou PuTTY" -ForegroundColor Red
        Write-Host "📋 Commandes à exécuter manuellement sur le VPS:" -ForegroundColor Yellow
        Write-Host $deployCommands -ForegroundColor Cyan
        return
    }
    
    Write-Host ""
    Write-Host "✅ Déploiement terminé avec succès!" -ForegroundColor Green
    Write-Host "🌐 Application accessible sur: http://$VpsIp" -ForegroundColor Cyan
    Write-Host "🔐 Identifiants: admin@demo.local / admin123" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erreur SSH: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "📋 Exécutez manuellement sur le VPS:" -ForegroundColor Yellow
    Write-Host $deployCommands -ForegroundColor Cyan
}

# Nettoyer le fichier temporaire
if (Test-Path $tempScript) {
    Remove-Item $tempScript -Force
}
