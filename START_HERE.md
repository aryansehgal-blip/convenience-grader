# 🚀 START HERE - ConvenienceGrader Deployment Guide

Welcome! You're about to deploy a production-ready online grading tool for convenience stores.

## What You've Got

✅ Complete Next.js application (85% finished)
✅ Database schema with migrations
✅ Background job processing system
✅ Full scoring algorithms
✅ External API integrations
✅ Beautiful landing page
✅ Comprehensive documentation

## Choose Your Path

### 🏃 Fast Track (30 minutes)
**Best for**: Experienced developers who want to deploy NOW

👉 **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - Command-by-command deployment

### 📚 Detailed Guide (1 hour)
**Best for**: First-time deployers or those who want to understand every step

👉 **[DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)** - Step-by-step with screenshots

### 🧠 Architecture Deep Dive
**Best for**: Understanding how everything fits together

👉 **[DEPLOYMENT_ARCHITECTURE.md](DEPLOYMENT_ARCHITECTURE.md)** - Diagrams & cost breakdown

---

## The Fastest Way to Deploy

### Step 1: Run Preparation Script (2 minutes)

```bash
cd /Users/aryansehgal/convenience-store-website
./deploy-prepare.sh
```

This checks your setup and prepares for deployment.

### Step 2: Get Your Services (15 minutes)

You need 4 things:

1. **PostgreSQL Database** → [supabase.com](https://supabase.com) (Free)
2. **Redis Cache** → [upstash.com](https://upstash.com) (Free)
3. **Google API Keys** → [console.cloud.google.com](https://console.cloud.google.com) (~$10/mo)
4. **SendGrid Email** → [sendgrid.com](https://sendgrid.com) (Free)

Copy the connection strings and API keys.

### Step 3: Edit .env File (2 minutes)

```bash
nano .env
```

Paste your credentials:
- `POSTGRES_URL=postgresql://...`
- `REDIS_URL=redis://...`
- `GOOGLE_PLACES_API_KEY=AIza...`
- `SENDGRID_API_KEY=SG...`

Save and exit.

### Step 4: Push to GitHub (3 minutes)

```bash
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/convenience-grader.git
git push -u origin main
```

### Step 5: Deploy to Vercel (5 minutes)

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repo
4. Add environment variables from .env
5. Click "Deploy"

Done! You get a URL like: `https://convenience-grader-xxx.vercel.app`

### Step 6: Deploy Worker to Railway (5 minutes)

1. Go to [railway.app](https://railway.app)
2. Click "Deploy from GitHub"
3. Select your repo
4. Set start command: `npm run worker`
5. Add same environment variables
6. Deploy

### Step 7: Run Database Migrations (2 minutes)

```bash
export POSTGRES_URL="your_production_postgres_url"
npm run db:migrate
```

### Step 8: Test! (2 minutes)

1. Visit your Vercel URL
2. Search for "7-Eleven"
3. Click "Get My Free Grade"
4. Wait 30-60 seconds
5. See your report! 🎉

---

## What If Something Goes Wrong?

### Common Issues & Fixes

**"Can't connect to database"**
```bash
# Test connection
psql $POSTGRES_URL -c "SELECT 1"

# Run migrations again
npm run db:migrate
```

**"Worker not processing jobs"**
- Check Railway logs (dashboard → Logs)
- Verify Redis URL is correct
- Restart worker in Railway

**"Google API error"**
- Verify API key is correct
- Check APIs are enabled in Google Cloud Console
- Check you haven't exceeded quota

**"Build fails on Vercel"**
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run lint
```

---

## Cost Calculator

Use this to estimate your monthly costs:

| Scans/Month | Vercel | Railway | Database | Redis | Google APIs | Total |
|-------------|--------|---------|----------|-------|-------------|-------|
| 0-1,000 | Free | Free | Free | Free | $0-10 | **$0-10** |
| 5,000 | $20 | $10 | $25 | $5 | $50 | **$110** |
| 10,000 | $20 | $10 | $25 | $10 | $100 | **$165** |
| 50,000 | $20 | $50 | $100 | $50 | $500 | **$720** |

**Pro tip**: Start with free tiers. Upgrade only when you hit limits.

---

## What's Next After Deployment?

### Week 1: Monitor & Fix
- Watch error logs (Vercel + Railway)
- Test with 10+ different stores
- Fix any edge cases

### Week 2: Optimize
- Increase cache TTLs to reduce API costs
- Add more problem detection rules
- Improve scoring accuracy

### Week 3: Launch
- Add custom domain
- Set up Google Analytics
- Start marketing!

### Month 2: Enhance
- Add email drip campaigns
- Multi-location support
- PDF report generation
- User accounts

---

## Need Help?

### Documentation Files

- [README.md](README.md) - Technical documentation
- [QUICKSTART.md](QUICKSTART.md) - Local development setup
- [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) - Detailed deployment steps
- [DEPLOYMENT_ARCHITECTURE.md](DEPLOYMENT_ARCHITECTURE.md) - Architecture & costs
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - Fast deployment commands
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - What's built & what's left

### Scripts

- `./setup.sh` - Set up local development
- `./deploy-prepare.sh` - Prepare for deployment

### Support

- 📧 Email: support@conveniencegrader.com
- 💬 GitHub Issues: Open an issue on your repo
- 📖 Docs: Read the files above

---

## Success Checklist

Before you consider it "done", make sure:

- [ ] Landing page loads at your Vercel URL
- [ ] Business search autocomplete works
- [ ] Can select a store
- [ ] Scan completes in <60 seconds
- [ ] Report displays with scores
- [ ] Worker logs show job processing
- [ ] No errors in Vercel/Railway logs
- [ ] Database has scan records
- [ ] Rate limiting works (try 6 scans)

---

## 🎉 Ready to Deploy?

Pick your guide:

**Fastest**: [QUICK_DEPLOY.md](QUICK_DEPLOY.md) → 30 minutes
**Detailed**: [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md) → 1 hour
**Local Dev**: [QUICKSTART.md](QUICKSTART.md) → 10 minutes

---

**Good luck!** You've got this. 💪

Questions? Open an issue or check the docs above.
