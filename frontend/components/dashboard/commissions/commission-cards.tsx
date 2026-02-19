'use client';

import { DollarSign, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { CommissionsSummary } from '@/lib/types/commissions';

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type Props = {
  summary: CommissionsSummary | null;
  loading: boolean;
};

const SKELETON = 'h-8 w-32 animate-pulse rounded bg-white/10';

export function CommissionCards({ summary, loading }: Props) {
  const cards = [
    {
      label: 'Total a Pagar (Mês)',
      value: summary ? formatBRL(summary.total_payable) : '—',
      icon: DollarSign,
      borderColor: 'border-[#D4AF37]/20',
      iconColor: 'text-[#D4AF37]',
      sub: summary ? `${summary.pending_count + summary.confirmed_count} lançamentos` : '',
    },
    {
      label: 'Pendente de Operadora',
      value: summary ? formatBRL(summary.total_pending_operator) : '—',
      icon: Clock,
      borderColor: 'border-yellow-500/20',
      iconColor: 'text-yellow-500',
      sub: summary ? `${summary.pending_count} pendentes` : '',
    },
    {
      label: 'Total Pago',
      value: summary ? formatBRL(summary.total_paid) : '—',
      icon: CheckCircle2,
      borderColor: 'border-green-500/20',
      iconColor: 'text-green-500',
      sub: summary ? `${summary.paid_count} pagos` : '',
    },
    {
      label: 'Divergências',
      value: summary ? String(summary.divergent_count + summary.missing_count) : '—',
      icon: AlertTriangle,
      borderColor: summary && (summary.divergent_count + summary.missing_count) > 0
        ? 'border-red-500/20'
        : 'border-white/10',
      iconColor: summary && (summary.divergent_count + summary.missing_count) > 0
        ? 'text-red-500'
        : 'text-gray-500',
      sub: summary
        ? `${summary.divergent_count} divergentes, ${summary.missing_count} faltando`
        : '',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border ${card.borderColor} bg-[#0a0a0a] p-6 transition-all hover:bg-[#111]`}
        >
          <card.icon className={`h-7 w-7 ${card.iconColor} mb-3`} />
          {loading ? (
            <div className={SKELETON} />
          ) : (
            <p className="text-2xl font-bold text-white">{card.value}</p>
          )}
          <p className="text-sm text-gray-400 mt-1">{card.label}</p>
          {card.sub && (
            <p className="text-xs text-gray-500 mt-2">{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
