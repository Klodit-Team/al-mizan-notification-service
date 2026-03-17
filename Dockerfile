# ── Stage 1 : Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Installer les dépendances d'abord (cache Docker optimisé)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copier les sources
COPY . .

# Générer le client Prisma
RUN yarn prisma:generate

# Compiler TypeScript
RUN yarn build

# ── Stage 2 : Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Dépendances de production uniquement
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Copier le build + le client Prisma généré
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

# Sécurité : utilisateur non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 8010

# Lancer les migrations + démarrer l'application
CMD ["sh", "-c", "node dist/main"]
