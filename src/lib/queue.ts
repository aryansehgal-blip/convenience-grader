import { Queue, Worker, Job } from 'bullmq';
import redis from './redis';

export enum JobType {
  SearchVisibility = 'search_visibility',
  WebsiteExperience = 'website_experience',
  LocalListings = 'local_listings',
  CompetitorBenchmark = 'competitor_benchmark',
  GeneratePDF = 'generate_pdf',
  SendEmail = 'send_email',
}

export interface ScanJobData {
  placeId: string;
  sessionId: string;
  businessData?: any;
}

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const scanQueue = new Queue('scans', { connection });

export const jobDefaults = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  timeout: 30000, // 30 seconds
};

// Publish progress updates
export async function publishProgress(sessionId: string, update: {
  stage: string;
  percent: number;
  message: string;
}) {
  await redis.publish(`scan_progress:${sessionId}`, JSON.stringify(update));
}

// Add scan jobs
export async function enqueueScanJobs(placeId: string, sessionId: string, businessData?: any) {
  const jobs = [
    {
      name: JobType.SearchVisibility,
      data: { placeId, sessionId, businessData },
      opts: jobDefaults,
    },
    {
      name: JobType.WebsiteExperience,
      data: { placeId, sessionId, businessData },
      opts: jobDefaults,
    },
    {
      name: JobType.LocalListings,
      data: { placeId, sessionId, businessData },
      opts: jobDefaults,
    },
    {
      name: JobType.CompetitorBenchmark,
      data: { placeId, sessionId, businessData },
      opts: jobDefaults,
    },
  ];

  await scanQueue.addBulk(jobs);
}

export type { Job };
