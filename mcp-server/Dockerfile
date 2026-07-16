FROM node:20-alpine

WORKDIR /app

COPY mcp-server/package*.json ./
RUN npm ci

COPY server/prisma ./server/prisma
COPY server/src ./server/src
COPY mcp-server/src ./mcp-server/src

RUN npx prisma generate --schema=/app/server/prisma/schema.prisma

EXPOSE 3002
CMD ["node", "mcp-server/src/app.js"]
