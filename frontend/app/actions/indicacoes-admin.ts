'use server';

import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ============================================
// TYPES
// ============================================

/** Tipo da indicação para visão admin/corretor */
export type TipoIndicacao = 'economizar' | 'form_indicar' | 'form_indicar_afiliado' | 'seja_corretor' | 'seja_afiliado';

export interface LeadIndicado {
  id: string;
  nome: string | null;
  whatsapp: string | null;
  operadora_atual: string | null;
  status: string;
  valor_atual: number | null;
  economia_estimada: number | null;
  created_at: string;
  clicou_no_contato: boolean;
  /** Origem: economizar (calculadora), form_indicar (form /indicar direto), form_indicar_afiliado (form /indicar via afiliado) */
  tipo?: TipoIndicacao;
  afiliado_nome?: string | null;
}

export interface CorretorIndicacoes {
  id: string;
  nome: string;
  slug: string | null;
  email: string | null;
  telefone: string | null;
  foto_url: string | null;
  ativo: boolean;
  created_at: string;
  // Métricas calculadas
  total_indicacoes: number;
  total_simulacoes: number;
  total_contatados: number;
  total_negociacao: number;
  total_propostas: number;
  total_ganhos: number;
  total_perdidos: number;
  taxa_conversao: number; // ganhos / total
  valor_total_faturas: number;
  economia_total: number;
  leads: LeadIndicado[];
}

export interface IndicacoesOverview {
  total_corretores_ativos: number;
  total_indicacoes: number;
  total_ganhos: number;
  total_perdidos: number;
  taxa_conversao_geral: number;
  valor_total_economia: number;
  corretores: CorretorIndicacoes[];
  /** Contagens por tipo (visão geral admin) */
  por_tipo: {
    economizar: number;
    form_indicar: number;
    form_indicar_afiliado: number;
    seja_corretor: number;
    seja_afiliado: number;
  };
}

// ============================================
// SERVER ACTION: Buscar dados completos de indicações
// ============================================

