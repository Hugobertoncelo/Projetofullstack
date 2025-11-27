#!/bin/bash

echo "🚀 Starting backend build process..."

# Install all dependencies (including devDependencies for build)
echo "📦 Installing all dependencies..."
cd backend
npm ci --include=dev

# Generate Prisma client
echo "🗃️ Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🏃‍♂️ Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Backend build completed successfully!"
