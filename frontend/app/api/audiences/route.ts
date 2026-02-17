import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { isAdminAuthorized } from '@/lib/api-auth';
import {
  clearAudienceCredentialsOverride,
  createMetaCustomAudience,
  listMetaAudiences,
  setAudienceCredentialsOverride,
} from '@/lib/audiences/audiences-client';
import { resolveMetaRuntimeConfig } from '@/lib/meta-config-resolver';
import type { AudienceSubtype } from '@/lib/audiences/types';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SUPPORTED_SUBTYPES: AudienceSubtype[] = [
  'customer_list',
  'website',
  'app',
  'offline',
  'engagement',
];

function normalizeSubtype(value: string | undefined): AudienceSubtype {
  const normalized = (value || 'customer_list').toLowerCase() as AudienceSubtype;
  if (SUPPORTED_SUBTYPES.includes(normalized)) return normalized;
  return 'customer_list';
}

function normalizeAdAccountId(value: string): string {
  return value.replace(/^act_/i, '').trim();
}

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAdminAuthorized(request);
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type');
    const status = request.nextUrl.searchParams.get('status');
    const limit = Math.min(
      Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '100', 10), 1),
      500
    );
    const withMeta = request.nextUrl.searchParams.get('withMeta') === '1';

    const supabase = createServiceClient();
    let query = supabase
      .from('audiences')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) query = query.eq('audience_type', type);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const audiences = data || [];
    if (!withMeta) {
      return NextResponse.json({ success: true, total: audiences.length, audiences });
    }

    const resolvedMeta = await resolveMetaRuntimeConfig({
      preferIntegration: true,
      allowEnvFallback: false,
      requiredAdAccountId: process.env.META_REQUIRED_AD_ACCOUNT_ID,
    });

    if (!resolvedMeta.isConfigured || !resolvedMeta.accountMatchesRequirement) {
      return NextResponse.json({
        success: true,
        total: audiences.length,
        audiences,
        metaUnavailable: true,
      });
    }

    setAudienceCredentialsOverride({
      accessToken: resolvedMeta.config.accessToken || '',
      adAccountId: resolvedMeta.config.adAccountId || '',
      pixelId: resolvedMeta.config.pixelId || '',
      businessId: resolvedMeta.config.businessId || '',
    });

    const metaAudiences = await listMetaAudiences()
      .catch(() => [])
      .finally(() => {
        clearAudienceCredentialsOverride();
      });
    const metaMap = new Map(metaAudiences.map((item) => [item.id, item]));

    const merged = audiences.map((row) => {
      const meta = metaMap.get(String(row.meta_audience_id));
      return {
        ...row,
        approximate_count: meta?.approximate_count ?? row.approximate_count,
        meta_status: meta?.status || null,
      };
    });

    return NextResponse.json({
      success: true,
      total: merged.length,
      audiences: merged,
    });
  } catch (error) {
    logger.error('❌ Erro ao listar audiences:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAdminAuthorized(request);
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
      type?: 'custom' | 'saved' | 'lookalike';
      name?: string;
      description?: string;
      subtype?: string;
      rule?: Record<string, unknown>;
      retention_days?: number;
      auto_sync?: boolean;
      sync_frequency_hours?: number;
    };

    const type = body.type || 'custom';
    if (type === 'lookalike') {
      return NextResponse.json(
        { success: false, error: 'Use /api/audiences/lookalike para criar lookalike' },
        { status: 400 }
      );
    }

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'name é obrigatório' },
        { status: 400 }
      );
    }

    const subtype = normalizeSubtype(body.subtype);
    setAudienceCredentialsOverride({
      accessToken: resolvedMeta.config.accessToken || '',
      adAccountId: resolvedMeta.config.adAccountId || '',
      pixelId: resolvedMeta.config.pixelId || '',
      businessId: resolvedMeta.config.businessId || '',
    });

    const created = await createMetaCustomAudience({
      name,
      description: body.description,
      subtype,
      rule: body.rule,
      retention_days: body.retention_days,
      auto_sync: body.auto_sync,
      sync_frequency_hours: body.sync_frequency_hours,
    }).finally(() => {
      clearAudienceCredentialsOverride();
    });

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('audiences')
      .insert({
        meta_audience_id: created.id,
        meta_account_id: normalizeAdAccountId(resolvedMeta.config.adAccountId || ''),
        audience_type: type,
        subtype,
        name,
        description: body.description || null,
        config: {
          retention_days: body.retention_days || null,
        },
        status: 'populating',
        auto_sync: body.auto_sync ?? true,
        sync_frequency_hours: Math.max(1, Number(body.sync_frequency_hours || 4)),
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      audience: data,
    });
  } catch (error) {
    logger.error('❌ Erro ao criar audience:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
