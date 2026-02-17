'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Target, Eye, MousePointer, Clock } from 'lucide-react';
import type { GA4Device, GA4KPIs, GA4TopPage } from '@/lib/types/analytics';

interface ConsolidatedMetrics {
  totalLeads: number;
  cpl: number;
  ctr: number;
  conversionRate: number;
}

export default function MetricasPage() {
  const [kpis, setKpis] = useState<GA4KPIs | null>(null);
  const [topPages, setTopPages] = useState<GA4TopPage[]>([]);
  const [devices, setDevices] = useState<GA4Device[]>([]);
  const [adsMetrics, setAdsMetrics] = useState<ConsolidatedMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const end = new Date().toISOString().split('T')[0];
      const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const qs = `?start=${start}&end=${end}`;

      const [kpiRes, topPagesRes, devicesRes, consolidatedRes] = await Promise.all([
        fetch(`/api/analytics/kpis${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/top-pages${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/devices${qs}`).then(r => r.json()).catch(() => null),
        fetch('/api/consolidated/metrics?period=last_30d').then(r => r.json()).catch(() => null),
      ]);

      if (kpiRes?.success) setKpis(kpiRes.data);
      if (topPagesRes?.success) setTopPages(topPagesRes.data || []);
      if (devicesRes?.success) setDevices(devicesRes.data || []);
      if (consolidatedRes?.success) {
        setAdsMetrics({
          totalLeads: Number(consolidatedRes?.metrics?.totalLeads || 0),
          cpl: Number(consolidatedRes?.metrics?.cpl || 0),
          ctr: Number(consolidatedRes?.metrics?.ctr || 0),
          conversionRate: Number(consolidatedRes?.metrics?.conversionRate || 0),
        });
      }

      setLoading(false);
    }
    load();
  }, []);

  const metrics = [
    { label: 'Usuários (30d)', value: kpis?.totalUsers || 0, icon: Eye, color: 'text-blue-400' },
    { label: 'Visualizações', value: kpis?.totalViews || 0, icon: MousePointer, color: 'text-purple-400' },
    { label: 'Sessões', value: kpis?.totalSessions || 0, icon: Users, color: 'text-green-400' },
    { label: 'Eventos', value: kpis?.totalEvents || 0, icon: Clock, color: 'text-yellow-400' },
    { label: 'Leads via Ads', value: adsMetrics?.totalLeads || 0, icon: Target, color: 'text-[#D4AF37]' },
    { label: 'CPL Médio', value: adsMetrics ? `R$ ${adsMetrics.cpl.toFixed(2)}` : '—', icon: TrendingUp, color: 'text-orange-400' },
    { label: 'CTR Ads', value: adsMetrics ? `${adsMetrics.ctr.toFixed(2)}%` : '—', icon: MousePointer, color: 'text-pink-400' },
    { label: 'Conv. Ads', value: adsMetrics ? `${adsMetrics.conversionRate.toFixed(2)}%` : '0%', icon: Target, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          MÉTRICAS
        </h1>
        <p className="mt-2 text-gray-400">KPIs e indicadores de performance</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-[#0a0a0a] p-5">
                <m.icon className={`h-6 w-6 ${m.color} mb-3`} />
                <p className="text-2xl font-bold text-white">{m.value}</p>
                <p className="text-sm text-gray-400">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Top Páginas */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Top Páginas (30 dias)</h2>
            <div className="space-y-3">
              {topPages.map((p, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 text-center text-sm font-bold text-[#D4AF37]">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white truncate">{p.title || 'Página sem título'}</span>
                      <span className="text-sm text-gray-400 ml-2">{p.views} views</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] rounded-full"
                        style={{
                          width: `${(p.views / (topPages?.[0]?.views || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {topPages.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">Nenhum dado disponível</p>
              )}
            </div>
          </div>

          {/* Dispositivos */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Dispositivos</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {devices.map((item) => (
                <div key={item.device} className="rounded-lg border border-white/5 p-4 text-center">
                  <p className="text-2xl font-bold text-white">{item.users}</p>
                  <p className="text-sm text-gray-400 capitalize">{item.device}</p>
                </div>
              ))}
              {devices.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8 md:col-span-3">Nenhum dado disponível</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
