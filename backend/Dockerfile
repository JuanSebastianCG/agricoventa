# Stage 1: Build the application
FROM node:20-alpine AS build

# 1. Set working directory
WORKDIR /app

# 2. Copy package definitions
COPY package*.json ./

# 3. Install dependencies:
#    - usa 'npm ci' si existe lockfile (reproducible y rápido en CI)
#    - si no, cae a 'npm install' para que no falle
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi

# 4. Copy source code
COPY . .

# 5. Generate Prisma client
RUN npx prisma generate

# 6. Build the application
RUN npm run build



# Stage 2: Production image
FROM node:20-alpine

# 1. Set working directory
WORKDIR /app

# 2. Set NODE_ENV
ENV NODE_ENV=production

# 3. Copy package definitions again
COPY package*.json ./

# 4. Install only production dependencies,
#    con la misma lógica condicional de 'ci' vs 'install'
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production; \
    else \
      npm install --only=production; \
    fi

# 5. Copy Prisma artifacts
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# 6. Copy built code
COPY --from=build /app/dist ./dist

# 7. Prepare uploads folders
RUN mkdir -p uploads/products uploads/profiles uploads/certifications

# 8. Expose port
EXPOSE 3000

# 9. Entrypoint
CMD ["node", "dist/index.js"]
