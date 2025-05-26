# Stage 1: Build the application
FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 2: Create the production image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy Prisma schema and client
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Copy the built application
COPY --from=build /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads/products uploads/profiles uploads/certifications

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"] 