#!/bin/bash

# Stop on error
set -e

echo "🚀 Starting deployment..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | xargs)
fi

# Pull latest code
echo "📦 Pulling latest code..."
git pull origin main

# Build and restart containers
echo "🐳 Building Docker containers..."
docker compose -f docker-compose.production.yaml down
docker compose -f docker-compose.production.yaml build --no-cache
docker compose -f docker-compose.production.yaml up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
docker compose -f docker-compose.production.yaml exec -T backend alembic upgrade head

echo "✅ Deployment complete!"