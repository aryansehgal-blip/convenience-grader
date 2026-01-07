# Quick Start Guide

Get ConvenienceGrader running in 10 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] PostgreSQL 14+ installed ([Download](https://www.postgresql.org/download/))
- [ ] Redis 6+ installed ([Download](https://redis.io/download)) or use [Redis Cloud](https://redis.com/try-free/)
- [ ] Google Cloud account with billing enabled

## Step 1: Get Your API Keys (5 min)

### Google Cloud APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable these APIs:
   - Places API
   - Places API (New)
   - PageSpeed Insights API
4. Create API credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key
   - (Optional) Restrict the key to only Places and PageSpeed APIs

### SendGrid (for emails)

1. Sign up at [SendGrid](https://sendgrid.com/) (free tier: 100 emails/day)
2. Go to Settings → API Keys
3. Create new API key with "Full Access"
4. Copy the key

## Step 2: Install & Configure (2 min)

```bash
# Clone or navigate to project directory
cd convenience-store-website

# Run setup script
chmod +x setup.sh
./setup.sh

# OR manually:
npm install
cp .env.example .env
```

Edit `.env` file with your credentials:

```bash
# Database (local PostgreSQL)
POSTGRES_URL="postgresql://postgres:password@localhost:5432/conveniencegrader"

# Redis (local)
REDIS_URL="redis://localhost:6379"

# Google APIs (use the key you created)
GOOGLE_PLACES_API_KEY="AIzaSy..."
GOOGLE_PAGESPEED_API_KEY="AIzaSy..."  # Can use same key

# SendGrid
SENDGRID_API_KEY="SG...."
FROM_EMAIL="noreply@conveniencegrader.com"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Step 3: Set Up Database (1 min)

```bash
# Create database
createdb conveniencegrader

# Generate and run migrations
npm run db:generate
npm run db:migrate
```

## Step 4: Start Services (1 min)

You need 3 terminals running:

**Terminal 1 - Database (if local):**
```bash
# Start PostgreSQL (if not running as service)
postgres -D /usr/local/var/postgres
```

**Terminal 2 - Redis:**
```bash
redis-server
```

**Terminal 3 - Next.js:**
```bash
npm run dev
```

**Terminal 4 - Worker:**
```bash
npm run worker
```

## Step 5: Test It! (1 min)

1. Open [http://localhost:3000](http://localhost:3000)
2. Search for "7-Eleven" or "Circle K"
3. Select a store from dropdown
4. Click "Get My Free Grade"
5. Watch the scan progress
6. View the report!

## Troubleshooting

### "Google Places API error"
- Check that Places API is enabled in Google Cloud Console
- Verify API key is correct in `.env`
- Check you haven't exceeded free tier quota

### "Redis connection error"
- Make sure Redis is running: `redis-cli ping` (should return `PONG`)
- Check `REDIS_URL` in `.env`

### "Database connection error"
- Verify PostgreSQL is running: `pg_isready`
- Check `POSTGRES_URL` format
- Create database if it doesn't exist: `createdb conveniencegrader`

### "Worker not processing jobs"
- Make sure worker is running in separate terminal
- Check worker logs for errors
- Verify Redis connection

### Scan gets stuck at "Checking search rankings..."
- This means the worker isn't running or can't connect to Redis
- Start worker in new terminal: `npm run worker`

## Next Steps

### Customize Scoring
- Edit `src/services/*-visibility.service.ts` files
- Adjust weights in scoring calculations
- Add new problem checks in `problem-detector.service.ts`

### Add Features
- Multi-location support
- User authentication
- PDF generation
- Email drip campaigns
- White-label branding

### Deploy to Production
See [README.md](./README.md) for deployment instructions (Vercel, Railway, DigitalOcean).

## Cost Estimation (MVP)

For 1,000 scans/month:

| Service | Cost |
|---------|------|
| Google Places API | ~$10 |
| PageSpeed Insights | Free (25k/day) |
| Vercel (hosting) | Free tier |
| PostgreSQL (Supabase) | Free tier |
| Redis (Redis Cloud) | Free tier |
| SendGrid (emails) | Free tier |
| **Total** | **~$10/mo** |

At 5,000 scans/month: ~$50-100/mo

## Need Help?

- Check [README.md](./README.md) for full documentation
- Open an issue on GitHub
- Email: support@conveniencegrader.com

---

Happy grading! 🎉
