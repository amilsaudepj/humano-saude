'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Gift, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCorretorId } from '../../hooks/useCorretorToken';
import { getLeadsFromAffiliatesList } from '@/app/actions/corretor-crm';
import CrmFilters from '../components/CrmFilters';
import LeadTable from '../components/LeadTable';
import { deleteCrmCard } from '@/app/actions/corretor-crm';
import type { CrmCardEnriched, KanbanColumnSlug } from '@/lib/types/corretor';
import type { LeadListFilters } from '@/app/actions/corretor-crm';

export default function LeadsAfiliadosPage() {
  const router = useRouter();
  const corretorId = useCorretorId();
  const [leads, setLeads] = useState<CrmCardEnriched[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadListFilters>({
    colunaSlug: 'todos',
    orderBy: 'updated_at',
    orderDir: 'desc',
    page: 1,
    perPage: 20,
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLeads = useCallback(
    async (overrides?: Partial<LeadListFilters>) => {
      if (!corretorId) return;
      setLoading(true);
      const merged = { ...filters, ...overrides };
      const res = await getLeadsFromAffiliatesList(corretorId, merged);
      if (res.success && res.data) {
        setLeads(res.data.leads);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        setPage(res.data.page);
      } else {
        toast.error(res.error ?? 'Erro ao carregar leads');
      }
      setLoading(false);
    },
    [corretorId, filters],
  );

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const setSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 400);
  }, []);

  const handlePrioridadeFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, prioridade: value || undefined, page: 1 }));
  }, []);

  const handleCardClick = useCallback(
    (card: CrmCardEnriched) => {
      router.push(`/dashboard/corretor/crm/lead/${card.id}`);
    },
    [router],
  );

  const handleDelete = useCallback(
    async (cardId: string) => {
      if (!corretorId) return;
      if (!confirm('Tem certeza que deseja excluir este lead do pipeline?')) return;
      const result = await deleteCrmCard(cardId, corretorId);
      if (result.success) {
        toast.success('Lead removido do pipeline');
        fetchLeads();
      } else {
        toast.error(result.error ?? 'Erro ao excluir');
      }
    },
    [corretorId, fetchLeads],
  );

  if (!corretorId) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gift className="h-6 w-6 text-[#D4AF37]" />
            Leads dos <span className="text-[#D4AF37]">Afiliados</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Leads indicados pelos seus afiliados — clique para abrir o card completo
          </p>
        </div>
        <a
          href="/dashboard/corretor/crm/leads"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-all"
        >
          <Users className="h-4 w-4" />
          Todos os leads
        </a>
      </div>

      <CrmFilters
        filters={filters}
        onSearch={setSearch}
        onColumnFilter={(slug) => setFilters((prev) => ({ ...prev, colunaSlug: slug as KanbanColumnSlug | 'todos', page: 1 }))}
        onPrioridadeFilter={handlePrioridadeFilter}
        onSort={(orderBy, orderDir) => setFilters((prev) => ({ ...prev, orderBy, orderDir, page: 1 }))}
        counts={{ todos: total }}
      />

      <LeadTable
        leads={leads}
        loading={loading}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => {
          setPage(p);
          setFilters((prev) => ({ ...prev, page: p }));
        }}
        onCardClick={handleCardClick}
        onDelete={handleDelete}
      />
    </div>
  );
}
