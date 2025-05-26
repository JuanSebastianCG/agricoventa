# backend/app/Dockerfile

# 1) Base ligera
FROM node:20-alpine

# 2) Directorio de trabajo
WORKDIR /app

# 3) Copia defs de deps e instala TODO (dev+prod)
COPY package*.json ./
RUN npm install

# 4) Copia el resto de tu código (src/, prisma/, tsconfig.json…)
COPY . .

# 5) Genera Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# 6) Compila TypeScript a /app/dist
RUN npm run build

# 7) Configura el puerto que Cloud Run inyecta y expónlo
ENV PORT=3000
EXPOSE 3000

# 8) Arranca la app compilada
CMD ["node", "dist/index.js"]
