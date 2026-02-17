'use client';

import { useState, useEffect } from 'react';
import {
  Settings, Globe, Brain, Save, CheckCircle,
  Database, Zap, Shield, Eye, EyeOff
} from 'lucide-react';

interface IntegrationStatus {
  name: string;
  key: string;
  connected: boolean;
  envVar: string;
  description: string;
  hint?: string;
}

export default function AISettingsPage() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);

  // Settings state
  const [aiModel, setAiModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState('0.3');
  const [maxTokens, setMaxTokens] = useState('2000');
  const [cacheMinutes, setCacheMinutes] = useState('10');
  const [cronInterval, setCronInterval] = useState('30');
  const [metaCpaTarget, setMetaCpaTarget] = useState('15');
  const [metaRoasTarget, setMetaRoasTarget] = useState('3.0');

  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    // Check integrations status
    async function checkStatus() {
      try {
        const res = await fetch('/api/ai/performance/integrations', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setIntegrations(json.data as IntegrationStatus[]);
        }
      } catch { /* silent */ }
      setLoading(false);
    }
    checkStatus();
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37] flex items-center gap-3" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            <Settings className="h-9 w-9" />
            CONFIGURAÇÕES
          </h1>
          <p className="mt-2 text-gray-400">APIs, modelos de IA, targets e integrações do AI Performance Engine</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#bf953f]"
        >
          {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Integration Status */}
          <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0a0a0a]">
            <div className="border-b border-[#D4AF37]/20 p-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2">
                <Globe className="h-4 w-4" /> Status das Integrações
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {integrations.filter((item) => item.connected).length}/{integrations.length || 0} conectadas
                </span>
                <button
                  onClick={() => setShowKeys(!showKeys)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showKeys ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showKeys ? 'Ocultar' : 'Mostrar'} env vars
                </button>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {integrations.map(int => (
                <div key={int.key} className="p-4 hover:bg-[#151515] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${int.connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                      <div>
                        <p className="text-sm font-medium text-white">{int.name}</p>
                        <p className="text-xs text-gray-500">{int.description}</p>
                        {int.hint && (
                          <p className="text-[11px] text-amber-400/80 mt-1">{int.hint}</p>
                        )}
                        {showKeys && (
                          <code className="text-[10px] text-gray-600 mt-1 block">{int.envVar}</code>
                        )}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      int.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {int.connected ? 'Conectado' : 'Não configurado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Model Settings */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Brain className="h-4 w-4 text-[#D4AF37]" /> Modelo de IA
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Modelo</label>
                  <select
                    value={aiModel}
                    onChange={e => setAiModel(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
                  >
                    <option value="gpt-4o">GPT-4o (Recomendado)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (Econômico)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gemini-2.0-flash-001">Gemini 2.0 Flash (Vertex)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (AI Studio)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={temperature}
                    onChange={e => setTemperature(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-600 mt-0.5">0 = determinístico, 1 = criativo</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Tokens</label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={e => setMaxTokens(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Targets */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#D4AF37]" /> Metas de Performance
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">CPA Máximo (R$)</label>
                  <input
                    type="number"
                    value={metaCpaTarget}
                    onChange={e => setMetaCpaTarget(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-600 mt-0.5">Meta máxima de Custo por Aquisição</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ROAS Mínimo (x)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={metaRoasTarget}
                    onChange={e => setMetaRoasTarget(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-600 mt-0.5">Meta mínima de Retorno sobre Investimento</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cache & Cron */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a]">
            <div className="border-b border-white/10 p-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Database className="h-4 w-4 text-[#D4AF37]" /> Cache & Automação
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cache TTL (minutos)</label>
                  <input
                    type="number"
                    value={cacheMinutes}
                    onChange={e => setCacheMinutes(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-600 mt-0.5">Tempo de cache para análises (reduz custos OpenAI)</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Intervalo Cron (minutos)</label>
                  <input
                    type="number"
                    value={cronInterval}
                    onChange={e => setCronInterval(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-600 mt-0.5">Intervalo entre auditorias automáticas (Camada 5)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Reference */}
          <div className="rounded-lg border border-white/5 bg-[#0a0a0a] p-5">
            <h3 className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4" /> Arquitetura do Motor
            </h3>
            <div className="grid gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-[#D4AF37] font-bold w-20">Camada 1</span>
                <span className="text-gray-400">AI Performance Engine — GPT-4o com fallback para análise local</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#D4AF37] font-bold w-20">Camada 2</span>
                <span className="text-gray-400">AI Advisor — Análise por campanha com chat contextual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#D4AF37] font-bold w-20">Camada 3</span>
                <span className="text-gray-400">Smart Analyzer — 100% local, sem dependência de AI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#D4AF37] font-bold w-20">Camada 4</span>
                <span className="text-gray-400">Campaign Analyzer — Funil × Nível de Consciência</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#D4AF37] font-bold w-20">Camada 5</span>
                <span className="text-gray-400">Ads Auditor — Cron automático com regras configuráveis</span>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                <span className="text-[#D4AF37] font-bold w-20">Hub</span>
                <span className="text-gray-400">Analytics Hub — Meta + GA4 + Gateway → KPIs derivados (ROAS Real, CPA Real, Conversão Real)</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
