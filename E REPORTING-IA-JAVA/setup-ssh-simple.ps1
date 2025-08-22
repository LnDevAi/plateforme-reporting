# Script simplifié pour configurer SSH automatique
Write-Host "🔑 Configuration SSH automatique" -ForegroundColor Green

# Étape 1: Générer la clé SSH
Write-Host "1. Génération de la clé SSH..." -ForegroundColor Yellow
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\vps_key" -N '""'

# Étape 2: Afficher la clé publique à copier
Write-Host "2. Clé publique générée:" -ForegroundColor Yellow
$publicKey = Get-Content "$env:USERPROFILE\.ssh\vps_key.pub"
Write-Host $publicKey -ForegroundColor Cyan

# Étape 3: Instructions pour déployer sur le VPS
Write-Host "`n3. Copiez cette commande et exécutez-la:" -ForegroundColor Yellow
$deployCommand = "echo '$publicKey' | ssh root@213.199.63.30 `"mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh`""
Write-Host $deployCommand -ForegroundColor White

Write-Host "`n4. Après déploiement, testez avec:" -ForegroundColor Yellow
Write-Host "ssh -i `"$env:USERPROFILE\.ssh\vps_key`" root@213.199.63.30" -ForegroundColor White

Write-Host "`n✅ Une fois configuré, je pourrai travailler directement sur le VPS!" -ForegroundColor Green
