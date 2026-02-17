'use server';

import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { saveCalculadoraLead } from '@/app/actions/leads';
import { salvarLeadIndicacao } from '@/app/actions/leads-indicacao';
import { enviarEmailAcessoPortalCliente, enviarEmailNovoLead } from '@/lib/email';
import { logger } from '@/lib/logger';

export type EconomizarProposta = {
  operadora_id: string;
  operadora_nome: string;
  plano_nome: string;
  valor_total: number;
  economia_valor: number;
  economia_pct: number;
  abrangencia?: string;
  coparticipacao?: boolean;
  notas?: string | null;
};

export type FinalizarCadastroEconomizarPayload = {
  nome: string;
  email: string;
  telefone: string;
  tipo_pessoa: 'PF' | 'PJ';
  operadora_atual?: string | null;
  valor_atual: number;
  idades: string[];
  propostas: EconomizarProposta[];
  corretor_id?: string;
  corretor_slug?: string;
};

export type FinalizarCadastroEconomizarResponse = {
  success: boolean;
  lead_id?: string;
  portal_email?: string;
  error?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateTemporaryPassword(): string {
  const raw = randomBytes(9).toString('base64url');
  return `HS${raw.slice(0, 10)}`;
}

export async function finalizarCadastroEconomizar(
  payload: FinalizarCadastroEconomizarPayload,
): Promise<FinalizarCadastroEconomizarResponse> {
  try {
    const nome = payload.nome.trim();
    const email = normalizeEmail(payload.email);
    const telefone = normalizePhone(payload.telefone);

    if (!nome) {
      return { success: false, error: 'Informe seu nome completo.' };
    }

    if (!isValidEmail(email)) {
      return { success: false, error: 'Informe um e-mail válido.' };
    }

    if (telefone.length < 10 || telefone.length > 11) {
      return { success: false, error: 'Informe um WhatsApp válido com DDD.' };
    }

    if (!Number.isFinite(payload.valor_atual) || payload.valor_atual <= 0) {
      return { success: false, error: 'Valor atual inválido.' };
    }

    if (!Array.isArray(payload.idades) || payload.idades.length === 0) {
      return { success: false, error: 'Informe pelo menos uma vida para simulação.' };
    }

    const melhorProposta = payload.propostas?.[0];

    const saveLeadResult = await saveCalculadoraLead({
      nome,
      email,
      telefone,
      operadora_atual: payload.operadora_atual || undefined,
      valor_atual: payload.valor_atual,
      idades: payload.idades,
      economia_estimada: melhorProposta?.economia_valor,
      valor_proposto: melhorProposta?.valor_total,
      tipo_pessoa: payload.tipo_pessoa,
      corretor_id: payload.corretor_id,
      corretor_slug: payload.corretor_slug,
      resultado_simulacao: {
        valorAtual: payload.valor_atual,
        qtdVidas: payload.idades.length,
        modalidade: payload.tipo_pessoa === 'PJ' ? 'PME' : 'PF',
      },
      propostas: payload.propostas?.map((proposta) => ({
        operadora_id: proposta.operadora_id,
        operadora_nome: proposta.operadora_nome,
        plano_nome: proposta.plano_nome,
        valor_total: proposta.valor_total,
        economia_valor: proposta.economia_valor,
        economia_pct: proposta.economia_pct,
        abrangencia: proposta.abrangencia || null,
        coparticipacao: Boolean(proposta.coparticipacao),
        notas: proposta.notas || null,
      })),
    });

    if (!saveLeadResult.success || !saveLeadResult.lead_id) {
      return {
        success: false,
        error: saveLeadResult.message || 'Não foi possível salvar seu cadastro.',
      };
    }

    if (payload.corretor_id || payload.corretor_slug) {
      await salvarLeadIndicacao({
        corretor_id: payload.corretor_id,
        origem: 'link_corretor',
        nome,
        email,
        telefone,
        operadora_atual: payload.operadora_atual || undefined,
        valor_atual: payload.valor_atual,
        qtd_vidas: payload.idades.length,
        idades: payload.idades,
        valor_estimado_min: payload.propostas?.[0]?.valor_total,
        valor_estimado_max: payload.propostas?.[payload.propostas.length - 1]?.valor_total,
        economia_estimada: melhorProposta?.economia_valor,
      }).catch((err) => {
        logger.warn('[finalizarCadastroEconomizar] Falha ao salvar lead de indicação', {
          error: err instanceof Error ? err.message : String(err),
          corretor_id: payload.corretor_id || null,
        });
      });
    }

    const senhaTemporaria = generateTemporaryPassword();
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const sb = createServiceClient();

    const resumoPortal = {
      origem: 'economizar',
      nome,
      email,
      telefone,
      tipo_pessoa: payload.tipo_pessoa,
      operadora_atual: payload.operadora_atual || null,
      valor_atual: payload.valor_atual,
      qtd_vidas: payload.idades.length,
      idades: payload.idades,
      propostas: payload.propostas || [],
      lead_id: saveLeadResult.lead_id,
      atualizado_em: new Date().toISOString(),
    };

    const { data: existingAccount, error: existingError } = await sb
      .from('portal_client_accounts')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existingError) {
      logger.error('[finalizarCadastroEconomizar] Erro ao buscar conta portal existente', existingError);
      return { success: false, error: 'Erro ao preparar o acesso ao portal.' };
    }

    if (existingAccount?.id) {
      const { error: updateError } = await sb
        .from('portal_client_accounts')
        .update({
          lead_id: saveLeadResult.lead_id,
          corretor_id: payload.corretor_id || null,
          nome,
          telefone,
          senha_hash: senhaHash,
          status: 'ativo',
          dados_resumo: resumoPortal,
        })
        .eq('id', existingAccount.id);

      if (updateError) {
        logger.error('[finalizarCadastroEconomizar] Erro ao atualizar conta portal', updateError);
        return { success: false, error: 'Não foi possível atualizar seu acesso ao portal.' };
      }
    } else {
      const { error: insertError } = await sb
        .from('portal_client_accounts')
        .insert({
          lead_id: saveLeadResult.lead_id,
          corretor_id: payload.corretor_id || null,
          nome,
          email,
          telefone,
          senha_hash: senhaHash,
          status: 'ativo',
          dados_resumo: resumoPortal,
        });

      if (insertError) {
        logger.error('[finalizarCadastroEconomizar] Erro ao criar conta portal', insertError);
        return { success: false, error: 'Não foi possível criar seu acesso ao portal.' };
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';
    const portalLoginUrl = `${appUrl.replace(/\/$/, '')}/portal-cliente/login`;

    await enviarEmailAcessoPortalCliente({
      nome,
      email,
      senhaTemporaria,
      portalLink: portalLoginUrl,
      resumo: {
        operadoraAtual: payload.operadora_atual || null,
        valorAtual: payload.valor_atual,
        qtdVidas: payload.idades.length,
      },
    }).catch((err) => {
      logger.error('[finalizarCadastroEconomizar] Erro ao enviar acesso do portal', err);
    });

    await enviarEmailNovoLead({
      nome,
      email,
      telefone,
      perfil: payload.tipo_pessoa === 'PJ' ? 'Empresarial' : 'Individual/Familiar',
      intencao: 'Comparar e economizar no plano de saúde',
      idades: payload.idades.join(', '),
      qtdVidas: String(payload.idades.length),
      origem: 'calculadora',
      parcial: false,
    }).catch((err) => {
      logger.error('[finalizarCadastroEconomizar] Erro ao enviar notificação de novo lead', err);
    });

    return {
      success: true,
      lead_id: saveLeadResult.lead_id,
      portal_email: email,
    };
  } catch (error) {
    logger.error('[finalizarCadastroEconomizar] Erro inesperado', error);
    return {
      success: false,
      error: 'Erro inesperado ao finalizar o cadastro.',
    };
  }
}
