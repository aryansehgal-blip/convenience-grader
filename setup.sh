#!/bin/bash

echo "🚀 ConvenienceGrader Setup Script"
echo "================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✓ npm version: $(npm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your API keys:"
    echo "   - POSTGRES_URL"
    echo "   - REDIS_URL"
    echo "   - GOOGLE_PLACES_API_KEY"
    echo "   - GOOGLE_PAGESPEED_API_KEY"
    echo "   - SENDGRID_API_KEY"
    echo ""
else
    echo "✓ .env file already exists"
fi

# Check if PostgreSQL is accessible
echo ""
echo "🗄️  Checking database connection..."
if [ -z "$POSTGRES_URL" ]; then
    echo "⚠️  POSTGRES_URL not set in environment. Skipping database check."
else
    echo "✓ POSTGRES_URL is set"
fi

# Check if Redis is accessible
echo ""
echo "📮 Checking Redis connection..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✓ Redis is running"
    else
        echo "⚠️  Redis is not running. Start it with: redis-server"
    fi
else
    echo "⚠️  redis-cli not found. Install Redis or use a hosted service."
fi

echo ""
echo "================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your API keys"
echo "2. Start PostgreSQL and Redis"
echo "3. Run database migrations: npm run db:generate && npm run db:migrate"
echo "4. Start the dev server: npm run dev"
echo "5. In another terminal, start the worker: npm run worker"
echo ""
echo "Then open http://localhost:3000 in your browser!"
echo ""
