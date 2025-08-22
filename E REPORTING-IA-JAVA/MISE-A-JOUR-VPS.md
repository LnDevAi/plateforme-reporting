# 🔄 Mise à Jour VPS Existant

## Situation
Vous avez déjà cloné le projet sur votre VPS **avant** mes corrections. Voici comment appliquer les corrections.

## 📋 Étapes de Mise à Jour

### 1. Connectez-vous à votre VPS
```bash
ssh votre-utilisateur@votre-vps
```

### 2. Naviguez vers le projet
```bash
cd /opt/plateforme-reporting
```

### 3. Sauvegardez vos modifications locales (si il y en a)
```bash
git stash
```

### 4. Récupérez les corrections
```bash
git pull origin main
```

### 5. Exécutez le script de mise à jour
```bash
cd "E REPORTING-IA-JAVA/deploy"
chmod +x update-existing-vps.sh
sudo ./update-existing-vps.sh
```

## 🔧 Alternative Manuelle

Si le script automatique ne fonctionne pas, voici les étapes manuelles :

### Backend
```bash
cd /opt/plateforme-reporting/E\ REPORTING-IA-JAVA/backend

# Rebuild avec les nouvelles dépendances
mvn clean package -DskipTests

# Mettre à jour le service
sudo cp ../deploy/reporting-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart reporting-backend
```

### Frontend
```bash
cd /opt/plateforme-reporting/E\ REPORTING-IA-JAVA/frontend

# Créer les fichiers d'environnement
mkdir -p src/environments

# environment.ts
cat > src/environments/environment.ts << 'EOF'
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
EOF

# environment.prod.ts
cat > src/environments/environment.prod.ts << 'EOF'
export const environment = {
  production: true,
  apiUrl: '/api'
};
EOF

# Rebuild
npm ci
npm run build

# Déployer
sudo rsync -a --delete dist/reporting-frontend/ /var/www/reporting-ia/
```

### Nginx
```bash
# Corriger la configuration
sudo cp /opt/plateforme-reporting/E\ REPORTING-IA-JAVA/deploy/nginx-site.conf /etc/nginx/sites-available/reporting-ia.conf
sudo nginx -t
sudo systemctl reload nginx
```

## ✅ Vérification

Après la mise à jour :

```bash
# Status des services
sudo systemctl status reporting-backend nginx

# Tests
curl http://localhost:8080/actuator/health
curl http://localhost/

# Logs si problème
sudo journalctl -u reporting-backend -f
```

## 🚨 En Cas de Problème

1. **Backend ne démarre pas** :
   ```bash
   sudo journalctl -u reporting-backend --no-pager -n 20
   ```

2. **Frontend 502** :
   ```bash
   sudo nginx -t
   netstat -tlnp | grep 8080
   ```

3. **Restaurer l'ancienne config** :
   ```bash
   sudo cp /tmp/nginx-backup.conf /etc/nginx/sites-available/reporting-ia.conf
   sudo cp /tmp/systemd-backup.service /etc/systemd/system/reporting-backend.service
   ```

## 📞 Support

Si vous rencontrez des erreurs, collectez ces informations :
- `sudo systemctl status reporting-backend nginx`
- `sudo journalctl -u reporting-backend --no-pager -n 50`
- `sudo nginx -T`
