import { Worker, Job } from 'bullmq';
import { scanQueue, JobType, publishProgress, ScanJobData } from '@/lib/queue';
import redis from '@/lib/redis';
import { db, scanJobs, reports, scans } from '@/db';
import { eq, and } from 'drizzle-orm';
import { getPlaceDetails } from '@/services/nominatim.service';
import { analyzeSearchVisibility } from '@/services/search-visibility.service';
import { analyzeWebsiteExperience } from '@/services/website-experience.service';
import { analyzeLocalListings } from '@/services/local-listings.service';
import { analyzeCompetitors } from '@/services/competitor.service';
import { detectProblems } from '@/services/problem-detector.service';
import { estimateRevenueUplift } from '@/services/revenue-estimator.service';
import { calculateOverallScore } from '@/lib/utils';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Worker for all scan job types
const scanWorker = new Worker(
  'scans',
  async (job: Job<ScanJobData, any, string>) => {
    const { placeId, sessionId, businessData } = job.data;

    console.log(`[Worker] Processing job ${job.name} for session ${sessionId}`);

    // Get place details if not provided
    const place = businessData || (await getPlaceDetails(placeId));
    if (!place) {
      throw new Error(`Place not found: ${placeId}`);
    }

    let result: any;

    switch (job.name) {
      case JobType.SearchVisibility:
        await publishProgress(sessionId, {
          stage: 'search',
          percent: 20,
          message: 'Checking search rankings...',
        });

        result = await analyzeSearchVisibility(place);

        await publishProgress(sessionId, {
          stage: 'search',
          percent: 30,
          message: '✓ Analyzed 6 keyword themes',
        });

        // Save job result
        await saveJobResult(sessionId, JobType.SearchVisibility, result);
        break;

      case JobType.WebsiteExperience:
        await publishProgress(sessionId, {
          stage: 'website',
          percent: 40,
          message: 'Testing website speed...',
        });

        result = await analyzeWebsiteExperience(place.website);

        await publishProgress(sessionId, {
          stage: 'website',
          percent: 55,
          message: `✓ Scanned website (Mobile Performance: ${result.score}/100)`,
        });

        await saveJobResult(sessionId, JobType.WebsiteExperience, result);
        break;

      case JobType.LocalListings:
        await publishProgress(sessionId, {
          stage: 'listings',
          percent: 60,
          message: 'Checking local listings...',
        });

        result = await analyzeLocalListings(place);

        await publishProgress(sessionId, {
          stage: 'listings',
          percent: 70,
          message: '✓ Analyzed Google Business Profile',
        });

        await saveJobResult(sessionId, JobType.LocalListings, result);
        break;

      case JobType.CompetitorBenchmark:
        await publishProgress(sessionId, {
          stage: 'competitors',
          percent: 75,
          message: 'Analyzing competitors...',
        });

        // Get results from other jobs
        const allJobs = await db
          .select()
          .from(scanJobs)
          .where(eq(scanJobs.scanId, sessionId as any));

        const searchJob = allJobs.find((j) => j.jobType === JobType.SearchVisibility);
        const websiteJob = allJobs.find((j) => j.jobType === JobType.WebsiteExperience);
        const listingsJob = allJobs.find((j) => j.jobType === JobType.LocalListings);

        if (!searchJob?.result || !websiteJob?.result || !listingsJob?.result) {
          throw new Error('Waiting for other jobs to complete');
        }

        const competitors = await analyzeCompetitors(place, {
          search: (searchJob.result as any).score,
          website: (websiteJob.result as any).score,
          listings: (listingsJob.result as any).score,
        });

        await publishProgress(sessionId, {
          stage: 'competitors',
          percent: 85,
          message: `✓ Benchmarked against ${competitors.length} nearby stores`,
        });

        await saveJobResult(sessionId, JobType.CompetitorBenchmark, competitors);

        // Generate final report
        await generateFinalReport(sessionId, place, {
          search: searchJob.result,
          website: websiteJob.result,
          listings: listingsJob.result,
          competitors,
        });

        break;

      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }

    return result;
  },
  {
    connection,
    concurrency: 5,
  }
);

scanWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

scanWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

// Helper to save job results
async function saveJobResult(sessionId: string, jobType: JobType, result: any) {
  const scanRecord = await db.select().from(scans).where(eq(scans.sessionId, sessionId)).limit(1);

  if (scanRecord.length === 0) {
    throw new Error(`Scan not found: ${sessionId}`);
  }

  const scanId = scanRecord[0].id;

  // Check if job record exists
  const existingJob = await db
    .select()
    .from(scanJobs)
    .where(and(eq(scanJobs.scanId, scanId), eq(scanJobs.jobType, jobType)))
    .limit(1);

  if (existingJob.length > 0) {
    // Update existing
    await db
      .update(scanJobs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        result: result,
      })
      .where(eq(scanJobs.id, existingJob[0].id));
  } else {
    // Insert new
    await db.insert(scanJobs).values({
      scanId,
      jobType,
      status: 'completed',
      completedAt: new Date(),
      result: result,
    });
  }
}

// Generate final report
async function generateFinalReport(
  sessionId: string,
  place: any,
  results: {
    search: any;
    website: any;
    listings: any;
    competitors: any;
  }
) {
  await publishProgress(sessionId, {
    stage: 'report',
    percent: 90,
    message: 'Generating your report...',
  });

  const overallScore = calculateOverallScore(
    results.search.score,
    results.website.score,
    results.listings.score
  );

  // Detect problems
  const problems = detectProblems(place, results.search, results.website, results.listings);

  // Estimate revenue uplift (target score: +15-20 points)
  const targetScore = Math.min(overallScore + 18, 95);
  const targetSearchScore = Math.min(results.search.score + 20, 95);
  const revenueEstimate = estimateRevenueUplift(
    results.search.score,
    targetSearchScore,
    results.listings.details.reviewCount
  );

  // Get scan ID
  const scanRecord = await db.select().from(scans).where(eq(scans.sessionId, sessionId)).limit(1);

  if (scanRecord.length === 0) {
    throw new Error(`Scan not found: ${sessionId}`);
  }

  const scanId = scanRecord[0].id;

  // Save report
  await db.insert(reports).values({
    scanId,
    overallScore,
    searchVisibilityScore: results.search.score,
    websiteExperienceScore: results.website.score,
    localListingsScore: results.listings.score,
    rawData: {
      search: results.search,
      website: results.website,
      listings: results.listings,
    },
    problems: problems,
    competitors: results.competitors,
    revenueEstimate,
  });

  // Update scan status
  await db
    .update(scans)
    .set({
      status: 'completed',
      completedAt: new Date(),
    })
    .where(eq(scans.id, scanId));

  await publishProgress(sessionId, {
    stage: 'complete',
    percent: 100,
    message: 'Report ready!',
  });

  console.log(`[Worker] Final report generated for session ${sessionId}`);
}

console.log('✓ Scan worker started');

export { scanWorker };
