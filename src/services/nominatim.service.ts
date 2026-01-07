// FREE Alternative to Google Places - OpenStreetMap Nominatim API
import axios from 'axios';
import { cache } from '@/lib/redis';
import { hashString } from '@/lib/utils';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'ConvenienceGrader/1.0';

export interface NominatimPlace {
  place_id: string;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export async function searchPlaces(query: string): Promise<NominatimPlace[]> {
  const cacheKey = `nominatim:search:${hashString(query)}`;

  // Check cache (with error handling)
  try {
    const cached = await cache.get<NominatimPlace[]>(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (cacheError) {
    console.warn('Redis cache read error, continuing without cache:', cacheError);
  }

  try {
    // Respect Nominatim usage policy: max 1 request per second
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: {
        q: query,
        format: 'json',
        addressdetails: 1,
        limit: 10,
      },
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    const places = response.data
      .filter((p: any) => p.type === 'shop' || p.type === 'fuel' || p.type === 'convenience')
      .map((p: any) => ({
        place_id: `osm_${p.place_id}`,
        name: p.display_name.split(',')[0],
        display_name: p.display_name,
        lat: p.lat,
        lon: p.lon,
        type: p.type,
        address: p.address,
      }));

    // Try to cache for 24 hours (but don't fail if Redis is down)
    try {
      await cache.set(cacheKey, places, 86400);
    } catch (cacheError) {
      console.warn('Redis cache write error, continuing without cache:', cacheError);
    }

    return places;
  } catch (error) {
    console.error('Nominatim search error:', error);
    return [];
  }
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  address?: any;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    weekday_text: string[];
  };
  photos?: any[];
  reviews?: any[];
  formatted_phone_number?: string;
  website?: string;
}

export async function getPlaceDetails(placeId: string, lat: string, lon: string): Promise<PlaceDetails | null> {
  const cacheKey = `nominatim:details:${placeId}`;

  // Check cache (with error handling)
  try {
    const cached = await cache.get<PlaceDetails>(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (cacheError) {
    console.warn('Redis cache read error, continuing without cache:', cacheError);
  }

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await axios.get(`${NOMINATIM_BASE_URL}/reverse`, {
      params: {
        lat,
        lon,
        format: 'json',
        addressdetails: 1,
      },
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    const details: PlaceDetails = {
      place_id: placeId,
      name: response.data.display_name.split(',')[0],
      formatted_address: response.data.display_name,
      geometry: {
        location: {
          lat: parseFloat(response.data.lat),
          lng: parseFloat(response.data.lon),
        },
      },
      types: ['convenience_store'],
      address: response.data.address,
      // Mock some fields that the app expects
      rating: 4.0,
      user_ratings_total: 10,
      opening_hours: {
        weekday_text: [
          'Monday: 6:00 AM – 11:00 PM',
          'Tuesday: 6:00 AM – 11:00 PM',
          'Wednesday: 6:00 AM – 11:00 PM',
          'Thursday: 6:00 AM – 11:00 PM',
          'Friday: 6:00 AM – 11:00 PM',
          'Saturday: 7:00 AM – 10:00 PM',
          'Sunday: 7:00 AM – 10:00 PM',
        ],
      },
      photos: [],
      reviews: [],
    };

    // Try to cache for 24 hours (but don't fail if Redis is down)
    try {
      await cache.set(cacheKey, details, 86400);
    } catch (cacheError) {
      console.warn('Redis cache write error, continuing without cache:', cacheError);
    }

    return details;
  } catch (error) {
    console.error('Nominatim details error:', error);
    return null;
  }
}

export async function searchNearby(lat: number, lon: number, radius: number = 3219) {
  // Convert meters to degrees (rough approximation)
  const radiusDegrees = radius / 111320;

  const bbox = `${lon - radiusDegrees},${lat - radiusDegrees},${lon + radiusDegrees},${lat + radiusDegrees}`;

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await axios.get(`${NOMINATIM_BASE_URL}/search`, {
      params: {
        q: 'convenience store',
        format: 'json',
        bounded: 1,
        viewbox: bbox,
        limit: 20,
      },
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    return response.data.map((p: any) => ({
      place_id: `osm_${p.place_id}`,
      name: p.display_name.split(',')[0],
      vicinity: p.display_name,
      geometry: {
        location: {
          lat: parseFloat(p.lat),
          lng: parseFloat(p.lon),
        },
      },
      rating: 4.0,
      user_ratings_total: 10,
      types: ['convenience_store'],
    }));
  } catch (error) {
    console.error('Nominatim nearby search error:', error);
    return [];
  }
}
