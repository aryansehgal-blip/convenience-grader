# ConvenienceGrader

A comprehensive online presence grading tool for convenience stores, built with Next.js 14, PostgreSQL, Redis, and BullMQ.

## Features

- **Business Search**: Autocomplete search using Google Places API
- **Comprehensive Scoring**:
  - Search Visibility (Maps + organic rankings)
  - Website Experience (Core Web Vitals + content analysis)
  - Local Listings & Reputation (Google Business Profile completeness)
- **Competitor Benchmarking**: Compare against top 3 nearby competitors
- **Problem Detection**: Identify and prioritize issues with actionable fixes
- **Revenue Estimation**: Calculate potential revenue uplift from improvements
- **Real-time Progress**: Server-Sent Events for scan progress updates
- **Email Capture & PDF Reports**: Lead generation funnel
- **Rate Limiting**: Prevent abuse with IP-based limits

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, BullMQ job queue
- **Database**: PostgreSQL (via Drizzle ORM)
- **Cache**: Redis
- **External APIs**:
  - Google Places API
  - PageSpeed Insights API
  - SendGrid (email)

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Google Cloud account with Places & PageSpeed APIs enabled

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

\`\`\`bash
cp .env.example .env
\`\`\`

Required variables:
- `POSTGRES_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `GOOGLE_PLACES_API_KEY`: Google Cloud API key with Places API enabled
- `GOOGLE_PAGESPEED_API_KEY`: Google Cloud API key with PageSpeed Insights enabled
- `SENDGRID_API_KEY`: SendGrid API key for emails

### 3. Database Setup

Generate and run migrations:

