# ---- Etapa de build ----
    FROM node:20-alpine AS build
    WORKDIR /app
    
    # 1. Copia solo defs de tu backend
    COPY backend/package*.json ./
    
    # 2. Instala deps
    RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
    
    # 3. Copia esquema y código de backend
    COPY backend/prisma ./prisma
    COPY backend/src   ./src
    COPY backend/ .     # para otros archivos: tsconfig.json, .env.example…
    
    # 4. Genera cliente Prisma indicando explícitamente el schema
    RUN npx prisma generate --schema=./prisma/schema.prisma
    
    # 5. Build de tu app
    RUN npm run build
    
    # ---- Etapa de producción ----
    FROM node:20-alpine
    WORKDIR /app
    ENV NODE_ENV=production
    
    # 6. Copia package defs de nuevo
    COPY backend/package*.json ./
    RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi
    
    # 7. Trae prisma y build result
    COPY --from=build /app/prisma ./prisma
    COPY --from=build /app/dist   ./dist
    
    # 8. Prep uploads, expón puerto y arranca
    RUN mkdir -p uploads/products uploads/profiles uploads/certifications
    EXPOSE 3000
    CMD ["node", "dist/index.js"]
    