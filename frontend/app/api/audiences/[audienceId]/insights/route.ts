import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { isAdminAuthorized } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type ParamsContext = {
  params: Promise<{ audienceId: string }>;
};

function toDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest, context: ParamsContext) {
  try {
    const authorized = await isAdminAuthorized(request);
    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { audienceId } = await context.params;
    const days = Math.min(
      Math.max(parseInt(request.nextUrl.searchParams.get('days') || '30', 10), 1),
      180
    );

    const supabase = createServiceClient();
    const fromDate = toDateDaysAgo(days);

    const { data: rows, error } = await supabase
      .from('audience_insights')
      .select('*')
      .eq('audience_id', audienceId)
      .gte('date_start', fromDate)
      .order('date_start', { ascending: false });

    if (error) throw new Error(error.message);

    const insightRows = rows || [];
    const summary = insightRows.reduce(
      (acc, row) => {
        acc.reach += Number(row.reach || 0);
        acc.impressions += Number(row.impressions || 0);
        acc.clicks += Number(row.clicks || 0);
        acc.spend += Number(row.spend || 0);
        acc.conversions += Number(row.conversions || 0);
        acc.revenue += Number(row.revenue || 0);
        return acc;
      },
      {
        reach: 0,
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        revenue: 0,
      }
    );

    const ctr = summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : 0;
    const cpc = summary.clicks > 0 ? summary.spend / summary.clicks : 0;
    const cpa = summary.conversions > 0 ? summary.spend / summary.conversions : 0;
    const roas = summary.spend > 0 ? summary.revenue / summary.spend : 0;

    return NextResponse.json({
      success: true,
      audienceId,
      days,
      summary: {
        ...summary,
        ctr,
        cpc,
        cpa,
        roas,
      },
      insights: insightRows,
    });
  } catch (error) {
    logger.error('❌ Erro ao buscar insights de audience:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
