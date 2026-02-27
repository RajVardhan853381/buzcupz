#!/bin/bash

# buzcupz Quick Start Script
# This script starts both the backend and frontend in development mode

set -e

echo "🚀 Starting buzcupz Development Environment..."
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ]; then
  echo "❌ Error: Please run this script from the project root directory"
  exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Check if backend dependencies are installed
if [ ! -d "apps/api/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd apps/api
  npm install
  cd ../..
fi

# Check if frontend dependencies are installed
if [ ! -d "apps/web/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd apps/web
  npm install
  cd ../..
fi

echo ""
echo "✅ Dependencies installed"
echo ""
echo "Starting services..."
echo "  📡 Backend API will be on: http://localhost:3001"
echo "  🎨 Frontend will be on: http://localhost:3000"
echo "  📚 API Docs will be on: http://localhost:3001/api/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start both services using turbo
npm run dev
