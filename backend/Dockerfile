FROM node:24-alpine

WORKDIR /app

# Install dependencies for Puppeteer/Chromium
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      yarn

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install app dependencies
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
