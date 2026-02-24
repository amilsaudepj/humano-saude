'use client';

import { useState, useEffect } from 'react';
import { ArrowDown, Users, FileCheck, Handshake, Trophy } from 'lucide-react';
import { getPipeline } from '@/app/actions/clientes';
import { getCorretoresMap } from '@/app/actions/indicacoes-admin';

interface PipelineItem {
  lead_id: string;
  nome: string;
  whatsapp: string;
  lead_status: string;
  corretor_id?: string | null;
  cotacao_id?: string;
  numero_cotacao?: string;
  cotacao_status?: string;
  proposta_id?: string;
  proposta_status?: string;
  operadora?: string;
  valor_mensal?: number;
}

const FUNNEL_STAGES = [
  { key: 'novo', label: 'Novos Leads', icon: Users, color: 'bg-blue-500', textColor: 'text-blue-400' },
  { key: 'contatado', label: 'Contatados', icon: Users, color: 'bg-cyan-500', textColor: 'text-cyan-400' },
  { key: 'negociando', label: 'Em Negociação', icon: Handshake, color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  { key: 'cotacao_enviada', label: 'Cotação Enviada', icon: FileCheck, color: 'bg-orange-500', textColor: 'text-orange-400' },
  { key: 'convertido', label: 'Convertidos', icon: Trophy, color: 'bg-green-500', textColor: 'text-green-400' },
];

export default function FunilPage() {
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [corretorMap, setCorretorMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [res, map] = await Promise.all([getPipeline(), getCorretoresMap()]);
      if (res.success) setPipeline(res.data || []);
      setCorretorMap(map);
      setLoading(false);
    }
    load();
  }, []);

  const stageCounts = FUNNEL_STAGES.map((stage) => ({
    ...stage,
    count: pipeline.filter((p) => p.lead_status === stage.key).length,
  }));

  const maxCount = Math.max(...stageCounts.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
          FUNIL DE VENDAS
        </h1>
        <p className="mt-2 text-gray-400">Visualização completa do pipeline comercial</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Funil Visual */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Funil Comercial</h2>
            <div className="flex flex-col items-center gap-2">
              {stageCounts.map((stage, i) => {
                const widthPercent = Math.max(20, (stage.count / maxCount) * 100);
                return (
                  <div key={stage.key} className="w-full flex flex-col items-center">
                    <div
                      className={`${stage.color} rounded-lg py-4 px-6 flex items-center justify-between text-white font-semibold transition-all`}
                      style={{ width: `${widthPercent}%`, minWidth: '200px' }}
                    >
                      <div className="flex items-center gap-2">
                        <stage.icon className="h-5 w-5" />
                        <span>{stage.label}</span>
                      </div>
                      <span className="text-xl font-bold">{stage.count}</span>
                    </div>
                    {i < stageCounts.length - 1 && (
                      <ArrowDown className="h-5 w-5 text-gray-600 my-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Taxa de Conversão */}
          <div className="grid gap-4 md:grid-cols-4">
            {stageCounts.slice(0, -1).map((stage, i) => {
              const next = stageCounts[i + 1];
              const rate = stage.count > 0 ? ((next.count / stage.count) * 100).toFixed(1) : '0';
              return (
                <div key={`conv-${i}`} className="rounded-lg border border-white/10 bg-[#0a0a0a] p-4 text-center">
                  <p className="text-sm text-gray-400 mb-1">{stage.label} → {next.label}</p>
                  <p className="text-2xl font-bold text-[#D4AF37]">{rate}%</p>
                </div>
              );
            })}
          </div>

          {/* Tabela por Estágio */}
          {FUNNEL_STAGES.map((stage) => {
            const items = pipeline.filter((p) => p.lead_status === stage.key);
            if (items.length === 0) return null;
            return (
              <div key={stage.key} className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
                <h3 className={`text-lg font-semibold ${stage.textColor} mb-4 flex items-center gap-2`}>
                  <stage.icon className="h-5 w-5" /> {stage.label} ({items.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-gray-400">
                        <th className="pb-2 pr-4">Nome</th>
                        <th className="pb-2 pr-4">Usuário</th>
                        <th className="pb-2 pr-4">WhatsApp</th>
                        <th className="pb-2 pr-4">Operadora</th>
                        <th className="pb-2 pr-4">Cotação</th>
                        <th className="pb-2 pr-4">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.lead_id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-2 pr-4 text-white">{item.nome}</td>
                          <td className="py-2 pr-4">
                            <span className="text-[#D4AF37] font-medium">
                              {item.corretor_id && corretorMap[item.corretor_id]
                                ? corretorMap[item.corretor_id]
                                : '—'}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-gray-300">{item.whatsapp || '—'}</td>
                          <td className="py-2 pr-4 text-gray-300">{item.operadora || '—'}</td>
                          <td className="py-2 pr-4 text-gray-300">{item.numero_cotacao || '—'}</td>
                          <td className="py-2 pr-4 text-[#D4AF37] font-semibold">
                            {item.valor_mensal ? `R$ ${item.valor_mensal.toLocaleString('pt-BR')}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
