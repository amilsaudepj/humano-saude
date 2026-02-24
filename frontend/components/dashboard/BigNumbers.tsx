'use client';

// =====================================================
// BigNumbers — 7 KPI Cards do Dashboard
// =====================================================

import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Users,
  TrendingUp,
  Wallet,
  CheckCircle,
} from 'lucide-react';
import type { BigNumbersMetrics } from '@/lib/types/analytics';
import { calculateNetProfit } from '@/lib/dashboard-queries';

// =====================================================
// ANIMATED NUMBER
// =====================================================

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return <span>{prefix}{formatted}{suffix}</span>;
}

function DeltaBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
      isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
    }`}>
      {isPositive ? '↑' : '↓'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// =====================================================
// COMPONENT
// =====================================================

interface BigNumbersProps {
  metrics: BigNumbersMetrics;
  loading?: boolean;
  /** Ex.: "30d" — exibido no card Visitantes para não confundir com "online agora" (badge LIVE) */
  periodLabel?: string;
}

export default function BigNumbers({ metrics, loading, periodLabel }: BigNumbersProps) {
  const financials = calculateNetProfit(metrics.revenue, metrics.paid_sales);
  const visitorsLabel = periodLabel ? `Visitantes (${periodLabel})` : 'Visitantes';
  const visitorsSubtitle = periodLabel ? 'no período — ao vivo no badge' : undefined;

  const cards = [
    {
      label: 'Faturamento',
      value: metrics.revenue,
      prefix: 'R$ ',
      decimals: 2,
      delta: metrics.revenue_change,
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Total Vendas',
      value: metrics.sales,
      delta: 0,
      icon: ShoppingCart,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Ticket Médio',
      value: metrics.average_order_value,
      prefix: 'R$ ',
      decimals: 2,
      delta: metrics.aov_change,
      icon: Receipt,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: visitorsLabel,
      value: metrics.unique_visitors,
      delta: metrics.visitors_change,
      icon: Users,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      subtitle: visitorsSubtitle,
    },
    {
      label: 'Conversão',
      value: metrics.conversion_rate,
      suffix: '%',
      decimals: 2,
      delta: metrics.time_change,
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Lucro Líquido',
      value: financials.netProfit,
      prefix: 'R$ ',
      decimals: 2,
      delta: 0,
      icon: Wallet,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      subtitle: `Margem: ${financials.profitMargin.toFixed(1)}%`,
    },
    {
      label: 'Vendas Pagas',
      value: metrics.paid_sales,
      delta: 0,
      icon: CheckCircle,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      subtitle: `Falhadas: ${metrics.failed_sales} | Pendentes: ${metrics.pending_sales}`,
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-white/5 bg-[#0a0a0a]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] p-4 transition-all hover:border-[#D4AF37]/30 hover:shadow-lg hover:shadow-[#D4AF37]/5"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`rounded-lg p-1.5 ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <DeltaBadge value={card.delta ?? 0} />
            </div>
            <p className="text-xl font-bold text-white leading-tight">
              <AnimatedNumber
                value={card.value}
                prefix={card.prefix}
                suffix={card.suffix}
                decimals={card.decimals ?? 0}
              />
            </p>
            <p className="mt-1 text-[11px] text-gray-500">{card.label}</p>
            {'subtitle' in card && card.subtitle && (
              <p className="mt-0.5 text-[9px] text-gray-600">{card.subtitle}</p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
