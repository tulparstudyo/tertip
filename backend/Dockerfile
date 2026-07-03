FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
RUN addgroup -S tertip && adduser -S tertip -G tertip
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER tertip
EXPOSE 8080
CMD ["node", "src/server.js"]
