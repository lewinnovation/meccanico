#!/bin/bash

# Meccanico Project Setup Script
# This script resets the database and seeds it with comprehensive test data

set -e

echo "🚀 Meccanico Project Setup"
echo "=========================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.local.yml" ]; then
  echo "❌ Error: docker-compose.local.yml not found. Please run this script from the project root."
  exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Check if database container is running
if ! docker ps | grep -q meccanico-db; then
  echo "📦 Starting database container..."
  docker-compose -f docker-compose.local.yml up -d postgres
  
  # Wait for database to be ready
  echo "⏳ Waiting for database to be ready..."
  sleep 5
fi

# Navigate to backend directory
cd backend

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null || echo "not installed")
echo "📋 Node.js version: $NODE_VERSION"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  npm install
fi

# Reset and seed database
echo ""
echo "🔄 Resetting database..."
npm run db:reset

echo ""
echo "🌱 Seeding database with comprehensive test data..."
npm run db:seed

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📊 Seeded data includes:"
echo "   - 3 users (admin, mechanic, viewer)"
echo "   - 50+ vehicle makes with models"
echo "   - 8 customers"
echo "   - 11 vehicles"
echo "   - 15 inventory items"
echo "   - 8 labour rates"
echo "   - 3 services"
echo "   - 2 templates"
echo "   - 5 jobs in various statuses"
echo "   - Default settings"
echo ""
echo "🔑 Default login credentials:"
echo "   Admin:    admin@meccanico.dev / admin123"
echo "   Mechanic: mechanic@meccanico.dev / mechanic123"
echo "   Viewer:   viewer@meccanico.dev / viewer123"
echo ""
echo "🚀 You can now start the backend with: cd backend && npm run dev"
echo "   Or start everything with: docker-compose -f docker-compose.local.yml up"


