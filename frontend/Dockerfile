# Multi-stage build: build with node, serve static with nginx
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# build assumes "build" script outputs to dist/ (Vite default)
RUN npm run build

FROM nginx:alpine AS runner
# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*
# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html
# Optional: custom nginx.conf can be added here if needed
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
