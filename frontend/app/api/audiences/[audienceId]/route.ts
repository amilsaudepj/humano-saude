import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { isAdminAuthorized } from '@/lib/api-auth';
import {
  clearAudienceCredentialsOverride,
  deleteMetaAudience,
  getMetaAudience,
  setAudienceCredentialsOverride,
  updateMetaAudience,
} from '@/lib/audiences/audiences-client';
import { resolveMetaRuntimeConfig } from '@/lib/meta-config-resolver';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type ParamsContext = {
  params: Promise<{ audienceId: string }>;
};

async function configureAudienceMeta(): Promise<{
  available: boolean;
  source: string;
}> {
  const resolvedMeta = await resolveMetaRuntimeConfig({
    preferIntegration: true,
    allowEnvFallback: false,
    requiredAdAccountId: process.env.META_REQUIRED_AD_ACCOUNT_ID,
  });

  if (!resolvedMeta.isConfigured || !resolvedMeta.accountMatchesRequirement) {
    clearAudienceCredentialsOverride();
    return { available: false, source: resolvedMeta.source };
  }

  setAudienceCredentialsOverride({
    accessToken: resolvedMeta.config.accessToken || '',
    adAccountId: resolvedMeta.config.adAccountId || '',
    pixelId: resolvedMeta.config.pixelId || '',
    businessId: resolvedMeta.config.businessId || '',
  });

  return { available: true, source: resolvedMeta.source };
}

export async function GET(request: NextRequest, context: ParamsContext) {
  try {
    const authorized = await isAdminAuthorized(request);
    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { audienceId } = await context.params;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('audiences')
      .select('*')
      .eq('id', audienceId)
      .is('deleted_at', null)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Audience não encontrado' }, { status: 404 });
    }

    const { count } = await supabase
      .from('audience_users')
      .select('*', { count: 'exact', head: true })
      .eq('audience_id', audienceId)
      .eq('status', 'pending');

    const metaContext = await configureAudienceMeta();
    let metaStatus: Record<string, unknown> | null = null;
    if (metaContext.available) {
      metaStatus = await getMetaAudience(String(data.meta_audience_id))
        .catch(() => null)
        .finally(() => clearAudienceCredentialsOverride());
    }

    return NextResponse.json({
      success: true,
      audience: data,
      pending_users: count || 0,
      meta: metaStatus,
    });
  } catch (error) {
    logger.error('❌ Erro ao buscar audience:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: ParamsContext) {
  try {
    const authorized = await isAdminAuthorized(request);
    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { audienceId } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      auto_sync?: boolean;
      sync_frequency_hours?: number;
      status?: string;
    };

    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name.trim();
    if (body.description !== undefined) patch.description = body.description;
    if (body.auto_sync !== undefined) patch.auto_sync = body.auto_sync;
    if (body.sync_frequency_hours !== undefined) {
      patch.sync_frequency_hours = Math.max(1, Number(body.sync_frequency_hours));
    }
    if (body.status !== undefined) patch.status = body.status;

    const supabase = createServiceClient();
    const { data: current, error: currentError } = await supabase
      .from('audiences')
      .select('id, meta_audience_id')
      .eq('id', audienceId)
      .single();

    if (currentError || !current) {
      return NextResponse.json({ success: false, error: 'Audience não encontrado' }, { status: 404 });
    }

    if (body.name !== undefined || body.description !== undefined) {
      const metaContext = await configureAudienceMeta();
      if (metaContext.available) {
        await updateMetaAudience(String(current.meta_audience_id), {
          name: typeof body.name === 'string' ? body.name.trim() : undefined,
          description: body.description === null ? '' : body.description,
        })
          .catch(() => {
            logger.warn('Falha ao atualizar metadata no Meta, mantendo atualização local', { audienceId });
          })
          .finally(() => clearAudienceCredentialsOverride());
      }
    }

    const { data, error } = await supabase
      .from('audiences')
      .update(patch)
      .eq('id', audienceId)
      .select('*')
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, audience: data });
  } catch (error) {
    logger.error('❌ Erro ao atualizar audience:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: ParamsContext) {
  try {
    const authorized = await isAdminAuthorized(request);
    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { audienceId } = await context.params;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('audiences')
      .select('id, meta_audience_id')
      .eq('id', audienceId)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Audience não encontrado' }, { status: 404 });
    }

    const metaContext = await configureAudienceMeta();
    if (metaContext.available) {
      await deleteMetaAudience(String(data.meta_audience_id))
        .catch((err: unknown) => {
          logger.warn('Falha ao deletar audience na Meta. Aplicando soft-delete local.', {
            audienceId,
            error: err instanceof Error ? err.message : String(err),
          });
        })
        .finally(() => clearAudienceCredentialsOverride());
    }

    const { error: updateError } = await supabase
      .from('audiences')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        auto_sync: false,
      })
      .eq('id', audienceId);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ success: true, audienceId });
  } catch (error) {
    logger.error('❌ Erro ao deletar audience:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
