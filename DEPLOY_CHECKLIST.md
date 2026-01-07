# Deployment Checklist

Follow this step-by-step guide to deploy ConvenienceGrader to production.

## Pre-Deployment Setup (15 minutes)

### 1. Get PostgreSQL Database

**Option A: Supabase (Recommended - Free tier)**

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - Name: `conveniencegrader`
   - Database Password: (generate strong password)
   - Region: Choose closest to you
5. Wait 2 minutes for setup
6. Go to Project Settings → Database
7. Copy "Connection string" (URI format)
   - Should look like: `postgresql://postgres.xxx:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres`
8. Save this for later ✅

**Option B: Neon (Free tier)**
- Go to [neon.tech](https://neon.tech)
- Create project
- Copy connection string

---

### 2. Get Redis Instance

**Option A: Upstash (Recommended - Free tier)**

1. Go to [upstash.com](https://upstash.com)
2. Sign up / Log in
3. Click "Create Database"
4. Fill in:
   - Name: `conveniencegrader`
   - Type: Regional
   - Region: Choose same as your app
5. Click "Create"
6. Copy the "UPSTASH_REDIS_REST_URL"
   - Should look like: `redis://default:[password]@usw1-xxx.upstash.io:6379`
7. Save this for later ✅

**Option B: Redis Cloud**
- Go to [redis.com](https://redis.com/try-free/)
- Create free 30MB database
- Copy connection string

---

### 3. Get Google Cloud API Keys

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project (or use existing)
3. Enable APIs:
   - Go to "APIs & Services" → "Library"
   - Search and enable:
     - ✅ **Places API (New)**
     - ✅ **Maps JavaScript API** (optional, for map display)
     - ✅ **PageSpeed Insights API**
4. Create API Key:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the key
   - (Recommended) Click "Restrict Key":
     - API restrictions: Select "Places API", "PageSpeed Insights API"
     - Save
5. You can use the same key for both `GOOGLE_PLACES_API_KEY` and `GOOGLE_PAGESPEED_API_KEY`
6. Save this for later ✅

**Cost estimate**: ~$10/month for 1,000 scans (Google gives $200 free credit)

---

### 4. Get SendGrid API Key

1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up (Free tier: 100 emails/day)
3. Go to Settings → API Keys
4. Click "Create API Key"
5. Name: `conveniencegrader`
6. Permissions: Full Access
7. Copy the key (shown only once!)
8. Save this for later ✅

---

## Deployment Steps

### STEP 1: Push Code to GitHub (2 minutes)

```bash
cd /Users/aryansehgal/convenience-store-website

# Add all files
git add .

# Commit
git commit -m "Initial deployment"

# Create GitHub repository (if you haven't)
# Go to github.com → New Repository → "convenience-grader"

# Add remote and push
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/convenience-grader.git
git push -u origin main
```

✅ Code is on GitHub

---

### STEP 2: Deploy Frontend to Vercel (5 minutes)

1. **Go to [vercel.com](https://vercel.com)**
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Import your `convenience-grader` repository
5. Configure:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (auto-filled)
   - Install Command: `npm install` (auto-filled)
6. **Add Environment Variables** (click "Environment Variables"):

   ```
   POSTGRES_URL=postgresql://postgres.xxx:[password]@...
   REDIS_URL=redis://default:[password]@...
   GOOGLE_PLACES_API_KEY=AIzaSy...
   GOOGLE_PAGESPEED_API_KEY=AIzaSy...
   SENDGRID_API_KEY=SG....
   FROM_EMAIL=noreply@conveniencegrader.com
   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
   RATE_LIMIT_SCANS_PER_HOUR=5
   ```

   **Important**: After deploy, come back and update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL

7. Click "Deploy"
8. Wait 2-3 minutes ⏳
9. ✅ You'll get a URL like: `https://convenience-grader-xxx.vercel.app`

---

### STEP 3: Run Database Migrations (2 minutes)

**Important**: You need to run migrations to create database tables.

**Option A: From your local machine**

```bash
# Set the production database URL temporarily
export POSTGRES_URL="postgresql://postgres.xxx:[password]@..."

# Run migrations
npm run db:migrate

# Verify tables were created
# (You can check in Supabase dashboard → Table Editor)
```

**Option B: Use Supabase SQL Editor**

1. Go to Supabase dashboard
2. Click "SQL Editor" → "New Query"
3. Paste this SQL (from your migration files):

```sql
-- Run the SQL from drizzle/migrations/*.sql
-- (After you run db:generate locally first)
```

✅ Database tables created

---

### STEP 4: Deploy Worker to Railway (5 minutes)

**Why Railway?** Vercel doesn't support long-running processes. The worker needs to run 24/7.

1. **Go to [railway.app](https://railway.app)**
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `convenience-grader` repository
5. Railway detects it's a Node.js app
6. **Configure**:
   - Name: `conveniencegrader-worker`
   - Start Command: Click "Settings" → Custom Start Command: `npm run worker`
7. **Add Environment Variables** (Settings → Variables):

   ```
   POSTGRES_URL=postgresql://...
   REDIS_URL=redis://...
   GOOGLE_PLACES_API_KEY=AIzaSy...
   GOOGLE_PAGESPEED_API_KEY=AIzaSy...
   ```

   (Same values as Vercel, but no NEXT_PUBLIC_APP_URL needed)

8. Click "Deploy"
9. ✅ Worker is running! Check logs to verify

**Cost**: Railway gives $5 free credit/month. Worker should cost ~$3-5/mo.

---

### STEP 5: Test Your Deployment (5 minutes)

1. **Visit your Vercel URL**: `https://convenience-grader-xxx.vercel.app`

2. **Test the flow**:
   - Search for "7-Eleven" or "Circle K"
   - Select a store
   - Click "Get My Free Grade"
   - Should see scanning progress...
   - Wait 30-60 seconds
   - Report should appear!

3. **Check Railway Logs**:
   - Go to Railway dashboard
   - Click on your worker
   - Check logs - should see:
     ```
     ✓ Connected to Redis
     ✓ Scan worker started
     [Worker] Processing job search_visibility...
     ```

4. **If something fails**:
   - Check Vercel logs (Deployment → Logs)
   - Check Railway logs (Dashboard → Logs)
   - Common issues:
     - Wrong database URL
     - Redis not accessible
     - API keys invalid
     - Worker not running

---

### STEP 6: Set Up Custom Domain (Optional, 5 minutes)

1. **In Vercel**:
   - Go to Project Settings → Domains
   - Add your domain: `conveniencegrader.com`
   - Follow instructions to add DNS records
   - Vercel auto-provisions SSL certificate

2. **Update environment variable**:
   - Change `NEXT_PUBLIC_APP_URL` to `https://conveniencegrader.com`
   - Redeploy

✅ Live on your domain!

---

## Post-Deployment

### Monitor Your App

1. **Vercel Analytics** (free):
   - Go to Project → Analytics
   - See page views, performance

2. **Railway Metrics**:
   - Dashboard shows CPU, memory usage
   - Watch for spikes

3. **Set up Sentry** (optional, error tracking):
   ```bash
   npm install @sentry/nextjs
   # Follow Sentry setup for Next.js
   ```

### Set Up Backups

**Supabase**: Backups are automatic (daily)

**Manual backup** (optional):
```bash
# Backup database to file
pg_dump $POSTGRES_URL > backup-$(date +%Y%m%d).sql
```

### Monitor Costs

- **Google Cloud Console**: Check API usage
- **Vercel**: Check bandwidth usage
- **Railway**: Check monthly spend

---

## Troubleshooting

### "Database connection failed"
- ✅ Check POSTGRES_URL is correct
- ✅ Run migrations (`npm run db:migrate`)
- ✅ Check Supabase database is running

### "Redis connection error"
- ✅ Check REDIS_URL is correct
- ✅ Test: `redis-cli -u $REDIS_URL ping`

### "Worker not processing jobs"
- ✅ Check Railway logs
- ✅ Verify worker is running (not crashed)
- ✅ Check Redis connection from worker

### "Google API error"
- ✅ Verify API key is correct
- ✅ Check APIs are enabled in Google Cloud
- ✅ Check quota hasn't been exceeded

### "Scan takes forever / times out"
- ✅ Check worker logs - is it processing?
- ✅ Check if website being scanned is slow/down
- ✅ Increase timeout in `queue.ts` if needed

---

## Success Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful (can see landing page)
- [ ] Database tables created
- [ ] Railway worker deployed and running
- [ ] Can search for businesses
- [ ] Can complete a full scan (30-60 seconds)
- [ ] Report displays correctly
- [ ] Worker logs show job processing
- [ ] No errors in Vercel or Railway logs

---

## Scaling Up

When you get more traffic:

### 100 scans/day → 3,000/month
- Current setup handles this ✅
- Cost: ~$10/month

### 1,000 scans/day → 30,000/month
- Upgrade Railway worker: $10/mo
- Upgrade Supabase: $25/mo
- Google APIs: ~$50/mo
- **Total: ~$85/month**

### 10,000 scans/day → 300,000/month
- Multiple Railway workers: $50/mo
- Upgrade database: $100/mo
- Google APIs: ~$500/mo
- **Total: ~$650/month**

---

## Need Help?

**Common Issues**: See [README.md](README.md) troubleshooting section

**Email**: support@conveniencegrader.com (set this up!)

**GitHub Issues**: Open an issue on your repository

---

🎉 **Congratulations!** Your ConvenienceGrader is now live!
