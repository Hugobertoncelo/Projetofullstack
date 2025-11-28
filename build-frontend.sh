echo "🎨 Starting frontend build process..."

echo "📦 Installing dependencies..."
cd frontend
npm ci --production=false

echo "🔨 Building Next.js application..."
npm run build

echo "✅ Frontend build completed successfully!"
