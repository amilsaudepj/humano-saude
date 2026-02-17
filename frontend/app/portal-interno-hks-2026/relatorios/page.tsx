'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Calendar, FileText } from 'lucide-react';
import type { BigNumbersMetrics, GA4KPIs, GA4Source, GA4TopPage } from '@/lib/types/analytics';

interface ConsolidatedMetrics {
  totalSpend: number;
  totalRevenue: number;
  totalLeads: number;
  roas: number;
  cpa: number;
  ctr: number;
}

export default function RelatoriosPage() {
  const [dashboardMetrics, setDashboardMetrics] = useState<BigNumbersMetrics | null>(null);
  const [gaKpis, setGaKpis] = useState<GA4KPIs | null>(null);
  const [sources, setSources] = useState<GA4Source[]>([]);
  const [topPages, setTopPages] = useState<GA4TopPage[]>([]);
  const [consolidated, setConsolidated] = useState<ConsolidatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const end = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const qs = `?start=${start}&end=${end}`;

      const [dashRes, kpiRes, sourceRes, pagesRes, consolidatedRes] = await Promise.all([
        fetch('/api/admin/dashboard?days=30').then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/kpis${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/sources${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/top-pages${qs}`).then(r => r.json()).catch(() => null),
        fetch('/api/consolidated/metrics?period=last_30d').then(r => r.json()).catch(() => null),
      ]);

      if (dashRes?.success) {
        setDashboardMetrics(dashRes?.data?.metrics || null);
      }
      if (kpiRes?.success) setGaKpis(kpiRes.data);
      if (sourceRes?.success) setSources(sourceRes.data || []);
      if (pagesRes?.success) setTopPages(pagesRes.data || []);
      if (consolidatedRes?.success) {
        setConsolidated({
          totalSpend: Number(consolidatedRes?.metrics?.totalSpend || 0),
          totalRevenue: Number(consolidatedRes?.metrics?.totalRevenue || 0),
          totalLeads: Number(consolidatedRes?.metrics?.totalLeads || 0),
          roas: Number(consolidatedRes?.metrics?.roas || 0),
          cpa: Number(consolidatedRes?.metrics?.cpa || 0),
          ctr: Number(consolidatedRes?.metrics?.ctr || 0),
        });
      }

      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            RELATÓRIOS
          </h1>
          <p className="mt-2 text-gray-400">Relatórios gerenciais consolidados</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Relatório de Leads & Cotações */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#D4AF37]" />
              Vendas & Conversão
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Total de Vendas</span>
                <span className="text-white font-medium">{dashboardMetrics?.sales || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Vendas Pagas</span>
                <span className="text-green-400 font-medium">{dashboardMetrics?.paid_sales || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Taxa de Conversão</span>
                <span className="text-[#D4AF37] font-medium">{dashboardMetrics?.conversion_rate || 0}%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Faturamento</span>
                <span className="text-white font-medium">
                  R$ {(dashboardMetrics?.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Relatório Financeiro */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#D4AF37]" />
              Marketing & Mídia
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Investimento</span>
                <span className="text-white font-medium">
                  R$ {(consolidated?.totalSpend || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Receita atribuída</span>
                <span className="text-green-400 font-medium">
                  R$ {(consolidated?.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">ROAS</span>
                <span className="text-[#D4AF37] font-medium">{(consolidated?.roas || 0).toFixed(2)}x</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">CPA médio</span>
                <span className="text-yellow-400 font-medium">R$ {(consolidated?.cpa || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Relatório de Tráfego */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#D4AF37]" />
              Tráfego (30 dias)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Total Visitas</span>
                <span className="text-white font-medium">{gaKpis?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Sessões</span>
                <span className="text-white font-medium">{gaKpis?.totalSessions || 0}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400">Page Views</span>
                <span className="text-white font-medium">{gaKpis?.totalViews || 0}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">Eventos</span>
                <span className="text-white font-medium">{gaKpis?.totalEvents || 0}</span>
              </div>
            </div>
          </div>

          {/* Top Fontes */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#D4AF37]" />
              Top Fontes de Tráfego
            </h3>
            <div className="space-y-3">
              {sources.map((f, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 capitalize">{f.source || '(direct)'}</span>
                  <span className="text-white font-medium">{f.users}</span>
                </div>
              ))}
              {sources.length === 0 && (
                <p className="text-gray-500 text-sm">Nenhum dado disponível</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4 md:col-span-2">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#D4AF37]" />
              Top Páginas
            </h3>
            <div className="grid gap-2">
              {topPages.slice(0, 5).map((page, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-white/5 px-3 py-2">
                  <span className="text-sm text-gray-300 truncate pr-4">{page.title || 'Página sem título'}</span>
                  <span className="text-sm font-semibold text-white">{page.views}</span>
                </div>
              ))}
              {topPages.length === 0 && (
                <p className="text-gray-500 text-sm">Nenhum dado disponível</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
