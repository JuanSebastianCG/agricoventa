# Stage 1: Build the application
FROM node:20-alpine AS build
WORKDIR /app

# 1. Copia defs de dependencias
COPY backend/package*.json ./

# 2. Instala deps
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# 3. Copia esquema y código
COPY backend/prisma ./prisma
COPY backend/src    ./src

# Si necesitas otros archivos de config:
COPY backend/tsconfig.json ./tsconfig.json
COPY backend/.env.example  ./.env.example

# 4. Genera Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# 5. Build
RUN npm run build



# Stage 2: Production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# 6. Copia defs de producción
COPY backend/package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi

# 7. Copia artefactos
COPY --from=build /app/dist   ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# 8. Prepara directorios
RUN mkdir -p uploads/products uploads/profiles uploads/certifications

EXPOSE 3000
CMD ["node", "dist/index.js"]
