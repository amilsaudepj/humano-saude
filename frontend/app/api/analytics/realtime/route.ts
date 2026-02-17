// =====================================================
// API — /api/analytics/realtime
// GA4 Realtime — Usuários ativos agora
// =====================================================

import { NextResponse } from 'next/server';
import { getRealtimeData } from '@/lib/google-analytics';
import { getGA4UnavailableResponse } from '@/app/api/analytics/_shared';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const unavailableResponse = await getGA4UnavailableResponse();
    if (unavailableResponse) return unavailableResponse;

    const data = await getRealtimeData();
    return NextResponse.json({ success: true, data: data || { activeUsers: 0, pages: [] } });
  } catch (error) {
    logger.error('❌ GA4 Realtime Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