export async function getIndicacoesOverview(): Promise<{
  success: boolean;
  data: IndicacoesOverview | null;
  error?: string;
}> {
  try {
    const sb = createServiceClient();

    // 1. Buscar todos os corretores
    const { data: corretores, error: errCorretores } = await sb
      .from('corretores')
      .select('id, nome, slug, email, telefone, foto_url, ativo, created_at')
      .order('nome');

    if (errCorretores) {
      return { success: false, data: null, error: errCorretores.message };
    }

    // 2. Buscar todos os leads com corretor (insurance_leads)
    const { data: leadsAdmin, error: errLeads } = await sb
      .from('insurance_leads')
      .select('id, nome, whatsapp, operadora_atual, status, valor_atual, economia_estimada, dados_pdf, created_at')
      .eq('arquivado', false);

    if (errLeads) {
      return { success: false, data: null, error: errLeads.message };
    }

    // 3. Buscar leads da tabela leads_indicacao (com afiliado para tipo e nome)
    const { data: leadsIndicacao, error: errLI } = await sb
      .from('leads_indicacao')
      .select('id, corretor_id, afiliado_id, nome, telefone, operadora_atual, status, valor_atual, economia_estimada, created_at, clicou_no_contato');

    if (errLI) {
      return { success: false, data: null, error: errLI.message };
    }

    // 3b. Buscar solicitações "seja corretor" (para contagem por tipo e por corretor indicador)
    const { data: solicitacoesCorretor } = await sb
      .from('solicitacoes_corretor')
      .select('id, indicado_por_corretor_id')
      .in('status', ['pendente', 'aprovado']);

    // 3c. Nomes dos afiliados (para exibir "indicado por afiliado X")
    const afiliadoIds = [...new Set((leadsIndicacao || []).map((l: { afiliado_id?: string }) => l.afiliado_id).filter(Boolean))] as string[];
    const { data: afiliados } = afiliadoIds.length
      ? await sb.from('corretor_afiliados').select('id, nome').in('id', afiliadoIds)
      : { data: [] };
    const afiliadoNomeById = new Map<string, string>(((afiliados as { id: string; nome: string }[]) || []).map((a) => [a.id, a.nome || '']));

    // 4. Montar mapa de corretor_id -> leads da leads_indicacao
    const indicacaoMap = new Map<string, typeof leadsIndicacao>();
    for (const lead of leadsIndicacao || []) {
      if (!lead.corretor_id) continue;
      const arr = indicacaoMap.get(lead.corretor_id) || [];
      arr.push(lead);
      indicacaoMap.set(lead.corretor_id, arr);
    }

    // 5. Montar mapa de corretor_id/slug -> leads do insurance_leads
    const adminLeadsByCorretor = new Map<string, typeof leadsAdmin>();
    for (const lead of leadsAdmin || []) {
      const corretorId = lead.dados_pdf?.corretor?.id;
      if (!corretorId) continue;
      const arr = adminLeadsByCorretor.get(corretorId) || [];
      arr.push(lead);
      adminLeadsByCorretor.set(corretorId, arr);
    }

    // Status mapping (leads_indicacao -> admin)
    const statusToAdmin: Record<string, string> = {
      simulou: 'novo',
      entrou_em_contato: 'contatado',
      em_analise: 'negociacao',
      proposta_enviada: 'proposta_enviada',
      fechado: 'ganho',
      perdido: 'perdido',
    };

    // 6. Calcular métricas por corretor
    let totalIndicacoesGeral = 0;
    let totalGanhosGeral = 0;
    let totalPerdidosGeral = 0;
    let economiaGeral = 0;

    const corretoresComMetricas: CorretorIndicacoes[] = (corretores || []).map((c) => {
      // Usar leads_indicacao como fonte primária (mais completa)
      const leadsDoCorretor = indicacaoMap.get(c.id) || [];
      // Complementar com insurance_leads
      const leadsAdmin = adminLeadsByCorretor.get(c.id) || [];

      const total = Math.max(leadsDoCorretor.length, leadsAdmin.length);

      // Contagem por status (usar leads_indicacao)
      let simulacoes = 0, contatados = 0, negociacao = 0, propostas = 0, ganhos = 0, perdidos = 0;
      let valorFaturas = 0, economiaTotal = 0;

      for (const lead of leadsDoCorretor) {
        const adminStatus = statusToAdmin[lead.status] || lead.status;
        
        switch (adminStatus) {
          case 'novo': simulacoes++; break;
          case 'contatado': contatados++; break;
          case 'negociacao': negociacao++; break;
          case 'proposta_enviada': propostas++; break;
          case 'ganho': ganhos++; break;
          case 'perdido': perdidos++; break;
          default: simulacoes++; break;
        }

        valorFaturas += Number(lead.valor_atual) || 0;
        economiaTotal += Number(lead.economia_estimada) || 0;
      }

      // Se leads_indicacao vazio, usar insurance_leads
      if (leadsDoCorretor.length === 0) {
        for (const lead of leadsAdmin) {
          switch (lead.status) {
            case 'novo': simulacoes++; break;
            case 'contatado': contatados++; break;
            case 'negociacao': negociacao++; break;
            case 'proposta_enviada': propostas++; break;
            case 'ganho': ganhos++; break;
            case 'perdido': perdidos++; break;
            default: simulacoes++; break;
          }
          valorFaturas += Number(lead.valor_atual) || 0;
          economiaTotal += Number(lead.economia_estimada) || 0;
        }
      }

      totalIndicacoesGeral += total;
      totalGanhosGeral += ganhos;
      totalPerdidosGeral += perdidos;
      economiaGeral += economiaTotal;

      // Montar lista de leads indicados (priorizar insurance_leads que tem nome)
      // Criar mapa id leads_indicacao para obter clicou_no_contato
      const indicacaoById = new Map<string, any>();
      for (const li of leadsDoCorretor) {
        indicacaoById.set(li.id, li);
      }

      const leadsIndicados: LeadIndicado[] = [];

      // Primeiro: leads da insurance_leads (calculadora /economizar)
      for (const la of leadsAdmin) {
        leadsIndicados.push({
          id: la.id,
          nome: la.nome || null,
          whatsapp: la.whatsapp || null,
          operadora_atual: la.operadora_atual || null,
          status: la.status,
          valor_atual: Number(la.valor_atual) || null,
          economia_estimada: Number(la.economia_estimada) || null,
          created_at: la.created_at,
          clicou_no_contato: false,
          tipo: 'economizar',
        });
      }

      // Segundo: leads da leads_indicacao (form /indicar) que NÃO estão no insurance_leads
      const adminLeadIds = new Set(leadsAdmin.map((la: any) => la.id));
      for (const li of leadsDoCorretor) {
        if (adminLeadIds.has(li.id)) continue;
        const tipoIndicacao = li.afiliado_id ? 'form_indicar_afiliado' : 'form_indicar';
        leadsIndicados.push({
          id: li.id,
          nome: li.nome || null,
          whatsapp: li.telefone || null,
          operadora_atual: li.operadora_atual || null,
          status: statusToAdmin[li.status] || li.status,
          valor_atual: Number(li.valor_atual) || null,
          economia_estimada: Number(li.economia_estimada) || null,
          created_at: li.created_at,
          clicou_no_contato: li.clicou_no_contato || false,
          tipo: tipoIndicacao,
          afiliado_nome: li.afiliado_id ? afiliadoNomeById.get(li.afiliado_id) ?? null : null,
        });
      }

      // Ordenar por data (mais recente primeiro)
      leadsIndicados.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return {
        id: c.id,
        nome: c.nome,
        slug: c.slug,
        email: c.email,
        telefone: c.telefone,
        foto_url: c.foto_url,
        ativo: c.ativo,
        created_at: c.created_at,
        total_indicacoes: total,
        total_simulacoes: simulacoes,
        total_contatados: contatados,
        total_negociacao: negociacao,
        total_propostas: propostas,
        total_ganhos: ganhos,
        total_perdidos: perdidos,
        taxa_conversao: total > 0 ? Math.round((ganhos / total) * 100) : 0,
        valor_total_faturas: valorFaturas,
        economia_total: economiaTotal,
        leads: leadsIndicados,
      };
    });

    // Ordenar por total de indicações (desc)
    corretoresComMetricas.sort((a, b) => b.total_indicacoes - a.total_indicacoes);

    const corretoresAtivos = corretoresComMetricas.filter(c => c.ativo).length;

    // Contagens por tipo (visão admin): economizar = insurance_leads com corretor; form = leads_indicacao
    let totalEconomizar = 0;
    adminLeadsByCorretor.forEach((arr) => { totalEconomizar += arr.length; });
    const totalFormIndicar = (leadsIndicacao || []).filter((l: { afiliado_id?: string }) => !l.afiliado_id).length;
    const totalFormIndicarAfiliado = (leadsIndicacao || []).filter((l: { afiliado_id?: string }) => !!l.afiliado_id).length;
    const totalSejaCorretor = (solicitacoesCorretor || []).length;
    const { count: countSejaAfiliado } = await sb
      .from('insurance_leads')
      .select('*', { count: 'exact', head: true })
      .eq('origem', 'landing_seja_afiliado')
      .eq('arquivado', false);
    const totalSejaAfiliado = countSejaAfiliado ?? 0;

    return {
      success: true,
      data: {
        total_corretores_ativos: corretoresAtivos,
        total_indicacoes: totalIndicacoesGeral,
        total_ganhos: totalGanhosGeral,
        total_perdidos: totalPerdidosGeral,
        taxa_conversao_geral: totalIndicacoesGeral > 0 ? Math.round((totalGanhosGeral / totalIndicacoesGeral) * 100) : 0,
        valor_total_economia: economiaGeral,
        corretores: corretoresComMetricas,
        por_tipo: {
          economizar: totalEconomizar,
          form_indicar: totalFormIndicar,
          form_indicar_afiliado: totalFormIndicarAfiliado,
          seja_corretor: totalSejaCorretor,
          seja_afiliado: totalSejaAfiliado,
        },
      },
    };
  } catch (error: any) {
    logger.error('❌ Erro ao buscar indicações:', error);
    return { success: false, data: null, error: error?.message };
  }
}

// ============================================
// SERVER ACTION: Buscar mapa slug/id → nome do corretor
// ============================================

export async function getCorretoresMap(): Promise<Record<string, string>> {
  try {
    const sb = createServiceClient();
    const { data } = await sb.from('corretores').select('id, nome, slug');
    const map: Record<string, string> = {};
    for (const c of data || []) {
      if (c.slug) map[c.slug] = c.nome;
      if (c.id) map[c.id] = c.nome;
    }
    return map;
  } catch {
    return {};
  }
}
