import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function toISODateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const days = Math.min(
      Math.max(parseInt(request.nextUrl.searchParams.get('days') || '30', 10), 1),
      90
    );
    const since = toISODateDaysAgo(days);
    const supabase = createServiceClient();

    const { data: campaigns, error: campaignsError } = await supabase
      .from('ads_campaigns')
      .select('spend, conversions, impressions, metadata')
      .gte('updated_at', since);

    if (campaignsError) {
      throw new Error(campaignsError.message);
    }

    const totals = (campaigns || []).reduce(
      (acc, row) => {
        const spend = Number(row.spend || 0);
        const purchases = Number(row.conversions || 0);
        const impressions = Number(row.impressions || 0);
        const metadata = (row.metadata || {}) as Record<string, unknown>;
        const revenue = Number(metadata.purchase_value || 0);

        acc.totalSpend += spend;
        acc.totalPurchases += purchases;
        acc.totalImpressions += impressions;
        acc.totalRevenue += revenue;
        return acc;
      },
      { totalSpend: 0, totalPurchases: 0, totalImpressions: 0, totalRevenue: 0 }
    );

    const avgRoas = totals.totalSpend > 0 ? totals.totalRevenue / totals.totalSpend : 0;

    return NextResponse.json({
      success: true,
      days,
      totalSpend: totals.totalSpend,
      totalPurchases: totals.totalPurchases,
      totalImpressions: totals.totalImpressions,
      totalRevenue: totals.totalRevenue,
      avgRoas,
    });
  } catch (error) {
    logger.error('❌ Erro ao buscar stats de ads:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
