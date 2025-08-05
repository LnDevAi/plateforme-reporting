FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Construire l'application pour la production
RUN npm run build

# Utiliser nginx pour servir les fichiers statiques
FROM nginx:alpine

# Copier les fichiers buildés
COPY --from=0 /app/dist /usr/share/nginx/html

# Copier la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]