\`\`\`bash
npm run db:generate
npm run db:migrate
\`\`\`

### 4. Start Services

You need to run three processes:

**Terminal 1 - Next.js dev server:**
\`\`\`bash
npm run dev
\`\`\`

**Terminal 2 - Worker (BullMQ):**
\`\`\`bash
npm run worker
\`\`\`

**Terminal 3 - Redis (if local):**
\`\`\`bash
redis-server
\`\`\`

### 5. Open Application

Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

\`\`\`
convenience-grader/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/               # API routes
│   │   │   ├── search/        # Business search endpoint
│   │   │   └── scans/         # Scan CRUD endpoints
│   │   ├── page.tsx           # Landing page
│   │   ├── scan/[id]/         # Scan progress page
│   │   └── report/[id]/       # Report display page
│   ├── components/            # React components
│   │   ├── SearchBox.tsx
│   │   ├── ScanProgress.tsx
│   │   ├── ScoreCard.tsx
│   │   └── ...
│   ├── db/                    # Database schema & client
│   │   ├── schema.ts          # Drizzle schema definitions
│   │   └── index.ts           # Database client
│   ├── lib/                   # Utilities
│   │   ├── redis.ts           # Redis client & cache helpers
│   │   ├── queue.ts           # BullMQ queue setup
│   │   └── utils.ts           # Shared utilities
│   ├── services/              # Business logic
│   │   ├── google-places.service.ts
│   │   ├── pagespeed.service.ts
│   │   ├── search-visibility.service.ts
│   │   ├── website-experience.service.ts
│   │   ├── local-listings.service.ts
│   │   ├── competitor.service.ts
│   │   ├── problem-detector.service.ts
│   │   └── revenue-estimator.service.ts
│   └── workers/               # Background job workers
│       └── index.ts           # BullMQ worker implementation
├── drizzle/                   # Database migrations
├── public/                    # Static assets
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## API Documentation

### POST /api/search
Search for businesses by name.

**Request:**
\`\`\`json
{
  "query": "QuickStop",
  "location": "Austin, TX"
}
\`\`\`

**Response:**
\`\`\`json
{
  "results": [
    {
      "place_id": "ChIJ...",
      "name": "QuickStop Market",
      "address": "123 Main St, Austin, TX",
      "types": ["convenience_store"]
    }
  ]
}
\`\`\`

### POST /api/scans
Initiate a new scan.

**Request:**
\`\`\`json
{
  "place_id": "ChIJ..."
}
\`\`\`

**Response (202 Accepted):**
\`\`\`json
{
  "session_id": "abc123xyz",
  "status": "pending",
  "progress_url": "/api/scans/abc123xyz/progress"
}
\`\`\`

### GET /api/scans/:session_id/progress
Server-Sent Events endpoint for real-time progress updates.

**Response (text/event-stream):**
\`\`\`
event: progress
data: {"stage":"search","percent":20,"message":"Checking search rankings..."}

event: complete
data: {"session_id":"abc123xyz","overall_score":67}
\`\`\`

### GET /api/scans/:session_id/report
Retrieve full report data.

**Response:**
\`\`\`json
{
  "session_id": "abc123xyz",
  "business": { ... },
  "scores": {
    "overall": 67,
    "search_visibility": 58,
    "website_experience": 72,
    "local_listings": 71
  },
  "subscores": { ... },
  "problems": [ ... ],
  "competitors": [ ... ],
  "revenue_estimate": { ... }
}
\`\`\`

## Scoring Algorithm

### Overall Score (0-100)
\`\`\`
Overall = (Search × 0.40) + (Website × 0.35) + (Listings × 0.25)
\`\`\`

### Search Visibility (0-100)
- **Keyword Rankings** (60 pts): Rankings for 6 keyword themes
- **Map Pack Presence** (40 pts): Position in Google Maps top 3

### Website Experience (0-100)
- **Core Web Vitals** (40 pts): LCP, FID, CLS scores
- **Essential Info** (30 pts): Hours, phone, address, services
- **Schema Markup** (15 pts): Structured data implementation
- **Mobile Optimization** (10 pts): Viewport, touch targets
- **Conversion Elements** (5 pts): Directions, CTAs

### Local Listings & Reputation (0-100)
- **GBP Completeness** (50 pts): Hours, photos, attributes, categories
- **NAP Consistency** (20 pts): Name, address, phone across platforms
- **Reviews & Reputation** (30 pts): Volume, rating, recency, response rate

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Note**: You'll need to deploy the worker separately (e.g., on Railway, Render, or DigitalOcean) since Vercel doesn't support long-running processes.

### Alternative: VPS (DigitalOcean, Linode)

1. Set up Ubuntu server
2. Install Node.js, PostgreSQL, Redis
3. Clone repository
4. Install dependencies and build:
   \`\`\`bash
   npm install
   npm run build
   \`\`\`
5. Use PM2 to run both Next.js and worker:
   \`\`\`bash
   pm2 start npm --name "conveniencegrader" -- start
   pm2 start npm --name "worker" -- run worker
   \`\`\`

## Development

### Add New Problem Checks

Edit `src/services/problem-detector.service.ts`:

\`\`\`typescript
problems.push({
  id: 'your_check_id',
  severity: 'high',
  title: 'Issue description',
  impactArea: 'search',
  impactScore: -10,
  explanation: 'Why it matters',
  fix: 'How to fix it',
  complexity: 'moderate',
  estimatedTime: '1 hour',
  priorityRank: 0,
});
\`\`\`

### Adjust Scoring Weights

Edit score calculation functions in service files:
- `src/services/search-visibility.service.ts`
- `src/services/website-experience.service.ts`
- `src/services/local-listings.service.ts`

## Troubleshooting

### Worker not processing jobs
- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check worker logs for errors
- Verify `REDIS_URL` is correct in `.env`

### Database connection errors
- Verify PostgreSQL is running
- Check `POSTGRES_URL` format: `postgresql://user:pass@host:5432/dbname`
- Run migrations: `npm run db:migrate`

### API rate limits exceeded
- Google Places: 100,000 requests/month free tier
- PageSpeed Insights: 25,000 requests/day free tier
- Consider caching results with longer TTLs

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Create an issue in GitHub repository
- Email: support@conveniencegrader.com

---

Built with ❤️ for convenience store owners everywhere.
