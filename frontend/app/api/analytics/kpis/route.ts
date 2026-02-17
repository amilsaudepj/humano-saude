// =====================================================
// API — /api/analytics/kpis
// GA4 KPIs: users, views, events, sessions
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getKPIs, normalizeDate, getGA4AvailabilityDiagnostics } from '@/lib/google-analytics';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const diagnostics = await getGA4AvailabilityDiagnostics();
    if (!diagnostics.available) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'GA4_NOT_CONFIGURED',
          error: 'GA4 não configurado',
          details: diagnostics,
          data: null,
        },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const start = normalizeDate(searchParams.get('start'));
    const end = normalizeDate(searchParams.get('end'));

    const data = await getKPIs(start, end);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('❌ GA4 KPIs Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
