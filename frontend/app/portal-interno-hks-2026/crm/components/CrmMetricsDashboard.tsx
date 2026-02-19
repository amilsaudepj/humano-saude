'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Users, Clock, Target,
  BarChart3, ArrowUpRight, ArrowDownRight, Flame,
  AlertTriangle, Calendar, CheckCircle2, Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCrmMetrics } from '../hooks/useCrm';
import { getStagesWithMetrics } from '@/app/actions/crm';
import type { CrmCorretorPerformance, CrmStageWithMetrics } from '@/lib/types/crm';

// ========================================
// HELPERS
// ========================================

function fmt(value: number | null | undefined): string {
  if (value == null) return '—';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pct(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(1)}%`;
}

// ========================================
// STAT CARD
// ========================================

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color = 'gold',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: number; isUp: boolean };
  color?: string;
}) {
  const colorMap: Record<string, { text: string; bg: string; glow: string }> = {
    gold: { text: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', glow: 'shadow-[#D4AF37]/5' },
    green: { text: 'text-green-400', bg: 'bg-green-500/10', glow: 'shadow-green-500/5' },
    blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/5' },
    purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/5' },
    red: { text: 'text-red-400', bg: 'bg-red-500/10', glow: 'shadow-red-500/5' },
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', glow: 'shadow-cyan-500/5' },
  };
  const c = colorMap[color] ?? colorMap.gold;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 p-5',
        `shadow-lg ${c.glow}`,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', c.bg)}>
          <Icon className={cn('h-5 w-5', c.text)} />
        </div>
        {trend && (
          <span className={cn('flex items-center gap-0.5 text-xs font-medium', trend.isUp ? 'text-green-400' : 'text-red-400')}>
            {trend.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
      {subValue && <p className="text-[10px] text-white/20 mt-0.5">{subValue}</p>}
    </motion.div>
  );
}

// ========================================
// FUNNEL BAR
// ========================================

function FunnelBar({ stages }: { stages: { nome: string; cor: string; total: number; valor: number }[] }) {
  const maxTotal = Math.max(...stages.map((s) => s.total), 1);

  return (
    <div className="space-y-2">
      {stages.map((stage) => (
        <div key={stage.nome} className="flex items-center gap-3">
          <span className="text-xs text-white/50 w-28 truncate text-right">{stage.nome}</span>
          <div className="flex-1 h-7 rounded-lg bg-white/[0.03] overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stage.total / maxTotal) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-lg flex items-center px-3"
              style={{ backgroundColor: `${stage.cor}40` }}
            >
              <span className="text-[11px] font-medium text-white whitespace-nowrap">
                {stage.total} — {fmt(stage.valor)}
              </span>
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ========================================
// CORRETOR LEADERBOARD
// ========================================

function CorretorLeaderboard({ data }: { data: CrmCorretorPerformance[] }) {
  if (!data.length) {
    return (
      <div className="text-center py-8 text-white/20 text-sm">Sem dados de performance</div>
    );
  }

  const topValor = Math.max(...data.map((d) => Number(d.valor_ganho ?? 0)), 1);

  return (
    <div className="space-y-3">
      {data.slice(0, 8).map((c, i) => (
        <div key={c.corretor_id ?? i} className="flex items-center gap-3">
          <span className={cn(
            'h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold',
            i === 0 ? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
            i === 1 ? 'bg-white/10 text-white/60' :
            i === 2 ? 'bg-orange-500/10 text-orange-400' :
            'bg-white/5 text-white/30',
          )}>
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{c.corretor_nome ?? 'Corretor'}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F6E05E]"
                  style={{ width: `${(Number(c.valor_ganho ?? 0) / topValor) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-white/40 whitespace-nowrap">
                {fmt(Number(c.valor_ganho))}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-green-400">{c.deals_ganhos ?? 0} ✓</p>
            <p className="text-[10px] text-white/20">{c.total_deals ?? 0} deals</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ========================================
// CRM METRICS DASHBOARD (MAIN EXPORT)
// ========================================

export default function CrmMetricsDashboard({ pipelineId }: { pipelineId?: string }) {
  const { metrics, performance, loading, refetch } = useCrmMetrics();
  const [stageMetrics, setStageMetrics] = useState<CrmStageWithMetrics[]>([]);

  useEffect(() => {
    refetch();
  }, [pipelineId, refetch]);

  useEffect(() => {
    if (!pipelineId) return;
    getStagesWithMetrics(pipelineId).then((res) => {
      if (res.success && res.data) setStageMetrics(res.data);
    });
  }, [pipelineId]);

  // Single CrmDealMetrics object
  const m = metrics;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Briefcase}
          label="Total de Oportunidades"
          value={loading ? '...' : (m?.total_deals ?? 0).toLocaleString()}
          color="gold"
        />
        <StatCard
          icon={DollarSign}
          label="Valor no Pipeline"
          value={loading ? '...' : fmt(m?.valor_total_pipeline)}
          color="green"
        />
        <StatCard
          icon={Target}
          label="Forecast (Ponderado)"
          value={loading ? '...' : fmt(m?.forecast_ponderado)}
          color="blue"
        />
        <StatCard
          icon={Flame}
          label="Oportunidades Hot"
          value={loading ? '...' : (m?.deals_hot ?? 0).toLocaleString()}
          subValue="Alto potencial"
          color="gold"
        />
        <StatCard
          icon={AlertTriangle}
          label="Oportunidades Paradas"
          value={loading ? '...' : (m?.deals_stale ?? 0).toLocaleString()}
          subValue="Necessitam atenção"
          color="red"
        />
        <StatCard
          icon={Clock}
          label="Tempo Médio Fech."
          value={loading ? '...' : m?.tempo_medio_fechamento_dias != null ? `${m.tempo_medio_fechamento_dias}d` : '—'}
          color="purple"
        />
      </div>

      {/* Two Columns: Funnel + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Chart */}
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#D4AF37]" />
              Funil por Etapa
            </h3>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-7 rounded-lg bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          ) : stageMetrics.length === 0 ? (
            <p className="text-sm text-white/20 text-center py-8">Sem dados</p>
          ) : (
            <FunnelBar
              stages={stageMetrics.map((s) => ({
                nome: s.nome ?? '?',
                cor: s.cor ?? '#6B7280',
                total: s.total_deals ?? 0,
                valor: Number(s.valor_total ?? 0),
              }))}
            />
          )}
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-[#D4AF37]" />
              Ranking Corretores
            </h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          ) : (
            <CorretorLeaderboard data={performance} />
          )}
        </div>
      </div>
    </div>
  );
}
