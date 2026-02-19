'use client';

import { useState } from 'react';
import type { CommissionLedgerFilters, LedgerStatus, AuditStatus } from '@/lib/types/commissions';

type BrokerOption = { id: string; nome_completo: string };
type OperatorOption = { id: string; nome: string };

type Props = {
  filters: CommissionLedgerFilters;
  onApply: (filters: CommissionLedgerFilters) => void;
  brokers: BrokerOption[];
  operators: OperatorOption[];
  currentMonth: string;
};

const STATUS_OPTIONS: { value: LedgerStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os Status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'paid', label: 'Pago' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'disputed', label: 'Contestado' },
];

const AUDIT_OPTIONS: { value: AuditStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'not_audited', label: 'Não auditado' },
  { value: 'match', label: '✅ OK' },
  { value: 'divergent', label: '⚠️ Divergente' },
  { value: 'missing', label: '❌ Faltando' },
];

const selectClass =
  'rounded-md border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30';

export function CommissionFilters({ filters, onApply, brokers, operators, currentMonth }: Props) {
  const [local, setLocal] = useState<CommissionLedgerFilters>({
    reference_month: filters.reference_month || currentMonth,
    ...filters,
  });

  function update(patch: Partial<CommissionLedgerFilters>) {
    const next = { ...local, ...patch };
    setLocal(next);
    onApply(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Mês de Referência */}
      <input
        type="month"
        value={local.reference_month || currentMonth}
        onChange={(e) => update({ reference_month: e.target.value })}
        className={selectClass}
      />

      {/* Corretor */}
      <select
        value={local.broker_id || ''}
        onChange={(e) => update({ broker_id: e.target.value || undefined })}
        className={selectClass}
      >
        <option value="">Todos os Corretores</option>
        {brokers.map((b) => (
          <option key={b.id} value={b.id}>{b.nome_completo}</option>
        ))}
      </select>

      {/* Operadora */}
      <select
        value={local.operator_id || ''}
        onChange={(e) => update({ operator_id: e.target.value || undefined })}
        className={selectClass}
      >
        <option value="">Todas as Operadoras</option>
        {operators.map((o) => (
          <option key={o.id} value={o.id}>{o.nome}</option>
        ))}
      </select>

      {/* Status */}
      <select
        value={local.status || ''}
        onChange={(e) => update({ status: (e.target.value || undefined) as LedgerStatus | undefined })}
        className={selectClass}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Auditoria */}
      <select
        value={local.audit_status || ''}
        onChange={(e) => update({ audit_status: (e.target.value || undefined) as AuditStatus | undefined })}
        className={selectClass}
      >
        {AUDIT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Limpar */}
      <button
        onClick={() => {
          const reset: CommissionLedgerFilters = { reference_month: currentMonth };
          setLocal(reset);
          onApply(reset);
        }}
        className="rounded-md border border-white/10 px-3 py-2 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
      >
        Limpar Filtros
      </button>
    </div>
  );
}
