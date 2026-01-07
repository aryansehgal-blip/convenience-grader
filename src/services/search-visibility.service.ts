import { PlaceDetails, nearbySearch, calculateDistance } from './google-places.service';

export interface SearchVisibilityResult {
  score: number;
  keywordScore: number;
  mapPackScore: number;
  breakdown: Array<{
    theme: string;
    score: number;
    maxScore: number;
    details: string;
    ranking?: number;
  }>;
  note?: string;
}

interface KeywordTheme {
  name: string;
  keywords: string[];
  maxPoints: number;
  condition?: (place: PlaceDetails) => boolean;
}

const KEYWORD_THEMES: KeywordTheme[] = [
  {
    name: 'core_convenience',
    keywords: ['convenience store near me', 'convenience store'],
    maxPoints: 20,
  },
  {
    name: '24_hour',
    keywords: ['24 hour store near me', 'late night convenience store'],
    maxPoints: 10,
    condition: (place) => {
      const hours = place.opening_hours?.weekday_text || [];
      return hours.some((h) => h.includes('24 hours') || h.includes('Open 24'));
    },
  },
  {
    name: 'gas_station',
    keywords: ['gas station near me', 'gas station'],
    maxPoints: 10,
    condition: (place) => place.types.includes('gas_station'),
  },
  {
    name: 'atm',
    keywords: ['ATM near me'],
    maxPoints: 5,
  },
];

export async function analyzeSearchVisibility(place: PlaceDetails): Promise<SearchVisibilityResult> {
  try {
    const breakdown: Array<{
      theme: string;
      score: number;
      maxScore: number;
      details: string;
      ranking?: number;
    }> = [];

    let totalKeywordScore = 0;
    const applicableThemes = KEYWORD_THEMES.filter(
      (theme) => !theme.condition || theme.condition(place)
    );

    // Simulate rankings using nearby search as proxy
    const nearby = await nearbySearch(
      place.geometry.location.lat,
      place.geometry.location.lng,
      3219, // 2 miles
      'convenience_store'
    );

    // Calculate prominence for ranking simulation
    const withProminence = nearby.map((p) => {
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
    });

    // Sort by prominence
    withProminence.sort((a, b) => b.prominence - a.prominence);

    // Find current place ranking
    const currentPlaceIndex = withProminence.findIndex((p) => p.place_id === place.place_id);
    const ranking = currentPlaceIndex >= 0 ? currentPlaceIndex + 1 : 20;

    // Score each applicable theme
    for (const theme of applicableThemes) {
      let themeScore = 0;

      if (ranking <= 3) {
        themeScore = theme.maxPoints;
      } else if (ranking <= 10) {
        themeScore = Math.round(theme.maxPoints * 0.6);
      } else if (ranking <= 20) {
        themeScore = Math.round(theme.maxPoints * 0.3);
      }

      totalKeywordScore += themeScore;

      breakdown.push({
        theme: theme.name,
        score: themeScore,
        maxScore: theme.maxPoints,
        details: `Ranked #${ranking} for "${theme.keywords[0]}"`,
        ranking,
      });
    }

    // Map Pack presence score
    let mapPackScore = 0;
    if (ranking <= 3) {
      mapPackScore = 40;
    } else if (ranking <= 10) {
      mapPackScore = 20;
    }

    const finalScore = totalKeywordScore + mapPackScore;

    return {
      score: Math.min(finalScore, 100),
      keywordScore: totalKeywordScore,
      mapPackScore,
      breakdown,
    };
  } catch (error) {
    console.error('Search visibility analysis error:', error);
    return {
      score: 0,
      keywordScore: 0,
      mapPackScore: 0,
      breakdown: [],
      note: 'Search ranking check failed. Score unavailable.',
    };
  }
}
