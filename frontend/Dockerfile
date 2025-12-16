FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Default command (overridden in docker-compose for dev)
CMD ["npm", "run", "dev", "--", "--host"]

