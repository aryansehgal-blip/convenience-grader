import { NextRequest, NextResponse } from 'next/server';
import { db, businesses, scans, scanJobs } from '@/db';
import { eq } from 'drizzle-orm';
import { getPlaceDetails } from '@/services/nominatim.service';
import { enqueueScanJobs } from '@/lib/queue';
import { cache } from '@/lib/redis';
import { generateSessionId } from '@/lib/utils';

const RATE_LIMIT_PER_HOUR = parseInt(process.env.RATE_LIMIT_SCANS_PER_HOUR || '5');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { place_id, lat, lon } = body;

    if (!place_id || !lat || !lon) {
      return NextResponse.json({ error: 'place_id, lat, and lon are required' }, { status: 400 });
    }

    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Check rate limit (with error handling for Redis)
    try {
      const rateLimitKey = `rate_limit:ip:${ip}`;
      const currentCount = await cache.increment(rateLimitKey, 3600); // 1 hour TTL

      if (currentCount > RATE_LIMIT_PER_HOUR) {
        return NextResponse.json(
          { error: 'Too many scans. Please try again in an hour.' },
          { status: 429 }
        );
      }
    } catch (rateLimitError) {
      console.warn('Rate limit check failed, continuing:', rateLimitError);
    }

    // Get place details with actual coordinates from search
    const placeDetails = await getPlaceDetails(place_id, lat, lon);

    if (!placeDetails) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    // Upsert business
    const existingBusiness = await db
      .select()
      .from(businesses)
      .where(eq(businesses.placeId, place_id))
      .limit(1);

    let businessId: string;

    if (existingBusiness.length > 0) {
      businessId = existingBusiness[0].id;

      // Update business data
      await db
        .update(businesses)
        .set({
          name: placeDetails.name,
          address: placeDetails.formatted_address,
          lat: placeDetails.geometry.location.lat.toString(),
          lng: placeDetails.geometry.location.lng.toString(),
          phone: placeDetails.formatted_phone_number || null,
          website: placeDetails.website || null,
          types: placeDetails.types,
          updatedAt: new Date(),
        })
        .where(eq(businesses.id, businessId));
    } else {
      const [newBusiness] = await db
        .insert(businesses)
        .values({
          placeId: place_id,
          name: placeDetails.name,
          address: placeDetails.formatted_address,
          lat: placeDetails.geometry.location.lat.toString(),
          lng: placeDetails.geometry.location.lng.toString(),
          phone: placeDetails.formatted_phone_number || null,
          website: placeDetails.website || null,
          types: placeDetails.types,
        })
        .returning();

      businessId = newBusiness.id;
    }

    // Create scan
    const sessionId = generateSessionId();

    const [scan] = await db
      .insert(scans)
      .values({
        sessionId,
        businessId,
        status: 'pending',
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
      })
      .returning();

    // Create job records
    await db.insert(scanJobs).values([
      { scanId: scan.id, jobType: 'search_visibility', status: 'queued' },
      { scanId: scan.id, jobType: 'website_experience', status: 'queued' },
      { scanId: scan.id, jobType: 'local_listings', status: 'queued' },
      { scanId: scan.id, jobType: 'competitor_benchmark', status: 'queued' },
    ]);

    // Enqueue jobs
    await enqueueScanJobs(place_id, sessionId, placeDetails);

    // Update scan status
    await db
      .update(scans)
      .set({ status: 'in_progress' })
      .where(eq(scans.id, scan.id));

    return NextResponse.json(
      {
        session_id: sessionId,
        status: 'pending',
        progress_url: `/api/scans/${sessionId}/progress`,
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('Scan creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
