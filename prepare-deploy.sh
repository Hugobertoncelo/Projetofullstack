#!/bin/bash

echo "🚀 Preparing for Render deployment..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository. Initializing..."
    git init
    git branch -M main
fi

# Add all files
echo "📦 Adding files to git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️ No changes to commit"
else
    # Commit changes
    echo "💾 Committing changes..."
    git commit -m "feat: prepare for Render deployment with production configs"
    
    echo "✅ Ready for deployment!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push to your git repository: git push origin main"
    echo "2. Follow the steps in DEPLOY.md"
    echo "3. Create services on Render.com"
fi

echo "📖 For detailed instructions, see DEPLOY.md"
