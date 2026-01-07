# Get Free Services - Open These Links

## 1. Supabase (PostgreSQL Database) - FREE ✅

**Open this link**: https://supabase.com/dashboard/sign-in

Steps:
1. Sign up with GitHub (easiest)
2. Click "New Project"
3. Fill in:
   - Name: `conveniencegrader`
   - Database Password: Click "Generate a password" and COPY IT
   - Region: Choose closest to you
4. Click "Create new project" (takes 2 minutes)
5. Once ready, go to: Settings → Database
6. Under "Connection string" → "URI", click "Copy"
7. **SAVE THIS**: `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6379/postgres`

✅ **GOT IT?** Post the connection string below (or just confirm you have it)

---

## 2. Upstash (Redis Cache) - FREE ✅

**Open this link**: https://console.upstash.com/login

Steps:
1. Sign up with GitHub
2. Click "Create database"
3. Fill in:
   - Name: `conveniencegrader`
   - Type: Regional
   - Region: Choose same as Supabase
   - TLS: Enabled
4. Click "Create"
5. On the database page, scroll down to "Redis Connect" section
6. Copy the connection string (looks like: `redis://default:...@...upstash.io:6379`)
7. **SAVE THIS**: `redis://default:[PASSWORD]@...-us1-....upstash.io:6379`

✅ **GOT IT?** Confirm you have it

---

## 3. Google Cloud API Keys - ~$10/month ⚠️

**Open this link**: https://console.cloud.google.com/

Steps:
1. Sign in with Google account
2. Create new project (top bar) → Name: `conveniencegrader`
3. Enable APIs:
   - Click hamburger menu (☰) → "APIs & Services" → "Library"
   - Search "Places API" → Click → Enable
   - Search "Places API (New)" → Click → Enable
   - Search "PageSpeed Insights API" → Click → Enable
4. Create API Key:
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "API Key"
   - **COPY THE KEY** (looks like: `AIzaSy...`)
   - (Optional but recommended) Click "Restrict Key":
     - API restrictions: Select "Places API" and "PageSpeed Insights API"
     - Click Save
5. **SAVE THIS**: `AIzaSy[YOUR-KEY]`

✅ **GOT IT?** Confirm you have it

**Note**: Google gives $200 free credit for 90 days, then ~$10/mo for 1,000 scans

---

## 4. SendGrid (Email - Optional) - FREE ✅

**Open this link**: https://signup.sendgrid.com/

Steps:
1. Sign up (free plan = 100 emails/day)
2. Verify email address
3. Go to Settings → API Keys
4. Click "Create API Key"
5. Name: `conveniencegrader`
6. Permissions: Full Access
7. Click "Create & View"
8. **COPY THE KEY** (shown only once! Looks like: `SG.`)
9. **SAVE THIS**: `SG.[YOUR-KEY]`

✅ **GOT IT?** Confirm you have it (or skip for now)

---

## ✅ Checklist

Once you have all these, reply with:
- [x] Supabase connection string
- [x] Upstash Redis URL
- [x] Google API key
- [x] SendGrid key (optional)

Then I'll help you deploy!
