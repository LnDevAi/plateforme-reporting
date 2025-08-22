# Script PowerShell pour déploiement rapide avec utilisateur admin
param(
    [string]$VpsIp = "213.199.63.30",
    [string]$VpsUser = "root"
)

Write-Host "🚀 Déploiement rapide avec utilisateur admin" -ForegroundColor Green

# Vérifier que nous sommes dans le bon dossier
$projectPath = "C:\Users\HP\Documents\GitHub\plateforme-reporting\plateforme-reporting\E REPORTING-IA-JAVA"
Set-Location $projectPath

Write-Host "📍 Dossier: $(Get-Location)" -ForegroundColor Cyan

# Créer le script de déploiement rapide pour le VPS
$quickDeployScript = @"
#!/bin/bash
set -e

echo "🚀 Déploiement rapide avec utilisateur admin..."

PROJECT_DIR="/opt/plateforme-reporting/E REPORTING-IA-JAVA"
cd "`$PROJECT_DIR"

# Arrêter les services
echo "🛑 Arrêt des services..."
sudo systemctl stop reporting-backend 2>/dev/null || true

# Mise à jour du code
echo "📥 Mise à jour du code..."
git pull origin main || git pull origin master || echo "⚠️ Git pull échoué"

# Build backend rapide
echo "🔨 Build backend..."
cd backend
mvn clean package -DskipTests -q

# Build frontend rapide
echo "🔨 Build frontend..."
cd ../frontend
npm run build --prod

# Déployer frontend
echo "📦 Déploiement frontend..."
sudo cp -r dist/* /var/www/reporting-ia/

# Redémarrer les services
echo "🚀 Redémarrage des services..."
sudo systemctl start reporting-backend
sudo systemctl restart nginx

echo ""
echo "✅ Déploiement terminé!"
echo "🌐 Application: http://`$(hostname -I | awk '{print `$1}')"
echo ""
echo "👤 Identifiants admin:"
echo "   Email: admin@demo.local"
echo "   Mot de passe: admin123"
"@

# Sauvegarder le script
$quickDeployScript | Out-File -FilePath ".\deploy\deploy-quick.sh" -Encoding UTF8

Write-Host "✅ Script de déploiement rapide créé" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Commandes pour le VPS:" -ForegroundColor Yellow
Write-Host "ssh $VpsUser@$VpsIp" -ForegroundColor Cyan
Write-Host "cd '/opt/plateforme-reporting/E REPORTING-IA-JAVA'" -ForegroundColor Cyan
Write-Host "chmod +x deploy/deploy-quick.sh" -ForegroundColor Cyan
Write-Host "./deploy/deploy-quick.sh" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔐 Identifiants admin pour tester:" -ForegroundColor Yellow
Write-Host "Email: admin@demo.local" -ForegroundColor Green
Write-Host "Mot de passe: admin123" -ForegroundColor Green

Write-Host ""
Write-Host "🌐 URL après déploiement:" -ForegroundColor Yellow
Write-Host "http://$VpsIp" -ForegroundColor Cyan
