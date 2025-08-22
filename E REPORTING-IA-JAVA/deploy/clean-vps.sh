#!/bin/bash

# Script de nettoyage complet du VPS
# Usage: ./clean-vps.sh
# ATTENTION: Ce script supprime TOUT le contenu lié à la plateforme

set -e

echo "🧹 NETTOYAGE COMPLET DU VPS - ATTENTION: SUPPRESSION DÉFINITIVE"
echo "⚠️  Ce script va supprimer tous les fichiers et configurations"
read -p "Êtes-vous sûr de vouloir continuer? (oui/non): " confirm

if [ "$confirm" != "oui" ]; then
    echo "❌ Nettoyage annulé"
    exit 1
fi

echo "🛑 Arrêt de tous les services..."
# Arrêter les services
sudo systemctl stop reporting-backend 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

echo "🗑️ Suppression des services systemd..."
# Supprimer les services systemd
sudo systemctl disable reporting-backend 2>/dev/null || true
sudo rm -f /etc/systemd/system/reporting-backend.service
sudo systemctl daemon-reload

echo "🌐 Nettoyage des configurations Nginx..."
# Supprimer les configurations Nginx
sudo rm -f /etc/nginx/sites-available/reporting-ia.conf
sudo rm -f /etc/nginx/sites-enabled/reporting-ia.conf
sudo rm -f /etc/nginx/sites-enabled/default

# Restaurer la configuration Nginx par défaut
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;
    
    server_name _;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

echo "📁 Suppression des dossiers de l'application..."
# Supprimer les dossiers de l'application
sudo rm -rf /opt/plateforme-reporting
sudo rm -rf /var/www/reporting-ia
sudo rm -rf /var/www/html/index.nginx-debian.html

# Créer une page par défaut
sudo tee /var/www/html/index.html > /dev/null <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>VPS Nettoyé</title>
</head>
<body>
    <h1>VPS nettoyé avec succès</h1>
    <p>Le serveur est prêt pour un nouveau déploiement.</p>
</body>
</html>
EOF

echo "🐳 Nettoyage Docker (si présent)..."
# Nettoyer Docker si présent
if command -v docker >/dev/null 2>&1; then
    sudo docker stop $(sudo docker ps -aq) 2>/dev/null || true
    sudo docker rm $(sudo docker ps -aq) 2>/dev/null || true
    sudo docker rmi $(sudo docker images -q) 2>/dev/null || true
    sudo docker system prune -af 2>/dev/null || true
fi

echo "📦 Nettoyage des packages Java/Maven/Node (optionnel)..."
# Optionnel: supprimer les packages (décommentez si nécessaire)
# sudo apt remove --purge -y openjdk-* maven nodejs npm
# sudo apt autoremove -y
# sudo apt autoclean

echo "🔄 Redémarrage des services..."
# Tester et redémarrer Nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

echo "🧪 Test de la page par défaut..."
if curl -f http://localhost/ >/dev/null 2>&1; then
    echo "✅ Nginx fonctionne - page par défaut accessible"
else
    echo "❌ Problème avec Nginx"
fi

echo ""
echo "🎉 NETTOYAGE COMPLET TERMINÉ!"
echo ""
echo "📋 État du serveur:"
echo "   - Tous les fichiers de l'application supprimés"
echo "   - Services systemd supprimés"
echo "   - Configuration Nginx réinitialisée"
echo "   - Page par défaut restaurée"
echo ""
echo "🚀 Le VPS est maintenant prêt pour un nouveau déploiement"
echo "📍 Page par défaut: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "⚠️  Pour redéployer:"
echo "   1. Cloner le repository"
echo "   2. Exécuter le script de déploiement"
