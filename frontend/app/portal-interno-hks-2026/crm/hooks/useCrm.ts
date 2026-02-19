'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type {
  AdminKanbanBoard, CrmDealEnriched, CrmStageWithMetrics,
  CrmDealMetrics, CrmCorretorPerformance,
  CrmContactEnriched, CrmCompanyEnriched,
  CrmActivityEnriched, CrmDealFilters, CrmContactFilters, CrmCompanyFilters,
  CrmPaginatedResult, CrmPipeline,
} from '@/lib/types/crm';
import {
  getPipelines, getAdminKanbanBoard, moveDeal,
  getCrmDealMetrics, getCorretoresPerformance,
  getDealsList, getContactsList, getCompaniesList,
  getActivities, createActivity,
  getDealDetail,
} from '@/app/actions/crm';
import type { CrmActivityInsert } from '@/lib/types/crm';

// ========================================
// useAdminKanban — Pipeline Kanban para Admin
// ========================================

export function useAdminKanban(initialPipelineId?: string) {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string>(initialPipelineId ?? '');
  const [corretorFilter, setCorretorFilter] = useState<string | null>(null);
  const [board, setBoard] = useState<AdminKanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<CrmDealEnriched | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Carregar pipelines
  useEffect(() => {
    (async () => {
      const res = await getPipelines();
      if (res.success && res.data) {
        setPipelines(res.data);
        if (!initialPipelineId && res.data.length > 0) {
          const defaultPipeline = res.data.find((p) => p.is_default) ?? res.data[0];
          setActivePipelineId(defaultPipeline.id);
        }
      }
    })();
  }, [initialPipelineId]);

  // Carregar board quando pipeline ou filtro de corretor muda
  const fetchBoard = useCallback(async () => {
    if (!activePipelineId) return;
    setLoading(true);
    const res = await getAdminKanbanBoard(activePipelineId, corretorFilter);
    if (res.success && res.data) {
      setBoard(res.data);
    } else {
      toast.error(res.error ?? 'Erro ao carregar pipeline');
    }
    setLoading(false);
  }, [activePipelineId, corretorFilter]);

  useEffect(() => {
    if (activePipelineId) fetchBoard();
  }, [activePipelineId, corretorFilter, fetchBoard]);

  // Move deal com optimistic update
  const handleMoveDeal = useCallback(async (
    dealId: string,
    sourceStageId: string,
    destStageId: string,
    newPosition: number,
    corretorId: string,
  ) => {
    if (!board) return;

    // Optimistic
    setBoard((prev) => {
      if (!prev) return prev;
      const next = { ...prev, dealsByStage: { ...prev.dealsByStage } };
      const sourceDeals = [...(next.dealsByStage[sourceStageId] ?? [])];
      const idx = sourceDeals.findIndex((d) => d.id === dealId);
      if (idx === -1) return prev;

      const [moved] = sourceDeals.splice(idx, 1);
      moved.stage_id = destStageId;
      next.dealsByStage[sourceStageId] = sourceDeals;

      const destDeals = [...(next.dealsByStage[destStageId] ?? [])];
      destDeals.splice(newPosition, 0, moved);
      next.dealsByStage[destStageId] = destDeals;

      return next;
    });

    const res = await moveDeal(dealId, destStageId, newPosition, corretorId);
    if (!res.success) {
      toast.error('Erro ao mover deal. Recarregando...');
      await fetchBoard();
    } else if (res.data?.is_won) {
      toast.success('🏆 Deal fechado como ganho!');
    } else if (res.data?.is_lost) {
      toast.info('Deal marcado como perdido');
    }
  }, [board, fetchBoard]);

  const openDrawer = useCallback((deal: CrmDealEnriched) => {
    setSelectedDeal(deal);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedDeal(null);
  }, []);

  return {
    pipelines,
    activePipelineId,
    setActivePipelineId,
    corretorFilter,
    setCorretorFilter,
    board,
    loading,
    selectedDeal,
    drawerOpen,
    handleMoveDeal,
    openDrawer,
    closeDrawer,
    fetchBoard,
  };
}

