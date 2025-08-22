# Script pour configurer SSH automatique vers le VPS
param(
    [string]$VpsIp = "213.199.63.30",
    [string]$VpsUser = "root"
)

Write-Host "🔑 Configuration SSH automatique pour VPS $VpsIp" -ForegroundColor Green

# Créer le dossier .ssh s'il n'existe pas
$sshDir = "$env:USERPROFILE\.ssh"
if (!(Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force
    Write-Host "✅ Dossier .ssh créé" -ForegroundColor Green
}

# Générer la clé SSH
$keyPath = "$sshDir\vps_key"
if (!(Test-Path $keyPath)) {
    Write-Host "🔧 Génération de la clé SSH..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -f $keyPath -N '""'
    Write-Host "✅ Clé SSH générée" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Clé SSH existe déjà" -ForegroundColor Cyan
}

# Copier la clé publique sur le VPS
Write-Host "📤 Copie de la clé publique sur le VPS..." -ForegroundColor Yellow
Write-Host "⚠️ Vous devrez entrer le mot de passe root une dernière fois" -ForegroundColor Red

$publicKey = Get-Content "$keyPath.pub"
$sshCommand = @"
mkdir -p ~/.ssh
echo '$publicKey' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
echo 'SSH key deployed successfully'
"@

try {
    $result = $sshCommand | ssh $VpsUser@$VpsIp 'bash -s'
    Write-Host "✅ Clé publique déployée sur le VPS" -ForegroundColor Green
    
    # Tester la connexion automatique
    Write-Host "🧪 Test de connexion automatique..." -ForegroundColor Yellow
    $testResult = ssh -i $keyPath $VpsUser@$VpsIp "echo 'Connexion SSH automatique réussie!'"
    
    if ($testResult -eq "Connexion SSH automatique réussie!") {
        Write-Host "🎉 SSH automatique configuré avec succès!" -ForegroundColor Green
        Write-Host "Vous pouvez maintenant vous connecter sans mot de passe avec:" -ForegroundColor Cyan
        Write-Host "ssh -i `"$keyPath`" $VpsUser@$VpsIp" -ForegroundColor White
        
        # Créer un alias pour faciliter la connexion
        $aliasScript = @"
# Alias pour connexion VPS automatique
function Connect-VPS {
    ssh -i "$keyPath" $VpsUser@$VpsIp
}
Set-Alias -Name vps -Value Connect-VPS
"@
        
        $aliasScript | Out-File -FilePath "$sshDir\vps-alias.ps1" -Encoding UTF8
        Write-Host "💡 Alias créé: Tapez 'vps' pour vous connecter rapidement" -ForegroundColor Cyan
        Write-Host "   Pour activer l'alias: . `"$sshDir\vps-alias.ps1`"" -ForegroundColor Cyan
        
    } else {
        Write-Host "❌ Erreur lors du test de connexion" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erreur lors du déploiement: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Vérifiez que le VPS est accessible et que vous avez les bonnes permissions" -ForegroundColor Yellow
}

Write-Host "`n📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "1. Testez: ssh -i `"$keyPath`" $VpsUser@$VpsIp" -ForegroundColor White
Write-Host "2. Si ça marche, je pourrai exécuter les commandes automatiquement!" -ForegroundColor White
