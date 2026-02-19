'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LayoutGrid, List, BarChart3, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '../components';
import { AdminKanbanBoard, CrmMetricsDashboard, DealsTable } from './components';
import { useAdminKanban, useDealsList } from './hooks/useCrm';
import { createDeal, getCorretoresList } from '@/app/actions/crm';
import { toast } from 'sonner';
import type { CrmDealInsert, CrmDealEnriched, CrmDealFilters } from '@/lib/types/crm';

// ========================================
// VIEW SWITCHER
// ========================================

type CrmView = 'kanban' | 'list' | 'analytics';

function ViewSwitcher({ view, onChange }: { view: CrmView; onChange: (v: CrmView) => void }) {
  const views: { key: CrmView; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { key: 'kanban', icon: LayoutGrid, label: 'Kanban' },
    { key: 'list', icon: List, label: 'Lista' },
    { key: 'analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="flex items-center rounded-xl bg-white/5 p-1">
      {views.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            view === key
              ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ========================================
// CRM PAGE
// ========================================

export default function CrmPage() {
  const router = useRouter();
  const [view, setView] = useState<CrmView>('kanban');
  const [corretores, setCorretores] = useState<Array<{ id: string; nome: string; foto_url: string | null }>>([]);

  // Kanban state
  const kanban = useAdminKanban();

  // Fetch corretores para o filtro
  useEffect(() => {
    (async () => {
      const res = await getCorretoresList();
      if (res.success && res.data) setCorretores(res.data);
    })();
  }, []);

  // Navigate to deal page
  const handleDealClick = useCallback((deal: CrmDealEnriched) => {
    router.push(`/portal-interno-hks-2026/crm/deal/${deal.id}`);
  }, [router]);

  // Deal list state (for list view)
  const dealsList = useDealsList();

  // New deal handler
  const handleNewDeal = useCallback(async () => {
    if (!kanban.pipelines.length || !kanban.board) return;

    const firstStage = kanban.board.stages[0];
    if (!firstStage) {
      toast.error('Nenhuma etapa encontrada no pipeline');
      return;
    }

    const input: CrmDealInsert = {
      pipeline_id: kanban.board.pipeline.id,
      stage_id: firstStage.id,
      contact_id: null,
      company_id: null,
      owner_corretor_id: null,
      crm_card_id: null,
      lead_id: null,
      titulo: 'Nova Oportunidade',
      valor: null,
      valor_recorrente: null,
      moeda: 'BRL',
      data_previsao_fechamento: null,
      data_ganho: null,
      data_perda: null,
      probabilidade: firstStage.probabilidade ?? null,
      posicao: 0,
      motivo_perda: null,
      motivo_perda_detalhe: null,
      score: 0,
      prioridade: 'media',
      is_hot: false,
      is_stale: false,
      dias_no_stage: 0,
      tags: [],
      custom_fields: {},
      metadata: {},
    };

    const res = await createDeal(input);
    if (res.success) {
      toast.success('Oportunidade criada!');
      kanban.fetchBoard();
    } else {
      toast.error(res.error ?? 'Erro ao criar oportunidade');
    }
  }, [kanban]);

  // Partial filter updater for DealsTable compatibility
  const handleFilterChange = useCallback((partial: Partial<CrmDealFilters>) => {
    for (const [key, value] of Object.entries(partial)) {
      dealsList.updateFilter(key as keyof CrmDealFilters, value);
    }
  }, [dealsList]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Pipeline de negócios e gestão de oportunidades"
        actionLabel="Nova Oportunidade"
        onAction={handleNewDeal}
      >
        <ViewSwitcher view={view} onChange={setView} />
      </PageHeader>

      {/* Corretor Filter (Admin) */}
      {view === 'kanban' && corretores.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Users className="h-3.5 w-3.5" />
            Filtrar por Corretor:
          </div>
          <button
            onClick={() => kanban.setCorretorFilter(null)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              !kanban.corretorFilter
                ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
                : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20',
            )}
          >
            Todos
          </button>
          {corretores.map((c) => (
            <button
              key={c.id}
              onClick={() => kanban.setCorretorFilter(kanban.corretorFilter === c.id ? null : c.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                kanban.corretorFilter === c.id
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
                  : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20',
              )}
            >
              {c.foto_url ? (
                <img src={c.foto_url} alt="" className="h-4 w-4 rounded-full" />
              ) : (
                <div className="h-4 w-4 rounded-full bg-white/10 flex items-center justify-center text-[8px]">
                  {c.nome.charAt(0)}
                </div>
              )}
              {c.nome.split(' ')[0]}
            </button>
          ))}
          {kanban.corretorFilter && (
            <button
              onClick={() => kanban.setCorretorFilter(null)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-[10px] hover:bg-red-500/20 transition-colors"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <AdminKanbanBoard
          board={kanban.board}
          pipelines={kanban.pipelines}
          activePipelineId={kanban.activePipelineId}
          loading={kanban.loading}
          onPipelineChange={kanban.setActivePipelineId}
          onMoveDeal={kanban.handleMoveDeal}
          onDealClick={handleDealClick}
          onAddDeal={() => handleNewDeal()}
          corretorId=""
        />
      )}

      {/* List View */}
      {view === 'list' && dealsList.result && (
        <DealsTable
          deals={dealsList.result.data}
          loading={dealsList.loading}
          total={dealsList.result.total}
          page={dealsList.result.page}
          perPage={dealsList.result.perPage}
          filters={dealsList.filters}
          onFilterChange={handleFilterChange}
          onPageChange={(p) => dealsList.updateFilter('page', p)}
          onRowClick={(d) => handleDealClick(d)}
        />
      )}

      {/* Analytics View */}
      {view === 'analytics' && (
        <CrmMetricsDashboard pipelineId={kanban.activePipelineId || undefined} />
      )}
    </div>
  );
}
