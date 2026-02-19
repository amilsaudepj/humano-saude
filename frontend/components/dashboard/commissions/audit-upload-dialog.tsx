'use client';

import { useState, useRef } from 'react';
import { Upload, FileSearch, Loader2, AlertTriangle, CheckCircle2, XCircle, X } from 'lucide-react';
import type { AuditResult, AuditDivergence } from '@/lib/types/commissions';
import { toast } from 'sonner';

type Props = {
  referenceMonth: string;
  onAuditComplete: () => void;
};

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function AuditUploadDialog({ referenceMonth, onAuditComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [operatorName, setOperatorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file || !operatorName) {
      toast.warning('Selecione um PDF e informe a operadora');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operator_name', operatorName);
      formData.append('reference_month', referenceMonth);

      const res = await fetch('/api/admin/commissions/audit', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro na auditoria');
      }

      const data: AuditResult = await res.json();
      setResult(data);

      if (data.divergences.length === 0) {
        toast.success('Auditoria concluída — sem divergências!');
      } else {
        toast.warning(`Auditoria encontrou ${data.divergences.length} divergência(s)`);
      }

      onAuditComplete();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro inesperado';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function renderDivergenceIcon(type: AuditDivergence['type']) {
    switch (type) {
      case 'amount_mismatch':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'missing_in_statement':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'missing_in_ledger':
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case 'extra_in_statement':
        return <CheckCircle2 className="h-4 w-4 text-blue-400" />;
    }
  }

  const divergenceLabel: Record<AuditDivergence['type'], string> = {
    amount_mismatch: 'Valor divergente',
    missing_in_statement: 'Faltando no extrato',
    missing_in_ledger: 'Faltando no sistema',
    extra_in_statement: 'Extra no extrato',
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400 hover:bg-purple-500/20 transition-colors"
      >
        <FileSearch className="h-4 w-4" />
        Auditoria IA (Gemini)
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0f0f0f] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Auditoria de Comissões — Gemini</h2>
            <p className="text-sm text-gray-400 mt-1">
              Envie o PDF do extrato da operadora para cruzar com o sistema
            </p>
          </div>
          <button onClick={() => { setOpen(false); setResult(null); setFile(null); }} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        {!result && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Operadora</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Ex: Bradesco Saúde, SulAmérica, Amil..."
                className="w-full rounded-md border border-white/10 bg-[#111] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">PDF do Extrato</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-white/10 bg-[#111] p-8 hover:border-[#D4AF37]/30 transition-colors"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-[#D4AF37] mx-auto mb-2" />
                    <p className="text-sm text-white font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Clique para selecionar o PDF</p>
                    <p className="text-xs text-gray-600">Máximo 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-[#111] rounded-md p-3 border border-white/5">
              <p className="font-medium text-gray-400 mb-1">Como funciona:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>O Gemini (Vertex AI) lê e extrai os dados do PDF da operadora</li>
                <li>Compara cada vida/valor com os lançamentos do sistema</li>
                <li>Gera relatório de divergências (centavos, vidas faltando, extras)</li>
                <li>Atualiza automaticamente o status de auditoria de cada lançamento</li>
              </ol>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || !operatorName || loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-3 text-sm font-semibold text-black hover:bg-[#C4A030] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando com Gemini...
                </>
              ) : (
                <>
                  <FileSearch className="h-4 w-4" />
                  Iniciar Auditoria
                </>
              )}
            </button>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-white/10 bg-[#111] p-4 text-center">
                <p className="text-2xl font-bold text-white">{result.raw_extracted_entries}</p>
                <p className="text-xs text-gray-400">Vidas no PDF</p>
              </div>
              <div className="rounded-lg border border-green-500/20 bg-[#111] p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{result.match_count}</p>
                <p className="text-xs text-gray-400">Conferem</p>
              </div>
              <div className={`rounded-lg border p-4 text-center ${result.divergences.length > 0 ? 'border-red-500/20' : 'border-white/10'} bg-[#111]`}>
                <p className={`text-2xl font-bold ${result.divergences.length > 0 ? 'text-red-400' : 'text-white'}`}>
                  {result.divergences.length}
                </p>
                <p className="text-xs text-gray-400">Divergências</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-[#111] p-3">
                <p className="text-sm text-gray-400">Esperado (sistema)</p>
                <p className="text-lg font-bold text-white">{formatBRL(result.total_expected)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#111] p-3">
                <p className="text-sm text-gray-400">Encontrado (PDF)</p>
                <p className="text-lg font-bold text-white">{formatBRL(result.total_found)}</p>
              </div>
            </div>

            {/* Divergências */}
            {result.divergences.length > 0 && (
              <div className="rounded-lg border border-red-500/10 bg-[#111] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-red-400">Divergências Encontradas</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {result.divergences.map((div, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-3">
                      {renderDivergenceIcon(div.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{div.titular_name}</span>
                          <span className="text-xs font-mono text-gray-500">{div.proposal_number}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{div.details}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            div.type === 'amount_mismatch' ? 'bg-yellow-500/10 text-yellow-400' :
                            div.type === 'missing_in_statement' ? 'bg-red-500/10 text-red-400' :
                            div.type === 'missing_in_ledger' ? 'bg-orange-500/10 text-orange-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            {divergenceLabel[div.type]}
                          </span>
                          {div.type === 'amount_mismatch' && (
                            <span className="text-xs text-gray-500">
                              Esperado: {formatBRL(div.expected_amount)} | PDF: {formatBRL(div.actual_amount || 0)} | Diferença: {formatBRL(div.difference)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.divergences.length === 0 && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
                <p className="text-lg font-semibold text-green-400">Sem divergências!</p>
                <p className="text-sm text-gray-400 mt-1">Todos os lançamentos conferem com o extrato</p>
              </div>
            )}

            <button
              onClick={() => { setResult(null); setFile(null); setOperatorName(''); }}
              className="w-full rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5 transition-colors"
            >
              Nova Auditoria
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
