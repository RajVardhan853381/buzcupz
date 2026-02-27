#!/bin/bash

# Restaurant Platform - Setup Script
# This script automates the initial setup process

set -e  # Exit on error

echo "🚀 Restaurant Platform Setup"
echo "=============================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed"
    echo "   Please install Docker:"
    echo "   Ubuntu/Debian: sudo apt install docker.io docker-compose-plugin"
    echo "   Or: sudo snap install docker"
    echo ""
    read -p "Do you want to continue without Docker? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    SKIP_DOCKER=true
else
    echo "✅ Docker $(docker --version | cut -d' ' -f3 | tr -d ',') detected"
    SKIP_DOCKER=false
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install API dependencies
echo "Installing API dependencies..."
cd apps/api
npm install

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

cd ../..

if [ "$SKIP_DOCKER" = false ]; then
    echo ""
    echo "🐳 Starting Docker services..."
    docker compose up -d

    echo ""
    echo "⏳ Waiting for database to be ready..."
    sleep 5

    echo ""
    echo "🗄️  Running database migrations..."
    cd apps/api
    npx prisma migrate dev --name init
    cd ../..

    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "🎉 Your Restaurant Platform is ready!"
    echo ""
    echo "Next steps:"
    echo "  1. Start the API: cd apps/api && npm run dev"
    echo "  2. Visit API docs: http://localhost:3001/api/docs"
    echo "  3. Open Prisma Studio: cd apps/api && npx prisma studio"
    echo ""
    echo "Docker services running:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo ""
    echo "⚠️  Setup complete (without Docker)"
    echo ""
    echo "Next steps:"
    echo "  1. Install Docker"
    echo "  2. Run: docker compose up -d"
    echo "  3. Run: cd apps/api && npx prisma migrate dev --name init"
    echo "  4. Start the API: cd apps/api && npm run dev"
fi

echo ""
echo "📚 Documentation:"
echo "  - Quick Start: QUICKSTART.md"
echo "  - Implementation Plan: brain/implementation_plan.md"
echo "  - Walkthrough: brain/walkthrough.md"
echo ""
