FROM node:20-alpine

WORKDIR /app

# 1) Copia solo package.json/package-lock.json de backend
COPY backend/package*.json ./

# 2) Instala deps
RUN npm install

# 3) Copia TODO el contenido de backend (src/, prisma/, tsconfig.json…)
COPY backend/ ./

# 4) Genera el cliente Prisma
RUN npx prisma generate

# 5) Expone el puerto que usa tu app
EXPOSE 3000

# 6) Arranca en modo dev
CMD ["npm", "run", "start:dev"]
