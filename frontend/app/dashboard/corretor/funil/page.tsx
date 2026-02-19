'use client';

import { useState, useEffect } from 'react';
import { Filter, ArrowDown, Users, Sparkles, FileCheck, FileText, Trophy, XCircle, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { useCorretorId } from '../hooks/useCorretorToken';
import { getCrmStats } from '@/app/actions/corretor-crm';
import type { CrmStats } from '@/app/actions/corretor-crm';

const FUNNEL_STAGES: {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  textColor: string;
  excludeFromConversion?: boolean;
}[] = [
  { key: 'novo_lead', label: 'Novos Leads', icon: Users, color: 'bg-blue-500', textColor: 'text-blue-400' },
  { key: 'qualificado', label: 'Qualificados', icon: Sparkles, color: 'bg-purple-500', textColor: 'text-purple-400' },
  { key: 'proposta_enviada', label: 'Proposta Enviada', icon: FileCheck, color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  { key: 'documentacao', label: 'Documentação', icon: FileText, color: 'bg-cyan-500', textColor: 'text-cyan-400' },
  { key: 'fechado', label: 'Fechados', icon: Trophy, color: 'bg-green-500', textColor: 'text-green-400' },
  { key: 'perdido', label: 'Perdidos', icon: XCircle, color: 'bg-red-500', textColor: 'text-red-400', excludeFromConversion: true },
];

export default function FunilCorretorPage() {
  const corretorId = useCorretorId();
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!corretorId) return;
    async function load() {
      const res = await getCrmStats(corretorId!);
      if (res.success && res.data) setStats(res.data);
      setLoading(false);
    }
    load();
  }, [corretorId]);

  if (!corretorId) return null;

  const stageCounts = FUNNEL_STAGES.map((stage) => ({
    ...stage,
    count: stats?.porColuna?.[stage.key as keyof typeof stats.porColuna] ?? 0,
  }));

  // Max count for funnel width (exclude "perdido" from width calculation)
  const activeStageCounts = stageCounts.filter((s) => !s.excludeFromConversion);
  const maxCount = Math.max(...activeStageCounts.map((s) => s.count), 1);

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-[#D4AF37] flex items-center gap-3" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          <Filter className="h-8 w-8" />
          FUNIL DE VENDAS
        </h1>
        <p className="mt-2 text-gray-400">Visualização completa do seu pipeline comercial</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : !stats ? (
        <div className="text-center py-20 text-white/40">
          Nenhum dado encontrado
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-white/40">Total de Leads</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalLeads}</p>
            </div>
            <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xs text-white/40">Pipeline Total</span>
              </div>
              <p className="text-2xl font-bold text-[#D4AF37]">
                R$ {stats.valorTotalPipeline.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-green-400" />
                <span className="text-xs text-white/40">Valor Fechado</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                R$ {stats.valorFechado.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-white/40">Taxa de Conversão</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{stats.taxaConversao}%</p>
            </div>
          </div>

          {/* Funil Visual */}
          <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#D4AF37]" />
              Funil Comercial
            </h2>
            <div className="flex flex-col items-center gap-2">
              {activeStageCounts.map((stage, i) => {
                const widthPercent = Math.max(20, (stage.count / maxCount) * 100);
                return (
                  <div key={stage.key} className="w-full flex flex-col items-center">
                    <div
                      className={`${stage.color} rounded-lg py-4 px-6 flex items-center justify-between text-white font-semibold transition-all hover:brightness-110`}
                      style={{ width: `${widthPercent}%`, minWidth: '200px' }}
                    >
                      <div className="flex items-center gap-2">
                        <stage.icon className="h-5 w-5" />
                        <span>{stage.label}</span>
                      </div>
                      <span className="text-xl font-bold">{stage.count}</span>
                    </div>
                    {i < activeStageCounts.length - 1 && (
                      <ArrowDown className="h-5 w-5 text-gray-600 my-1" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Perdidos (separado) */}
            {(stats.porColuna?.perdido ?? 0) > 0 && (
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-center">
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg py-3 px-6 flex items-center gap-3 text-red-400 font-semibold">
                    <XCircle className="h-5 w-5" />
                    <span>Perdidos</span>
                    <span className="text-xl font-bold">{stats.porColuna.perdido}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Taxas de Conversão entre etapas */}
          <div className="grid gap-4 md:grid-cols-4">
            {activeStageCounts.slice(0, -1).map((stage, i) => {
              const next = activeStageCounts[i + 1];
              const rate = stage.count > 0 ? ((next.count / stage.count) * 100).toFixed(1) : '0.0';
              return (
                <div key={`conv-${i}`} className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 text-center">
                  <p className="text-xs text-gray-400 mb-2 leading-tight">
                    {stage.label} → {next.label}
                  </p>
                  <p className="text-2xl font-bold text-[#D4AF37]">{rate}%</p>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#D4AF37]/60 transition-all"
                      style={{ width: `${Math.min(parseFloat(rate), 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Distribuição de Scores */}
          {stats.scoreDistribuicao && stats.scoreDistribuicao.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                Distribuição por Lead Score
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.scoreDistribuicao.map((faixa) => {
                  const colors: Record<string, { bg: string; text: string; bar: string }> = {
                    '0-25': { bg: 'bg-red-500/10', text: 'text-red-400', bar: 'bg-red-500' },
                    '26-50': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', bar: 'bg-yellow-500' },
                    '51-75': { bg: 'bg-blue-500/10', text: 'text-blue-400', bar: 'bg-blue-500' },
                    '76-100': { bg: 'bg-green-500/10', text: 'text-green-400', bar: 'bg-green-500' },
                  };
                  const c = colors[faixa.faixa] ?? { bg: 'bg-white/5', text: 'text-white/60', bar: 'bg-white/40' };
                  const pct = stats.totalLeads > 0 ? Math.round((faixa.count / stats.totalLeads) * 100) : 0;

                  return (
                    <div key={faixa.faixa} className={`rounded-xl border border-white/10 ${c.bg} p-4`}>
                      <p className="text-xs text-white/40 mb-1">Score {faixa.faixa}</p>
                      <p className={`text-2xl font-bold ${c.text}`}>{faixa.count}</p>
                      <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-white/30 mt-1">{pct}% do total</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
