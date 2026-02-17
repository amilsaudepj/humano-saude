'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Target, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { BigNumbersMetrics, FunnelData } from '@/lib/types/analytics';

interface ConsolidatedMetrics {
  totalLeads: number;
  roas: number;
  ctr: number;
  cpc: number;
  cpa: number;
  cpl: number;
  conversionRate: number;
}

export default function PerformancePage() {
  const [dashboardMetrics, setDashboardMetrics] = useState<BigNumbersMetrics | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [consolidated, setConsolidated] = useState<ConsolidatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [dashRes, consolidatedRes] = await Promise.all([
        fetch('/api/admin/dashboard?days=30').then(r => r.json()).catch(() => null),
        fetch('/api/consolidated/metrics?period=last_30d').then(r => r.json()).catch(() => null),
      ]);

      if (dashRes?.success) {
        setDashboardMetrics(dashRes?.data?.metrics || null);
        setFunnel(dashRes?.data?.funnel || dashRes?.data?.funnelData || null);
      }

      if (consolidatedRes?.success) {
        setConsolidated({
          totalLeads: Number(consolidatedRes?.metrics?.totalLeads || 0),
          roas: Number(consolidatedRes?.metrics?.roas || 0),
          ctr: Number(consolidatedRes?.metrics?.ctr || 0),
          cpc: Number(consolidatedRes?.metrics?.cpc || 0),
          cpa: Number(consolidatedRes?.metrics?.cpa || 0),
          cpl: Number(consolidatedRes?.metrics?.cpl || 0),
          conversionRate: Number(consolidatedRes?.metrics?.conversionRate || 0),
        });
      }

      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    {
      title: 'Faturamento',
      value: `R$ ${(dashboardMetrics?.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      sub: 'Últimos 30 dias',
      icon: Users,
      color: 'text-blue-400',
    },
    {
      title: 'Vendas Confirmadas',
      value: dashboardMetrics?.sales || 0,
      sub: `${dashboardMetrics?.paid_sales || 0} pagas`,
      icon: Target,
      color: 'text-purple-400',
    },
    {
      title: 'Leads Capturados',
      value: consolidated?.totalLeads || 0,
      sub: 'Meta + Google',
      icon: Award,
      color: 'text-green-400',
    },
    {
      title: 'Taxa de Conversão',
      value: `${dashboardMetrics?.conversion_rate || 0}%`,
      sub: 'Visitantes → Vendas',
      icon: TrendingUp,
      color: 'text-[#D4AF37]',
    },
  ];

  const kpis = [
    { label: 'ROAS', value: `${(consolidated?.roas || 0).toFixed(2)}x`, trend: (consolidated?.roas || 0) >= 1 ? 'up' : 'down' },
    { label: 'CTR', value: `${(consolidated?.ctr || 0).toFixed(2)}%`, trend: (consolidated?.ctr || 0) >= 1 ? 'up' : 'down' },
    { label: 'CPC', value: `R$ ${(consolidated?.cpc || 0).toFixed(2)}`, trend: (consolidated?.cpc || 0) <= 2 ? 'up' : 'down' },
    { label: 'CPA', value: `R$ ${(consolidated?.cpa || 0).toFixed(2)}`, trend: (consolidated?.cpa || 0) <= 80 ? 'up' : 'down' },
    { label: 'CPL', value: `R$ ${(consolidated?.cpl || 0).toFixed(2)}`, trend: (consolidated?.cpl || 0) <= 50 ? 'up' : 'down' },
    { label: 'Conv. Marketing', value: `${(consolidated?.conversionRate || 0).toFixed(2)}%`, trend: (consolidated?.conversionRate || 0) >= 1 ? 'up' : 'down' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          PERFORMANCE
        </h1>
        <p className="mt-2 text-gray-400">Indicadores de desempenho da equipe</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((c, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
                <div className="flex items-center justify-between mb-3">
                  <c.icon className={`h-6 w-6 ${c.color}`} />
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-white">{c.value}</p>
                <p className="text-sm text-gray-400">{c.title}</p>
                <p className="text-xs text-gray-500 mt-1">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">KPIs Mensais</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {kpis.map((kpi, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-[#111] p-4">
                  <div>
                    <p className="text-sm text-gray-400">{kpi.label}</p>
                    <p className="text-xl font-bold text-white mt-1">{kpi.value}</p>
                  </div>
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight className="h-5 w-5 text-green-400" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline Summary */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Resumo do Funil</h2>
            <div className="space-y-3">
              {[
                { label: 'Visitantes', count: funnel?.visitors || 0, color: 'bg-blue-500' },
                { label: 'Interessados', count: funnel?.interested || 0, color: 'bg-cyan-500' },
                { label: 'Checkout', count: funnel?.checkoutStarted || 0, color: 'bg-yellow-500' },
                { label: 'Vendas', count: funnel?.purchased || 0, color: 'bg-green-500' },
              ].map((item) => {
                const total = funnel?.visitors || 1;
                const pct = ((item.count / total) * 100).toFixed(1);
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-300">{item.label}</div>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-12 text-right text-sm text-gray-400">{item.count}</div>
                    <div className="w-12 text-right text-sm text-[#D4AF37]">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
