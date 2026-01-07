# Deployment Architecture

## Production Setup Diagram

```
                                    ┌─────────────────────┐
                                    │                     │
                                    │   Your Domain       │
                                    │  (conveniencegrader │
                                    │       .com)         │
                                    │                     │
                                    └──────────┬──────────┘
                                               │
                                               │ DNS
                                               │
                                    ┌──────────▼──────────┐
                                    │                     │
                                    │      VERCEL         │
                                    │  (Next.js Frontend) │
                                    │                     │
                                    │  ┌───────────────┐  │
                                    │  │ Landing Page  │  │
                                    │  │ Search UI     │  │
                                    │  │ Report Pages  │  │
                                    │  └───────────────┘  │
                                    │                     │
                                    │  ┌───────────────┐  │
                                    │  │  API Routes   │  │
                                    │  │  /api/search  │  │
                                    │  │  /api/scans   │  │
                                    │  └───────────────┘  │
                                    │                     │
                                    └─────┬───────┬───────┘
                                          │       │
                                          │       │
            ┌─────────────────────────────┘       └──────────────────────┐
            │                                                             │
            │                                                             │
┌───────────▼──────────┐                                    ┌─────────────▼─────────┐
│                      │                                    │                       │
│   SUPABASE/NEON      │                                    │   UPSTASH/REDIS       │
│   (PostgreSQL)       │                                    │   (Cache + Queue)     │
│                      │                                    │                       │
│  ┌────────────────┐  │                                    │  ┌─────────────────┐  │
│  │  businesses    │  │                                    │  │ Cache Keys:     │  │
│  │  scans         │  │                                    │  │ - place:xxx     │  │
│  │  reports       │  │                                    │  │ - serp:xxx      │  │
│  │  scan_jobs     │  │                                    │  │ - pagespeed:xxx │  │
│  │  email_captures│  │                                    │  └─────────────────┘  │
│  └────────────────┘  │                                    │                       │
│                      │                                    │  ┌─────────────────┐  │
│  Auto backups: Daily │                                    │  │ BullMQ Queue    │  │
│  Storage: 500MB free │                                    │  │ - Scan jobs     │  │
└──────────────────────┘                                    │  └─────────────────┘  │
                                                            │                       │
                                                            │  Memory: 30MB free    │
                                                            └───────────┬───────────┘
                                                                        │
                                                                        │ Pub/Sub
                                                                        │
                                                            ┌───────────▼───────────┐
                                                            │                       │
                                                            │     RAILWAY           │
                                                            │  (Background Worker)  │
                                                            │                       │
                                                            │  ┌─────────────────┐  │
                                                            │  │  BullMQ Worker  │  │
                                                            │  │                 │  │
                                                            │  │  - Search jobs  │  │
                                                            │  │  - Website jobs │  │
                                                            │  │  - Listing jobs │  │
                                                            │  │  - Competitor   │  │
                                                            │  └─────────────────┘  │
                                                            │                       │
                                                            │  Running 24/7         │
                                                            │  Cost: ~$5/month      │
                                                            └───────────┬───────────┘
                                                                        │
                                                                        │
                          ┌─────────────────────────────────────────────┴────────────┐
                          │                                                           │
                          │                                                           │
              ┌───────────▼────────────┐                               ┌──────────────▼──────────┐
              │                        │                               │                         │
              │   GOOGLE CLOUD APIs    │                               │   SENDGRID              │
              │                        │                               │   (Email Service)       │
              │  ┌──────────────────┐  │                               │                         │
              │  │ Places API       │  │                               │  ┌───────────────────┐  │
              │  │ - Autocomplete   │  │                               │  │ Report Delivery   │  │
              │  │ - Place Details  │  │                               │  │ Welcome Email     │  │
              │  │ - Nearby Search  │  │                               │  │ Drip Campaign     │  │
              │  └──────────────────┘  │                               │  └───────────────────┘  │
              │                        │                               │                         │
              │  ┌──────────────────┐  │                               │  100 emails/day free    │
              │  │ PageSpeed API    │  │                               └─────────────────────────┘
              │  │ - Core Web Vitals│  │
              │  │ - Performance    │  │
              │  └──────────────────┘  │
              │                        │
              │  $200 free credit      │
              │  ~$10/mo for 1K scans  │
              └────────────────────────┘
```

## Data Flow

