'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Award,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
  Mail,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  UserCheck,
  BarChart3,
  Calculator,
  UserPlus,
  Share2,
  LayoutGrid,
} from 'lucide-react';
import { getIndicacoesOverview } from '@/app/actions/indicacoes-admin';
import type { CorretorIndicacoes, IndicacoesOverview, LeadIndicado } from '@/app/actions/indicacoes-admin';
import {
  PageHeader,
  StatsCard,
  StatsGrid,
  PageLoading,
} from '../components';

// ============================================
// CONFIGURAÇÃO DE STATUS DO FUNIL
// ============================================

const FUNIL_STEPS = [
  { key: 'total_simulacoes', label: 'Simulações', color: 'bg-blue-500', textColor: 'text-blue-400', icon: ArrowUpRight },
  { key: 'total_contatados', label: 'Contatados', color: 'bg-yellow-500', textColor: 'text-yellow-400', icon: Phone },
  { key: 'total_negociacao', label: 'Negociação', color: 'bg-purple-500', textColor: 'text-purple-400', icon: MessageSquare },
  { key: 'total_propostas', label: 'Propostas', color: 'bg-orange-500', textColor: 'text-orange-400', icon: Mail },
  { key: 'total_ganhos', label: 'Ganhos', color: 'bg-green-500', textColor: 'text-green-400', icon: CheckCircle },
  { key: 'total_perdidos', label: 'Perdidos', color: 'bg-red-500', textColor: 'text-red-400', icon: XCircle },
] as const;

// Status labels / colors para os leads indicados
const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  novo: { label: 'Novo', color: 'bg-blue-500/20 text-blue-400' },
  contatado: { label: 'Contatado', color: 'bg-yellow-500/20 text-yellow-400' },
  negociacao: { label: 'Negociação', color: 'bg-purple-500/20 text-purple-400' },
  proposta_enviada: { label: 'Proposta', color: 'bg-orange-500/20 text-orange-400' },
  ganho: { label: 'Ganho', color: 'bg-green-500/20 text-green-400' },
  perdido: { label: 'Perdido', color: 'bg-red-500/20 text-red-400' },
  simulou: { label: 'Simulou', color: 'bg-blue-500/20 text-blue-400' },
  entrou_em_contato: { label: 'Contatou', color: 'bg-yellow-500/20 text-yellow-400' },
  em_analise: { label: 'Análise', color: 'bg-purple-500/20 text-purple-400' },
  fechado: { label: 'Fechado', color: 'bg-green-500/20 text-green-400' },
};
const LEAD_STATUS_FALLBACK = { label: 'Desconhecido', color: 'bg-gray-500/20 text-gray-400' };

const TIPO_INDICACAO_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  economizar: { label: 'Economizar', color: 'bg-emerald-500/20 text-emerald-400', icon: Calculator },
  form_indicar: { label: 'Form. indicar', color: 'bg-blue-500/20 text-blue-400', icon: Share2 },
  form_indicar_afiliado: { label: 'Via afiliado', color: 'bg-violet-500/20 text-violet-400', icon: UserPlus },
  seja_corretor: { label: 'Seja corretor', color: 'bg-amber-500/20 text-amber-400', icon: Award },
  seja_afiliado: { label: 'Seja afiliado', color: 'bg-cyan-500/20 text-cyan-400', icon: LayoutGrid },
};

// ============================================
// COMPONENTE: Barra de Funil
// ============================================

function FunnelBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-white/5">
      <div
        className={`h-2 rounded-full ${color} transition-all duration-500`}
        style={{ width: `${Math.max(pct, 2)}%` }}
      />
    </div>
  );
}

// ============================================
// COMPONENTE: Card do Corretor Expandível
// ============================================

