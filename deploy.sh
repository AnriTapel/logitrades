#!/bin/bash

# Stop on error
set -e

# Prerequisite: docker login ghcr.io (PAT with read:packages)
COMPOSE_CMD="docker compose --env-file .env.production -f docker-compose.production.yaml"

echo "🚀 Starting deployment..."

# Pull latest compose/script changes
echo "📦 Pulling latest code..."
git pull origin main

# Pull prebuilt images from GHCR and restart
echo "🐳 Pulling Docker images..."
$COMPOSE_CMD pull
$COMPOSE_CMD up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
$COMPOSE_CMD exec -T backend alembic upgrade head

echo "✅ Deployment complete!"
