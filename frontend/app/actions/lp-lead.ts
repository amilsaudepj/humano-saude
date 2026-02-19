'use server';

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { HUMANO_TENANT_ID } from '@/lib/types/tenant';

// ─── Supabase server-side (service role) ────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Schema de validação do formulário da LP ─────────────────
const LPLeadSchema = z.object({
  nome:           z.string().min(2, 'Nome obrigatório'),
  whatsapp:       z.string().min(10, 'WhatsApp inválido'),
  email:          z.string().email('E-mail inválido').optional().or(z.literal('')),
  empresa:        z.string().optional(),
  n_vidas:        z.coerce.number().min(1).optional(),
  operadora_atual: z.string().optional(),
  tenant_slug:    z.string().min(1),
  lp_slug:        z.string().min(1), // ex: 'amil-pj', 'bradesco-pj'
  utm_source:     z.string().optional(),
  utm_medium:     z.string().optional(),
  utm_campaign:   z.string().optional(),
});

export type LPLeadInput = z.infer<typeof LPLeadSchema>;

export interface LPLeadResult {
  success: boolean;
  error?: string;
  leadId?: string;
}

// ─── Resolução do tenant_id a partir do slug ─────────────────
async function resolveTenantId(slug: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  // Fallback para Humano Saúde se o tenant não for encontrado
  return data?.id ?? HUMANO_TENANT_ID;
}

// ─── Server Action principal ──────────────────────────────────
export async function ingestLPLead(raw: LPLeadInput): Promise<LPLeadResult> {
  const parsed = LPLeadSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first.message };
  }

  const { nome, whatsapp, email, empresa, n_vidas, operadora_atual, tenant_slug, lp_slug, utm_source, utm_medium, utm_campaign } = parsed.data;

  try {
    const tenantId = await resolveTenantId(tenant_slug);

    // Normalizar telefone (remove tudo que não é número)
    const whatsappClean = whatsapp.replace(/\D/g, '');

    // Verificar duplicata por WhatsApp no mesmo tenant (30 dias)
    const { data: existing } = await supabaseAdmin
      .from('insurance_leads')
      .select('id')
      .eq('whatsapp', whatsappClean)
      .eq('tenant_id', tenantId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (existing) {
      // Atualizar a origem em vez de duplicar
      await supabaseAdmin
        .from('insurance_leads')
        .update({
          origem: `lp_${lp_slug}`,
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      return { success: true, leadId: existing.id };
    }

    const { data: lead, error } = await supabaseAdmin
      .from('insurance_leads')
      .insert({
        nome,
        whatsapp: whatsappClean,
        email: email || null,
        empresa: empresa || null,
        n_vidas: n_vidas || null,
        operadora_atual: operadora_atual || null,
        status: 'novo',
        origem: `lp_${lp_slug}`,
        tenant_id: tenantId,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        historico: [
          {
            timestamp: new Date().toISOString(),
            evento: 'lead_criado',
            origem: `lp_${lp_slug}`,
            detalhes: `Lead captado via Landing Page ${lp_slug} do tenant ${tenant_slug}`,
          },
        ],
      })
      .select('id')
      .single();

    if (error) throw error;

    return { success: true, leadId: lead.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[ingestLPLead]', message);
    return { success: false, error: 'Erro ao registrar. Tente novamente.' };
  }
}
