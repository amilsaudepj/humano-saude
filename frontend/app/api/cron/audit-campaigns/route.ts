// =====================================================
// API — /api/cron/audit-campaigns
// Cron Job — Camada 5 (Ads Auditor)
// Vercel Cron: diário (07:00)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { AdsAuditor } from '@/lib/services/ads-auditor';
import { resolveMetaRuntimeConfig } from '@/lib/meta-config-resolver';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60s max

function normalizeAdAccountId(value: string): string {
  return value.replace(/^act_/i, '').trim();
}

export async function GET(request: NextRequest) {
  try {
    // Validar cron secret (Vercel envia CRON_SECRET no header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
          error: 'Meta credentials not configured',
          missing: resolvedMeta.missing,
          source: resolvedMeta.source,
        },
        { status: 503 }
      );
    }

    if (!resolvedMeta.accountMatchesRequirement) {
      return NextResponse.json(
        { success: false, error: 'Active Meta account does not match required account' },
        { status: 412 }
      );
    }

    const auditor = new AdsAuditor(
      resolvedMeta.config.accessToken || '',
      normalizeAdAccountId(resolvedMeta.config.adAccountId || '')
    );
    const result = await auditor.runAudit();

    logger.info(
      `✅ Cron Audit: ${result.campaigns_analyzed} campaigns, ` +
      `${result.recommendations.length} recommendations, ` +
      `${result.alerts_generated} alerts`
    );

    return NextResponse.json({
      success: true,
      data: {
        campaignsAnalyzed: result.campaigns_analyzed,
        recommendationsCount: result.recommendations.length,
        alertsGenerated: result.alerts_generated,
        opportunitiesFound: result.opportunities_found,
        durationMs: result.duration_ms,
        configSource: resolvedMeta.source,
        adAccountId: resolvedMeta.config.adAccountId || null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('❌ Cron Audit Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro no audit' },
      { status: 500 }
    );
  }
}
