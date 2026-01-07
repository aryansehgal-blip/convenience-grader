import { PlaceDetails, nearbySearch, calculateDistance, getPlaceDetails } from './google-places.service';
import { analyzeSearchVisibility } from './search-visibility.service';
import { analyzeWebsiteExperience } from './website-experience.service';
import { analyzeLocalListings } from './local-listings.service';
import { calculateOverallScore } from '@/lib/utils';

export interface CompetitorData {
  id: string;
  name?: string;
  distance: number;
  scores: {
    overall: number;
    search: number;
    website: number;
    listings: number;
  };
  advantages: string[];
}

export async function analyzeCompetitors(
  place: PlaceDetails,
  currentScores: {
    search: number;
    website: number;
    listings: number;
  }
): Promise<CompetitorData[]> {
  try {
    // Find nearby competitors
    const nearby = await nearbySearch(
      place.geometry.location.lat,
      place.geometry.location.lng,
      3219, // 2 miles
      'convenience_store'
    );

    // Filter out current place and calculate prominence
    const competitors = nearby
      .filter((p) => p.place_id !== place.place_id)
      .map((p) => {
        const distance = calculateDistance(
          place.geometry.location.lat,
          place.geometry.location.lng,
          p.geometry.location.lat,
          p.geometry.location.lng
        );

        const prominence =
          ((p.rating || 0) * (p.user_ratings_total || 0)) / Math.pow(distance + 0.5, 2);

        return {
          ...p,
          distance,
          prominence,
        };
      })
      .sort((a, b) => b.prominence - a.prominence)
      .slice(0, 3); // Top 3 competitors

    // Analyze top competitors
    const competitorData: CompetitorData[] = [];

    for (const [index, comp] of competitors.entries()) {
      try {
        const compDetails = await getPlaceDetails(comp.place_id);
        if (!compDetails) continue;

        // Run simplified scoring for competitor
        const searchResult = await analyzeSearchVisibility(compDetails);
        const websiteResult = await analyzeWebsiteExperience(compDetails.website);
        const listingsResult = await analyzeLocalListings(compDetails);

        const overallScore = calculateOverallScore(
          searchResult.score,
          websiteResult.score,
          listingsResult.score
        );

        // Identify advantages over current business
        const advantages: string[] = [];

        if (listingsResult.details.reviewCount > place.user_ratings_total! + 20) {
          advantages.push(
            `${listingsResult.details.reviewCount} Google reviews (you have ${place.user_ratings_total || 0})`
          );
        }

        if (searchResult.score > currentScores.search + 10) {
          const betterRanking = searchResult.breakdown.find((b) => b.ranking && b.ranking <= 3);
          if (betterRanking) {
            advantages.push(`Ranks #${betterRanking.ranking} for "${betterRanking.theme}"`);
          }
        }

        if (websiteResult.hasWebsite && websiteResult.pageSpeedData?.lcp) {
          const compLCP = websiteResult.pageSpeedData.lcp / 1000;
          advantages.push(`Website loads in ${compLCP.toFixed(1)}s`);
        }

        if (listingsResult.details.photoCount > (place.photos?.length || 0) + 5) {
          advantages.push(`${listingsResult.details.photoCount} photos on Google`);
        }

        competitorData.push({
          id: `competitor_${String.fromCharCode(65 + index)}`,
          name: undefined, // Anonymized in MVP
          distance: comp.distance,
          scores: {
            overall: overallScore,
            search: searchResult.score,
            website: websiteResult.score,
            listings: listingsResult.score,
          },
          advantages: advantages.slice(0, 3), // Top 3 advantages
        });
      } catch (error) {
        console.error(`Error analyzing competitor ${comp.place_id}:`, error);
      }
    }

    return competitorData;
  } catch (error) {
    console.error('Competitor analysis error:', error);
    return [];
  }
}
