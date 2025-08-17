# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Run stage
FROM nginx:alpine
COPY --from=build /app/dist/reporting-frontend /usr/share/nginx/html
# Default nginx already serves static files; add simple API proxy if needed via custom conf
EXPOSE 80