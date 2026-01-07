# Quick Deploy - TL;DR Version

For experienced developers who want to deploy FAST.

## 30-Minute Deployment

### 1. Get Services (10 min)

```bash
# PostgreSQL → https://supabase.com (copy connection string)
# Redis → https://upstash.com (copy connection string)
# Google APIs → https://console.cloud.google.com (enable Places + PageSpeed, create key)
# SendGrid → https://sendgrid.com (create API key)
```

### 2. Configure & Deploy (10 min)

```bash
# Prepare
cd /Users/aryansehgal/convenience-store-website
chmod +x deploy-prepare.sh
./deploy-prepare.sh

# Configure .env with your credentials
nano .env

# Commit and push to GitHub
git commit -m "Deploy"
git remote add origin https://github.com/YOUR_USERNAME/convenience-grader.git
git push -u origin main
```

### 3. Deploy to Vercel (5 min)

1. Go to **vercel.com** → Import GitHub repo
2. Add environment variables from .env
3. Deploy

### 4. Deploy Worker to Railway (5 min)

1. Go to **railway.app** → Deploy from GitHub
2. Set start command: `npm run worker`
3. Add same environment variables
4. Deploy

### 5. Run Migrations

```bash
export POSTGRES_URL="your_production_url"
npm run db:migrate
```

### Done! 🎉

Visit your Vercel URL and test.

---

## Command Cheat Sheet

```bash
# Local development
npm run dev           # Start Next.js (port 3000)
npm run worker        # Start background worker

# Database
npm run db:generate   # Generate migrations from schema
npm run db:migrate    # Run migrations
npm run db:studio     # Open Drizzle Studio (GUI)

# Deployment
./deploy-prepare.sh   # Prepare for deployment
git push             # Triggers auto-deploy (Vercel)

# Logs
vercel logs          # Vercel logs
# Railway: View in dashboard

# Testing
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"7-Eleven"}'
```

---

## Environment Variables Reference

Copy to Vercel & Railway:

```bash
# Required
POSTGRES_URL=postgresql://...
REDIS_URL=redis://...
GOOGLE_PLACES_API_KEY=AIza...
GOOGLE_PAGESPEED_API_KEY=AIza...

# Optional (for email)
SENDGRID_API_KEY=SG...
FROM_EMAIL=noreply@yoursite.com

# Vercel only
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Optional
RATE_LIMIT_SCANS_PER_HOUR=5
```

---

## Architecture at a Glance

```
Vercel (Frontend)
  ↓
PostgreSQL (Supabase) ← → Redis (Upstash)
                            ↓
                      Railway (Worker)
                            ↓
                    Google APIs + SendGrid
```

---

## Troubleshooting Quick Fixes

**Deployment fails**
```bash
# Check build locally
npm run build
```

**Database errors**
```bash
# Verify connection
psql $POSTGRES_URL -c "SELECT 1"

# Re-run migrations
npm run db:migrate
```

**Worker not processing**
```bash
# Check Redis
redis-cli -u $REDIS_URL ping

# Check Railway logs (in dashboard)
```

**API errors**
```bash
# Test API key
curl "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=test&key=$GOOGLE_PLACES_API_KEY"
```

---

## Costs

- **Free tier**: $0-10/mo (up to 1K scans)
- **Growth**: $100-150/mo (5K scans)
- **Scale**: $500-800/mo (50K scans)

---

Need detailed instructions? See [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)
