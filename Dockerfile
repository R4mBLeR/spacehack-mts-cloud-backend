FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm ci

COPY src/ ./src/

RUN npm run build

FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 8080

USER node

CMD ["node", "dist/main.js"]