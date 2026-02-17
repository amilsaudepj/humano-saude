'use client';

// =====================================================
// Analytics Dashboard — Google Analytics 4 + AI Insight
// 10 parallel API fetches, 60s auto-refresh, GlassCard
// =====================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  MousePointer,
  Layers,
  Globe,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  FileText,
  ArrowUpRight,
  PieChart,
  Users,
  Chrome,
  UserCheck,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import AnalyticsChart from '@/components/dashboard/AnalyticsChart';
import RealtimeVisitors from '@/components/dashboard/RealtimeVisitors';
import type {
  GA4KPIs,
  GA4TrafficPoint,
  GA4Source,
  GA4TopPage,
  GA4Country,
  GA4City,
  GA4Device,
  GA4Browser,
  GA4AgeGroup,
  GA4OutboundSummary,
} from '@/lib/types/analytics';

// =====================================================
// HELPERS
// =====================================================

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-[#0a0a0a] p-5 ${className || ''}`}>
      {children}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-[#0a0a0a] p-5"
    >
      <Icon className={`h-5 w-5 mb-2 ${color}`} />
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </motion.div>
  );
}

const SOURCE_COLORS = [
  '#D4AF37', '#3B82F6', '#10B981', '#EF4444', '#A855F7',
  '#F59E0B', '#EC4899', '#14B8A6', '#6366F1', '#F97316',
];

const FLAG_MAP: Record<string, string> = {
  Brazil: '🇧🇷', 'United States': '🇺🇸', Portugal: '🇵🇹', Argentina: '🇦🇷',
  Colombia: '🇨🇴', Chile: '🇨🇱', Mexico: '🇲🇽', Germany: '🇩🇪',
  France: '🇫🇷', Spain: '🇪🇸', Italy: '🇮🇹', Japan: '🇯🇵',
  'United Kingdom': '🇬🇧', Canada: '🇨🇦', Australia: '🇦🇺',
};

function getFlag(country: string) { return FLAG_MAP[country] || '🌐'; }

// =====================================================
// TYPES
// =====================================================

interface AnalyticsData {
  kpis: GA4KPIs | null;
  traffic: GA4TrafficPoint[];
  sources: GA4Source[];
  topPages: GA4TopPage[];
  countries: GA4Country[];
  cities: GA4City[];
  devices: GA4Device[];
  browsers: GA4Browser[];
  ageGroups: GA4AgeGroup[];
  outbound: GA4OutboundSummary | null;
}

const INITIAL: AnalyticsData = {
  kpis: null, traffic: [], sources: [], topPages: [],
  countries: [], cities: [], devices: [], browsers: [],
  ageGroups: [], outbound: null,
};

