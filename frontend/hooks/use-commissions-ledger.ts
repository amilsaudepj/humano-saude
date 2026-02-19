'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  getCommissionsSummary,
  getCommissionsLedger,
  markAsPaid,
  generatePaymentCSV,
  getBrokersForFilter,
  getOperatorsForFilter,
} from '@/app/actions/commissions-ledger';
import type {
  CommissionLedgerFilters,
  CommissionLedgerExpanded,
  CommissionsSummary,
} from '@/lib/types/commissions';
import { toast } from 'sonner';

type BrokerOption = { id: string; nome_completo: string };
type OperatorOption = { id: string; nome: string };

export function useCommissionsLedger() {
  const [entries, setEntries] = useState<CommissionLedgerExpanded[]>([]);
  const [summary, setSummary] = useState<CommissionsSummary | null>(null);
  const [brokers, setBrokers] = useState<BrokerOption[]>([]);
  const [operators, setOperators] = useState<OperatorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CommissionLedgerFilters>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Mês corrente como default
  const currentMonth = new Date().toISOString().slice(0, 7);

  const loadData = useCallback(async (currentFilters?: CommissionLedgerFilters) => {
    setLoading(true);
    try {
      const activeFilters = currentFilters || filters;
      const month = activeFilters.reference_month || currentMonth;

      const [summaryRes, ledgerRes] = await Promise.all([
        getCommissionsSummary(month),
        getCommissionsLedger(activeFilters),
      ]);

      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      if (ledgerRes.success) setEntries(ledgerRes.data);
    } catch {
      toast.error('Erro ao carregar dados de comissões');
    } finally {
      setLoading(false);
    }
  }, [filters, currentMonth]);

  // Carrega filtros de corretores e operadoras uma vez
  useEffect(() => {
    async function loadFilterOptions() {
      const [brokersRes, operatorsRes] = await Promise.all([
        getBrokersForFilter(),
        getOperatorsForFilter(),
      ]);
      if (brokersRes.success) setBrokers(brokersRes.data);
      if (operatorsRes.success) setOperators(operatorsRes.data);
    }
    loadFilterOptions();
  }, []);

  // Recarrega quando filters mudam
  useEffect(() => {
    loadData(filters);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = useCallback((newFilters: CommissionLedgerFilters) => {
    setFilters(newFilters);
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    const payable = entries
      .filter((e) => e.status === 'confirmed' || e.status === 'pending')
      .map((e) => e.id);
    setSelectedIds(new Set(payable));
  }, [entries]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleMarkPaid = useCallback(async (paymentMethod: string) => {
    if (selectedIds.size === 0) {
      toast.warning('Selecione ao menos um lançamento');
      return;
    }
    startTransition(async () => {
      const result = await markAsPaid(Array.from(selectedIds), {
        payment_method: paymentMethod,
      });
      if (result.success) {
        toast.success(result.message);
        setSelectedIds(new Set());
        await loadData();
      } else {
        toast.error(result.error || 'Erro ao marcar como pago');
      }
    });
  }, [selectedIds, loadData]);

  const handleDownloadCSV = useCallback(async () => {
    startTransition(async () => {
      const month = filters.reference_month || currentMonth;
      const result = await generatePaymentCSV({ reference_month: month });
      if (result.success && result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'pagamento.csv';
        link.click();
        URL.revokeObjectURL(url);
        toast.success('CSV gerado com sucesso');
      } else {
        toast.error(result.error || 'Erro ao gerar CSV');
      }
    });
  }, [filters.reference_month, currentMonth]);

  return {
    entries,
    summary,
    brokers,
    operators,
    loading,
    isPending,
    filters,
    selectedIds,
    currentMonth,
    applyFilters,
    toggleSelect,
    selectAll,
    clearSelection,
    handleMarkPaid,
    handleDownloadCSV,
    reload: loadData,
  };
}
