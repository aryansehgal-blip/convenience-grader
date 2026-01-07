import axios from 'axios';
import { cache } from '@/lib/redis';
import { hashString } from '@/lib/utils';

const PAGESPEED_API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY!;
const API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

export interface PageSpeedResult {
  score: number;
  lcp: number;
  fid: number;
  cls: number;
  performanceScore: number;
  fetchSuccess: boolean;
}

export async function analyzePageSpeed(url: string): Promise<PageSpeedResult | null> {
  if (!url) {
    return null;
  }

  const cacheKey = `pagespeed:${hashString(url)}`;

  // Check cache (24 hour TTL)
  const cached = await cache.get<PageSpeedResult>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(API_URL, {
      params: {
        url,
        key: PAGESPEED_API_KEY,
        strategy: 'mobile',
        category: 'performance',
      },
      timeout: 30000,
    });

    const lighthouseResult = response.data.lighthouseResult;
    const metrics = lighthouseResult.audits;

    const result: PageSpeedResult = {
      score: Math.round((lighthouseResult.categories.performance.score || 0) * 100),
      lcp: metrics['largest-contentful-paint']?.numericValue || 0,
      fid: metrics['max-potential-fid']?.numericValue || 0,
      cls: metrics['cumulative-layout-shift']?.numericValue || 0,
      performanceScore: Math.round((lighthouseResult.categories.performance.score || 0) * 100),
      fetchSuccess: true,
    };

    // Cache for 24 hours
    await cache.set(cacheKey, result, 86400);

    return result;
  } catch (error: any) {
    console.error('PageSpeed analysis error:', error.message);

    // Return a failed result instead of null for better handling
    return {
      score: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      performanceScore: 0,
      fetchSuccess: false,
    };
  }
}

export function scoreCoreWebVitals(result: PageSpeedResult): number {
  if (!result.fetchSuccess) {
    return 0;
  }

  let score = 0;

  // LCP score (15 points max)
  if (result.lcp < 2500) {
    score += 15;
  } else if (result.lcp < 4000) {
    score += 10;
  }

  // FID score (10 points max)
  if (result.fid < 100) {
    score += 10;
  } else if (result.fid < 300) {
    score += 5;
  }

  // CLS score (10 points max)
  if (result.cls < 0.1) {
    score += 10;
  } else if (result.cls < 0.25) {
    score += 5;
  }

  // Overall performance (5 points max)
  if (result.performanceScore > 90) {
    score += 5;
  } else if (result.performanceScore >= 50) {
    score += 3;
  }

  return score; // Max 40 points
}
