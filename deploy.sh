#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "======================================"
echo "🚀 Starting Deployment Process..."
echo "======================================"

# 1. Pull latest code
echo "📦 Pulling latest code from git..."
git pull

# 2. Setup Backend & DB Migrate
echo "⏳ Setting up backend..."
cd backend
echo "   -> Installing backend dependencies..."
pnpm install
echo "   -> Generating Prisma client..."
npx prisma generate
echo "   -> Running Prisma migrations..."
npx prisma migrate deploy
cd ..

# 3. Setup Frontend & Build
echo "🎨 Setting up frontend..."
cd frontend
echo "   -> Installing frontend dependencies..."
pnpm install
echo "   -> Building frontend..."
pnpm run build
cd ..

# 4. Restart Backend PM2
echo "🔄 Restarting backend with PM2..."
# Restart specific PM2 app
pm2 restart sudoku-backend

echo "======================================"
echo "✅ Deployment completed successfully!"
echo "======================================"
