# Deploy Right Now - Step by Step

I'll walk you through the **fastest free deployment**. Follow along!

---

## 🎯 What We're Doing

```
You → Get API keys (15 min) → Push to GitHub (2 min) → Deploy to Vercel (5 min) → Deploy worker to Railway (5 min) → Test! (2 min)
```

**Total time**: ~30 minutes
**Total cost**: FREE (using all free tiers)

---

## ✅ **Phase 1: Get Your Services** (15 minutes)

### Open these 3 tabs now:

1. **Supabase** (Database): https://supabase.com/dashboard/sign-in
2. **Upstash** (Redis): https://console.upstash.com/login
3. **Google Cloud** (APIs): https://console.cloud.google.com/

### For each service, follow GET_SERVICES.md

**When you have all 3 connection strings, come back here!**

---

## ✅ **Phase 2: Configure Your App** (2 minutes)

Once you have your credentials:

1. Open the `.env` file in this directory
2. Replace these lines with your actual values:

```bash
POSTGRES_URL="postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6379/postgres"

REDIS_URL="redis://default:[YOUR-PASSWORD]@us1-xxx.upstash.io:6379"

GOOGLE_PLACES_API_KEY="AIzaSy[YOUR-KEY]"
GOOGLE_PAGESPEED_API_KEY="AIzaSy[YOUR-KEY]"  # Can use same key

SENDGRID_API_KEY="SG.[YOUR-KEY]"  # Optional
FROM_EMAIL="noreply@conveniencegrader.com"

NEXT_PUBLIC_APP_URL="http://localhost:3000"  # We'll update this after Vercel deploy
```

3. Save the file

**Ready?** Reply "configured" and I'll help you deploy!

---

## ✅ **Phase 3: Push to GitHub** (2 minutes)

I can help you with this! Just tell me:
1. Do you have a GitHub account?
2. Have you created a repository for this project?

---

## ✅ **Phase 4: Deploy to Vercel** (5 minutes)

**Link**: https://vercel.com

1. Sign up/login with GitHub
2. Click "Add New..." → "Project"
3. Import your `convenience-grader` repository
4. In the "Configure Project" screen:
   - Framework: Next.js (auto-detected ✅)
   - Root Directory: `./`
   - Build Command: `npm run build`
5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add ALL variables from your `.env` file:
     ```
     POSTGRES_URL
     REDIS_URL
     GOOGLE_PLACES_API_KEY
     GOOGLE_PAGESPEED_API_KEY
     SENDGRID_API_KEY
     FROM_EMAIL
     NEXT_PUBLIC_APP_URL (use https://your-project-name.vercel.app)
     RATE_LIMIT_SCANS_PER_HOUR=5
     ```
6. Click "Deploy"
7. Wait 2-3 minutes ⏳
8. **You'll get a URL**: `https://convenience-grader-xxx.vercel.app`

**Copy this URL!** We need it for the next step.

---

## ✅ **Phase 5: Run Database Migrations** (2 minutes)

In your terminal, run:

```bash
# Set your production database URL
export POSTGRES_URL="your_supabase_connection_string"

# Run migrations to create tables
npm run db:migrate
```

You should see output like:
```
✓ Applied migration: 0001_create_businesses.sql
✓ Applied migration: 0002_create_scans.sql
...
```

---

## ✅ **Phase 6: Deploy Worker to Railway** (5 minutes)

**Link**: https://railway.app

1. Sign up/login with GitHub
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `convenience-grader` repository
5. Railway detects it's a Node.js app ✅
6. **IMPORTANT - Set Start Command**:
   - Click on your service
   - Go to "Settings"
   - Find "Custom Start Command"
   - Enter: `npm run worker`
   - Save
7. **Add Environment Variables**:
   - Click "Variables"
   - Add these (same as Vercel):
     ```
     POSTGRES_URL
     REDIS_URL
     GOOGLE_PLACES_API_KEY
     GOOGLE_PAGESPEED_API_KEY
     ```
8. Click "Deploy"
9. Check logs to verify it's running:
   ```
   ✓ Connected to Redis
   ✓ Scan worker started
   ```

---

## ✅ **Phase 7: Update Vercel URL** (1 minute)

Now that you have your Vercel URL:

1. Go back to Vercel dashboard
2. Go to your project → Settings → Environment Variables
3. Find `NEXT_PUBLIC_APP_URL`
4. Update it to your actual URL: `https://convenience-grader-xxx.vercel.app`
5. Redeploy (Deployments → ... → Redeploy)

---

## ✅ **Phase 8: TEST IT!** (2 minutes)

1. **Visit your Vercel URL**: `https://convenience-grader-xxx.vercel.app`

2. **Try the flow**:
   - Type "7-Eleven" in the search box
   - Select a store from the dropdown
   - Click "Get My Free Grade"
   - Watch the progress...
   - Wait 30-60 seconds
   - See your report! 🎉

3. **Verify in Railway**:
   - Open Railway dashboard
   - Click on your worker
   - Check logs - should see:
     ```
     [Worker] Processing job search_visibility...
     [Worker] Job completed successfully
     ```

---

## ✅ **Success Checklist**

- [ ] Landing page loads
- [ ] Search autocomplete works
- [ ] Can select a business
- [ ] Scan starts (shows progress)
- [ ] Report displays (with scores)
- [ ] Railway logs show job processing
- [ ] No errors in logs

---

## 🎉 **YOU'RE LIVE!**

Your app is now deployed at: `https://convenience-grader-xxx.vercel.app`

**Share it** with friends and test with different stores!

---

## 🆘 **Troubleshooting**

### "Database connection failed"
```bash
# Test your connection string
psql $POSTGRES_URL -c "SELECT 1"
```

### "Worker not processing"
- Check Railway logs for errors
- Verify REDIS_URL is correct
- Try redeploying worker

### "Google API error"
- Verify APIs are enabled in Google Cloud Console
- Check API key is correct
- Make sure you're not over quota

### Still stuck?
Reply with the error message and I'll help debug!

---

## 💰 **Cost Summary**

- Vercel: **FREE** (Hobby plan)
- Railway: **FREE** ($5 credit, ~$3-5/mo after)
- Supabase: **FREE** (500MB database)
- Upstash: **FREE** (30MB Redis)
- Google APIs: **~$10/mo** for 1K scans (first $200 free for 90 days)
- **TOTAL: $0-10/month**

---

## 🚀 **Next Steps**

After it's deployed:
1. Add a custom domain (optional)
2. Set up monitoring (Sentry)
3. Share with convenience store owners!
4. Get feedback and iterate

---

Ready to start? Open **GET_SERVICES.md** and get your API keys!
