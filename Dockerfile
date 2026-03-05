FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json yarn.lock* ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN yarn install --frozen-lockfile

COPY src/ ./src/

RUN yarn build

FROM node:22-alpine

WORKDIR /app

COPY package*.json yarn.lock* ./

RUN yarn install --production --frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 8080

USER node

CMD ["node", "dist/main.js"]