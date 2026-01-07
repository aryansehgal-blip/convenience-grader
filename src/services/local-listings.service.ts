import { PlaceDetails } from './google-places.service';

export interface LocalListingsResult {
  score: number;
  gbpCompletenessScore: number;
  napConsistencyScore: number;
  reviewsScore: number;
  details: {
    hasBasicInfo: boolean;
    hasCompleteHours: boolean;
    hasWebsite: boolean;
    hasCategory: boolean;
    photoCount: number;
    attributeCount: number;
    reviewCount: number;
    averageRating: number;
    hasRecentReview: boolean;
    responseRate: number;
  };
}

export async function analyzeLocalListings(place: PlaceDetails): Promise<LocalListingsResult> {
  try {
    // Google Business Profile completeness
    const details = {
      hasBasicInfo: !!(place.name && place.formatted_address && place.formatted_phone_number),
      hasCompleteHours: checkCompleteHours(place),
      hasWebsite: !!place.website,
      hasCategory: place.types.length > 0,
      photoCount: place.photos?.length || 0,
      attributeCount: estimateAttributeCount(place),
      reviewCount: place.user_ratings_total || 0,
      averageRating: place.rating || 0,
      hasRecentReview: checkRecentReview(place),
      responseRate: calculateResponseRate(place),
    };

    // Calculate GBP completeness score (max 50 points)
    let gbpScore = 0;

    // Basic info (15 points total)
    if (details.hasBasicInfo) gbpScore += 15;

    // Hours (10 points)
    if (details.hasCompleteHours) {
      gbpScore += 10;
    } else if (place.opening_hours) {
      gbpScore += 5;
    }

    // Website (5 points)
    if (details.hasWebsite) gbpScore += 5;

    // Category (5 points)
    if (details.hasCategory) gbpScore += 5;

    // Photos (10 points)
    if (details.photoCount >= 16) {
      gbpScore += 10;
    } else if (details.photoCount >= 6) {
      gbpScore += 7;
    } else if (details.photoCount >= 1) {
      gbpScore += 3;
    }

    // Attributes (10 points - estimated)
    if (details.attributeCount >= 5) {
      gbpScore += 10;
    } else if (details.attributeCount >= 3) {
      gbpScore += 7;
    } else if (details.attributeCount >= 1) {
      gbpScore += 3;
    }

    // NAP consistency score (max 20 points)
    // For MVP, assume consistency if basic info exists
    const napScore = details.hasBasicInfo ? 15 : 0;

    // Reviews & Reputation score (max 30 points)
    let reviewsScore = 0;

    // Review volume (10 points)
    if (details.reviewCount >= 50) {
      reviewsScore += 10;
    } else if (details.reviewCount >= 20) {
      reviewsScore += 7;
    } else if (details.reviewCount >= 10) {
      reviewsScore += 4;
    }

    // Average rating (10 points)
    if (details.averageRating >= 4.5) {
      reviewsScore += 10;
    } else if (details.averageRating >= 4.0) {
      reviewsScore += 7;
    } else if (details.averageRating >= 3.5) {
      reviewsScore += 4;
    }

    // Review recency (5 points)
    if (details.hasRecentReview) reviewsScore += 5;
    else if (details.reviewCount > 0) reviewsScore += 3;

    // Response rate (5 points)
    if (details.responseRate >= 0.8) {
      reviewsScore += 5;
    } else if (details.responseRate >= 0.5) {
      reviewsScore += 3;
    }

    const totalScore = gbpScore + napScore + reviewsScore;

    return {
      score: Math.min(totalScore, 100),
      gbpCompletenessScore: gbpScore,
      napConsistencyScore: napScore,
      reviewsScore,
      details,
    };
  } catch (error) {
    console.error('Local listings analysis error:', error);
    return {
      score: 0,
      gbpCompletenessScore: 0,
      napConsistencyScore: 0,
      reviewsScore: 0,
      details: {
        hasBasicInfo: false,
        hasCompleteHours: false,
        hasWebsite: false,
        hasCategory: false,
        photoCount: 0,
        attributeCount: 0,
        reviewCount: 0,
        averageRating: 0,
        hasRecentReview: false,
        responseRate: 0,
      },
    };
  }
}

function checkCompleteHours(place: PlaceDetails): boolean {
  const hours = place.opening_hours?.weekday_text || [];
  return hours.length >= 7;
}

function estimateAttributeCount(place: PlaceDetails): number {
  let count = 0;
  if (place.opening_hours?.open_now !== undefined) count++;
  if (place.types.includes('gas_station')) count++;
  // In a real implementation, we'd check actual attributes via Google My Business API
  // For MVP, estimate based on available data
  return Math.min(count + 2, 5);
}

function checkRecentReview(place: PlaceDetails): boolean {
  const reviews = place.reviews || [];
  if (reviews.length === 0) return false;

  const thirtyDaysAgo = Date.now() / 1000 - 30 * 24 * 60 * 60;
  return reviews.some((review) => review.time > thirtyDaysAgo);
}

function calculateResponseRate(place: PlaceDetails): number {
  const reviews = place.reviews || [];
  if (reviews.length === 0) return 0;

  // Google API doesn't return response status, so this is a simplified estimation
  // In production, would need Google My Business API for accurate data
  // For MVP, assume 0 response rate (conservative)
  return 0;
}
