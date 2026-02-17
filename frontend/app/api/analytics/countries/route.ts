// =====================================================
// API — /api/analytics/countries
// GA4 Top 5 países
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getTopCountries, normalizeDate, isGA4Available } from '@/lib/google-analytics';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    if (!(await isGA4Available())) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { searchParams } = new URL(request.url);
    const start = normalizeDate(searchParams.get('start'));
    const end = normalizeDate(searchParams.get('end'));

    const data = await getTopCountries(start, end);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('❌ GA4 Countries Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
