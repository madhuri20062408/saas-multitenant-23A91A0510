FROM node:20-slim

WORKDIR /app

# Install required dependencies for Prisma and health check
RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy all application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Run init, then start server
CMD ["sh", "-c", "node init-db.js && node src/server.js"]