// ========================================
// useCrmMetrics — Métricas do CRM Admin
// ========================================

export function useCrmMetrics() {
  const [metrics, setMetrics] = useState<CrmDealMetrics | null>(null);
  const [performance, setPerformance] = useState<CrmCorretorPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [mRes, pRes] = await Promise.all([
      getCrmDealMetrics(),
      getCorretoresPerformance(),
    ]);
    if (mRes.success && mRes.data) setMetrics(mRes.data);
    if (pRes.success && pRes.data) setPerformance(pRes.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { metrics, performance, loading, refetch: fetch };
}

// ========================================
// useDealsList — Lista de deals com filtros
// ========================================

export function useDealsList(initialFilters: CrmDealFilters = {}) {
  const [result, setResult] = useState<CrmPaginatedResult<CrmDealEnriched> | null>(null);
  const [filters, setFilters] = useState<CrmDealFilters>({
    orderBy: 'updated_at', orderDir: 'desc', page: 1, perPage: 20,
    ...initialFilters,
  });
  const [loading, setLoading] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDeals = useCallback(async (overrides?: Partial<CrmDealFilters>) => {
    setLoading(true);
    const merged = { ...filters, ...overrides };
    const res = await getDealsList(merged);
    if (res.success && res.data) setResult(res.data);
    else toast.error(res.error ?? 'Erro ao carregar oportunidades');
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const updateFilter = useCallback((key: keyof CrmDealFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  }, []);

  const setSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 400);
  }, []);

  return { result, filters, loading, updateFilter, setSearch, refetch: fetchDeals };
}

// ========================================
// useContactsList — Lista de contatos
// ========================================

export function useContactsList(initialFilters: CrmContactFilters = {}) {
  const [result, setResult] = useState<CrmPaginatedResult<CrmContactEnriched> | null>(null);
  const [filters, setFilters] = useState<CrmContactFilters>({
    orderBy: 'updated_at', orderDir: 'desc', page: 1, perPage: 20,
    ...initialFilters,
  });
  const [loading, setLoading] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const res = await getContactsList(filters);
    if (res.success && res.data) setResult(res.data);
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const updateFilter = useCallback((key: keyof CrmContactFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  }, []);

  const setSearch = useCallback((value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value, page: 1 }));
    }, 400);
  }, []);

  return { result, filters, loading, updateFilter, setSearch, refetch: fetchContacts };
}

// ========================================
// useCompaniesList — Lista de empresas
// ========================================

export function useCompaniesList(initialFilters: CrmCompanyFilters = {}) {
  const [result, setResult] = useState<CrmPaginatedResult<CrmCompanyEnriched> | null>(null);
  const [filters, setFilters] = useState<CrmCompanyFilters>({
    orderBy: 'updated_at', orderDir: 'desc', page: 1, perPage: 20,
    ...initialFilters,
  });
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const res = await getCompaniesList(filters);
    if (res.success && res.data) setResult(res.data);
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const updateFilter = useCallback((key: keyof CrmCompanyFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  }, []);

  return { result, filters, loading, updateFilter, refetch: fetchCompanies };
}

// ========================================
// useDealDrawer — Deal detail + activities
// ========================================

export function useDealDrawer(dealId: string | null) {
  const [deal, setDeal] = useState<CrmDealEnriched | null>(null);
  const [activities, setActivities] = useState<CrmActivityEnriched[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    const [dRes, aRes] = await Promise.all([
      getDealDetail(dealId),
      getActivities({ deal_id: dealId }),
    ]);
    if (dRes.success && dRes.data) setDeal(dRes.data);
    if (aRes.success && aRes.data) setActivities(aRes.data);
    setLoading(false);
  }, [dealId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addActivity = useCallback(async (input: CrmActivityInsert) => {
    const res = await createActivity(input);
    if (res.success) {
      toast.success('Atividade registrada');
      await fetchData();
    } else {
      toast.error(res.error ?? 'Erro ao registrar atividade');
    }
    return res.success;
  }, [fetchData]);

  return { deal, activities, loading, addActivity, refetch: fetchData };
}
