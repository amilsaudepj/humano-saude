'use client';

import { useRouter } from 'next/navigation';
import { Users, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useCorretorId } from '../../hooks/useCorretorToken';
import { useCrmLeads } from '../hooks/useCrmLeads';
import { useCrmStats } from '../hooks/useCrmStats';
import CrmStatsCards from '../components/CrmStatsCards';
import CrmFilters from '../components/CrmFilters';
import LeadTable from '../components/LeadTable';
import { deleteCrmCard } from '@/app/actions/corretor-crm';
import type { CrmCardEnriched } from '@/lib/types/corretor';

export default function LeadsPage() {
  const router = useRouter();
  const corretorId = useCorretorId();
  const { stats, loading: statsLoading } = useCrmStats(corretorId);
  const {
    leads,
    total,
    page,
    totalPages,
    loading,
    filters,
    setSearch,
    setPage,
    setSort,
    setColumnFilter,
    updateFilter,
    refetch,
  } = useCrmLeads(corretorId);

  if (!corretorId) return null;

  const handleCardClick = (card: CrmCardEnriched) => {
    router.push(`/dashboard/corretor/crm/lead/${card.id}`);
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead do pipeline?')) return;
    const result = await deleteCrmCard(cardId, corretorId);
    if (result.success) {
      toast.success('Lead removido do pipeline');
      refetch();
    } else {
      toast.error(result.error ?? 'Erro ao excluir');
    }
  };

  const handlePrioridadeFilter = (value: string) => {
    updateFilter('prioridade', value || undefined);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-[#D4AF37]" />
            Meus <span className="text-[#D4AF37]">Leads</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Visão tabular completa de todos os leads do seu pipeline
          </p>
        </div>
        <a
          href="/dashboard/corretor/crm"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black text-sm font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          Ver Pipeline
        </a>
      </div>

      {/* KPIs */}
      <CrmStatsCards stats={stats} loading={statsLoading} />

      {/* Filtros */}
      <CrmFilters
        filters={filters}
        onSearch={setSearch}
        onColumnFilter={setColumnFilter}
        onPrioridadeFilter={handlePrioridadeFilter}
        onSort={setSort}
        counts={stats?.porColuna ? { ...stats.porColuna, todos: stats.totalLeads } : undefined}
      />

      {/* Tabela */}
      <LeadTable
        leads={leads}
        loading={loading}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onCardClick={handleCardClick}
        onDelete={handleDelete}
      />
    </div>
  );
}
