FROM node:24-bookworm-slim AS build

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN DATABASE_URL=file:/tmp/build.db npx prisma generate --config prisma7.config.ts \
    && npm run build \
    && npm prune --omit=dev

FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma7.config.ts ./prisma7.config.ts
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy --config prisma7.config.ts && node dist/main.js"]
