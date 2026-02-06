# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Singapore

FROM base AS deps
RUN apk add --no-cache python3 make g++ sqlite
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=${PORT:-3000}

# Install sqlite in runtime for better-sqlite3
RUN apk add --no-cache sqlite

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Create database directory for SQLite persistence
# Railway persistent volumes are typically mounted at /data
RUN mkdir -p /data && chmod 755 /data

# Set database path to use Railway's persistent volume
ENV DATABASE_PATH=/data/todos.db

EXPOSE 3000
CMD ["npm", "start"]
