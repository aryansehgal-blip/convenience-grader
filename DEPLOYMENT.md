# Deployment Guide

Complete guide to deploying ConvenienceGrader to production.

## Architecture Overview

```
┌─────────────┐
│   Vercel    │  ← Frontend + API Routes
│  (Next.js)  │
└─────────────┘
       │
       ├── PostgreSQL (Supabase/Neon)
       ├── Redis (Redis Cloud/Upstash)
       └── S3/R2 (PDF storage)

┌─────────────┐
│   Railway   │  ← Background Worker (separate)
│  (Worker)   │
└─────────────┘
       │
       └── Same PostgreSQL + Redis
```

## Option 1: Vercel + Railway (Recommended)

### Step 1: Deploy Frontend to Vercel

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/convenience-grader.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables**

   Add these in Vercel dashboard (Settings → Environment Variables):

   ```
   POSTGRES_URL=your_postgres_connection_string
   REDIS_URL=your_redis_connection_string
   GOOGLE_PLACES_API_KEY=AIza...
   GOOGLE_PAGESPEED_API_KEY=AIza...
   SENDGRID_API_KEY=SG...
   FROM_EMAIL=noreply@conveniencegrader.com
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_S3_BUCKET=conveniencegrader-reports
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel builds and deploys automatically

### Step 2: Deploy Worker to Railway

1. **Create `railway.json`**
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "npm run worker",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

2. **Create `Procfile`** (for Railway)
   ```
   worker: npm run worker
   ```

3. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway detects Node.js automatically
   - Add same environment variables as Vercel
   - Set start command: `npm run worker`

### Step 3: Set Up Supabase (PostgreSQL)

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy connection string (format: `postgresql://postgres:[password]@[host]:5432/postgres`)

2. **Run Migrations**
   ```bash
   # Set POSTGRES_URL locally
   export POSTGRES_URL="postgresql://..."

   # Generate and run migrations
   npm run db:generate
   npm run db:migrate
   ```

3. **Add to Environment Variables**
   - Update `POSTGRES_URL` in both Vercel and Railway

### Step 4: Set Up Redis Cloud

1. **Create Database**
   - Go to [redis.com](https://redis.com/try-free/)
   - Create free database (30MB)
   - Copy connection string (format: `redis://default:[password]@[host]:12345`)

2. **Add to Environment Variables**
   - Update `REDIS_URL` in both Vercel and Railway

### Step 5: Set Up Cloudflare R2 (PDF Storage)

1. **Create R2 Bucket**
   - Go to Cloudflare Dashboard → R2
   - Create bucket: `conveniencegrader-reports`
   - Generate API token (with R2 write permissions)

2. **Configure Access**
   - Add R2 credentials to environment variables:
     ```
     AWS_ACCESS_KEY_ID=your_r2_access_key
     AWS_SECRET_ACCESS_KEY=your_r2_secret
     AWS_S3_BUCKET=conveniencegrader-reports
     AWS_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
     ```

## Option 2: All-in-One VPS (DigitalOcean, Linode)

### Step 1: Provision Server

- Ubuntu 22.04 LTS
- 2 GB RAM minimum
- 50 GB SSD

### Step 2: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install PM2 (process manager)
sudo npm install -g pm2

# Install build tools
sudo apt install -y build-essential
```

### Step 3: Set Up Database

```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE conveniencegrader;
CREATE USER cguser WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE conveniencegrader TO cguser;
\q
```

### Step 4: Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/convenience-grader.git
cd convenience-grader

# Install dependencies
npm install

# Create .env file
sudo nano .env
# (paste your environment variables)

# Run migrations
npm run db:migrate

# Build Next.js
npm run build

# Start services with PM2
pm2 start npm --name "conveniencegrader" -- start
pm2 start npm --name "worker" -- run worker

# Save PM2 configuration
pm2 save
pm2 startup
```

### Step 5: Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/conveniencegrader

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/conveniencegrader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Set Up SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Post-Deployment Checklist

- [ ] Test landing page loads
- [ ] Test business search autocomplete
- [ ] Run full scan on test business
- [ ] Verify worker processes jobs (check Railway logs or PM2 logs)
- [ ] Test email capture and PDF download
- [ ] Set up monitoring (Sentry, LogRocket, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure custom domain
- [ ] Add Google Analytics or PostHog
- [ ] Test rate limiting (5 scans/hour per IP)

## Monitoring & Maintenance

### Logs

**Vercel:**
```bash
vercel logs
```

**Railway:**
- View logs in Railway dashboard

**VPS (PM2):**
```bash
pm2 logs
pm2 monit  # real-time monitoring
```

### Database Backups

**Supabase:**
- Automatic daily backups (included)
- Point-in-time recovery available

**VPS:**
```bash
# Create backup script
sudo nano /usr/local/bin/backup-db.sh

#!/bin/bash
pg_dump conveniencegrader | gzip > /backup/cg-$(date +%Y%m%d).sql.gz

# Make executable
sudo chmod +x /usr/local/bin/backup-db.sh

# Add to cron (daily at 3 AM)
sudo crontab -e
0 3 * * * /usr/local/bin/backup-db.sh
```

### Scaling

**When to scale:**
- Response time >2 seconds
- Worker queue backing up (>100 jobs pending)
- Database CPU >70%

**How to scale:**

1. **Horizontal scaling (Vercel)**
   - Automatic with Vercel Pro

2. **Worker scaling (Railway)**
   - Increase instance count in Railway settings

3. **Database scaling (Supabase)**
   - Upgrade plan for more connections/storage

4. **Redis scaling (Redis Cloud)**
   - Upgrade plan for more memory

## Cost Optimization

### Reduce API Costs

1. **Increase cache TTLs**
   ```typescript
   // In services, increase cache duration
   await cache.set(key, data, 86400 * 3); // 3 days instead of 1
   ```

2. **Batch API calls**
   - Combine nearby searches for multi-location scans

3. **Pre-compute popular chains**
   - Run nightly cron job to scan all 7-Eleven, Circle K, etc.
   - Serve cached results

### Infrastructure

- Use Vercel free tier (100GB bandwidth/mo)
- Railway free tier ($5 credit/mo)
- Supabase free tier (500MB database)
- Redis Cloud free tier (30MB)

Upgrade only when limits exceeded.

## Troubleshooting Production Issues

### Scans timing out

1. Check worker logs
2. Increase job timeout:
   ```typescript
   // In queue.ts
   timeout: 60000, // 60 seconds instead of 30
   ```
3. Scale worker instances

### High API costs

1. Check cache hit rate:
   ```bash
   redis-cli
   INFO stats
   # Look for "keyspace_hits" vs "keyspace_misses"
   ```
2. Increase TTLs
3. Add more aggressive rate limiting

### Database connection errors

1. Check connection pool size:
   ```typescript
   // In db/index.ts
   max: 20, // increase pool size
   ```
2. Upgrade database plan
3. Optimize slow queries

## Security Best Practices

- [ ] Enable CORS only for your domain
- [ ] Use environment variables (never hardcode secrets)
- [ ] Set up rate limiting on all endpoints
- [ ] Enable Vercel WAF (Pro plan)
- [ ] Regular dependency updates (`npm audit`)
- [ ] Database backups (automated)
- [ ] Monitor for suspicious activity (PostHog, Sentry)

---

Questions? See [README.md](./README.md) or open an issue.
