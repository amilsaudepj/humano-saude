import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { isAdminAuthorized } from '@/lib/api-auth';
import {
  clearAudienceCredentialsOverride,
  createMetaLookalikeAudience,
  setAudienceCredentialsOverride,
} from '@/lib/audiences/audiences-client';
import { resolveMetaRuntimeConfig } from '@/lib/meta-config-resolver';
import { generateAudienceName, validateLookalikeRatio } from '@/lib/audiences/utils';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function normalizeAdAccountId(value: string): string {
  return value.replace(/^act_/i, '').trim();
}

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAdminAuthorized(request);
    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('audiences')
      .select('id, name, approximate_count, status, audience_type')
      .eq('audience_type', 'custom')
      .is('deleted_at', null)
      .order('approximate_count', { ascending: false });

    if (error) throw new Error(error.message);

    const rows = data || [];
    const sources =
      rows.filter((row) => Number(row.approximate_count || 0) >= 100).length > 0
        ? rows.filter((row) => Number(row.approximate_count || 0) >= 100)
        : rows;

    return NextResponse.json({
      success: true,
      totalSources: sources.length,
      sources,
    });
  } catch (error) {
    logger.error('❌ Erro ao listar fontes de lookalike:', error);
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

    const resolvedMeta = await resolveMetaRuntimeConfig({
      preferIntegration: true,
      allowEnvFallback: false,
      requiredAdAccountId: process.env.META_REQUIRED_AD_ACCOUNT_ID,
    });

    if (!resolvedMeta.isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: 'Meta API não configurada para públicos',
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

    const body = (await request.json()) as {
      sourceAudienceId?: string;
      country?: string;
      ratio?: number;
      startingRatio?: number;
      name?: string;
      description?: string;
    };

    if (!body.sourceAudienceId) {
      return NextResponse.json(
        { success: false, error: 'sourceAudienceId é obrigatório' },
        { status: 400 }
      );
    }

    const ratio = Number(body.ratio || 0.01);
    if (!validateLookalikeRatio(ratio)) {
      return NextResponse.json(
        { success: false, error: 'ratio deve estar entre 0.01 e 0.10' },
        { status: 400 }
      );
    }

    const country = (body.country || 'BR').toUpperCase();
    const supabase = createServiceClient();

    const { data: sourceAudience, error: sourceError } = await supabase
      .from('audiences')
      .select('id, meta_audience_id, name')
      .eq('id', body.sourceAudienceId)
      .single();

    if (sourceError || !sourceAudience) {
      return NextResponse.json(
        { success: false, error: 'Fonte de lookalike não encontrada' },
        { status: 404 }
      );
    }

    setAudienceCredentialsOverride({
      accessToken: resolvedMeta.config.accessToken || '',
      adAccountId: resolvedMeta.config.adAccountId || '',
      pixelId: resolvedMeta.config.pixelId || '',
      businessId: resolvedMeta.config.businessId || '',
    });

    const created = await createMetaLookalikeAudience({
      sourceAudienceId: String(sourceAudience.meta_audience_id),
      country,
      ratio,
      startingRatio: body.startingRatio,
      name:
        body.name?.trim() ||
        generateAudienceName('lookalike', `${sourceAudience.name} ${Math.round(ratio * 100)}% ${country}`),
      description: body.description,
    }).finally(() => {
      clearAudienceCredentialsOverride();
    });

    const { data, error } = await supabase
      .from('audiences')
      .insert({
        meta_audience_id: created.id,
        meta_account_id: normalizeAdAccountId(resolvedMeta.config.adAccountId || ''),
        audience_type: 'lookalike',
        subtype: null,
        name: created.name,
        description: body.description || null,
        source_audience_id: sourceAudience.id,
        lookalike_spec: {
          country,
          ratio,
          ...(body.startingRatio ? { starting_ratio: body.startingRatio } : {}),
        },
        status: 'populating',
        auto_sync: false,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      audience: data,
    });
  } catch (error) {
    logger.error('❌ Erro ao criar lookalike:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
