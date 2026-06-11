# ---- build/deps stage ----
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# ---- runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# 非rootユーザーで起動(セキュリティ)
RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./
COPY data ./data
COPY public ./public

# data/saves と data/ranking.json は実行時に書き込まれるのでownerをappに
RUN mkdir -p ./data/saves && chown -R app:app ./data

USER app

EXPOSE 3000

# シンプルなヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:${PORT}/api/questions || exit 1

CMD ["node", "server.js"]
