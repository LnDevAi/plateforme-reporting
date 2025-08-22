# Guide de Dépannage - Plateforme de Reporting

## 🚨 Problèmes Courants et Solutions

### 1. Backend ne démarre pas

**Symptômes :**
- Service `reporting-backend` en échec
- Port 8080 non accessible

**Solutions :**
```bash
# Vérifier les logs
sudo journalctl -u reporting-backend -f

# Vérifier Java
java -version  # Doit être Java 17

# Vérifier le JAR
ls -la /opt/plateforme-reporting/E\ REPORTING-IA-JAVA/backend/target/backend-0.0.1-SNAPSHOT.jar

# Rebuild si nécessaire
cd /opt/plateforme-reporting/E\ REPORTING-IA-JAVA/backend
mvn clean package -DskipTests
```

### 2. Frontend affiche erreur 502

**Cause :** Backend non accessible depuis Nginx

**Solutions :**
```bash
# Vérifier que le backend écoute
netstat -tlnp | grep 8080

# Tester directement
curl http://localhost:8080/actuator/health

# Vérifier la config Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Erreurs de build Angular

**Symptômes :**
- `npm run build` échoue
- Erreurs TypeScript

**Solutions :**
```bash
# Nettoyer et réinstaller
cd /opt/plateforme-reporting/E\ REPORTING-IA-JAVA/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 4. Permissions insuffisantes

**Symptômes :**
- Service systemd ne démarre pas
- Erreurs d'accès fichiers

**Solutions :**
```bash
# Corriger les permissions
sudo chown -R ubuntu:ubuntu /opt/plateforme-reporting

# Vérifier le service
sudo systemctl edit reporting-backend
# Ajouter si nécessaire :
# [Service]
# User=ubuntu
# Group=ubuntu
```

### 5. Port déjà utilisé

**Symptômes :**
- "Port 8080 already in use"

**Solutions :**
```bash
# Identifier le processus
sudo lsof -i :8080

# Arrêter le processus
sudo kill -9 PID

# Ou changer le port
sudo systemctl edit reporting-backend
# Ajouter :
# [Service]
# Environment=SERVER_PORT=8081
```

### 6. Base de données H2 corrompue

**Symptômes :**
- Erreurs JPA au démarrage
- Données perdues

**Solutions :**
```bash
# H2 en mémoire se recrée automatiquement
sudo systemctl restart reporting-backend

# Pour H2 fichier (si configuré) :
rm -f /opt/plateforme-reporting/E\ REPORTING-IA-JAVA/backend/*.db
```

## 🔧 Commandes de Diagnostic

```bash
# Status complet
sudo systemctl status reporting-backend nginx

# Logs en temps réel
sudo journalctl -u reporting-backend -f
sudo tail -f /var/log/nginx/error.log

# Test de connectivité
curl -v http://localhost:8080/actuator/health
curl -v http://localhost/

# Vérifier les ports
sudo netstat -tlnp | grep -E '(80|8080)'

# Espace disque
df -h
```

## 🔄 Redémarrage Complet

```bash
# Arrêter tout
sudo systemctl stop reporting-backend nginx

# Nettoyer les logs (optionnel)
sudo journalctl --vacuum-time=1d

# Redémarrer
sudo systemctl start reporting-backend
sleep 10
sudo systemctl start nginx

# Vérifier
sudo systemctl status reporting-backend nginx
```

## 📞 Support

Si les problèmes persistent :
1. Collecter les logs : `sudo journalctl -u reporting-backend --no-pager > backend.log`
2. Vérifier la configuration : `sudo nginx -T > nginx-config.txt`
3. Documenter les étapes reproduisant l'erreur
