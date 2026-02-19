'use server';

import { createServiceClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import type {
  CommissionLedgerFilters,
  CommissionLedgerInsert,
  CommissionLedgerUpdate,
  CommissionLedgerExpanded,
  CommissionsSummary,
  LedgerStatus,
} from '@/lib/types/commissions';

const PORTAL = '/portal-interno-hks-2026';

// ========================================
// RESUMO MENSAL (RPC)
// ========================================

export async function getCommissionsSummary(month?: string) {
  try {
    const sb = createServiceClient();
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const { data, error } = await sb.rpc('get_commissions_summary', {
      p_month: targetMonth,
    });

    if (error) {
      logger.error('❌ Erro ao buscar resumo de comissões:', error);
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data as CommissionsSummary };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// LISTAR LANÇAMENTOS (LEDGER)
// ========================================

export async function getCommissionsLedger(filters?: CommissionLedgerFilters) {
  try {
    const sb = createServiceClient();
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    let query = sb
      .from('commissions_ledger')
      .select(`
        *,
        operadoras(nome, logo_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.broker_id) query = query.eq('broker_id', filters.broker_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.audit_status) query = query.eq('audit_status', filters.audit_status);
    if (filters?.reference_month) query = query.eq('reference_month', filters.reference_month);
    if (filters?.operator_id) query = query.eq('operator_id', filters.operator_id);
    if (filters?.date_from) query = query.gte('expected_payment_date', filters.date_from);
    if (filters?.date_to) query = query.lte('expected_payment_date', filters.date_to);

    const { data, error, count } = await query;

    if (error) {
      logger.error('❌ Erro ao buscar ledger de comissões:', error);
      return { success: false, data: [], total: 0, error: error.message };
    }

    return {
      success: true,
      data: (data || []) as CommissionLedgerExpanded[],
      total: count || data?.length || 0,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: [], total: 0, error: msg };
  }
}

// ========================================
// CRIAR LANÇAMENTO
// ========================================

export async function createLedgerEntry(input: CommissionLedgerInsert) {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('commissions_ledger')
      .insert(input)
      .select('id')
      .single();

    if (error) {
      logger.error('❌ Erro ao criar lançamento:', error);
      return { success: false, data: null, error: error.message };
    }

    revalidatePath(`${PORTAL}/financeiro/comissoes`);
    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, data: null, error: msg };
  }
}

// ========================================
// MARCAR COMO PAGO (um ou vários)
// ========================================

export async function markAsPaid(
  ids: string[],
  paymentInfo: { payment_method: string; payment_reference?: string }
) {
  try {
    const sb = createServiceClient();
    const now = new Date().toISOString().split('T')[0];

    const { error } = await sb
      .from('commissions_ledger')
      .update({
        status: 'paid' as LedgerStatus,
        actual_payment_date: now,
        payment_method: paymentInfo.payment_method,
        payment_reference: paymentInfo.payment_reference || null,
      })
      .in('id', ids);

    if (error) {
      logger.error('❌ Erro ao marcar como pago:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`${PORTAL}/financeiro/comissoes`);
    return { success: true, message: `${ids.length} lançamento(s) marcado(s) como pago(s)` };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// ATUALIZAR STATUS
// ========================================

export async function updateLedgerStatus(id: string, status: LedgerStatus) {
  try {
    const sb = createServiceClient();
    const update: CommissionLedgerUpdate = { status };

    if (status === 'cancelled') {
      update.actual_payment_date = null;
    }

    const { error } = await sb
      .from('commissions_ledger')
      .update(update)
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/financeiro/comissoes`);
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// GERAR CSV DE PAGAMENTO (para banco)
// ========================================

export async function generatePaymentCSV(filters?: {
  reference_month?: string;
  status?: LedgerStatus;
}) {
  try {
    const sb = createServiceClient();
    const targetMonth = filters?.reference_month || new Date().toISOString().slice(0, 7);
    const targetStatus = filters?.status || 'confirmed';

    // Buscar lançamentos confirmados do mês + dados do corretor
    const { data: entries, error } = await sb
      .from('commissions_ledger')
      .select(`
        id, broker_id, amount, reference_month, installment_number
      `)
      .eq('reference_month', targetMonth)
      .eq('status', targetStatus)
      .order('broker_id');

    if (error) {
      logger.error('❌ Erro ao gerar CSV:', error);
      return { success: false, csv: '', error: error.message };
    }

    if (!entries || entries.length === 0) {
      return { success: false, csv: '', error: 'Nenhum lançamento encontrado para o período' };
    }

    // Buscar dados bancários dos corretores
    const brokerIds = [...new Set(entries.map((e) => e.broker_id))];
    const { data: brokers } = await sb
      .from('corretores')
      .select('id, nome_completo, cpf, banco, agencia, conta')
      .in('id', brokerIds);

    const brokerMap = new Map(
      (brokers || []).map((b) => [b.id, b])
    );

    // Agrupar por corretor e somar valores
    const grouped = new Map<string, { total: number; entries: typeof entries }>();
    for (const entry of entries) {
      const current = grouped.get(entry.broker_id) || { total: 0, entries: [] };
      current.total += Number(entry.amount);
      current.entries.push(entry);
      grouped.set(entry.broker_id, current);
    }

    // Montar CSV
    const header = 'Nome;CPF;Banco;Agencia;Conta;Valor;Referencia';
    const rows: string[] = [header];

    for (const [brokerId, group] of grouped) {
      const broker = brokerMap.get(brokerId);
      rows.push([
        broker?.nome_completo || 'N/A',
        broker?.cpf || 'N/A',
        broker?.banco || 'N/A',
        broker?.agencia || 'N/A',
        broker?.conta || 'N/A',
        group.total.toFixed(2).replace('.', ','),
        targetMonth,
      ].join(';'));
    }

    return { success: true, csv: rows.join('\n'), filename: `pagamento_comissoes_${targetMonth}.csv` };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, csv: '', error: msg };
  }
}

// ========================================
// ATUALIZAR AUDIT STATUS (pós-Gemini)
// ========================================

export async function updateAuditStatus(
  id: string,
  auditData: { audit_status: 'match' | 'divergent' | 'missing'; audit_notes?: string }
) {
  try {
    const sb = createServiceClient();
    const { error } = await sb
      .from('commissions_ledger')
      .update({
        audit_status: auditData.audit_status,
        audit_notes: auditData.audit_notes || null,
        audited_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath(`${PORTAL}/financeiro/comissoes`);
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro inesperado';
    return { success: false, error: msg };
  }
}

// ========================================
// LISTAR CORRETORES (para filtro)
// ========================================

export async function getBrokersForFilter() {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('corretores')
      .select('id, nome_completo')
      .eq('status', 'ativo')
      .order('nome_completo');

    if (error) return { success: false, data: [] };
    return { success: true, data: data || [] };
  } catch {
    return { success: false, data: [] };
  }
}

// ========================================
// LISTAR OPERADORAS (para filtro)
// ========================================

export async function getOperatorsForFilter() {
  try {
    const sb = createServiceClient();
    const { data, error } = await sb
      .from('operadoras')
      .select('id, nome')
      .eq('ativa', true)
      .order('nome');

    if (error) return { success: false, data: [] };
    return { success: true, data: data || [] };
  } catch {
    return { success: false, data: [] };
  }
}
