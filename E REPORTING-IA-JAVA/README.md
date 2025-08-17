# E REPORTING-IA-JAVA

Stack:
- Backend: Java 17, Spring Boot 3 (REST API)
- Frontend: Angular 17
- Dev proxy: Angular dev server -> Spring Boot (proxy /api)

Quick start

Backend
- Prerequisites: Java 17, Maven 3.9+
- Commands:
  - mvn spring-boot:run
  - API: http://localhost:8080/api/health

Frontend
- Prerequisites: Node 20, npm 10
- Commands:
  - npm ci
  - npm run start
  - App: http://localhost:4200

Docker (prod-like)
- Prérequis: Docker + docker-compose
- Ports configurables via .env (BACKEND_PORT, FRONTEND_PORT). Exemple: BACKEND_PORT=9090
- Lancer:
  ```bash
  docker compose up -d --build
  ```
  - Backend: http://localhost:${BACKEND_PORT:-8080}
  - Frontend: http://localhost:${FRONTEND_PORT:-8081}

Dev proxy
- /api requests from Angular dev server are proxied to http://localhost:8080

Build
- Backend: mvn clean package
- Frontend: npm run build (artifacts in dist/)

Monorepo
- Ce code vit dans le repo racine; utilisez docker-compose à la racine pour lancer les services sans IP serveur.