function CorretorCard({ corretor }: { corretor: CorretorIndicacoes }) {
  const [expanded, setExpanded] = useState(false);

  const iniciais = corretor.nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0a0a0a] transition-colors hover:border-[#D4AF37]/20">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        {/* Avatar */}
        {corretor.foto_url ? (
          <img
            src={corretor.foto_url}
            alt={corretor.nome}
            className="h-12 w-12 rounded-full border-2 border-[#D4AF37]/30 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#D4AF37]/30 bg-[#D4AF37]/10 text-sm font-bold text-[#D4AF37]">
            {iniciais}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{corretor.nome}</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {corretor.email && <span>{corretor.email}</span>}
            {corretor.telefone && <span>{corretor.telefone}</span>}
          </div>
        </div>

        {/* Métricas resumo */}
        <div className="hidden items-center gap-4 sm:flex">
          <div className="text-center">
            <p className="text-lg font-bold text-[#D4AF37]">{corretor.total_indicacoes}</p>
            <p className="text-[10px] text-gray-500">Indicações</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-400">{corretor.total_ganhos}</p>
            <p className="text-[10px] text-gray-500">Ganhos</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{corretor.taxa_conversao}%</p>
            <p className="text-[10px] text-gray-500">Conversão</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-400">
              {corretor.economia_total > 0
                ? `R$ ${corretor.economia_total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                : '—'}
            </p>
            <p className="text-[10px] text-gray-500">Economia</p>
          </div>
        </div>

        {/* Expand/collapse */}
        <div className="text-gray-500">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* Expanded: Funil detalhado */}
      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3">
          {/* Mobile summary */}
          <div className="mb-4 flex items-center gap-4 sm:hidden">
            <div className="text-center">
              <p className="text-lg font-bold text-[#D4AF37]">{corretor.total_indicacoes}</p>
              <p className="text-[10px] text-gray-500">Indicações</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-400">{corretor.total_ganhos}</p>
              <p className="text-[10px] text-gray-500">Ganhos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{corretor.taxa_conversao}%</p>
              <p className="text-[10px] text-gray-500">Conversão</p>
            </div>
          </div>

          {/* Funil visual */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Funil de Conversão
            </h4>
            {FUNIL_STEPS.map((step) => {
              const value = (corretor as any)[step.key] as number;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className="flex w-28 items-center gap-2">
                    <step.icon className={`h-3.5 w-3.5 ${step.textColor}`} />
                    <span className="text-xs text-gray-400">{step.label}</span>
                  </div>
                  <div className="flex-1">
                    <FunnelBar
                      value={value}
                      max={corretor.total_indicacoes}
                      color={step.color}
                    />
                  </div>
                  <span className={`w-8 text-right text-sm font-semibold ${step.textColor}`}>
                    {value}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Extra metrics */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-white/[0.03] p-3 text-center">
              <p className="text-xs text-gray-500">Valor Total Faturas</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {corretor.valor_total_faturas > 0
                  ? `R$ ${corretor.valor_total_faturas.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                  : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-3 text-center">
              <p className="text-xs text-gray-500">Economia Gerada</p>
              <p className="mt-1 text-sm font-semibold text-emerald-400">
                {corretor.economia_total > 0
                  ? `R$ ${corretor.economia_total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                  : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-3 text-center">
              <p className="text-xs text-gray-500">Status</p>
              <p className={`mt-1 text-sm font-semibold ${corretor.ativo ? 'text-green-400' : 'text-red-400'}`}>
                {corretor.ativo ? 'Ativo' : 'Inativo'}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-3 text-center">
              <p className="text-xs text-gray-500">Cadastro</p>
              <p className="mt-1 text-sm font-semibold text-gray-300">
                {new Date(corretor.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Lista de Leads Indicados */}
          {corretor.leads && corretor.leads.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Leads Indicados ({corretor.leads.length})
              </h4>
              <div className="overflow-x-auto rounded-lg border border-white/5">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-gray-600">
                      <th className="px-3 py-2">Nome</th>
                      <th className="hidden px-3 py-2 sm:table-cell">Tipo</th>
                      <th className="hidden px-3 py-2 sm:table-cell">Operadora</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="hidden px-3 py-2 text-right md:table-cell">Valor</th>
                      <th className="hidden px-3 py-2 text-right md:table-cell">Economia</th>
                      <th className="px-3 py-2 text-right">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {corretor.leads.map((lead) => {
                      const st = LEAD_STATUS_CONFIG[lead.status] || LEAD_STATUS_FALLBACK;
                      const tipoConf = (lead as LeadIndicado & { tipo?: string }).tipo
                        ? TIPO_INDICACAO_CONFIG[(lead as LeadIndicado & { tipo?: string }).tipo!]
                        : null;
                      return (
                        <tr key={lead.id} className="transition-colors hover:bg-white/[0.02]">
                          <td className="px-3 py-2">
                            <div>
                              <p className="font-medium text-white">
                                {lead.nome || (
                                  <span className="italic text-gray-600">Anônimo</span>
                                )}
                              </p>
                              {lead.whatsapp && (
                                <a
                                  href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-green-500 hover:text-green-400"
                                >
                                  {lead.whatsapp}
                                </a>
                              )}
                              {(lead as LeadIndicado & { afiliado_nome?: string }).afiliado_nome && (
                                <p className="text-[10px] text-violet-400">via {(lead as LeadIndicado & { afiliado_nome?: string }).afiliado_nome}</p>
                              )}
                            </div>
                          </td>
                          <td className="hidden px-3 py-2 sm:table-cell">
                            {tipoConf ? (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tipoConf.color}`}>
                                {tipoConf.label}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-500">—</span>
                            )}
                          </td>
                          <td className="hidden px-3 py-2 text-gray-400 sm:table-cell">
                            {lead.operadora_atual || '—'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.color}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="hidden px-3 py-2 text-right text-gray-400 md:table-cell">
                            {lead.valor_atual
                              ? `R$ ${Number(lead.valor_atual).toLocaleString('pt-BR')}`
                              : '—'}
                          </td>
                          <td className="hidden px-3 py-2 text-right text-emerald-400 md:table-cell">
                            {lead.economia_estimada
                              ? `R$ ${Number(lead.economia_estimada).toLocaleString('pt-BR')}`
                              : '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-500">
                            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {corretor.leads && corretor.leads.length === 0 && (
            <div className="mt-4 rounded-lg border border-white/5 py-6 text-center text-xs text-gray-600">
              Nenhum lead indicado por este corretor ainda
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE: Tabela Resumo (Visão Rápida)
// ============================================

function CorretoresTable({ corretores }: { corretores: CorretorIndicacoes[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0a0a0a]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">Corretor</th>
            <th className="px-3 py-3 text-center">Indicações</th>
            <th className="hidden px-3 py-3 text-center md:table-cell">Simulações</th>
            <th className="hidden px-3 py-3 text-center md:table-cell">Contatados</th>
            <th className="hidden px-3 py-3 text-center lg:table-cell">Negociação</th>
            <th className="hidden px-3 py-3 text-center lg:table-cell">Propostas</th>
            <th className="px-3 py-3 text-center">Ganhos</th>
            <th className="px-3 py-3 text-center">Perdidos</th>
            <th className="px-3 py-3 text-center">Conversão</th>
            <th className="hidden px-3 py-3 text-right lg:table-cell">Economia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {corretores.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-xs font-bold text-[#D4AF37]">
                    {c.nome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{c.nome}</p>
                    {c.slug && <p className="truncate text-[10px] text-gray-600">{c.slug}</p>}
                  </div>
                </div>
              </td>
              <td className="px-3 py-3 text-center font-semibold text-[#D4AF37]">{c.total_indicacoes}</td>
              <td className="hidden px-3 py-3 text-center text-blue-400 md:table-cell">{c.total_simulacoes}</td>
              <td className="hidden px-3 py-3 text-center text-yellow-400 md:table-cell">{c.total_contatados}</td>
              <td className="hidden px-3 py-3 text-center text-purple-400 lg:table-cell">{c.total_negociacao}</td>
              <td className="hidden px-3 py-3 text-center text-orange-400 lg:table-cell">{c.total_propostas}</td>
              <td className="px-3 py-3 text-center font-semibold text-green-400">{c.total_ganhos}</td>
              <td className="px-3 py-3 text-center font-semibold text-red-400">{c.total_perdidos}</td>
              <td className="px-3 py-3 text-center">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  c.taxa_conversao >= 50
                    ? 'bg-green-500/20 text-green-400'
                    : c.taxa_conversao >= 20
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {c.taxa_conversao}%
                </span>
              </td>
              <td className="hidden px-3 py-3 text-right text-emerald-400 lg:table-cell">
                {c.economia_total > 0
                  ? `R$ ${c.economia_total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                  : '—'}
              </td>
            </tr>
          ))}
          {corretores.length === 0 && (
            <tr>
              <td colSpan={10} className="py-12 text-center text-gray-500">
                <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p>Nenhum corretor cadastrado</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

type ViewMode = 'cards' | 'table';

export default function IndicacoesPage() {
  const [data, setData] = useState<IndicacoesOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const result = await getIndicacoesOverview();
    if (result.success && result.data) {
      setData(result.data);
    }
    setLoading(false);
  }

  if (loading) return <PageLoading text="Carregando indicações..." />;
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Award className="mb-4 h-12 w-12 opacity-30" />
        <p>Erro ao carregar dados de indicações</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="INDICAÇÕES"
        description={`Gestão de indicações por corretor — ${data.total_corretores_ativos} corretores ativos`}
      />

      {/* Stats Gerais */}
      <StatsGrid cols={5}>
        <StatsCard
          label="Corretores Ativos"
          value={data.total_corretores_ativos}
        />
        <StatsCard
          label="Total Indicações"
          value={data.total_indicacoes}
        />
        <StatsCard
          label="Ganhos"
          value={data.total_ganhos}
        />
        <StatsCard
          label="Taxa Conversão"
          value={`${data.taxa_conversao_geral}%`}
        />
        <StatsCard
          label="Economia Total"
          value={
            data.valor_total_economia > 0
              ? `R$ ${data.valor_total_economia.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
              : 'R$ 0'
          }
        />
      </StatsGrid>

      {/* Por tipo de indicação */}
      {data.por_tipo && (
        <div className="rounded-xl border border-white/5 bg-[#0a0a0a] p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Por tipo de indicação
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {(['economizar', 'form_indicar', 'form_indicar_afiliado', 'seja_corretor', 'seja_afiliado'] as const).map((key) => {
              const conf = TIPO_INDICACAO_CONFIG[key];
              const count = data.por_tipo[key] ?? 0;
              const Icon = conf?.icon ?? LayoutGrid;
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-3"
                >
                  <div className={`rounded-lg p-2 ${conf?.color || 'bg-gray-500/20 text-gray-400'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{count}</p>
                    <p className="text-[10px] text-gray-500">{conf?.label ?? key}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-gray-600">
            Economizar = cliente pelo /economizar · Form. indicar = formulário /indicar · Via afiliado = indicação do afiliado · Seja corretor = solicitações · Seja afiliado = cadastros afiliado
          </p>
        </div>
      )}

      {/* Toggle de visualização */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Corretores ({data.corretores.length})
        </h2>
        <div className="flex gap-1 rounded-lg border border-white/10 p-0.5">
          <button
            onClick={() => setViewMode('cards')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'cards'
                ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <UserCheck className="mr-1.5 inline h-3.5 w-3.5" />
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <BarChart3 className="mr-1.5 inline h-3.5 w-3.5" />
            Tabela
          </button>
        </div>
      </div>

      {/* Lista de Corretores */}
      {viewMode === 'cards' ? (
        <div className="space-y-3">
          {data.corretores.map((corretor) => (
            <CorretorCard key={corretor.id} corretor={corretor} />
          ))}
          {data.corretores.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-[#0a0a0a] py-16 text-gray-500">
              <Users className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhum corretor cadastrado</p>
              <p className="mt-1 text-xs text-gray-600">
                Corretores aparecerão aqui quando fizerem indicações
              </p>
            </div>
          )}
        </div>
      ) : (
        <CorretoresTable corretores={data.corretores} />
      )}
    </div>
  );
}
