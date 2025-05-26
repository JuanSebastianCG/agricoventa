# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# 1. Copia los package desde la raíz del contexto
COPY backend/package*.json ./

# 2. Instala deps
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 3. Copia tu código de backend (prisma, src, tsconfig…)
COPY backend/prisma ./prisma
COPY backend/src    ./src
COPY backend/tsconfig.json ./tsconfig.json
COPY backend/.env.example  .env.example

# 4. Prisma + build
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY backend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi

COPY --from=build /app/dist   ./dist
COPY --from=build /app/prisma  ./prisma
RUN mkdir -p uploads/products uploads/profiles uploads/certifications

EXPOSE 3000
CMD ["node", "dist/index.js"]
