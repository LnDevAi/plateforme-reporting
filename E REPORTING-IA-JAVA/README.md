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

Dev proxy
- /api requests from Angular dev server are proxied to http://localhost:8080

Build
- Backend: mvn clean package
- Frontend: npm run build (artifacts in dist/)