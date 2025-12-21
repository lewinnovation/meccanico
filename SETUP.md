# Meccanico Project Setup Guide

This guide will help you set up the Meccanico project from scratch with comprehensive seed data.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 24+ installed
- npm installed

## Quick Setup

Run the setup script from the project root:

```bash
./setup.sh
```

This will:
1. Start the PostgreSQL database container
2. Reset the database (drops all tables and recreates them)
3. Seed the database with comprehensive test data

## Manual Setup

If you prefer to set up manually:

### 1. Start the Database

```bash
docker-compose up -d postgres
```

Wait a few seconds for the database to be ready.

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Reset and Seed Database

```bash
# Reset the database (drops all tables)
npm run db:reset

# Seed with comprehensive data
npm run db:seed
```

Or do both in one command:

```bash
npm run db:setup
```

## Seed Data Overview

The seed data includes:

### Users (3)
- **Admin**: `admin@meccanico.dev` / `admin123`
- **Mechanic**: `mechanic@meccanico.dev` / `mechanic123`
- **Viewer**: `viewer@meccanico.dev` / `viewer123`

### Vehicle Data
- 50+ vehicle makes (Toyota, Honda, Ford, etc.)
- Hundreds of vehicle models

### Customers (8)
- John Smith
- Sarah Johnson
- Michael Brown
- Emma Wilson
- David Lee
- Lisa Anderson
- Robert Taylor
- Jennifer Martinez

### Vehicles (11)
- Various makes and models
- Different years, colors, and license plates
- Assigned to different customers

### Inventory (15 items)
- Oil filters, air filters
- Brake pads (front/rear)
- Fluids (oil, brake fluid, transmission fluid)
- Spark plugs, wiper blades
- Battery, timing belt
- And more...

### Labour Rates (8)
- General Labor ($85/hr)
- Senior Mechanic ($120/hr)
- Diagnostic ($150/hr)
- Flat rate services (Oil Change, Brake Service, etc.)

### Services (3)
- Oil Change Service
- Complete Brake Service
- Clutch Change

### Templates (2)
- Standard Service
- Major Service

### Jobs (5)
- 1 ESTIMATE job
- 1 IN_PROGRESS job
- 1 INVOICED job
- 1 PAID job (with 10% discount)
- 1 ON_HOLD job

### Invoices (2)
- 1 unpaid invoice (for completed job)
- 1 paid invoice (with partial payments: $50 cash, then remaining with card)

### Payments (2)
- Payment 1: $50.00 - CASH (for paid invoice)
- Payment 2: Remaining balance - VISA/MASTER CARD (for paid invoice)

### Credit Notes (2)
- 1 credit note for unpaid invoice ($25.00 - "Returned unused parts")
- 1 credit note for paid invoice ($50.00 - "Warranty adjustment")

### Payment Methods (11)
- VISA, MASTER/BANK CARD, EFTPOS
- DIRECT PAYMENT, MOTORCHARGE
- CASH, CHEQUE RECEIVED
- FLEET CARD, AMERICAN EXPRESS
- BANK, CALTEX STARFLEET

### Settings
- Shop information
- Tax settings (10% GST)
- Currency settings (AUD)
- Invoice settings

## Running the Application

### Backend Only

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:4000`

### Full Stack (Docker)

```bash
docker-compose up
```

This starts:
- PostgreSQL on port 5432
- Backend API on port 4000
- Frontend on port 3000

## Database Scripts

Available npm scripts in the backend:

- `npm run db:reset` - Drop all tables and recreate schema
- `npm run db:seed` - Seed database with test data
- `npm run db:setup` - Reset and seed in one command

## Environment Variables

The backend uses the following environment variables (with defaults):

- `DB_HOST` - Database host (default: `localhost`)
- `DB_PORT` - Database port (default: `5432`)
- `DB_NAME` - Database name (default: `meccanico`)
- `DB_USER` - Database user (default: `meccanico`)
- `DB_PASSWORD` - Database password (default: `meccanico_dev_password`)
- `AUTO_SEED` - Auto-seed on server start (default: `true`, set to `false` to disable)

## E2E Testing

The seed data is designed to work with E2E tests. All tests should pass with the default seed data.

To run E2E tests:

```bash
cd frontend
npm run test:e2e
```

## Troubleshooting

### Database Connection Issues

If you get connection errors:
1. Make sure Docker is running
2. Check that the postgres container is running: `docker ps`
3. Try restarting the container: `docker-compose restart postgres`

### Port Already in Use

If ports 3000, 4000, or 5432 are already in use:
1. Stop the conflicting services
2. Or update the ports in `docker-compose.yml`

### Seed Data Not Loading

If seed data doesn't load:
1. Make sure the database is reset first: `npm run db:reset`
2. Check database connection settings
3. Review the console output for errors

## Resetting Everything

To completely reset the project:

```bash
# Stop all containers
docker-compose down

# Remove database volume (WARNING: deletes all data)
docker volume rm meccanico_postgres_data

# Start fresh
./setup.sh
``