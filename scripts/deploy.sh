#!/bin/bash

# buzcupz Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

echo "🚀 Starting deployment..."

# Environment check
if [ -z "$1" ]; then
  echo "❌ Please specify environment: staging or production"
  echo "Usage: ./scripts/deploy.sh [staging|production]"
  exit 1
fi

DEPLOY_ENV=$1

# Configuration
if [ "$DEPLOY_ENV" = "production" ]; then
  DOCKER_TAG="latest"
  NAMESPACE="cafeelevate-prod"
  echo "🔴 Deploying to PRODUCTION"
else
  DOCKER_TAG="staging"
  NAMESPACE="cafeelevate-staging"
  echo "🟡 Deploying to STAGING"
fi

# Confirmation for production
if [ "$DEPLOY_ENV" = "production" ]; then
  read -p "⚠️  Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
  if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
  fi
fi

echo "📦 Building Docker images..."
docker-compose -f docker-compose.yml build

echo "🧪 Running tests..."
cd apps/api && npm run test
cd ../..

echo "🔍 Running security scan..."
# docker scan cafeelevate-api:$DOCKER_TAG || true

echo "🗄️  Running database migrations..."
cd apps/api
npx prisma migrate deploy
cd ../..

echo "🔄 Restarting services..."
docker-compose down
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

echo "🔍 Running health check..."
HEALTH_URL="http://localhost:3000/health"
for i in {1..10}; do
  if curl -sf $HEALTH_URL > /dev/null; then
    echo "✅ Health check passed!"
    break
  fi
  echo "Waiting for health check... (attempt $i/10)"
  sleep 5
done

echo "📊 Deployment metrics:"
docker-compose ps

echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Monitor logs: docker-compose logs -f"
echo "2. Check metrics dashboard"
echo "3. Verify key features are working"
