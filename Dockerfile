FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/src/lib/server/db/migrations ./src/lib/server/db/migrations
COPY package.json ./

ENV PORT=3000
ENV MIGRATIONS_PATH=/app/src/lib/server/db/migrations
ENV DB_PATH=/app/data/rabatttracker.db

EXPOSE 3000
VOLUME ["/app/data"]

CMD ["node", "build/index.js"]
