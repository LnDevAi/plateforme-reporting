# 🚀 Instructions de déploiement sur VPS

## Étapes à suivre sur le VPS 213.199.63.30

### 1. Connexion au VPS
```bash
ssh root@213.199.63.30
```

### 2. Navigation vers le projet
```bash
cd "/opt/plateforme-reporting/E REPORTING-IA-JAVA"
```

### 3. Exécution du script de déploiement
```bash
chmod +x deploy/execute-on-vps.sh
./deploy/execute-on-vps.sh
```

## 🎯 Résultats attendus

Le script va automatiquement :
- ✅ Arrêter les services existants
- ✅ Mettre à jour le code depuis Git
- ✅ Builder le backend (Maven + Java)
- ✅ Builder le frontend (Angular)
- ✅ Déployer l'application
- ✅ Configurer les services systemd
- ✅ Configurer Nginx
- ✅ Redémarrer tous les services
- ✅ Vérifier la connectivité

## 🌐 URLs finales

- **Application principale** : http://213.199.63.30
- **Backend Health** : http://213.199.63.30:8080/actuator/health

## 👤 Identifiants de test

- **Email** : `admin@demo.local`
- **Mot de passe** : `admin123`

## 🔧 Diagnostic en cas de problème

### Vérifier les services
```bash
sudo systemctl status reporting-backend
sudo systemctl status nginx
```

### Vérifier les logs
```bash
sudo journalctl -u reporting-backend -f
sudo tail -f /var/log/nginx/error.log
```

### Redémarrer manuellement
```bash
sudo systemctl restart reporting-backend
sudo systemctl restart nginx
```