### User Request Flow
```
1. User visits website
   └─> Vercel serves Next.js pages

2. User searches for business
   └─> POST /api/search
       └─> Google Places API (autocomplete)
           └─> Returns results

3. User starts scan
   └─> POST /api/scans
       └─> Creates DB records (PostgreSQL)
           └─> Enqueues 4 jobs (Redis/BullMQ)
               └─> Returns session_id

4. Railway Worker picks up jobs
   └─> Job 1: Search Visibility
       └─> Google Places Nearby Search
           └─> Saves to DB
   └─> Job 2: Website Experience
       └─> PageSpeed Insights API
           └─> Fetches & analyzes HTML
               └─> Saves to DB
   └─> Job 3: Local Listings
       └─> Google Place Details
           └─> Saves to DB
   └─> Job 4: Competitors
       └─> Combines all results
           └─> Generates final report
               └─> Saves to DB

5. User views report
   └─> GET /api/scans/:id/report
       └─> Fetches from PostgreSQL
           └─> Returns JSON
```

## Cost Breakdown

### Free Tier (0-1,000 scans/month)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | **$0** |
| Railway | Free credit | **$0** (has $5 credit) |
| Supabase | Free | **$0** |
| Upstash Redis | Free | **$0** |
| Google APIs | Free tier + credit | **$0-10** |
| SendGrid | Free | **$0** |
| **TOTAL** | | **$0-10/month** |

### Growth Tier (5,000 scans/month)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | **$20** |
| Railway | Starter | **$10** |
| Supabase | Pro | **$25** |
| Upstash Redis | Pay as you go | **$5** |
| Google APIs | Pay as you go | **$50** |
| SendGrid | Essentials | **$20** |
| **TOTAL** | | **$130/month** |

### Scale Tier (50,000 scans/month)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | **$20** |
| Railway | 2x workers | **$50** |
| Supabase | Pro | **$100** |
| Upstash Redis | Dedicated | **$50** |
| Google APIs | Pay as you go | **$500** |
| SendGrid | Pro | **$90** |
| **TOTAL** | | **$810/month** |

## Deployment Checklist Summary

### Phase 1: Prerequisites (15 min)
- [ ] Create Supabase account & database
- [ ] Create Upstash Redis instance
- [ ] Get Google Cloud API keys
- [ ] Get SendGrid API key
- [ ] Create .env file with all credentials

### Phase 2: Deploy Code (10 min)
- [ ] Push code to GitHub
- [ ] Deploy to Vercel (frontend + API)
- [ ] Deploy to Railway (worker)
- [ ] Run database migrations

### Phase 3: Test (5 min)
- [ ] Visit deployed URL
- [ ] Search for business
- [ ] Complete full scan
- [ ] Verify worker logs
- [ ] Check database for results

### Phase 4: Monitor (Ongoing)
- [ ] Set up error tracking (Sentry)
- [ ] Monitor API usage (Google Cloud Console)
- [ ] Monitor costs (all platforms)
- [ ] Set up uptime monitoring (UptimeRobot)

## Scaling Strategies

### When to scale each component:

**Frontend (Vercel)**
- Trigger: >100 req/second
- Action: Upgrade to Pro (auto-scales)

**Worker (Railway)**
- Trigger: Queue backup >100 jobs
- Action: Add more worker instances

**Database (Supabase)**
- Trigger: >80% storage or >70% CPU
- Action: Upgrade plan or optimize queries

**Redis (Upstash)**
- Trigger: Memory >80% full
- Action: Upgrade plan or adjust TTLs

**Google APIs**
- Trigger: Approaching quota limits
- Action: Request quota increase or optimize caching

## Security Checklist

- [ ] All environment variables set (no placeholders)
- [ ] API keys restricted to specific services
- [ ] Database has strong password
- [ ] Redis requires authentication
- [ ] Rate limiting enabled (5 scans/hour/IP)
- [ ] CORS configured (Vercel handles this)
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] Regular dependency updates (npm audit)

## Monitoring & Alerts

### Set up monitoring for:

1. **Uptime**
   - Use UptimeRobot (free)
   - Ping https://your-domain.com every 5 min

2. **Errors**
   - Install Sentry
   - Get notified of crashes

3. **Performance**
   - Vercel Analytics (included)
   - Track page load times

4. **Costs**
   - Google Cloud billing alerts
   - Set budget alerts ($50, $100, $200)

---

Ready to deploy? Follow [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)!
