// =====================================================
// API — /api/analytics/realtime-detailed
// GA4 Realtime com cidade + device + country
// =====================================================

import { NextResponse } from 'next/server';
import { getRealtimeDetailed } from '@/lib/google-analytics';
import { getGA4UnavailableResponse } from '@/app/api/analytics/_shared';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const unavailableResponse = await getGA4UnavailableResponse();
    if (unavailableResponse) return unavailableResponse;

    const data = await getRealtimeDetailed();
    return NextResponse.json({
      success: true,
      data: data || { activeUsers: 0, cities: [], devices: [], countries: [] },
    });
  } catch (error) {
    logger.error('❌ GA4 Realtime Detailed Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
