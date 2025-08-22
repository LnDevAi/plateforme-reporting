# Script PowerShell simplifié pour déploiement SSH
param(
    [string]$VpsIp = "213.199.63.30",
    [string]$VpsUser = "root"
)

Write-Host "🚀 Déploiement automatique sur VPS $VpsIp" -ForegroundColor Green

# Commandes bash simplifiées
$commands = @'
cd "/opt/plateforme-reporting/E REPORTING-IA-JAVA"
echo "📍 Dans le dossier: $(pwd)"

# Arrêter services
sudo systemctl stop reporting-backend 2>/dev/null || true

# Mise à jour code
git pull origin main || git pull origin master || echo "Git pull échoué"

# Build backend
cd backend
mvn clean package -DskipTests -q
echo "✅ Backend buildé"

# Build frontend
cd ../frontend
npm install --silent
npm run build --prod
echo "✅ Frontend buildé"

# Déployer
sudo mkdir -p /var/www/reporting-ia
sudo cp -r dist/* /var/www/reporting-ia/
sudo chown -R www-data:www-data /var/www/reporting-ia

# Service backend
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

[Install]
WantedBy=multi-user.target
EOL

# Config Nginx
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
    }
}
EOL

sudo ln -sf /etc/nginx/sites-available/reporting-ia.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

# Redémarrer
sudo systemctl daemon-reload
sudo systemctl enable reporting-backend
sudo systemctl start reporting-backend
sudo systemctl restart nginx

echo "✅ Déploiement terminé!"
echo "🌐 Application: http://$(hostname -I | awk '{print $1}')"
echo "👤 Admin: admin@demo.local / admin123"
'@

Write-Host "📝 Commandes préparées" -ForegroundColor Yellow

# Tenter SSH
try {
    if (Get-Command ssh -ErrorAction SilentlyContinue) {
        Write-Host "🔗 Connexion SSH..." -ForegroundColor Cyan
        $commands | ssh $VpsUser@$VpsIp 'bash -s'
        Write-Host "✅ Déploiement réussi!" -ForegroundColor Green
    } else {
        Write-Host "❌ SSH non disponible" -ForegroundColor Red
        Write-Host "Commandes à exécuter manuellement:" -ForegroundColor Yellow
        Write-Host $commands -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Commandes manuelles:" -ForegroundColor Yellow
    Write-Host $commands -ForegroundColor Cyan
}
