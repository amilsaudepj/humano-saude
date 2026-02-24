'use server';

import { createServiceClient } from '@/lib/supabase';
import { enviarEmailAprovacao } from '@/lib/email';
import { logger } from '@/lib/logger';

export interface SolicitacaoCorretor {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  cpf: string | null;
  tipo_pessoa: 'pf' | 'pj';
  cnpj: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
  registro_susep: string | null;
  experiencia_anos: number;
  operadoras_experiencia: string[];
  especialidade: string | null;
  motivacoes: string[] | null;
  modalidade_trabalho: 'presencial' | 'digital' | 'hibrido' | null;
  como_conheceu: string | null;
  mensagem: string | null;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  motivo_rejeicao: string | null;
  termo_aceito: boolean;
  created_at: string;
  indicado_por_corretor_id?: string | null;
}

export interface TermoAceite {
  id: string;
  nome_completo: string;
  email: string;
  documento: string;
  termo_tipo: string;
  termo_versao: string;
  ip_address: string | null;
  user_agent: string | null;
  aceite_timestamp: string;
  solicitacao_id: string | null;
  corretor_id: string | null;
}

export async function getSolicitacoes(status?: string): Promise<{
  success: boolean;
  data?: SolicitacaoCorretor[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    let query = supabase
      .from('solicitacoes_corretor')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data: data as SolicitacaoCorretor[] };
  } catch (err) {
    logger.error('[getSolicitacoes]', err);
    return { success: false, error: 'Erro ao buscar solicitações' };
  }
}

/** Lista solicitações de corretores indicadas pelo corretor logado (link seja corretor). */
export async function getSolicitacoesIndicadasPorCorretor(corretorId: string): Promise<{
  success: boolean;
  data?: SolicitacaoCorretor[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('solicitacoes_corretor')
      .select('*')
      .eq('indicado_por_corretor_id', corretorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: (data ?? []) as SolicitacaoCorretor[] };
  } catch (err) {
    logger.error('[getSolicitacoesIndicadasPorCorretor]', err);
    return { success: false, error: 'Erro ao buscar indicados' };
  }
}

export async function aprovarSolicitacao(
  solicitacaoId: string,
  adminUserId?: string,
): Promise<{ success: boolean; onboardingToken?: string; error?: string }> {
  try {
    const supabase = createServiceClient();

    // 1. Buscar solicitação
    const { data: solicitacao, error: fetchErr } = await supabase
      .from('solicitacoes_corretor')
      .select('*')
      .eq('id', solicitacaoId)
      .single();

    if (fetchErr || !solicitacao) {
      return { success: false, error: 'Solicitação não encontrada' };
    }

    if (solicitacao.status !== 'pendente') {
      return { success: false, error: 'Solicitação já foi processada' };
    }

    // 2. Gerar token de onboarding + senha temporária
    const onboardingToken = crypto.randomUUID();
    const tokenExpira = new Date();
    tokenExpira.setDate(tokenExpira.getDate() + 7);
    
    // Gerar senha temporária legível: 2 letras + 4 números + 2 letras
    const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numeros = '23456789';
    const senhaTemporaria = [
      letras[Math.floor(Math.random() * letras.length)],
      letras[Math.floor(Math.random() * letras.length)],
      numeros[Math.floor(Math.random() * numeros.length)],
      numeros[Math.floor(Math.random() * numeros.length)],
      numeros[Math.floor(Math.random() * numeros.length)],
      numeros[Math.floor(Math.random() * numeros.length)],
      letras[Math.floor(Math.random() * letras.length)].toLowerCase(),
      letras[Math.floor(Math.random() * letras.length)].toLowerCase(),
    ].join('');

    // 3. Criar corretor na tabela corretores
    const corretorData: Record<string, unknown> = {
      nome: solicitacao.nome_completo,
      email: solicitacao.email,
      telefone: solicitacao.telefone,
      cpf: solicitacao.cpf,
      susep: solicitacao.registro_susep,
      role: 'corretor',
      ativo: true,
      data_admissao: new Date().toISOString().split('T')[0],
      comissao_padrao_pct: 10,
      metadata: {
        experiencia_anos: solicitacao.experiencia_anos,
        operadoras_experiencia: solicitacao.operadoras_experiencia,
        especialidade: solicitacao.especialidade,
        motivacoes: solicitacao.motivacoes,
        modalidade_trabalho: solicitacao.modalidade_trabalho,
        origem: 'cadastro_online',
        solicitacao_id: solicitacaoId,
        onboarding_token: onboardingToken,
        onboarding_token_expira: tokenExpira.toISOString(),
        senha_temporaria: senhaTemporaria, // Em produção, usar hash bcrypt
        senha_alterada: false,
      },
    };

    const { data: corretor, error: insertErr } = await supabase
      .from('corretores')
      .insert(corretorData)
      .select('id')
      .single();

    if (insertErr) {
      logger.error('[aprovarSolicitacao] insert corretor', insertErr);
      return { success: false, error: 'Erro ao criar corretor' };
    }

    // 4. Atualizar status da solicitação
    const { error: updateErr } = await supabase
      .from('solicitacoes_corretor')
      .update({
        status: 'aprovado',
        aprovado_por: adminUserId ?? null,
        aprovado_em: new Date().toISOString(),
      })
      .eq('id', solicitacaoId);

    if (updateErr) {
      logger.error('[aprovarSolicitacao] update status', updateErr);
    }

    // 5. Enviar email de aprovação com dados de acesso + link de onboarding
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br';
      const tipo = solicitacao.tipo_pessoa || 'pf';
      const onboardingLink = `${baseUrl}/dashboard/corretor/onboarding?token=${onboardingToken}&tipo=${tipo}`;

      await enviarEmailAprovacao({
        nome: solicitacao.nome_completo,
        email: solicitacao.email,
        onboardingLink,
        senhaTemporaria,
      });
    } catch (emailErr) {
      logger.error('[aprovarSolicitacao] email error (non-critical):', emailErr);
    }

    return { success: true, onboardingToken };
  } catch (err) {
    logger.error('[aprovarSolicitacao]', err);
    return { success: false, error: 'Erro ao aprovar solicitação' };
  }
}

export async function rejeitarSolicitacao(
  solicitacaoId: string,
  motivo: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('solicitacoes_corretor')
      .update({
        status: 'rejeitado',
        motivo_rejeicao: motivo || 'Não atende aos critérios no momento',
      })
      .eq('id', solicitacaoId)
      .eq('status', 'pendente');

    if (error) throw error;

    return { success: true };
  } catch (err) {
    logger.error('[rejeitarSolicitacao]', err);
    return { success: false, error: 'Erro ao rejeitar solicitação' };
  }
}

export async function getTermosAceites(): Promise<{
  success: boolean;
  data?: TermoAceite[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('termos_aceites')
      .select('*')
      .order('aceite_timestamp', { ascending: false });

    if (error) throw error;

    return { success: true, data: data as TermoAceite[] };
  } catch (err) {
    logger.error('[getTermosAceites]', err);
    return { success: false, error: 'Erro ao buscar aceites de termos' };
  }
}

export async function getTermosAceitesBySolicitacao(
  solicitacaoId: string,
): Promise<{
  success: boolean;
  data?: TermoAceite[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('termos_aceites')
      .select('*')
      .eq('solicitacao_id', solicitacaoId)
      .order('aceite_timestamp', { ascending: false });

    if (error) throw error;

    return { success: true, data: data as TermoAceite[] };
  } catch (err) {
    logger.error('[getTermosAceitesBySolicitacao]', err);
    return { success: false, error: 'Erro ao buscar aceites' };
  }
}
