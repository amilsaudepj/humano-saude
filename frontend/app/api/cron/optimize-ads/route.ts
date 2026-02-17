import { NextRequest, NextResponse } from 'next/server';
import { optimizeCampaigns } from '@/lib/ads/optimize-campaigns';
import { resolveMetaRuntimeConfig } from '@/lib/meta-config-resolver';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isCronAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || '';
  if (!cronSecret) return false;

  const authHeader = request.headers.get('authorization') || '';
  return authHeader === `Bearer ${cronSecret}`;
}

async function runOptimization(request: NextRequest) {
  if (!isCronAuthorized(request)) {
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
        success: false,
        error: 'Meta Ads não configurado',
        missing: resolvedMeta.missing,
        source: resolvedMeta.source,
      },
      { status: 503 }
    );
  }

  if (!resolvedMeta.accountMatchesRequirement) {
    return NextResponse.json(
      {
        success: false,
        error: 'Conta Meta ativa não corresponde ao account obrigatório do ambiente',
      },
      { status: 412 }
    );
  }

  const result = await optimizeCampaigns({}, resolvedMeta.config);

  return NextResponse.json({
    success: true,
    source: 'cron',
    configSource: resolvedMeta.source,
    adAccountId: resolvedMeta.config.adAccountId || null,
    summary: {
      adsAnalyzed: result.totalAds,
      paused: result.paused,
      scaled: result.scaled,
      noAction: result.noAction,
    },
    errors: result.errors,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  try {
    return await runOptimization(request);
  } catch (error) {
    logger.error('❌ Erro no cron optimize-ads (GET):', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await runOptimization(request);
  } catch (error) {
    logger.error('❌ Erro no cron optimize-ads (POST):', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
