'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Sparkles, AlertTriangle, Clock, Flag,
  Search, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCorretorId } from '../../hooks/useCorretorToken';
import { getLeadsList } from '@/app/actions/corretor-crm';
import type { CrmCardEnriched, KanbanColumnSlug } from '@/lib/types/corretor';

// ========================================
// HELPERS
// ========================================

function fmt(value: number | null | undefined): string {
  if (value == null) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  urgente: { label: 'Urgente', color: 'text-red-400', bg: 'bg-red-500/10' },
  alta: { label: 'Alta', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  media: { label: 'Média', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  baixa: { label: 'Baixa', color: 'text-green-400', bg: 'bg-green-500/10' },
};

const columnLabels: Record<string, { label: string; color: string }> = {
  novo_lead: { label: 'Novo Lead', color: 'text-blue-400' },
  qualificado: { label: 'Qualificado', color: 'text-purple-400' },
  proposta_enviada: { label: 'Proposta Enviada', color: 'text-yellow-400' },
  documentacao: { label: 'Documentação', color: 'text-cyan-400' },
  fechado: { label: 'Fechado', color: 'text-green-400' },
  perdido: { label: 'Perdido', color: 'text-red-400' },
};

// ========================================
// DEALS LIST PAGE (usa crm_cards existentes)
// ========================================

export default function CorretorDealsPage() {
  const router = useRouter();
  const corretorId = useCorretorId();
  const [deals, setDeals] = useState<CrmCardEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  const fetchDeals = useCallback(async () => {
    if (!corretorId) return;
    setLoading(true);
    const res = await getLeadsList(corretorId, {
      search: search || undefined,
      colunaSlug: (filterStatus || undefined) as KanbanColumnSlug | 'todos' | undefined,
      prioridade: filterPrioridade || undefined,
      page,
      perPage,
    });
    if (res.success && res.data) {
      setDeals(res.data.leads);
      setTotal(res.data.total);
    }
    setLoading(false);
  }, [corretorId, search, filterStatus, filterPrioridade, page, perPage]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const totalPages = Math.ceil(total / perPage);

  if (!corretorId) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-[#D4AF37]" />
            Minhas <span className="text-[#D4AF37]">Oportunidades</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Visão em lista de todos os seus negócios no pipeline
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nome..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/50 transition-colors"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/70 outline-none"
        >
          <option value="" className="bg-[#0A0A0A]">Todas etapas</option>
          {Object.entries(columnLabels).map(([k, v]) => (
            <option key={k} value={k} className="bg-[#0A0A0A]">{v.label}</option>
          ))}
        </select>

        <select
          value={filterPrioridade}
          onChange={(e) => { setFilterPrioridade(e.target.value); setPage(1); }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/70 outline-none"
        >
          <option value="" className="bg-[#0A0A0A]">Todas prioridades</option>
          {Object.entries(priorityConfig).map(([k, v]) => (
            <option key={k} value={k} className="bg-[#0A0A0A]">{v.label}</option>
          ))}
        </select>

        <span className="text-xs text-white/30">
          {total} oportunidade{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <Briefcase className="h-12 w-12 text-white/10 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white/60">Nenhuma oportunidade encontrada</h3>
          <p className="text-sm text-white/30 mt-1">
            Crie leads no <span className="text-[#D4AF37]">CRM</span> para vê-los aqui
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-xs font-medium text-white/40">
            <div className="col-span-4">Oportunidade</div>
            <div className="col-span-2">Etapa</div>
            <div className="col-span-2 hidden md:block">Valor</div>
            <div className="col-span-2 hidden md:block">Prioridade</div>
            <div className="col-span-2">Atualizado</div>
          </div>

          {/* Rows */}
          {deals.map((deal) => {
            const colCfg = columnLabels[deal.coluna_slug] ?? { label: deal.coluna_slug, color: 'text-white/50' };
            const priCfg = priorityConfig[deal.prioridade] ?? { label: deal.prioridade, color: 'text-white/50', bg: 'bg-white/5' };

            return (
              <div
                key={deal.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/dashboard/corretor/crm/lead/${deal.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/dashboard/corretor/crm/lead/${deal.id}`)}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                {/* Name + badges */}
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{deal.titulo}</p>
                      {deal.is_hot && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black flex-shrink-0">
                          <Sparkles className="h-2 w-2" /> HOT
                        </span>
                      )}
                    </div>
                    {deal.lead && (
                      <p className="text-[11px] text-white/30 truncate">
                        {deal.lead.whatsapp}
                        {deal.lead.operadora_atual && ` · ${deal.lead.operadora_atual}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stage */}
                <div className="col-span-2 flex items-center">
                  <span className={cn('text-xs font-medium', colCfg.color)}>{colCfg.label}</span>
                </div>

                {/* Value */}
                <div className="col-span-2 items-center hidden md:flex">
                  <span className="text-sm text-[#D4AF37] font-semibold">
                    {fmt(deal.valor_estimado ?? deal.lead?.valor_atual)}
                  </span>
                </div>

                {/* Priority */}
                <div className="col-span-2 items-center hidden md:flex">
                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium', priCfg.color, priCfg.bg)}>
                    <Flag className="h-2.5 w-2.5" />
                    {priCfg.label}
                  </span>
                </div>

                {/* Updated */}
                <div className="col-span-2 flex items-center gap-1.5 text-white/30">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">
                    {deal.hours_since_update < 1
                      ? 'agora'
                      : deal.hours_since_update < 24
                        ? `${Math.round(deal.hours_since_update)}h atrás`
                        : `${Math.floor(deal.hours_since_update / 24)}d atrás`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-white/30">
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
