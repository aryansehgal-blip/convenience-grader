#!/bin/bash

echo "🚀 ConvenienceGrader - Deployment Preparation"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
    git branch -M main
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "✅ .env created"
    echo ""
    echo "${YELLOW}⚠️  IMPORTANT: You must edit .env with your production credentials before deploying!${NC}"
    echo ""
else
    echo "✅ .env file exists"
fi

# Check if README variables are set
echo ""
echo "🔑 Checking required environment variables..."
echo ""

required_vars=(
    "POSTGRES_URL"
    "REDIS_URL"
    "GOOGLE_PLACES_API_KEY"
)

missing_vars=0

for var in "${required_vars[@]}"; do
    if grep -q "^${var}=\"your_" .env 2>/dev/null || ! grep -q "^${var}=" .env 2>/dev/null; then
        echo "❌ $var - Not set or using placeholder"
        missing_vars=$((missing_vars + 1))
    else
        echo "✅ $var - Configured"
    fi
done

echo ""

if [ $missing_vars -gt 0 ]; then
    echo "${YELLOW}⚠️  You have $missing_vars missing configuration(s)${NC}"
    echo ""
    echo "Before deploying, you need to:"
    echo ""
    echo "1. Get PostgreSQL database (Supabase/Neon)"
    echo "   → https://supabase.com"
    echo ""
    echo "2. Get Redis instance (Upstash)"
    echo "   → https://upstash.com"
    echo ""
    echo "3. Get Google Cloud API keys"
    echo "   → https://console.cloud.google.com"
    echo "   → Enable: Places API & PageSpeed Insights API"
    echo ""
    echo "4. Get SendGrid API key (optional, for emails)"
    echo "   → https://sendgrid.com"
    echo ""
    echo "Then edit .env with your credentials"
    echo ""
else
    echo "${GREEN}✅ All required variables configured!${NC}"
    echo ""
fi

# Create .gitignore if needed
if [ ! -f .gitignore ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << 'EOF'
# dependencies
node_modules
.pnp
.pnp.js

# testing
coverage

# next.js
.next/
out/

# production
build

# env files
.env
.env.local
.env.production.local

# debug
npm-debug.log*
yarn-debug.log*

# misc
.DS_Store
*.pem

# typescript
*.tsbuildinfo
next-env.d.ts

# vercel
.vercel

# python
.venv
__pycache__
EOF
    echo "✅ .gitignore created"
fi

# Add all files
echo ""
echo "📦 Staging files for git..."
git add .

echo ""
echo "=============================================="
echo "✅ Preparation complete!"
echo ""
echo "${GREEN}Next steps:${NC}"
echo ""
echo "1. Review DEPLOY_CHECKLIST.md for detailed instructions"
echo ""
echo "2. Commit your code:"
echo "   ${YELLOW}git commit -m 'Initial deployment'${NC}"
echo ""
echo "3. Create GitHub repository and push:"
echo "   ${YELLOW}git remote add origin https://github.com/YOUR_USERNAME/convenience-grader.git${NC}"
echo "   ${YELLOW}git push -u origin main${NC}"
echo ""
echo "4. Deploy to Vercel:"
echo "   → Go to https://vercel.com"
echo "   → Import your GitHub repository"
echo "   → Add environment variables from .env"
echo ""
echo "5. Deploy worker to Railway:"
echo "   → Go to https://railway.app"
echo "   → Deploy from GitHub"
echo "   → Set start command: npm run worker"
echo ""
echo "Full guide: ${GREEN}DEPLOY_CHECKLIST.md${NC}"
echo ""
