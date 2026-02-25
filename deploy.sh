#!/bin/bash

# Stop on error
set -e

COMPOSE_CMD="docker compose --env-file .env.production -f docker-compose.production.yaml"

echo "🚀 Starting deployment..."

# Pull latest code
echo "📦 Pulling latest code..."
git pull origin main

# Build and restart containers
echo "🐳 Building Docker containers..."
$COMPOSE_CMD down
$COMPOSE_CMD build --no-cache
$COMPOSE_CMD up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
$COMPOSE_CMD exec -T backend alembic upgrade head

echo "✅ Deployment complete!"
