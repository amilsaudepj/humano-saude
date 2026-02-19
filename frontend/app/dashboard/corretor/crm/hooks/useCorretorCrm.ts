'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type {
  AdminKanbanBoard, CrmDealEnriched, CrmDealMetrics,
  CrmContactEnriched, CrmCompanyEnriched,
  CrmActivityEnriched, CrmDealFilters, CrmContactFilters, CrmCompanyFilters,
  CrmPaginatedResult, CrmPipeline, CrmStageWithMetrics,
} from '@/lib/types/crm';
import type { CrmActivityInsert } from '@/lib/types/crm';
import {
  getPipelines, getAdminKanbanBoard, moveDeal,
  getCrmDealMetrics, getStagesWithMetrics,
  getDealsList, getContactsList, getCompaniesList,
  getActivities, createActivity,
  getDealDetail,
} from '@/app/actions/crm';

// ========================================
// useCorretorDeals — Deals do corretor logado
// ========================================

export function useCorretorDeals(corretorId: string | null, initialFilters: CrmDealFilters = {}) {
  const [result, setResult] = useState<CrmPaginatedResult<CrmDealEnriched> | null>(null);
  const [filters, setFilters] = useState<CrmDealFilters>({
    orderBy: 'updated_at', orderDir: 'desc', page: 1, perPage: 20,
    ...initialFilters,
  });
  const [loading, setLoading] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDeals = useCallback(async (overrides?: Partial<CrmDealFilters>) => {
    if (!corretorId) return;
    setLoading(true);
    const merged = { ...filters, ...overrides, owner_corretor_id: corretorId };
    const res = await getDealsList(merged);
    if (res.success && res.data) setResult(res.data);
    else toast.error(res.error ?? 'Erro ao carregar oportunidades');
    setLoading(false);
  }, [corretorId, filters]);

  useEffect(() => { if (corretorId) fetchDeals(); }, [corretorId, fetchDeals]);

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
// useCorretorContacts — Contatos do corretor logado
// ========================================

export function useCorretorContacts(corretorId: string | null, initialFilters: CrmContactFilters = {}) {
  const [result, setResult] = useState<CrmPaginatedResult<CrmContactEnriched> | null>(null);
  const [filters, setFilters] = useState<CrmContactFilters>({
    orderBy: 'updated_at', orderDir: 'desc', page: 1, perPage: 20,
    ...initialFilters,
  });
  const [loading, setLoading] = useState(true);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!corretorId) return;
    setLoading(true);
    const res = await getContactsList({ ...filters, owner_corretor_id: corretorId });
    if (res.success && res.data) setResult(res.data);
    setLoading(false);
  }, [corretorId, filters]);

  useEffect(() => { if (corretorId) fetchContacts(); }, [corretorId, fetchContacts]);

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
// useCorretorCompanies — Empresas do corretor logado
// ========================================

export function useCorretorCompanies(corretorId: string | null, initialFilters: CrmCompanyFilters = {}) {
  const [result, setResult] = useState<CrmPaginatedResult<CrmCompanyEnriched> | null>(null);
  const [filters, setFilters] = useState<CrmCompanyFilters>({
    orderBy: 'updated_at', orderDir: 'desc', page: 1, perPage: 20,
    ...initialFilters,
  });
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    if (!corretorId) return;
    setLoading(true);
    const res = await getCompaniesList({ ...filters, owner_corretor_id: corretorId });
    if (res.success && res.data) setResult(res.data);
    setLoading(false);
  }, [corretorId, filters]);

  useEffect(() => { if (corretorId) fetchCompanies(); }, [corretorId, fetchCompanies]);

  const updateFilter = useCallback((key: keyof CrmCompanyFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  }, []);

  return { result, filters, loading, updateFilter, refetch: fetchCompanies };
}

// ========================================
// useCorretorKanban — Pipeline Kanban do corretor (novo crm_deals)
// ========================================

export function useCorretorKanban(corretorId: string | null) {
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string>('');
  const [board, setBoard] = useState<AdminKanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPipelines().then((res) => {
      if (res.success && res.data) {
        setPipelines(res.data);
        const def = res.data.find((p) => p.is_default) ?? res.data[0];
        if (def) setActivePipelineId(def.id);
      }
    });
  }, []);

  const fetchBoard = useCallback(async () => {
    if (!activePipelineId) return;
    setLoading(true);
    const res = await getAdminKanbanBoard(activePipelineId);
    if (res.success && res.data) {
      // Filter deals to only show this corretor's deals
      if (corretorId) {
        const filtered = { ...res.data, dealsByStage: { ...res.data.dealsByStage } };
        for (const stageId of Object.keys(filtered.dealsByStage)) {
          filtered.dealsByStage[stageId] = filtered.dealsByStage[stageId].filter(
            (d) => d.owner_corretor_id === corretorId,
          );
        }
        setBoard(filtered);
      } else {
        setBoard(res.data);
      }
    }
    setLoading(false);
  }, [activePipelineId, corretorId]);

  useEffect(() => { if (activePipelineId) fetchBoard(); }, [activePipelineId, fetchBoard]);

  const handleMoveDeal = useCallback(async (
    dealId: string,
    sourceStageId: string,
    destStageId: string,
    newPosition: number,
  ) => {
    if (!board || !corretorId) return;

    // Optimistic update
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
      toast.error('Erro ao mover deal');
      await fetchBoard();
    } else if (res.data?.is_won) {
      toast.success('🏆 Deal fechado como ganho!');
    }
  }, [board, corretorId, fetchBoard]);

  return { pipelines, activePipelineId, setActivePipelineId, board, loading, handleMoveDeal, fetchBoard };
}

// ========================================
// useCorretorDealDrawer — Detail drawer do deal
// ========================================

export function useCorretorDealDrawer(dealId: string | null) {
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

// ========================================
// useCorretorCrmMetrics — Métricas do corretor
// ========================================

export function useCorretorCrmMetrics() {
  const [metrics, setMetrics] = useState<CrmDealMetrics | null>(null);
  const [stageMetrics, setStageMetrics] = useState<CrmStageWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (pipelineId?: string) => {
    setLoading(true);
    const mRes = await getCrmDealMetrics();
    if (mRes.success && mRes.data) setMetrics(mRes.data);
    if (pipelineId) {
      const sRes = await getStagesWithMetrics(pipelineId);
      if (sRes.success && sRes.data) setStageMetrics(sRes.data);
    }
    setLoading(false);
  }, []);

  return { metrics, stageMetrics, loading, refetch: fetch };
}
