echo "🚀 Starting backend build process..."

echo "📦 Installing all dependencies..."
cd backend
npm ci --include=dev

echo "🗃️ Generating Prisma client..."
npx prisma generate

echo "🏃‍♂️ Running database migrations..."
npx prisma migrate deploy

echo "🔨 Building application..."
npm run build

echo "✅ Backend build completed successfully!"
