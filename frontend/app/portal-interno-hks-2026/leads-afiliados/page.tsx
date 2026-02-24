'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Search, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { getLeadsFromAffiliatesList } from '@/app/actions/corretor-crm';
import type { CrmCardEnriched } from '@/lib/types/corretor';
import { PageHeader } from '../components';

const COLUMN_LABELS: Record<string, string> = {
  novo_lead: 'Novo Lead',
  qualificado: 'Qualificado',
  proposta_enviada: 'Proposta Enviada',
  documentacao: 'Documentação',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

function fmt(value: number | null | undefined): string {
  if (value == null) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function LeadsAfiliadosAdminPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<CrmCardEnriched[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchDebounce = useRef<NodeJS.Timeout | null>(null);
  const perPage = 20;

  const fetchLeads = useCallback(
    async (pageNum: number, searchVal: string) => {
      setLoading(true);
      const res = await getLeadsFromAffiliatesList(null, {
        search: searchVal.trim() || undefined,
        page: pageNum,
        perPage,
        orderBy: 'updated_at',
        orderDir: 'desc',
      });
      if (res.success && res.data) {
        setLeads(res.data.leads);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        setPage(res.data.page);
      }
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    const delay = search ? 400 : 0;
    searchDebounce.current = setTimeout(() => {
      fetchLeads(search ? 1 : page, search);
    }, delay);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [page, search, fetchLeads]);

  const handleRowClick = useCallback(
    (card: CrmCardEnriched) => {
      router.push(`/portal-interno-hks-2026/leads/card/${card.id}`);
    },
    [router],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="LEADS DOS AFILIADOS"
        description={`Leads indicados por afiliados de todos os corretores — ${total} registro(s). Clique na linha para abrir o card do lead.`}
        actionLabel="Ver todos os leads"
        onAction={() => router.push('/portal-interno-hks-2026/leads')}
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome do lead..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-white/25 outline-none focus:border-[#D4AF37]/50 transition-colors"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/40">Carregando...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <Gift className="h-12 w-12 text-[#D4AF37]/40 mx-auto mb-4" />
            <p className="text-white/60">Nenhum lead vindo de afiliados no momento.</p>
            <a
              href="/portal-interno-hks-2026/leads"
              className="inline-block mt-4 text-[#D4AF37] hover:underline text-sm"
            >
              Ver todos os leads
            </a>
          </div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-xs font-semibold text-white/40 uppercase tracking-wider">
              <div className="col-span-3">Lead</div>
              <div className="col-span-2">Corretor</div>
              <div className="col-span-2">Etapa</div>
              <div className="col-span-2">Valor</div>
              <div className="col-span-2">Atualizado</div>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {leads.map((card) => {
                const corretorNome = (card as CrmCardEnriched & { corretor?: { nome?: string } | null }).corretor?.nome ?? '—';
                const colLabel = COLUMN_LABELS[card.coluna_slug] ?? card.coluna_slug;
                return (
                  <div
                    key={card.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRowClick(card)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRowClick(card)}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 cursor-pointer transition-all hover:bg-white/[0.03]"
                  >
                    <div className="col-span-3 flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                        <Gift className="h-4 w-4 text-[#D4AF37]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{card.titulo}</p>
                        {card.lead?.whatsapp && (
                          <p className="text-[10px] text-white/40 truncate">{card.lead.whatsapp}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center text-sm text-white/70">{corretorNome}</div>
                    <div className="col-span-2 flex items-center">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-white/10 text-white/80">
                        {colLabel}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center text-sm text-[#D4AF37] font-medium">
                      {fmt(card.valor_estimado ?? card.lead?.valor_atual)}
                    </div>
                    <div className="col-span-2 flex items-center gap-1 text-white/40 text-xs">
                      <Clock className="h-3 w-3" />
                      {card.hours_since_update < 1
                        ? 'agora'
                        : card.hours_since_update < 24
                          ? `${card.hours_since_update}h`
                          : `${Math.floor(card.hours_since_update / 24)}d`}
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
                <span className="text-xs text-white/40">
                  Página {page} de {totalPages} · {total} lead(s)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-8 w-8 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
