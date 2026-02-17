// =====================================================
// API — /api/analytics/top-pages
// GA4 Top 10 páginas
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getTopPages, normalizeDate, isGA4Available } from '@/lib/google-analytics';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    if (!(await isGA4Available())) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { searchParams } = new URL(request.url);
    const start = normalizeDate(searchParams.get('start'));
    const end = normalizeDate(searchParams.get('end'));

    const data = await getTopPages(start, end);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('❌ GA4 Top Pages Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
