# Déploiement en production (VPS)

Cible: VPS Linux (Ubuntu/Debian), Nginx pour le frontend, Spring Boot (Java 17) pour le backend via systemd.

Nota: ports configurables
- Backend Spring Boot lit `SERVER_PORT` (par défaut 8080)
- Nginx écoute 80 (modifiable dans le conf)

## 1) Prérequis serveur
- OS: Ubuntu 22.04+/Debian 12+
- Accès sudo
- Nom de domaine (optionnel mais recommandé)

Installer outils:
```bash
sudo apt update && sudo apt install -y openjdk-17-jre maven nginx curl git
# Node 20 (Angular build)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

## 2) Récupération du code
```bash
cd /opt && sudo git clone https://github.com/LnDevAi/plateforme-reporting.git
sudo chown -R $USER:$USER /opt/plateforme-reporting
cd /opt/plateforme-reporting/E\ REPORTING-IA-JAVA
```

## 3) Build backend (Spring Boot)
```bash
cd backend
mvn -q -DskipTests clean package
# Jar attendu: target/backend-0.0.1-SNAPSHOT.jar
```

Créer un service systemd (adapter le port si 8080 occupé):
```bash
sudo cp /opt/plateforme-reporting/E\ REPORTING-IA-JAVA/deploy/reporting-backend.service /etc/systemd/system/reporting-backend.service
# Option: éditer /etc/systemd/system/reporting-backend.service et ajouter
# Environment=SERVER_PORT=9090
sudo systemctl daemon-reload
sudo systemctl enable --now reporting-backend
sudo systemctl status reporting-backend --no-pager
```

## 4) Build frontend (Angular)
```bash
cd /opt/plateforme-reporting/E\ REPORTING-IA-JAVA/frontend
npm ci
npm run build
# Artéfacts: dist/reporting-frontend
```

Publier le frontend via Nginx (adapter listen/server_name si besoin):
```bash
sudo mkdir -p /var/www/reporting-ia
sudo rsync -a dist/reporting-frontend/ /var/www/reporting-ia/

sudo cp /opt/plateforme-reporting/E\ REPORTING-IA-JAVA/deploy/nginx-site.conf /etc/nginx/sites-available/reporting-ia.conf
sudo nano /etc/nginx/sites-available/reporting-ia.conf
# - changer server_name
# - si backend sur 9090, changer proxy_pass en http://127.0.0.1:9090/

sudo ln -sf /etc/nginx/sites-available/reporting-ia.conf /etc/nginx/sites-enabled/reporting-ia.conf
sudo nginx -t && sudo systemctl reload nginx
```

Le site est accessible sur http://VOTRE_DNS ou http://IP. Les requêtes `/api` sont proxy vers `http://127.0.0.1:8080`.

## 5) HTTPS (optionnel mais recommandé)
Avec Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votredomaine.tld -d www.votredomaine.tld
sudo systemctl reload nginx
```

## 6) Mises à jour (pull & rebuild)
```bash
cd /opt/plateforme-reporting
git pull origin main
# Backend
cd E\ REPORTING-IA-JAVA/backend && mvn -q -DskipTests clean package
sudo systemctl restart reporting-backend
# Frontend
cd ../frontend && npm ci && npm run build
sudo rsync -a dist/reporting-frontend/ /var/www/reporting-ia/
sudo systemctl reload nginx
```

## 7) Dépannage rapide
- Backend ne démarre pas: `journalctl -u reporting-backend -f`
- Nginx: `sudo nginx -t` puis `sudo systemctl reload nginx`
- 502/404 sur /api: vérifier que `reporting-backend` écoute en 127.0.0.1:8080
- Build Angular: vérifier Node 20 et npm 10

## 8) Alternative Docker (optionnelle)
Vous pouvez packager le backend dans une image et servir le frontend via Nginx conteneurisé. Non inclus ici pour rester simple, mais ajout possible.