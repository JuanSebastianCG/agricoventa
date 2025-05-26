# Usa Node LTS ligero
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copia defs de paquete e instala deps
COPY package*.json ./
RUN npm install

# Copia todo el código (incluyendo prisma/schema.prisma y src/)
COPY . .

# Expone el puerto de tu app
EXPOSE 3000

# Arranca en modo desarrollo
CMD ["npm", "run", "start:dev"]
