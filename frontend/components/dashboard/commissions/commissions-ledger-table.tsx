'use client';

import { CheckSquare, Square, AlertTriangle, CheckCircle2, Clock, XCircle, ShieldAlert } from 'lucide-react';
import type { CommissionLedgerExpanded, LedgerStatus, AuditStatus } from '@/lib/types/commissions';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-BR');
}

const STATUS_BADGE: Record<LedgerStatus, { label: string; class: string }> = {
  pending: { label: 'Pendente', class: 'bg-yellow-500/20 text-yellow-400' },
  confirmed: { label: 'Confirmado', class: 'bg-blue-500/20 text-blue-400' },
  paid: { label: 'Pago', class: 'bg-green-500/20 text-green-400' },
  cancelled: { label: 'Cancelado', class: 'bg-red-500/20 text-red-400' },
  disputed: { label: 'Contestado', class: 'bg-orange-500/20 text-orange-400' },
};

const AUDIT_ICON: Record<AuditStatus, { icon: typeof CheckCircle2; class: string; label: string }> = {
  not_audited: { icon: Clock, class: 'text-gray-500', label: 'Não auditado' },
  match: { icon: CheckCircle2, class: 'text-green-400', label: 'OK' },
  divergent: { icon: AlertTriangle, class: 'text-red-400', label: 'Divergente' },
  missing: { icon: XCircle, class: 'text-orange-400', label: 'Faltando' },
};

type Props = {
  entries: CommissionLedgerExpanded[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  loading: boolean;
};

export function CommissionsLedgerTable({
  entries,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  loading,
}: Props) {
  const allSelected = entries.length > 0 && entries.every((e) => selectedIds.has(e.id));

  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-8">
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <ShieldAlert className="h-12 w-12 mb-3 text-gray-600" />
          <p className="text-lg font-medium">Nenhum lançamento encontrado</p>
          <p className="text-sm mt-1">Ajuste os filtros ou selecione outro mês</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-gray-400 uppercase tracking-wider">
              <th className="px-4 py-3 w-10">
                <button
                  onClick={allSelected ? onClearSelection : onSelectAll}
                  className="hover:text-[#D4AF37] transition-colors"
                  title={allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                >
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 text-[#D4AF37]" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3">Proposta</th>
              <th className="px-4 py-3">Titular</th>
              <th className="px-4 py-3">Operadora</th>
              <th className="px-4 py-3">Parcela</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">% Aplicado</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Pgto</th>
              <th className="px-4 py-3">Auditoria</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const statusBadge = STATUS_BADGE[entry.status];
              const auditInfo = AUDIT_ICON[entry.audit_status];
              const AuditIcon = auditInfo.icon;
              const isSelected = selectedIds.has(entry.id);
              const canSelect = entry.status === 'pending' || entry.status === 'confirmed';

              return (
                <tr
                  key={entry.id}
                  className={`border-b border-white/5 transition-colors ${
                    isSelected ? 'bg-[#D4AF37]/5' : 'hover:bg-white/5'
                  }`}
                >
                  <td className="px-4 py-3">
                    {canSelect ? (
                      <button onClick={() => onToggleSelect(entry.id)}>
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-[#D4AF37]" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-500 hover:text-white" />
                        )}
                      </button>
                    ) : (
                      <span className="h-4 w-4 block" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-white">
                    {entry.proposal_number || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {entry.titular_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {entry.operadoras?.nome || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-400">
                    {entry.installment_number}ª
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#D4AF37]">
                    {formatBRL(Number(entry.amount))}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {entry.applied_pct ? `${entry.applied_pct}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.class}`}>
                      {statusBadge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDate(entry.expected_payment_date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDate(entry.actual_payment_date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" title={auditInfo.label}>
                      <AuditIcon className={`h-4 w-4 ${auditInfo.class}`} />
                      {entry.audit_status === 'divergent' && entry.audit_notes && (
                        <span className="text-xs text-red-400 max-w-[120px] truncate" title={entry.audit_notes}>
                          {entry.audit_notes}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rodapé com contagem */}
      <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
        <span>{entries.length} lançamentos exibidos</span>
        {selectedIds.size > 0 && (
          <span className="text-[#D4AF37] font-medium">
            {selectedIds.size} selecionado(s) — Total: {
              formatBRL(
                entries
                  .filter((e) => selectedIds.has(e.id))
                  .reduce((sum, e) => sum + Number(e.amount), 0)
              )
            }
          </span>
        )}
      </div>
    </div>
  );
}
