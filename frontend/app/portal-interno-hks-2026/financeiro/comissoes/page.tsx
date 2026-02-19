'use client';

import { Wallet } from 'lucide-react';
import { useCommissionsLedger } from '@/hooks/use-commissions-ledger';
import { CommissionCards } from '@/components/dashboard/commissions/commission-cards';
import { CommissionFilters } from '@/components/dashboard/commissions/commission-filters';
import { CommissionsLedgerTable } from '@/components/dashboard/commissions/commissions-ledger-table';
import { PaymentActions } from '@/components/dashboard/commissions/payment-actions';
import { AuditUploadDialog } from '@/components/dashboard/commissions/audit-upload-dialog';

export default function ComissoesPage() {
  const {
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
    reload,
  } = useCommissionsLedger();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <div className="flex items-center gap-3">
          <Wallet className="h-8 w-8 text-[#D4AF37]" />
          <div>
            <h1
              className="text-3xl font-bold text-[#D4AF37]"
              style={{ fontFamily: 'Perpetua Titling MT, serif' }}
            >
              COMISSÕES
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Módulo Financeiro — Gestão de comissões por proposta e corretor
            </p>
          </div>
        </div>
      </div>

      {/* Cards de visão geral */}
      <CommissionCards summary={summary} loading={loading} />

      {/* Filtros */}
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
        <CommissionFilters
          filters={filters}
          onApply={applyFilters}
          brokers={brokers}
          operators={operators}
          currentMonth={currentMonth}
        />
      </div>

      {/* Ações de pagamento + Auditoria */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PaymentActions
          selectedCount={selectedIds.size}
          onMarkPaid={handleMarkPaid}
          onDownloadCSV={handleDownloadCSV}
          isPending={isPending}
        />
        <AuditUploadDialog
          referenceMonth={filters.reference_month || currentMonth}
          onAuditComplete={reload}
        />
      </div>

      {/* Tabela de lançamentos */}
      <CommissionsLedgerTable
        entries={entries}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        loading={loading}
      />
    </div>
  );
}
