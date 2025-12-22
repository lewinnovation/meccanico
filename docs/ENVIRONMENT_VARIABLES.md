# Environment Variables

This document describes all environment variables used in the Meccanico project and how to configure them for different deployment scenarios.

## Table of Contents

- [Backend Environment Variables](#backend-environment-variables)
- [Frontend Environment Variables](#frontend-environment-variables)
- [Database Environment Variables](#database-environment-variables)
- [Local Development Setup](#local-development-setup)
- [External/Traefik Setup](#externaltraefik-setup)
- [Environment File Examples](#environment-file-examples)

---

## Backend Environment Variables

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Node.js environment | `development` | `production`, `development` |
| `PORT` | Backend API port | `4000` | `4000` |
| `DB_HOST` | PostgreSQL host | `localhost` | `postgres`, `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` | `5432` |
| `DB_NAME` | Database name | `meccanico` | `meccanico` |
| `DB_USER` | Database user | `meccanico` | `meccanico` |
| `DB_PASSWORD` | Database password | `meccanico_dev_password` | `your-secure-password` |
| `DB_SSL` | Enable SSL for database connection | `false` (dev), `true` (prod) | `true`, `false`, `require` |
| `DB_SSL_REJECT_UNAUTHORIZED` | Reject unauthorized SSL certificates | `false` (default) | `true`, `false` |
| `JWT_SECRET` | Secret key for JWT tokens | `default-dev-secret` | `your-secret-key-here` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DB_SSL` | Enable SSL for database connection | Auto (true in prod, false in dev) | `true`, `false`, `require` |
| `DB_SSL_REJECT_UNAUTHORIZED` | Reject unauthorized SSL certificates | `false` | `true`, `false` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` | `https://meccanico.com`, `*` |
| `JWT_EXPIRES_IN` | JWT token expiration | `24h` | `1h`, `7d` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` | `30d` |
| `LOG_LEVEL` | Logging level | `info` | `debug`, `warn`, `error` |

---

## Frontend Environment Variables

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_API_URL` | Backend API URL | (empty) | `http://localhost:4000`, `https://api.meccanico.com` |

**Note:** Vite requires the `VITE_` prefix for environment variables to be exposed to the client-side code.

---

## Database Environment Variables

These are used by the PostgreSQL Docker container:

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `POSTGRES_USER` | PostgreSQL user | `meccanico` | `meccanico` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `meccanico_dev_password` | `your-secure-password` |
| `POSTGRES_DB` | Database name | `meccanico` | `meccanico` |

---

## Local Development Setup

For local development using `docker-compose.local.yml`, most variables have sensible defaults and don't need to be set explicitly. However, you can customize them if needed.

### Option 1: Using Docker Compose (Recommended)

The `docker-compose.local.yml` file includes default values for all required variables. No additional configuration is needed to get started.

```bash
docker-compose -f docker-compose.local.yml up -d
```

### Option 2: Using Environment Files

Create a `.env` file in the project root or use environment-specific files:

```bash
# .env.local (for local development)
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=meccanico
DB_USER=meccanico
DB_PASSWORD=meccanico_dev_password
JWT_SECRET=dev-secret-change-in-production
CORS_ORIGIN=http://localhost:3000
```

Then load it when starting Docker Compose:

```bash
docker-compose -f docker-compose.local.yml --env-file .env.local up -d
```

### Option 3: Running Services Locally (Without Docker)

If running services directly on your machine:

1. **Backend**: Create `backend/.env`:
   ```env
   NODE_ENV=development
   PORT=4000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=meccanico
   DB_USER=meccanico
   DB_PASSWORD=meccanico_dev_password
   JWT_SECRET=dev-secret-change-in-production
   CORS_ORIGIN=http://localhost:3000
   ```

2. **Frontend**: Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:4000
   ```

3. **Database**: Start PostgreSQL using Docker:
   ```bash
   docker-compose -f docker-compose.local.yml up postgres -d
   ```

---

## External/Traefik Setup

For production or external deployments using `docker-compose.external.yml`, you need to configure environment variables for Traefik routing and security.

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `API_DOMAIN` | Domain for the backend API | `api.meccanico.com` |
| `WEB_DOMAIN` | Domain for the frontend | `meccanico.com` |
| `API_URL` | Full URL to the backend API (used by frontend) | `https://api.meccanico.com` |
| `JWT_SECRET` | Secret key for JWT tokens (must be set!) | `your-production-secret-key` |
| `CORS_ORIGIN` | Allowed CORS origin | `https://meccanico.com` |

### Setup Instructions

1. **Create an environment file** (e.g., `.env.external`):

   ```env
   # Traefik Configuration
   API_DOMAIN=api.meccanico.com
   WEB_DOMAIN=meccanico.com
   API_URL=https://api.meccanico.com
   
   # Security
   JWT_SECRET=your-production-secret-key-change-this
   CORS_ORIGIN=https://meccanico.com
   
   # Database (optional, defaults are fine for most cases)
   POSTGRES_USER=meccanico
   POSTGRES_PASSWORD=your-secure-db-password
   POSTGRES_DB=meccanico
   ```

2. **Start services with the environment file**:

   ```bash
   docker-compose -f docker-compose.external.yml --env-file .env.external up -d
   ```

3. **Or set variables inline**:

   ```bash
   API_DOMAIN=api.meccanico.com \
   WEB_DOMAIN=meccanico.com \
   API_URL=https://api.meccanico.com \
   JWT_SECRET=your-production-secret \
   CORS_ORIGIN=https://meccanico.com \
   docker-compose -f docker-compose.external.yml up -d
   ```

### Traefik Network Requirements

The external setup requires the Traefik network to exist:

```bash
# Create the network if it doesn't exist
docker network create traefik_compose_webgateway
```

Or ensure your Traefik setup creates this network.

---

## Environment File Examples

### Backend `.env` Example

```env
# Node.js Environment
NODE_ENV=development

# Server Configuration
PORT=4000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=meccanico
DB_USER=meccanico
DB_PASSWORD=meccanico_dev_password
# SSL Configuration (optional)
# DB_SSL=true (enable SSL)
# DB_SSL_REJECT_UNAUTHORIZED=false (for cloud databases like GCP Cloud SQL)

# JWT Configuration
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### Frontend `.env` Example

```env
# Backend API URL
VITE_API_URL=http://localhost:4000
```

### Production `.env.external` Example

```env
# Traefik Domains
API_DOMAIN=api.meccanico.com
WEB_DOMAIN=meccanico.com
API_URL=https://api.meccanico.com

# Security (IMPORTANT: Change these!)
JWT_SECRET=your-super-secure-production-secret-key-min-32-chars
CORS_ORIGIN=https://meccanico.com

# Database
POSTGRES_USER=meccanico
POSTGRES_PASSWORD=your-secure-production-password
POSTGRES_DB=meccanico

# Backend
NODE_ENV=production
PORT=4000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=meccanico
DB_USER=meccanico
DB_PASSWORD=your-secure-production-password
# SSL Configuration (required for cloud databases)
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

---

## Security Best Practices

1. **Never commit `.env` files** to version control. They are already in `.gitignore`.

2. **Use strong secrets in production**:
   - `JWT_SECRET` should be at least 32 characters long
   - Use a cryptographically secure random string generator
   - Example: `openssl rand -base64 32`

3. **Use different secrets for different environments**:
   - Development: `dev-secret-change-in-production`
   - Staging: Different secret
   - Production: Strong, unique secret

4. **Restrict CORS origins in production**:
   - Don't use `*` in production
   - Specify exact domains: `https://meccanico.com`

5. **Use environment-specific files**:
   - `.env.local` for local development
   - `.env.staging` for staging
   - `.env.production` for production

---

## Troubleshooting

### Backend can't connect to database

- Check `DB_HOST` matches the service name in Docker Compose (`postgres` for Docker, `localhost` for local)
- Verify `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` are correct
- Ensure the database container is running: `docker ps`
- For cloud databases, verify `DB_SSL=true` is set
- Check SSL certificate issues: set `DB_SSL_REJECT_UNAUTHORIZED=false` for cloud databases

### Frontend can't reach backend API

- Verify `VITE_API_URL` is set correctly
- For local development, use `http://localhost:4000`
- For production, use the full URL including protocol: `https://api.meccanico.com`
- Check CORS settings if making cross-origin requests

### Traefik routing not working

- Verify the `traefik_compose_webgateway` network exists
- Check that `API_DOMAIN` and `WEB_DOMAIN` match your DNS configuration
- Ensure Traefik is running and can see the containers
- Check Traefik logs: `docker logs traefik`

---

## Quick Reference

### Local Development (No configuration needed)
```bash
docker-compose -f docker-compose.local.yml up -d
```

### External/Traefik Setup
```bash
# With environment file
docker-compose -f docker-compose.external.yml --env-file .env.external up -d

# With inline variables
API_DOMAIN=api.example.com WEB_DOMAIN=example.com JWT_SECRET=secret \
docker-compose -f docker-compose.external.yml up -d
```

### Check Environment Variables
```bash
# Backend container
docker exec meccanico-api env | grep -E 'DB_|JWT_|CORS_'

# Frontend container
docker exec meccanico-web env | grep VITE_
```
