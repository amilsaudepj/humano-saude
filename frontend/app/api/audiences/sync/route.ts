import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/api-auth';
import {
  clearAudienceCredentialsOverride,
  setAudienceCredentialsOverride,
} from '@/lib/audiences/audiences-client';
import {
  getAudienceSyncOverview,
  syncAllAudiences,
  syncAudience,
} from '@/lib/audiences/sync-service';
import { resolveMetaRuntimeConfig } from '@/lib/meta-config-resolver';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAdminAuthorized(request);
    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const overview = await getAudienceSyncOverview();
    return NextResponse.json({
      success: true,
      ...overview,
    });
  } catch (error) {
    logger.error('❌ Erro ao carregar overview de sync:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAdminAuthorized(request);
    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as {
      audienceId?: string;
    };

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

    if (body.audienceId) {
      const result = await syncAudience(body.audienceId, 'manual').finally(() => {
        clearAudienceCredentialsOverride();
      });
      return NextResponse.json({
        success: result.success,
        mode: 'single',
        configSource: resolvedMeta.source,
        adAccountId: resolvedMeta.config.adAccountId || null,
        result,
      });
    }

    const result = await syncAllAudiences('manual').finally(() => {
      clearAudienceCredentialsOverride();
    });
    return NextResponse.json({
      mode: 'all',
      configSource: resolvedMeta.source,
      adAccountId: resolvedMeta.config.adAccountId || null,
      ...result,
    });
  } catch (error) {
    logger.error('❌ Erro no sync manual de audiences:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
