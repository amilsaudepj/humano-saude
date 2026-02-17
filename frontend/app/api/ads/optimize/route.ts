// =====================================================
// API: /api/ads/optimize — Otimização automática/manual
// - POST: executa otimização (manual no admin ou cron)
// - GET: retorna logs e resumo
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { optimizeCampaigns } from '@/lib/ads/optimize-campaigns';
import { getCampaigns } from '@/lib/ads/meta-client';
import { resolveMetaRuntimeConfig } from '@/lib/meta-config-resolver';
import { createServiceClient } from '@/lib/supabase';
import type { OptimizationRules } from '@/lib/ads/types';
import { verifyToken } from '@/lib/auth-jwt';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.replace('Bearer ', '') || '';
  const querySecret = request.nextUrl.searchParams.get('secret') || '';

  if (cronSecret && (bearerToken === cronSecret || querySecret === cronSecret)) {
    return true;
  }

  const cookieToken = request.cookies.get('admin_token')?.value || '';
  const appToken = bearerToken || cookieToken;
  if (!appToken) return false;

  const jwt = await verifyToken(appToken);
  return jwt?.role === 'admin';
}

function toISODateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedMeta = await resolveMetaRuntimeConfig({
      preferIntegration: true,
      allowEnvFallback: false,
      requiredAdAccountId: process.env.META_REQUIRED_AD_ACCOUNT_ID,
    });

    if (!resolvedMeta.isConfigured) {
      return NextResponse.json(
        {
          error: 'Meta Ads não configurado',
          missing: resolvedMeta.missing,
          source: resolvedMeta.source,
        },
        { status: 503 }
      );
    }

    if (!resolvedMeta.accountMatchesRequirement) {
      return NextResponse.json(
        { error: 'Conta Meta ativa não corresponde ao account obrigatório do ambiente' },
        { status: 412 }
      );
    }

    const body = await request
      .json()
      .catch(() => ({}) as { rules?: Partial<OptimizationRules> });
    const rules = body.rules || {};

    const result = await optimizeCampaigns(rules, resolvedMeta.config);

    return NextResponse.json({
      success: true,
      message: 'Otimização concluída',
      configSource: resolvedMeta.source,
      adAccountId: resolvedMeta.config.adAccountId || null,
      summary: {
        adsAnalyzed: result.totalAds,
        paused: result.paused,
        scaled: result.scaled,
        noAction: result.noAction,
      },
      logs: result.logs,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Erro na otimização:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = Math.min(
      Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '50', 10), 1),
      200
    );
    const days = Math.min(
      Math.max(parseInt(request.nextUrl.searchParams.get('days') || '7', 10), 1),
      60
    );

    const supabase = createServiceClient();
    const since = toISODateDaysAgo(days);

    const { data: logs, error: logsError } = await supabase
      .from('optimization_logs')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (logsError) {
      throw new Error(logsError.message);
    }

    const safeLogs = logs || [];
    const summary = safeLogs.reduce(
      (acc, row) => {
        const action = String(row.action_type || 'NO_ACTION').toUpperCase();
        if (action === 'PAUSE') acc.paused += 1;
        else if (action === 'SCALE') acc.scaled += 1;
        else acc.noAction += 1;
        return acc;
      },
      { adsAnalyzed: safeLogs.length, paused: 0, scaled: 0, noAction: 0 }
    );

    const resolvedMeta = await resolveMetaRuntimeConfig({
      preferIntegration: true,
      allowEnvFallback: false,
      requiredAdAccountId: process.env.META_REQUIRED_AD_ACCOUNT_ID,
    });

    let activeCampaigns = 0;
    if (resolvedMeta.isConfigured && resolvedMeta.accountMatchesRequirement) {
      const active = await getCampaigns(
        resolvedMeta.config.adAccountId,
        'ACTIVE',
        resolvedMeta.config
      ).catch(() => []);
      activeCampaigns = active.length;
    }

    return NextResponse.json({
      success: true,
      activeCampaigns,
      configSource: resolvedMeta.source,
      summary,
      logs: safeLogs,
      periodDays: days,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Erro ao buscar logs de otimização:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
