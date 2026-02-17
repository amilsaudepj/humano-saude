'use client';

import { useState, useEffect } from 'react';
import {
  Scale, TrendingUp, DollarSign, Pause, Play, AlertTriangle,
  RefreshCw, Target, BarChart3, Zap, ArrowUpRight, ArrowDownRight,
  CheckCircle, Clock, ShieldAlert
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  roas: number;
  cpa: number;
  ctr: number;
  purchases: number;
  impressions: number;
  clicks: number;
}

interface ScaleRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
}

export default function EscalaAutomaticaPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationSummary, setOptimizationSummary] = useState<{
    adsAnalyzed: number;
    paused: number;
    scaled: number;
    noAction: number;
  } | null>(null);
  const [recommendations, setRecommendations] = useState<Array<{
    campaignId: string;
    campaignName: string;
    action: string;
    reason: string;
    currentBudget: number;
    suggestedBudget: number;
    confidence: number;
  }>>([]);

  const scaleRules: ScaleRule[] = [
    { id: '1', name: 'ROAS Alto → Escalar', condition: 'ROAS ≥ 3x por 3 dias', action: 'Aumentar budget 20%', enabled: true },
    { id: '2', name: 'CPA Alto → Reduzir', condition: 'CPA ≥ 2x meta', action: 'Reduzir budget 30%', enabled: true },
    { id: '3', name: 'Sangria → Pausar', condition: 'Spend ≥ R$50 sem conversão', action: 'Pausar campanha', enabled: true },
    { id: '4', name: 'CTR Excelente → Escalar', condition: 'CTR ≥ 2.5%', action: 'Aumentar budget 15%', enabled: false },
    { id: '5', name: 'Fadiga → Alertar', condition: 'Frequency ≥ 3.0', action: 'Notificar para trocar criativos', enabled: true },
  ];

  useEffect(() => {
    async function load() {
      try {
        const [insightsRes, optimizeRes] = await Promise.all([
          fetch('/api/ai/campaign-insights?period=last_7d'),
          fetch('/api/ads/optimize?days=7&limit=30'),
        ]);

        const insightsJson = await insightsRes.json();
        if (insightsJson.success && insightsJson.data?.campaigns) {
          setCampaigns(insightsJson.data.campaigns);
        }

        const optimizeJson = await optimizeRes.json();
        if (optimizeJson.success && optimizeJson.summary) {
          setOptimizationSummary(optimizeJson.summary);
        }
      } catch { /* silent */ }
      setLoading(false);
    }
    load();
  }, []);

  const analyzeScale = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/ai/smart-analysis?period=last_7d');
      const json = await res.json();

      // Gerar recomendações de escala baseadas nos dados
      const recs: typeof recommendations = [];
      if (json.success && json.data?.recommendations) {
        json.data.recommendations
          .filter((r: { category: string }) => r.category === 'budget')
          .forEach((r: { action: string; reason: string }, i: number) => {
            recs.push({
              campaignId: `auto-${i}`,
              campaignName: 'Geral',
              action: r.action,
              reason: r.reason,
              currentBudget: 0,
              suggestedBudget: 0,
              confidence: 0.85,
            });
          });
      }
      setRecommendations(recs);
    } catch { /* silent */ }
    setAnalyzing(false);
  };

  const optimizeNow = async () => {
    setOptimizing(true);
    try {
      const res = await fetch('/api/ads/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: {} }),
      });
      const json = await res.json();

      if (json.success && json.summary) {
        setOptimizationSummary(json.summary);

        const recs: typeof recommendations = (json.logs || [])
          .filter((l: { actionType: string }) => l.actionType === 'PAUSE' || l.actionType === 'SCALE')
          .slice(0, 8)
          .map((l: { adId: string; adName: string; actionType: string; reason: string }, i: number) => ({
            campaignId: l.adId || `opt-${i}`,
            campaignName: l.adName || 'Anúncio',
            action: l.actionType === 'PAUSE' ? 'Pausar anúncio' : 'Escalar orçamento',
            reason: l.reason || 'Regra automática aplicada',
            currentBudget: 0,
            suggestedBudget: 0,
            confidence: 0.9,
          }));

        if (recs.length > 0) {
          setRecommendations(recs);
        }
      }
    } catch { /* silent */ }
    setOptimizing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37] flex items-center gap-3" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            <Scale className="h-9 w-9" />
            ESCALA AUTOMÁTICA
          </h1>
          <p className="mt-2 text-gray-400">Budget dinâmico baseado em performance real — Camada 5 + IA</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={analyzeScale}
            disabled={analyzing}
            className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#bf953f] disabled:opacity-50"
          >
            {analyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {analyzing ? 'Analisando...' : 'Analisar Escala'}
          </button>
          <button
            onClick={optimizeNow}
            disabled={optimizing}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {optimizing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {optimizing ? 'Otimizando...' : 'Otimizar Agora'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {optimizationSummary && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
                <p className="text-xs text-gray-500">Ads analisados</p>
                <p className="mt-1 text-2xl font-bold text-white">{optimizationSummary.adsAnalyzed}</p>
              </div>
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-xs text-red-300">Pausados</p>
                <p className="mt-1 text-2xl font-bold text-red-300">{optimizationSummary.paused}</p>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs text-emerald-300">Escalados</p>
                <p className="mt-1 text-2xl font-bold text-emerald-300">{optimizationSummary.scaled}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
                <p className="text-xs text-gray-500">Sem ação</p>
                <p className="mt-1 text-2xl font-bold text-white">{optimizationSummary.noAction}</p>
              </div>
            </div>
          )}

          {/* Scale Rules */}
          <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a]">
            <div className="border-b border-[#D4AF37]/20 p-4">
              <h2 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Regras de Escala Automática
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {scaleRules.map(rule => (
                <div key={rule.id} className="flex items-center justify-between p-4 hover:bg-[#151515] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${rule.enabled ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{rule.name}</p>
                      <p className="text-xs text-gray-500">
                        Se <span className="text-[#D4AF37]">{rule.condition}</span> → {rule.action}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    rule.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-500'
                  }`}>
                    {rule.enabled ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="rounded-lg border border-emerald-500/20 bg-[#0a0a0a]">
              <div className="border-b border-emerald-500/20 p-4">
                <h2 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Recomendações de Escala
                </h2>
              </div>
              <div className="divide-y divide-white/5">
                {recommendations.map((rec, i) => (
                  <div key={i} className="p-4 hover:bg-[#151515] transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                      <p className="text-sm font-medium text-white">{rec.action}</p>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">{rec.reason}</p>
                    <div className="ml-6 mt-1">
                      <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded">
                        Confiança: {(rec.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaign Overview for Scale */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
                <BarChart3 className="h-4 w-4 text-[#D4AF37]" /> Campanhas × Potencial de Escala
              </h2>
            </div>
            {campaigns.length === 0 ? (
              <div className="p-12 text-center text-gray-600 text-sm">
                Nenhuma campanha ativa encontrada. Configure Meta Ads para começar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left">
                      <th className="p-3 text-xs text-gray-500 font-medium">Campanha</th>
                      <th className="p-3 text-xs text-gray-500 font-medium text-right">Spend</th>
                      <th className="p-3 text-xs text-gray-500 font-medium text-right">ROAS</th>
                      <th className="p-3 text-xs text-gray-500 font-medium text-right">CPA</th>
                      <th className="p-3 text-xs text-gray-500 font-medium text-right">Conversões</th>
                      <th className="p-3 text-xs text-gray-500 font-medium text-center">Potencial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {campaigns.slice(0, 10).map(c => {
                      const potential = c.roas >= 3 ? 'alto' : c.roas >= 1.5 ? 'medio' : 'baixo';
                      return (
                        <tr key={c.id} className="hover:bg-[#151515] transition-colors">
                          <td className="p-3">
                            <p className="text-white font-medium truncate max-w-[200px]">{c.name}</p>
                            <p className="text-[10px] text-gray-600">{c.objective}</p>
                          </td>
                          <td className="p-3 text-right text-gray-300">R$ {c.spend.toFixed(2)}</td>
                          <td className={`p-3 text-right font-semibold ${c.roas >= 3 ? 'text-emerald-400' : c.roas >= 1 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
                            {c.roas.toFixed(2)}x
                          </td>
                          <td className="p-3 text-right text-gray-300">R$ {c.cpa.toFixed(2)}</td>
                          <td className="p-3 text-right text-white">{c.purchases}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              potential === 'alto' ? 'bg-emerald-500/20 text-emerald-400' :
                              potential === 'medio' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {potential === 'alto' ? <ArrowUpRight className="h-3 w-3" /> :
                               potential === 'medio' ? <Target className="h-3 w-3" /> :
                               <ArrowDownRight className="h-3 w-3" />}
                              {potential}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
