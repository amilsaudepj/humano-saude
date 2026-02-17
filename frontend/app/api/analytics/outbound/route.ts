// =====================================================
// API — /api/analytics/outbound
// GA4 Links de saída (WhatsApp, App Store, etc.)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getOutboundClicks, normalizeDate, isGA4Available } from '@/lib/google-analytics';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    if (!(await isGA4Available())) {
      return NextResponse.json({
        success: true,
        data: { clicks: [], summary: { whatsapp: 0, appstore: 0, playstore: 0, external: 0, total: 0 } },
      });
    }

    const { searchParams } = new URL(request.url);
    const start = normalizeDate(searchParams.get('start'));
    const end = normalizeDate(searchParams.get('end'));

    const data = await getOutboundClicks(start, end);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('❌ GA4 Outbound Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
