FROM node:24-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate TSOA routes
RUN npm run tsoa:generate || true

# Build
RUN npm run build || true

# Expose port
EXPOSE 4000

# Default command (overridden in docker-compose for dev)
CMD ["npm", "start"]

