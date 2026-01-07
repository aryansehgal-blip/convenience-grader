import { NextRequest, NextResponse } from 'next/server';
import { searchPlaces } from '@/services/nominatim.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query too short' }, { status: 400 });
    }

    const places = await searchPlaces(query + ' convenience store');

    // Transform to match expected format
    const results = places.map((p) => ({
      place_id: p.place_id,
      name: p.name,
      address: p.display_name,
      types: ['convenience_store'],
    }));

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
