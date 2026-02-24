'use client';

// =====================================================
// Dashboard de Vendas — Sales Dashboard Completo
// BigNumbers · ROI · Funil · Saúde Operacional · Realtime
// =====================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  Megaphone,
} from 'lucide-react';
import BigNumbers from '@/components/dashboard/BigNumbers';
import ConversionFunnel from '@/components/dashboard/ConversionFunnel';
import OperationalHealth from '@/components/dashboard/OperationalHealth';
import RealtimeFeed from '@/components/dashboard/RealtimeFeed';
import RealtimeVisitors from '@/components/dashboard/RealtimeVisitors';
import FraudAnalysisCard from '@/components/dashboard/FraudAnalysisCard';
import GatewayStatsCard from '@/components/dashboard/GatewayStatsCard';
import ActionCenter from '@/components/dashboard/ActionCenter';
import AnalyticsChart from '@/components/dashboard/AnalyticsChart';
import type {
  BigNumbersMetrics,
  OperationalHealthData,
  SalesByDayData,
  FunnelData,
  GatewayStats,
  FraudItem,
  GA4TrafficPoint,
} from '@/lib/types/analytics';

// =====================================================
// TYPES
// =====================================================

interface DashboardData {
  metrics: BigNumbersMetrics | null;
  health: OperationalHealthData | null;
  salesByDay: SalesByDayData[];
  funnel: FunnelData | null;
  gateway: GatewayStats[];
  fraud: FraudItem[];
  traffic: GA4TrafficPoint[];
}

const INITIAL: DashboardData = {
  metrics: null,
  health: null,
  salesByDay: [],
  funnel: null,
  gateway: [],
  fraud: [],
  traffic: [],
};

type Period = '7d' | '14d' | '30d' | '90d' | 'custom';

// =====================================================
// HELPERS
// =====================================================

