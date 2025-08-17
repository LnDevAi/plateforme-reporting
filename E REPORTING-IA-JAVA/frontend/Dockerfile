# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# Run stage
FROM nginx:alpine
COPY --from=build /app/dist/reporting-frontend /usr/share/nginx/html
# Nginx: proxy /api to backend service
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80