# === Stage 1: Build Frontend ===
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --production=false
COPY client/ ./
RUN npm run build

# === Stage 2: Production Server ===
FROM node:18-alpine
WORKDIR /app

# Install server deps
COPY server/package*.json ./server/
RUN cd server && npm ci --production

# Copy server code
COPY server/ ./server/

# Copy built frontend
COPY --from=frontend-builder /app/client/dist ./client/dist

# Runtime config (injected by Render)
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server/app.js"]