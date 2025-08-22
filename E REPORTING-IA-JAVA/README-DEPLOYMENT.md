# Guide de Déploiement - Plateforme de Reporting

## ✅ Corrections Appliquées

### Erreurs corrigées :
1. **Port backend** : Correction du proxy Nginx (8081 → 8080)
2. **Configuration Angular** : Ajout du build de production
3. **Dépendances Spring Boot** : Ajout JPA, H2, tests
4. **Service systemd** : Amélioration des permissions et logs
5. **Configuration base de données** : Ajout configuration H2 complète

## 🚀 Options de Déploiement

### Option 1: Déploiement VPS (Recommandé)

```bash
# 1. Cloner le projet
cd /opt
sudo git clone https://github.com/LnDevAi/plateforme-reporting.git
sudo chown -R $USER:$USER /opt/plateforme-reporting

# 2. Exécuter le script automatisé
cd /opt/plateforme-reporting/E\ REPORTING-IA-JAVA/deploy
chmod +x deploy-vps.sh
sudo ./deploy-vps.sh
```

### Option 2: Déploiement Docker

```bash
cd /opt/plateforme-reporting/E\ REPORTING-IA-JAVA
docker-compose up -d
```

## 🔧 Prérequis VPS

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y \
  openjdk-17-jre maven nginx curl git

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 📊 Vérification Post-Déploiement

- **Frontend** : http://VOTRE_IP
- **Backend Health** : http://VOTRE_IP:8080/actuator/health
- **Console H2** (dev) : http://VOTRE_IP:8080/h2-console

## 🔍 Dépannage

```bash
# Logs backend
sudo journalctl -u reporting-backend -f

# Status services
sudo systemctl status reporting-backend
sudo systemctl status nginx

# Test connectivité
curl http://localhost:8080/actuator/health
curl http://localhost/
```

## 🔄 Mise à jour

```bash
cd /opt/plateforme-reporting
git pull origin main
sudo ./E\ REPORTING-IA-JAVA/deploy/deploy-vps.sh
```

## 🔒 HTTPS (Optionnel)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votredomaine.com
```
