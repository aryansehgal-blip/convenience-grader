import axios from 'axios';
import { cache } from '@/lib/redis';
import { hashString } from '@/lib/utils';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

export interface PlaceAutocompleteResult {
  place_id: string;
  name: string;
  address: string;
  types: string[];
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  opening_hours?: {
    weekday_text: string[];
    open_now?: boolean;
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  rating?: number;
  user_ratings_total?: number;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

export interface NearbyPlace {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  types: string[];
}

export async function autocompleteSearch(
  query: string,
  location?: string
): Promise<PlaceAutocompleteResult[]> {
  try {
    const params: any = {
      input: query,
      key: GOOGLE_PLACES_API_KEY,
      types: 'establishment',
      components: 'country:us',
    };

    const response = await axios.get(`${BASE_URL}/autocomplete/json`, { params });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    return response.data.predictions.map((pred: any) => ({
      place_id: pred.place_id,
      name: pred.structured_formatting.main_text,
      address: pred.description,
      types: pred.types || [],
    }));
  } catch (error) {
    console.error('Autocomplete search error:', error);
    return [];
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const cacheKey = `place:${placeId}`;

  // Check cache first
  const cached = await cache.get<PlaceDetails>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const fields = [
      'place_id',
      'name',
      'formatted_address',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'geometry',
      'types',
      'opening_hours',
      'photos',
      'rating',
      'user_ratings_total',
      'reviews',
    ].join(',');

    const response = await axios.get(`${BASE_URL}/details/json`, {
      params: {
        place_id: placeId,
        fields,
        key: GOOGLE_PLACES_API_KEY,
      },
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Place details error: ${response.data.status}`);
    }

    const details = response.data.result;

    // Cache for 24 hours
    await cache.set(cacheKey, details, 86400);

    return details;
  } catch (error) {
    console.error('Get place details error:', error);
    return null;
  }
}

export async function nearbySearch(
  lat: number,
  lng: number,
  radius: number = 3219, // 2 miles in meters
  type: string = 'convenience_store'
): Promise<NearbyPlace[]> {
  const cacheKey = `nearby:${hashString(`${lat},${lng},${radius},${type}`)}`;

  // Check cache
  const cached = await cache.get<NearbyPlace[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await axios.get(`${BASE_URL}/nearbysearch/json`, {
      params: {
        location: `${lat},${lng}`,
        radius,
        type,
        key: GOOGLE_PLACES_API_KEY,
      },
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      throw new Error(`Nearby search error: ${response.data.status}`);
    }

    const results = response.data.results || [];

    // Cache for 12 hours
    await cache.set(cacheKey, results, 43200);

    return results;
  } catch (error) {
    console.error('Nearby search error:', error);
    return [];
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
