import { NextRequest, NextResponse } from 'next/server';
import { syncAllAudiences } from '@/lib/audiences/sync-service';
import {
  clearAudienceCredentialsOverride,
  setAudienceCredentialsOverride,
} from '@/lib/audiences/audiences-client';
import { resolveMetaRuntimeConfig } from '@/lib/meta-config-resolver';
import { isCronAuthorized } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
        error: 'Meta API não configurada para sincronização de públicos',
        missing: resolvedMeta.missing,
        source: resolvedMeta.source,
      },
      { status: 503 }
    );
  }

  if (!resolvedMeta.accountMatchesRequirement) {
    return NextResponse.json(
      { success: false, error: 'Conta Meta ativa não corresponde ao account obrigatório do ambiente' },
      { status: 412 }
    );
  }

  setAudienceCredentialsOverride({
    accessToken: resolvedMeta.config.accessToken || '',
    adAccountId: resolvedMeta.config.adAccountId || '',
    pixelId: resolvedMeta.config.pixelId || '',
    businessId: resolvedMeta.config.businessId || '',
  });

  const result = await syncAllAudiences('cron').finally(() => {
    clearAudienceCredentialsOverride();
  });

  return NextResponse.json({
    source: 'cron',
    configSource: resolvedMeta.source,
    adAccountId: resolvedMeta.config.adAccountId || null,
    ...result,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  try {
    return await run(request);
  } catch (error) {
    logger.error('❌ Erro no cron sync-audiences (GET):', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await run(request);
  } catch (error) {
    logger.error('❌ Erro no cron sync-audiences (POST):', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