// =====================================================
// PAGE
// =====================================================

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    const qs = `?start=${start}&end=${end}`;

    try {
      const [kR, tR, sR, pR, coR, ciR, dR, bR, aR, oR] = await Promise.all([
        fetch(`/api/analytics/kpis${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/traffic${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/sources${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/top-pages${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/countries${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/cities${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/devices${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/browsers${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/age${qs}`).then(r => r.json()).catch(() => null),
        fetch(`/api/analytics/outbound${qs}`).then(r => r.json()).catch(() => null),
      ]);

      const responses = [kR, tR, sR, pR, coR, ciR, dR, bR, aR, oR].filter(Boolean);
      const ga4ConfigResponse = responses.find((r: any) => r?.errorCode === 'GA4_NOT_CONFIGURED');
      const ga4NotConfigured = responses.some((r: any) =>
        r?.errorCode === 'GA4_NOT_CONFIGURED' ||
        typeof r?.error === 'string' && r.error.toLowerCase().includes('ga4 não configurado')
      );
      const hasApiError = responses.some((r: any) => r?.success === false);

      setData({
        kpis: kR?.success ? kR.data : null,
        traffic: tR?.success ? tR.data : [],
        sources: (sR?.success ? sR.data : []).map((s: GA4Source, i: number) => ({ ...s, color: SOURCE_COLORS[i % SOURCE_COLORS.length] })),
        topPages: pR?.success ? pR.data : [],
        countries: coR?.success ? coR.data : [],
        cities: ciR?.success ? ciR.data : [],
        devices: dR?.success ? dR.data : [],
        browsers: bR?.success ? bR.data : [],
        ageGroups: aR?.success ? aR.data : [],
        outbound: oR?.success ? oR.data : null,
      });
      if (ga4NotConfigured) {
        const missing = Array.isArray(ga4ConfigResponse?.details?.missing)
          ? ga4ConfigResponse.details.missing.join(' ')
          : '';
        setError(
          `GA4 não configurado no servidor.${missing ? ` ${missing}` : ' Configure Property ID numérico + credenciais da Service Account Google.'}`
        );
      } else if (hasApiError) {
        setError('Erro ao carregar dados do GA4. Verifique as credenciais.');
      } else {
        setError(null);
      }
    } catch (e) {
      setError('Erro ao carregar dados do GA4. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    refreshRef.current = setInterval(load, 60_000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [load]);

  const kpis = data.kpis;
  const deviceIcon = (d: string) => {
    if (d?.toLowerCase().includes('mobile')) return Smartphone;
    if (d?.toLowerCase().includes('tablet')) return Tablet;
    return Monitor;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            ANALYTICS
          </h1>
          <p className="mt-2 text-gray-400">Google Analytics 4 — Tráfego e Comportamento</p>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeVisitors />
          <div className="flex gap-2">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => { setDays(d); }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  days === d ? 'bg-[#D4AF37] text-white' : 'border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button onClick={() => { setLoading(true); load(); }} className="rounded-full p-1.5 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <p className="text-sm text-yellow-300">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* KPIs row */}
          <div className="grid gap-4 md:grid-cols-4">
            <KpiCard icon={Users} label={`Usuários (${days}d)`} value={kpis?.totalUsers || 0} color="text-blue-400" />
            <KpiCard icon={Eye} label="Visualizações" value={kpis?.totalViews || 0} color="text-purple-400" />
            <KpiCard icon={Layers} label="Sessões" value={kpis?.totalSessions || 0} color="text-green-400" />
            <KpiCard icon={MousePointer} label="Eventos" value={kpis?.totalEvents || 0} color="text-yellow-400" />
          </div>

          {/* Traffic chart */}
          <AnalyticsChart data={data.traffic} />

          {/* Sources + Top Pages */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sources */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-4 w-4 text-[#D4AF37]" />
                <h2 className="text-sm font-semibold text-white">Fontes de Tráfego</h2>
              </div>
              <div className="space-y-2">
                {data.sources.slice(0, 10).map((s, i) => {
                  const maxUsers = data.sources[0]?.users || 1;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-white truncate">{s.source || '(direct)'}</span>
                          <span className="text-[10px] text-gray-400">{s.users}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(s.users / maxUsers) * 100}%`, backgroundColor: s.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {data.sources.length === 0 && <p className="text-center text-xs text-gray-500 py-4">Sem dados GA4</p>}
              </div>
            </GlassCard>

            {/* Top Pages */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-[#D4AF37]" />
                <h2 className="text-sm font-semibold text-white">Top Páginas</h2>
              </div>
              <div className="space-y-2">
                {data.topPages.slice(0, 10).map((p, i) => {
                  const maxViews = data.topPages[0]?.views || 1;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-5 text-center text-[10px] font-bold text-[#D4AF37]">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-white truncate">{p.title}</span>
                          <span className="text-[10px] text-gray-400">{p.views}</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] rounded-full" style={{ width: `${(p.views / maxViews) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {data.topPages.length === 0 && <p className="text-center text-xs text-gray-500 py-4">Sem dados GA4</p>}
              </div>
            </GlassCard>
          </div>

          {/* Countries + Cities */}
          <div className="grid gap-4 md:grid-cols-2">
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-4 w-4 text-[#D4AF37]" />
                <h2 className="text-sm font-semibold text-white">Países</h2>
              </div>
              <div className="space-y-2">
                {data.countries.slice(0, 10).map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
                    <span className="text-xs text-white">{getFlag(c.country)} {c.country}</span>
                    <span className="text-xs font-semibold text-[#D4AF37]">{c.users.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
                {data.countries.length === 0 && <p className="text-center text-xs text-gray-500 py-4">Sem dados</p>}
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-[#D4AF37]" />
                <h2 className="text-sm font-semibold text-white">Cidades</h2>
              </div>
              <div className="space-y-2">
                {data.cities.slice(0, 10).map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
                    <span className="text-xs text-white">{c.city}</span>
                    <span className="text-xs font-semibold text-[#D4AF37]">{c.users.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
                {data.cities.length === 0 && <p className="text-center text-xs text-gray-500 py-4">Sem dados</p>}
              </div>
            </GlassCard>
          </div>

          {/* Devices + Browsers + Age */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Devices */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="h-4 w-4 text-[#D4AF37]" />
                <h2 className="text-sm font-semibold text-white">Dispositivos</h2>
              </div>
              <div className="space-y-3">
                {data.devices.map((d, i) => {
                  const Icon = deviceIcon(d.device);
                  const total = data.devices.reduce((s, x) => s + x.users, 0) || 1;
                  const pct = ((d.users / total) * 100).toFixed(1);
                  return (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-white/5 p-3">
                      <Icon className="h-6 w-6 text-[#D4AF37]" />
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-white capitalize">{d.device}</span>
                          <span className="text-[10px] text-gray-400">{pct}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white">{d.users.toLocaleString('pt-BR')}</span>
                    </div>
                  );
                })}
                {data.devices.length === 0 && <p className="text-center text-xs text-gray-500 py-4">Sem dados</p>}
              </div>
            </GlassCard>

            {/* Browsers */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <Chrome className="h-4 w-4 text-[#D4AF37]" />
                <h2 className="text-sm font-semibold text-white">Navegadores</h2>
              </div>
              <div className="space-y-2">
                {data.browsers.slice(0, 8).map((b, i) => {
                  const total = data.browsers.reduce((s, x) => s + x.users, 0) || 1;
                  const pct = ((b.users / total) * 100).toFixed(1);
                  return (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
                      <span className="text-xs text-white">{b.browser}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{pct}%</span>
                        <span className="text-xs font-bold text-[#D4AF37]">{b.users.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  );
                })}
                {data.browsers.length === 0 && <p className="text-center text-xs text-gray-500 py-4">Sem dados</p>}
              </div>
            </GlassCard>

            {/* Age groups */}
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="h-4 w-4 text-[#D4AF37]" />
                <h2 className="text-sm font-semibold text-white">Faixa Etária</h2>
              </div>
              <div className="space-y-2">
                {data.ageGroups.map((a, i) => {
                  const total = data.ageGroups.reduce((s, x) => s + x.users, 0) || 1;
                  const pct = ((a.users / total) * 100).toFixed(1);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-12 text-xs text-gray-400">{a.age}</span>
                      <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] rounded-full flex items-center justify-end pr-1" style={{ width: `${pct}%` }}>
                          <span className="text-[8px] font-bold text-black">{pct}%</span>
                        </div>
                      </div>
                      <span className="w-10 text-right text-xs font-bold text-white">{a.users}</span>
                    </div>
                  );
                })}
                {data.ageGroups.length === 0 && <p className="text-center text-xs text-gray-500 py-4">Sem dados (requer Google Signals)</p>}
              </div>
            </GlassCard>
          </div>

          {/* Outbound clicks */}
          {data.outbound && data.outbound.summary.total > 0 && (
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <ExternalLink className="h-4 w-4 text-[#D4AF37]" />
                <h2 className="text-sm font-semibold text-white">Cliques de Saída</h2>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-center">
                  <p className="text-lg font-bold text-green-400">{data.outbound.summary.whatsapp}</p>
                  <p className="text-[10px] text-gray-400">WhatsApp</p>
                </div>
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-center">
                  <p className="text-lg font-bold text-blue-400">{data.outbound.summary.appstore}</p>
                  <p className="text-[10px] text-gray-400">App Store</p>
                </div>
                <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-center">
                  <p className="text-lg font-bold text-purple-400">{data.outbound.summary.playstore}</p>
                  <p className="text-[10px] text-gray-400">Play Store</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-lg font-bold text-white">{data.outbound.summary.external}</p>
                  <p className="text-[10px] text-gray-400">Externos</p>
                </div>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {data.outbound.clicks.slice(0, 15).map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-white/5 px-3 py-1.5">
                    <span className="text-[10px] text-gray-400 truncate max-w-[60%]">{c.url}</span>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
                        c.category === 'whatsapp' ? 'bg-green-500/10 text-green-400' :
                        c.category === 'appstore' ? 'bg-blue-500/10 text-blue-400' :
                        c.category === 'playstore' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-white/10 text-gray-400'
                      }`}>{c.category}</span>
                      <span className="text-xs font-bold text-[#D4AF37]">{c.clicks}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
