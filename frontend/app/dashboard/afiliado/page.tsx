'use client';

import { useState, useEffect } from 'react';
import { getIndicacoesAfiliado } from '@/app/actions/leads-indicacao';
import type { LeadIndicacao } from '@/app/actions/leads-indicacao';
import { getAfiliadoLogado } from '@/app/actions/corretor-afiliados';
import { useAfiliadoId } from './hooks/useAfiliadoToken';
import { UserPlus, Loader2, Phone, Mail, TrendingUp, CheckCircle, Clock, Send, FileCheck, Share2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://humanosaude.com.br');

const STATUS_LABEL: Record<string, string> = {
  simulou: 'Simulou',
  entrou_em_contato: 'Entrou em contato',
  em_analise: 'Em análise',
  proposta_enviada: 'Proposta enviada',
  fechado: 'Fechado',
  perdido: 'Perdido',
};

export default function AfiliadoDashboardPage() {
  const afiliadoId = useAfiliadoId();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeadIndicacao[]>([]);
  const [resumo, setResumo] = useState<{
    total: number;
    simularam: number;
    contataram: number;
    em_analise: number;
    fechados: number;
    taxa_conversao: number;
  } | null>(null);
  const [error, setError] = useState<string>('');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [cadastroCompleto, setCadastroCompleto] = useState<boolean | null>(null);
  const [tokenUnico, setTokenUnico] = useState<string | null>(null);

  useEffect(() => {
    getAfiliadoLogado().then((res) => {
      if (res.success && res.afiliado) {
        setCadastroCompleto(res.afiliado.cadastro_completo ?? false);
        setTokenUnico(res.afiliado.token_unico ?? null);
      }
    });
  }, []);

  useEffect(() => {
    if (!afiliadoId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getIndicacoesAfiliado(afiliadoId, { status: statusFiltro === 'todos' ? undefined : statusFiltro })
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
          setResumo(res.resumo ?? null);
        } else {
          setError(res.error || 'Erro ao carregar');
        }
      })
      .finally(() => setLoading(false));
  }, [afiliadoId, statusFiltro]);

  if (!afiliadoId && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/50">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cadastroCompleto === false && (
        <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-white/90">
            Complete seu cadastro (dados bancários e termo) para receber comissões.
          </p>
          <Link
            href="/dashboard/afiliado/completar-cadastro"
            className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F6E05E]"
          >
            <FileCheck className="h-4 w-4" />
            Completar cadastro
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Minhas indicações</h1>
        <p className="text-sm text-white/50 mt-1">Acompanhe o status das pessoas que você indicou.</p>
      </div>

      {resumo && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/50">Total</p>
            <p className="text-xl font-bold text-white">{resumo.total}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/50">Simularam</p>
            <p className="text-xl font-bold text-white">{resumo.simularam}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/50">Em andamento</p>
            <p className="text-xl font-bold text-white">{resumo.contataram}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-white/50">Fechados</p>
            <p className="text-xl font-bold text-[#D4AF37]">{resumo.fechados}</p>
            <p className="text-xs text-white/50">{resumo.taxa_conversao}% conversão</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-white/50">Filtrar:</span>
        {['todos', 'simulou', 'entrou_em_contato', 'em_analise', 'proposta_enviada', 'fechado'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFiltro(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
              statusFiltro === s
                ? 'bg-[#D4AF37] text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {STATUS_LABEL[s] || s}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <UserPlus className="mx-auto h-12 w-12 text-white/30 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Nenhuma indicação ainda</h2>
          <p className="text-sm text-white/50 mb-6 max-w-sm mx-auto">
            Use o botão abaixo para indicar alguém (só preencha os dados da pessoa). Ou envie o link da calculadora para seus clientes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={tokenUnico ? `/indicar?ref=${encodeURIComponent(tokenUnico)}` : '/indicar'}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-black hover:bg-[#F6E05E] transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Nova indicação
            </Link>
            {tokenUnico && (
              <button
                type="button"
                onClick={() => {
                  const link = `${BASE_URL}/economizar/afiliado/${tokenUnico}`;
                  navigator.clipboard.writeText(link);
                  toast.success('Link copiado! Envie para seus clientes economizarem.');
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-all"
              >
                <Share2 className="h-4 w-4" />
                Copiar link Economizar (para clientes)
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Link
              href={tokenUnico ? `/indicar?ref=${encodeURIComponent(tokenUnico)}` : '/indicar'}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F6E05E] transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Nova indicação
            </Link>
            {tokenUnico && (
              <button
                type="button"
                onClick={() => {
                  const link = `${BASE_URL}/economizar/afiliado/${tokenUnico}`;
                  navigator.clipboard.writeText(link);
                  toast.success('Link copiado! Envie para clientes.');
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-all"
              >
                <Share2 className="h-4 w-4" />
                Copiar link Economizar (para clientes)
              </button>
            )}
          </div>
          <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-xs font-medium text-white/50 uppercase">Nome / Contato</th>
                  <th className="px-4 py-3 text-xs font-medium text-white/50 uppercase hidden sm:table-cell">Operadora / Plano</th>
                  <th className="px-4 py-3 text-xs font-medium text-white/50 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-white/50 uppercase">Data</th>
                </tr>
              </thead>
              <tbody>
                {data.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{lead.nome || '—'}</p>
                      {lead.telefone && (
                        <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" /> {lead.telefone}
                        </p>
                      )}
                      {lead.email && (
                        <p className="text-xs text-white/50 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70 hidden sm:table-cell">
                      {lead.operadora_atual || '—'} {lead.plano_atual && `· ${lead.plano_atual}`}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          lead.status === 'fechado'
                            ? 'bg-green-500/20 text-green-400'
                            : lead.status === 'proposta_enviada' || lead.status === 'em_analise'
                            ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        {lead.status === 'fechado' && <CheckCircle className="h-3 w-3" />}
                        {(lead.status === 'em_analise' || lead.status === 'proposta_enviada') && <Clock className="h-3 w-3" />}
                        {lead.status === 'proposta_enviada' && <Send className="h-3 w-3" />}
                        {STATUS_LABEL[lead.status] || lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                          })
                        : '—'}
                    </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
