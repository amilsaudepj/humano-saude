// =====================================================
// API — /api/analytics/devices
// GA4 Dispositivos (desktop/mobile/tablet)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDevices, normalizeDate } from '@/lib/google-analytics';
import { getGA4UnavailableResponse } from '@/app/api/analytics/_shared';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const unavailableResponse = await getGA4UnavailableResponse();
    if (unavailableResponse) return unavailableResponse;

    const { searchParams } = new URL(request.url);
    const start = normalizeDate(searchParams.get('start'));
    const end = normalizeDate(searchParams.get('end'));

    const data = await getDevices(start, end);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('❌ GA4 Devices Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