function GlassCard({ children, className, title, icon: Icon }: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className={`rounded-xl border border-white/10 bg-[#0a0a0a] p-5 ${className || ''}`}>
      {title && (
        <div className="mb-4 flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-[#D4AF37]" />}
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

function calcROI(revenue: number, adSpend: number): number {
  if (!adSpend) return 0;
  return ((revenue - adSpend) / adSpend) * 100;
}

// =====================================================
// PAGE
// =====================================================

export default function DashboardVendasPage() {
  const [data, setData] = useState<DashboardData>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [metaAdSpend, setMetaAdSpend] = useState(0);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const daysMap: Record<string, number> = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 };
    const days = daysMap[period] || 30;
    const consolidatedPeriod: Record<Exclude<Period, 'custom'>, string> = {
      '7d': 'last_7d',
      '14d': 'last_14d',
      '30d': 'last_30d',
      '90d': 'last_30d',
    };

    let qs = `?days=${days}`;
    if (period === 'custom' && customRange.start && customRange.end) {
      qs = `?start=${customRange.start}&end=${customRange.end}`;
    }

    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    const gaQs = `?start=${start}&end=${end}`;

    try {
      const [dashRes, trafficRes, consolidatedRes] = await Promise.all([
        fetch(`/api/admin/dashboard${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/traffic${gaQs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/consolidated/metrics?period=${period === 'custom' ? 'last_30d' : consolidatedPeriod[period]}`).then(r => r.json()).catch(() => null),
      ]);

      if (dashRes?.success) {
        setData({
          metrics: dashRes.data?.metrics || null,
          health: dashRes.data?.health || dashRes.data?.operationalHealth || null,
          salesByDay: dashRes.data?.salesByDay || dashRes.data?.chartData || [],
          funnel: dashRes.data?.funnel || dashRes.data?.funnelData || null,
          gateway: dashRes.data?.gateway || dashRes.data?.gatewayStats || [],
          fraud: dashRes.data?.fraud || dashRes.data?.fraudItems || [],
          traffic: trafficRes?.success ? trafficRes.data : [],
        });
      } else {
        setData({
          ...INITIAL,
          traffic: trafficRes?.success ? trafficRes.data : [],
        });
      }

      setMetaAdSpend(consolidatedRes?.success ? Number(consolidatedRes?.metrics?.totalSpend || 0) : 0);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [period, customRange]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    refreshRef.current = setInterval(load, 60_000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [load]);

  const revenue = data.metrics?.revenue || 0;
  const roi = calcROI(revenue, metaAdSpend);
  const roas = metaAdSpend > 0 ? revenue / metaAdSpend : 0;

  // Export function
  const handleExport = () => {
    const rows = [
      ['Data', 'Receita', 'Vendas'],
      ...data.salesByDay.map(d => [d.date, d.revenue.toFixed(2), d.sales.toString()]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-vendas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1
            className="text-4xl font-bold text-[#D4AF37]"
            style={{ fontFamily: 'Perpetua Titling MT, serif' }}
          >
            DASHBOARD DE VENDAS
          </h1>
          <p className="mt-2 text-gray-400">Métricas de vendas, conversão e saúde operacional</p>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeVisitors />
          <div className="flex gap-1.5">
            {(['7d', '14d', '30d', '90d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  period === p
                    ? 'bg-[#D4AF37] text-white'
                    : 'border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400 transition-colors hover:text-white"
          >
            <Download className="h-3 w-3" /> CSV
          </button>
          <button
            onClick={() => { setLoading(true); load(); }}
            className="rounded-full p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Big Numbers */}
          {data.metrics && <BigNumbers metrics={data.metrics} periodLabel={period} />}

          {/* ROI + Meta Ads Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <GlassCard title="ROI Marketing" icon={TrendingUp}>
              <div className="flex items-baseline gap-3">
                <p className={`text-3xl font-bold ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {roi.toFixed(1)}%
                </p>
                <span className="text-xs text-gray-400">retorno sobre investimento</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 rounded-lg border border-white/5 p-3">
                <div>
                  <p className="text-[10px] text-gray-500">Receita</p>
                  <p className="text-sm font-bold text-emerald-400">
                    R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Investimento Ads</p>
                  <p className="text-sm font-bold text-red-400">
                    R$ {metaAdSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard title="ROAS" icon={DollarSign}>
              <p className={`text-3xl font-bold ${roas >= 3 ? 'text-emerald-400' : roas >= 1.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                {roas.toFixed(2)}x
              </p>
              <p className="mt-1 text-[10px] text-gray-400">
                {roas >= 3 ? 'Excelente performance' : roas >= 1.5 ? 'Performance aceitável' : 'Performance abaixo do ideal'}
              </p>
              <div className="mt-3 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${roas >= 3 ? 'bg-emerald-400' : roas >= 1.5 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(roas * 20, 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[8px] text-gray-500">
                <span>0x</span>
                <span>3x</span>
                <span>5x+</span>
              </div>
            </GlassCard>

            <GlassCard title="Meta Ads Resumo" icon={Megaphone}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Gasto Total</span>
                  <span className="text-sm font-bold text-white">
                    R$ {metaAdSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Custo por Venda</span>
                  <span className="text-sm font-bold text-white">
                    R$ {data.metrics?.sales ? (metaAdSpend / data.metrics.sales).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Lucro Líquido (post-ads)</span>
                  <span className={`text-sm font-bold ${revenue - metaAdSpend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    R$ {(revenue - metaAdSpend).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Traffic Chart */}
          {data.traffic.length > 0 && (
            <AnalyticsChart data={data.traffic} />
          )}

          {/* Revenue Chart - Sales by Day */}
          {data.salesByDay.length > 0 && (
            <GlassCard title="Faturamento Diário" icon={BarChart3}>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {data.salesByDay.map((d, i) => {
                  const maxRevenue = Math.max(...data.salesByDay.map(s => s.revenue)) || 1;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-20 text-[10px] text-gray-400 shrink-0">{d.date}</span>
                      <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(d.revenue / maxRevenue) * 100}%` }}
                          transition={{ delay: i * 0.03, duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] rounded-full flex items-center justify-end pr-2"
                        >
                          {d.revenue > 0 && (
                            <span className="text-[8px] font-bold text-black">
                              R$ {d.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </span>
                          )}
                        </motion.div>
                      </div>
                      <span className="w-8 text-right text-[10px] font-bold text-white">{d.sales}</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Funnel + Operational Health */}
          <div className="grid gap-4 md:grid-cols-2">
            {data.funnel && <ConversionFunnel data={data.funnel} />}
            {data.health && <OperationalHealth data={data.health} />}
          </div>

          {/* Realtime Feed + Fraud + Gateway */}
          <div className="grid gap-4 md:grid-cols-3">
            <RealtimeFeed />
            <FraudAnalysisCard />
            <GatewayStatsCard stats={data.gateway} />
          </div>

          {/* Action Center */}
          <ActionCenter />
        </>
      )}
    </div>
  );
}
