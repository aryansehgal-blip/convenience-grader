import { NextRequest, NextResponse } from 'next/server';
import { Job } from 'bullmq';
import { scanQueue, JobType, publishProgress, ScanJobData } from '@/lib/queue';
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

// Vercel serverless functions have a 60s timeout on Hobby plan
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Get a job from the queue
    const job = await scanQueue.getNextJob('worker-token');

    if (!job) {
      return NextResponse.json({ message: 'No jobs in queue' }, { status: 200 });
    }

    console.log(`[Serverless Worker] Processing job ${job.name} (ID: ${job.id})`);

    // Process the job
    const result = await processJob(job);

    // Mark job as completed
    await job.moveToCompleted(result, 'worker-token', true);

    console.log(`[Serverless Worker] Job ${job.id} completed`);

    return NextResponse.json({
      success: true,
      jobId: job.id,
      jobName: job.name
    });

  } catch (error: any) {
    console.error('[Serverless Worker] Error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

async function processJob(job: Job<ScanJobData, any, string>) {
  const { placeId, sessionId, businessData } = job.data;

  console.log(`[Worker] Processing job ${job.name} for session ${sessionId}`);

  // Get place details if not provided
  const place = businessData || (await getPlaceDetails(placeId, '', ''));
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
}

async function saveJobResult(sessionId: string, jobType: JobType, result: any) {
  const scanRecord = await db.select().from(scans).where(eq(scans.sessionId, sessionId)).limit(1);

  if (scanRecord.length === 0) {
    throw new Error(`Scan not found: ${sessionId}`);
  }

  const scanId = scanRecord[0].id;

  const existingJob = await db
    .select()
    .from(scanJobs)
    .where(and(eq(scanJobs.scanId, scanId), eq(scanJobs.jobType, jobType)))
    .limit(1);

  if (existingJob.length > 0) {
    await db
      .update(scanJobs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        result: result,
      })
      .where(eq(scanJobs.id, existingJob[0].id));
  } else {
    await db.insert(scanJobs).values({
      scanId,
      jobType,
      status: 'completed',
      completedAt: new Date(),
      result: result,
    });
  }
}

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

  const problems = detectProblems(place, results.search, results.website, results.listings);

  const targetScore = Math.min(overallScore + 18, 95);
  const targetSearchScore = Math.min(results.search.score + 20, 95);
  const revenueEstimate = estimateRevenueUplift(
    results.search.score,
    targetSearchScore,
    results.listings.details.reviewCount
  );

  const scanRecord = await db.select().from(scans).where(eq(scans.sessionId, sessionId)).limit(1);

  if (scanRecord.length === 0) {
    throw new Error(`Scan not found: ${sessionId}`);
  }

  const scanId = scanRecord[0].id;

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
