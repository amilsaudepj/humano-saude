'use server';

import { createServiceClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

const PORTAL = '/portal-interno-hks-2026';
const BROKER = '/dashboard/corretor';

// =============================================
// TIPOS
// =============================================

export type ProducaoIntegrada = {
  id: string;
  corretor_id: string;
  fila_proposta_id: string | null;
  numero_proposta: string | null;
  nome_segurado: string;
  cpf_segurado: string | null;
  operadora: string | null;
  operadora_id: string | null;
  modalidade: string | null;
  subproduto: string | null;
  valor_mensalidade: number;
  valor_comissao_total: number;
  percentual_comissao: number;
  grade_id: string | null;
  status: string;
  data_producao: string | null;
  data_implantacao: string | null;
  observacoes_admin: string | null;
  anexos: AnexoItem[];
  created_at: string;
  updated_at: string;
  // Joined
  corretor_nome?: string;
  corretor_email?: string;
  corretor_telefone?: string;
  total_parcelas?: number;
  parcelas_pagas?: number;
  valor_pago?: number;
  valor_pendente?: number;
};

export type AnexoItem = {
  url: string;
  nome: string;
  tipo: string;
  uploaded_at: string;
  tamanho?: number;
};

export type ProducaoAnexo = {
  id: string;
  producao_id: string;
  tipo: string;
  nome: string;
  url: string;
  tamanho_bytes: number | null;
  mime_type: string | null;
  observacao: string | null;
  uploaded_by: string;
  created_at: string;
};

export type ParcelaComissaoEntry = {
  id: string;
  producao_id: string;
  corretor_id: string;
  numero_parcela: number;
  valor_parcela: number;
  taxa: number;
  data_vencimento: string;
  percentual_comissao: number;
  codigo_comissao: string | null;
  data_pagamento_comissao: string | null;
  status_comissao: string;
  created_at: string;
};

export type ProducaoFilters = {
  busca?: string;
  corretor_id?: string;
  status?: string;
  modalidade?: string;
  operadora_id?: string;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  perPage?: number;
};

// =============================================
// LISTAR PRODUÇÕES (ADMIN - VISÃO INTEGRADA)
// =============================================

export async function getProducoesAdmin(filters?: ProducaoFilters): Promise<{
  success: boolean;
  data?: ProducaoIntegrada[];
  total?: number;
  totalValor?: number;
  totalComissao?: number;
  error?: string;
}> {
  try {
    const sb = createServiceClient();
    const page = filters?.page ?? 1;
    const perPage = filters?.perPage ?? 20;
    const offset = (page - 1) * perPage;

    let query = sb
      .from('producoes_corretor')
      .select(`
        *,
        corretores(nome, email, telefone)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (filters?.busca) {
      query = query.or(
        `nome_segurado.ilike.%${filters.busca}%,numero_proposta.ilike.%${filters.busca}%,cpf_segurado.ilike.%${filters.busca}%`
      );
    }
    if (filters?.corretor_id) query = query.eq('corretor_id', filters.corretor_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.modalidade) query = query.eq('modalidade', filters.modalidade);
    if (filters?.operadora_id) query = query.eq('operadora_id', filters.operadora_id);
    if (filters?.dataInicio) query = query.gte('data_producao', filters.dataInicio);
    if (filters?.dataFim) query = query.lte('data_producao', filters.dataFim);

    const { data, error, count } = await query;
    if (error) throw error;

    // Mapear dados
    const mapped: ProducaoIntegrada[] = (data || []).map((row: Record<string, unknown>) => {
      const corretor = row.corretores as Record<string, unknown> | null;
      return {
        id: row.id as string,
        corretor_id: row.corretor_id as string,
        fila_proposta_id: row.fila_proposta_id as string | null,
        numero_proposta: row.numero_proposta as string | null,
        nome_segurado: row.nome_segurado as string,
        cpf_segurado: row.cpf_segurado as string | null,
        operadora: row.operadora as string | null,
        operadora_id: row.operadora_id as string | null,
        modalidade: row.modalidade as string | null,
        subproduto: row.subproduto as string | null,
        valor_mensalidade: Number(row.valor_mensalidade) || 0,
        valor_comissao_total: Number(row.valor_comissao_total) || 0,
        percentual_comissao: Number(row.percentual_comissao) || 0,
        grade_id: row.grade_id as string | null,
        status: row.status as string,
        data_producao: row.data_producao as string | null,
        data_implantacao: row.data_implantacao as string | null,
        observacoes_admin: row.observacoes_admin as string | null,
        anexos: (row.anexos as AnexoItem[]) || [],
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        corretor_nome: corretor?.nome as string | undefined,
        corretor_email: corretor?.email as string | undefined,
        corretor_telefone: corretor?.telefone as string | undefined,
      };
    });

    // Calcular totais
    const { data: totais } = await sb
      .from('producoes_corretor')
      .select('valor_mensalidade, valor_comissao_total');

    const totalValor = (totais || []).reduce((sum, r) => sum + Number(r.valor_mensalidade || 0), 0);
    const totalComissao = (totais || []).reduce((sum, r) => sum + Number(r.valor_comissao_total || 0), 0);

    return { success: true, data: mapped, total: count || 0, totalValor, totalComissao };
  } catch (err) {
    logger.error('[getProducoesAdmin]', err);
    return { success: false, error: 'Erro ao carregar produções' };
  }
}

// =============================================
// CRIAR PRODUÇÃO A PARTIR DA FILA (IMPLANTAÇÃO)
// =============================================

export async function criarProducaoFromFila(params: {
  fila_id: string;
  operadora_id?: string;
  valor_mensalidade: number;
  modalidade?: string;
  subproduto?: string;
  percentual_comissao?: number;
  numero_parcelas?: number;
  observacoes?: string;
}): Promise<{ success: boolean; producao_id?: string; error?: string }> {
  try {
    const sb = createServiceClient();

    const { data, error } = await sb.rpc('create_producao_from_fila', {
      p_fila_id: params.fila_id,
      p_operadora_id: params.operadora_id || null,
      p_valor_mensalidade: params.valor_mensalidade,
      p_modalidade: params.modalidade || null,
      p_subproduto: params.subproduto || null,
      p_percentual_comissao: params.percentual_comissao || 100,
      p_numero_parcelas: params.numero_parcelas || 12,
      p_observacoes: params.observacoes || null,
    });

    if (error) {
      logger.error('[criarProducaoFromFila] RPC error:', error);
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; producao_id?: string; error?: string };

    if (!result.success) {
      return { success: false, error: result.error || 'Erro desconhecido' };
    }

    revalidatePath(`${PORTAL}/financeiro`);
    revalidatePath(`${PORTAL}/financeiro/comissoes`);
    revalidatePath(`${PORTAL}/producao`);
    revalidatePath(`${PORTAL}/propostas/fila`);
    revalidatePath(`${BROKER}/financeiro`);
    revalidatePath(`${BROKER}/financeiro/comissoes`);

    return { success: true, producao_id: result.producao_id };
  } catch (err) {
    logger.error('[criarProducaoFromFila]', err);
    return { success: false, error: 'Erro ao criar produção' };
  }
}

// =============================================
// CRIAR PRODUÇÃO MANUAL (SEM FILA)
// =============================================

export async function criarProducaoManual(params: {
  corretor_id: string;
  nome_segurado: string;
  cpf_segurado?: string;
  numero_proposta?: string;
  operadora_id?: string;
  modalidade?: string;
  subproduto?: string;
  valor_mensalidade: number;
  percentual_comissao?: number;
  numero_parcelas?: number;
  observacoes?: string;
}): Promise<{ success: boolean; producao_id?: string; error?: string }> {
  try {
    const sb = createServiceClient();

    // Criar produção
    const { data: prod, error: prodErr } = await sb
      .from('producoes_corretor')
      .insert({
        corretor_id: params.corretor_id,
        nome_segurado: params.nome_segurado,
        cpf_segurado: params.cpf_segurado || null,
        numero_proposta: params.numero_proposta || `MANUAL-${Date.now()}`,
        operadora_id: params.operadora_id || null,
        modalidade: params.modalidade || null,
        subproduto: params.subproduto || null,
        valor_mensalidade: params.valor_mensalidade,
        percentual_comissao: params.percentual_comissao || 100,
        status: 'Implantada',
        data_producao: new Date().toISOString().split('T')[0],
        data_implantacao: new Date().toISOString().split('T')[0],
        observacoes_admin: params.observacoes || null,
      })
      .select('id')
      .single();

    if (prodErr) throw prodErr;
    if (!prod) throw new Error('Produção não criada');

    // Gerar parcelas e ledger entries
    const numParcelas = params.numero_parcelas || 12;
    const pctFirst = params.percentual_comissao || 100;
    const pctRecurring = 30;
    const today = new Date();

    const parcelasInsert: Record<string, unknown>[] = [];
    const ledgerInsert: Record<string, unknown>[] = [];

    for (let i = 1; i <= numParcelas; i++) {
      const expectedDate = new Date(today);
      expectedDate.setMonth(expectedDate.getMonth() + (i - 1));
      const dateStr = expectedDate.toISOString().split('T')[0];
      const refMonth = dateStr.slice(0, 7);
      const pct = i === 1 ? pctFirst : pctRecurring;
      const amount = params.valor_mensalidade * (pct / 100);

      parcelasInsert.push({
        producao_id: prod.id,
        corretor_id: params.corretor_id,
        numero_parcela: i,
        valor_parcela: params.valor_mensalidade,
        taxa: amount,
        data_vencimento: dateStr,
        percentual_comissao: pct,
        status_comissao: 'pendente',
      });

      ledgerInsert.push({
        producao_id: prod.id,
        broker_id: params.corretor_id,
        operator_id: params.operadora_id || null,
        titular_name: params.nome_segurado,
        proposal_number: params.numero_proposta || `MANUAL-${Date.now()}`,
        cpf_titular: params.cpf_segurado || null,
        amount,
        base_amount: params.valor_mensalidade,
        applied_pct: pct,
        installment_number: i,
        status: 'pending',
        reference_month: refMonth,
        expected_payment_date: dateStr,
      });
    }

    await sb.from('parcelas_comissao').insert(parcelasInsert);
    await sb.from('commissions_ledger').insert(ledgerInsert);

    // Atualizar total
    const totalComissao = ledgerInsert.reduce((sum, e) => sum + (e.amount as number), 0);
    await sb.from('producoes_corretor').update({ valor_comissao_total: totalComissao }).eq('id', prod.id);

    revalidatePath(`${PORTAL}/producao`);
    revalidatePath(`${PORTAL}/financeiro`);
    revalidatePath(`${BROKER}/financeiro`);

    return { success: true, producao_id: prod.id };
  } catch (err) {
    logger.error('[criarProducaoManual]', err);
    return { success: false, error: 'Erro ao criar produção manual' };
  }
}

// =============================================
// ATUALIZAR PRODUÇÃO (ADMIN)
// =============================================

export async function atualizarProducao(
  producaoId: string,
  updates: {
    status?: string;
    valor_mensalidade?: number;
    percentual_comissao?: number;
    observacoes_admin?: string;
    operadora_id?: string;
    modalidade?: string;
    subproduto?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = createServiceClient();

    const updatePayload: Record<string, unknown> = {};
    if (updates.status) updatePayload.status = updates.status;
    if (updates.observacoes_admin !== undefined) updatePayload.observacoes_admin = updates.observacoes_admin;
    if (updates.operadora_id) updatePayload.operadora_id = updates.operadora_id;
    if (updates.modalidade) updatePayload.modalidade = updates.modalidade;
    if (updates.subproduto) updatePayload.subproduto = updates.subproduto;

    // Se mudou valor ou percentual, recalcular comissões
    if (updates.valor_mensalidade !== undefined || updates.percentual_comissao !== undefined) {
      const { error } = await sb.rpc('recalcular_comissoes_producao', {
        p_producao_id: producaoId,
        p_valor_mensalidade: updates.valor_mensalidade || null,
        p_pct_first: updates.percentual_comissao || null,
        p_pct_recurring: null,
      });

      if (error) {
        logger.error('[atualizarProducao] recalcular erro:', error);
        return { success: false, error: error.message };
      }
    }

    // Aplicar outros updates
    if (Object.keys(updatePayload).length > 0) {
      const { error } = await sb
        .from('producoes_corretor')
        .update(updatePayload)
        .eq('id', producaoId);

      if (error) throw error;
    }

    revalidatePath(`${PORTAL}/producao`);
    revalidatePath(`${PORTAL}/financeiro`);
    revalidatePath(`${BROKER}/financeiro`);

    return { success: true };
  } catch (err) {
    logger.error('[atualizarProducao]', err);
    return { success: false, error: 'Erro ao atualizar produção' };
  }
}

// =============================================
// BUSCAR DETALHES DE PRODUÇÃO
// =============================================

export async function getProducaoDetalhes(producaoId: string): Promise<{
  success: boolean;
  producao?: ProducaoIntegrada;
  parcelas?: ParcelaComissaoEntry[];
  anexos?: ProducaoAnexo[];
  error?: string;
}> {
  try {
    const sb = createServiceClient();

    const [prodRes, parcelasRes, anexosRes] = await Promise.all([
      sb.from('producoes_corretor')
        .select('*, corretores(nome, email, telefone)')
        .eq('id', producaoId)
        .single(),
      sb.from('parcelas_comissao')
        .select('*')
        .eq('producao_id', producaoId)
        .order('numero_parcela'),
      sb.from('producao_anexos')
        .select('*')
        .eq('producao_id', producaoId)
        .order('created_at', { ascending: false }),
    ]);

    if (prodRes.error) throw prodRes.error;

    const row = prodRes.data as Record<string, unknown>;
    const corretor = row.corretores as Record<string, unknown> | null;

    const producao: ProducaoIntegrada = {
      id: row.id as string,
      corretor_id: row.corretor_id as string,
      fila_proposta_id: row.fila_proposta_id as string | null,
      numero_proposta: row.numero_proposta as string | null,
      nome_segurado: row.nome_segurado as string,
      cpf_segurado: row.cpf_segurado as string | null,
      operadora: row.operadora as string | null,
      operadora_id: row.operadora_id as string | null,
      modalidade: row.modalidade as string | null,
      subproduto: row.subproduto as string | null,
      valor_mensalidade: Number(row.valor_mensalidade) || 0,
      valor_comissao_total: Number(row.valor_comissao_total) || 0,
      percentual_comissao: Number(row.percentual_comissao) || 0,
      grade_id: row.grade_id as string | null,
      status: row.status as string,
      data_producao: row.data_producao as string | null,
      data_implantacao: row.data_implantacao as string | null,
      observacoes_admin: row.observacoes_admin as string | null,
      anexos: (row.anexos as AnexoItem[]) || [],
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      corretor_nome: corretor?.nome as string | undefined,
      corretor_email: corretor?.email as string | undefined,
      corretor_telefone: corretor?.telefone as string | undefined,
    };

    return {
      success: true,
      producao,
      parcelas: (parcelasRes.data || []) as ParcelaComissaoEntry[],
      anexos: (anexosRes.data || []) as ProducaoAnexo[],
    };
  } catch (err) {
    logger.error('[getProducaoDetalhes]', err);
    return { success: false, error: 'Erro ao carregar detalhes' };
  }
}

// =============================================
// ADICIONAR ANEXO
// =============================================

export async function adicionarAnexoProducao(
  producaoId: string,
  anexo: {
    tipo: string;
    nome: string;
    url: string;
    tamanho_bytes?: number;
    mime_type?: string;
    observacao?: string;
    uploaded_by?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = createServiceClient();

    const { error } = await sb.from('producao_anexos').insert({
      producao_id: producaoId,
      tipo: anexo.tipo,
      nome: anexo.nome,
      url: anexo.url,
      tamanho_bytes: anexo.tamanho_bytes || null,
      mime_type: anexo.mime_type || null,
      observacao: anexo.observacao || null,
      uploaded_by: anexo.uploaded_by || 'admin',
    });

    if (error) throw error;

    revalidatePath(`${PORTAL}/producao`);

    return { success: true };
  } catch (err) {
    logger.error('[adicionarAnexoProducao]', err);
    return { success: false, error: 'Erro ao adicionar anexo' };
  }
}

// =============================================
// MARCAR PARCELA COMO PAGA
// =============================================

export async function marcarParcelaPaga(
  parcelaId: string,
  dados?: { data_pagamento?: string; codigo_comissao?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = createServiceClient();

    // Atualizar parcela_comissao
    const { data: parcela, error: parcelaErr } = await sb
      .from('parcelas_comissao')
      .update({
        status_comissao: 'paga',
        data_pagamento_comissao: dados?.data_pagamento || new Date().toISOString().split('T')[0],
        codigo_comissao: dados?.codigo_comissao || null,
      })
      .eq('id', parcelaId)
      .select('producao_id, numero_parcela')
      .single();

    if (parcelaErr) throw parcelaErr;

    // Atualizar commissions_ledger correspondente
    if (parcela) {
      await sb
        .from('commissions_ledger')
        .update({
          status: 'paid',
          actual_payment_date: dados?.data_pagamento || new Date().toISOString().split('T')[0],
          payment_reference: dados?.codigo_comissao || null,
        })
        .eq('producao_id', parcela.producao_id)
        .eq('installment_number', parcela.numero_parcela);
    }

    revalidatePath(`${PORTAL}/producao`);
    revalidatePath(`${PORTAL}/financeiro`);
    revalidatePath(`${PORTAL}/financeiro/comissoes`);
    revalidatePath(`${BROKER}/financeiro`);
    revalidatePath(`${BROKER}/financeiro/comissoes`);

    return { success: true };
  } catch (err) {
    logger.error('[marcarParcelaPaga]', err);
    return { success: false, error: 'Erro ao marcar parcela como paga' };
  }
}

// =============================================
// LISTAR CORRETORES (para selects)
// =============================================

export async function getCorretoresParaSelect(): Promise<{
  success: boolean;
  data?: { id: string; nome: string; email: string | null }[];
  error?: string;
}> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('corretores')
      .select('id, nome, email')
      .order('nome');

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    logger.error('[getCorretoresParaSelect]', err);
    return { success: false, error: 'Erro ao listar corretores' };
  }
}

// =============================================
// LISTAR OPERADORAS (para selects)
// =============================================

export async function getOperadorasParaSelect(): Promise<{
  success: boolean;
  data?: { id: string; nome: string }[];
  error?: string;
}> {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('operadoras')
      .select('id, nome')
      .order('nome');

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err) {
    logger.error('[getOperadorasParaSelect]', err);
    return { success: false, error: 'Erro ao listar operadoras' };
  }
}

// =============================================
// STATS GERAIS PARA DASHBOARD ADMIN
// =============================================

export async function getProducaoStats(): Promise<{
  success: boolean;
  data?: {
    total_producoes: number;
    total_implantadas: number;
    total_valor_mensalidade: number;
    total_comissao: number;
    total_pago: number;
    total_pendente: number;
  };
  error?: string;
}> {
  try {
    const sb = createServiceClient();

    const { data: prods } = await sb
      .from('producoes_corretor')
      .select('status, valor_mensalidade, valor_comissao_total');

    const { data: ledger } = await sb
      .from('commissions_ledger')
      .select('status, amount');

    const totalPago = (ledger || [])
      .filter(l => l.status === 'paid')
      .reduce((sum, l) => sum + Number(l.amount || 0), 0);

    const totalPendente = (ledger || [])
      .filter(l => l.status === 'pending')
      .reduce((sum, l) => sum + Number(l.amount || 0), 0);

    return {
      success: true,
      data: {
        total_producoes: prods?.length || 0,
        total_implantadas: prods?.filter(p => p.status === 'Implantada').length || 0,
        total_valor_mensalidade: (prods || []).reduce((sum, p) => sum + Number(p.valor_mensalidade || 0), 0),
        total_comissao: (prods || []).reduce((sum, p) => sum + Number(p.valor_comissao_total || 0), 0),
        total_pago: totalPago,
        total_pendente: totalPendente,
      },
    };
  } catch (err) {
    logger.error('[getProducaoStats]', err);
    return { success: false, error: 'Erro ao carregar stats' };
  }
}
