#!/bin/bash

echo "🎨 Starting frontend build process..."

# Install dependencies
echo "📦 Installing dependencies..."
cd frontend
npm ci --production=false

# Build the application
echo "🔨 Building Next.js application..."
npm run build

echo "✅ Frontend build completed successfully!"
