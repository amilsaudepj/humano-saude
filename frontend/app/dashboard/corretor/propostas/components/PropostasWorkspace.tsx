'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ScannerDocumentos from '@/app/components/ScannerDocumentos';
import type { PDFExtraido } from '@/app/services/api';
import { CheckCircle2, ClipboardList, ListChecks, ScanLine } from 'lucide-react';
import { getExtractionQuickSummary } from '@/lib/extraction-summary';
import { useCorretorId } from '../../hooks/useCorretorToken';
import { listPropostasFilaCorretor, type PropostaFilaItem } from '@/app/actions/propostas-fila';
import {
  PROPOSTA_FILA_STATUS_BADGE_CLASS,
  PROPOSTA_FILA_STATUS_LABELS,
} from '@/lib/propostas-fila-status';

type ProposalMode = 'ia' | 'manual';

interface PropostasWorkspaceProps {
  initialMode?: ProposalMode;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR');
}

export default function PropostasWorkspace({ initialMode = 'ia' }: PropostasWorkspaceProps) {
  const corretorId = useCorretorId();
  const [mode, setMode] = useState<ProposalMode>(initialMode);
  const [lastExtraction, setLastExtraction] = useState<PDFExtraido | null>(null);
  const [fila, setFila] = useState<PropostaFilaItem[]>([]);
  const extractionSummary = getExtractionQuickSummary(lastExtraction);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const loadFila = useCallback(async () => {
    if (!corretorId) return;
    const result = await listPropostasFilaCorretor();
    if (result.success && result.data) {
      setFila(result.data);
    }
  }, [corretorId]);

  useEffect(() => {
    void loadFila();
  }, [loadFila]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Geração de Propostas</h1>
          <p className="mt-1 text-sm text-white/60">
            Escolha o fluxo por IA ou manual para montar a proposta completa.
          </p>
        </div>
        <Badge variant="info" className="gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" /> Fluxo operacional
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className={mode === 'ia' ? 'border-[#D4AF37]/35 bg-[#D4AF37]/5' : 'border-white/10 bg-black/30'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ScanLine className="h-5 w-5 text-[#D4AF37]" />
              Scanner Inteligente
            </CardTitle>
            <CardDescription className="text-white/65">
              Processa documentos com IA e preenche os dados automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-[#D4AF37] text-white hover:bg-[#E8C25B]">
              <Link href="/dashboard/corretor/propostas" onClick={() => setMode('ia')}>
                Usar fluxo IA
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className={mode === 'manual' ? 'border-[#D4AF37]/35 bg-[#D4AF37]/5' : 'border-white/10 bg-black/30'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ClipboardList className="h-5 w-5 text-[#D4AF37]" />
              Manual (um a um)
            </CardTitle>
            <CardDescription className="text-white/65">
              Digite os dados e anexe documento por documento, beneficiário por beneficiário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-[#D4AF37] text-white hover:bg-[#E8C25B]">
              <Link href="/dashboard/corretor/propostas/manual" onClick={() => setMode('manual')}>
                Usar fluxo manual
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ListChecks className="h-5 w-5 text-[#D4AF37]" />
              Fila de Propostas
            </CardTitle>
            <CardDescription className="text-white/65">
              Acompanhe suas propostas enviadas e o andamento operacional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full border-[#D4AF37]/35 bg-black/40 text-white hover:bg-black/60 hover:text-white">
              <Link href="/dashboard/corretor/propostas/fila">
                Abrir fila operacional
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {mode === 'manual' && (
        <Card className="border-white/10 bg-black/30">
          <CardContent className="p-4 text-sm text-white/80">
            <p className="font-medium text-white">Modo manual ativo</p>
            <p className="mt-1">
              Preencha os campos obrigatórios e anexe cada documento no checklist. O sistema permite validação
              um a um por modalidade e beneficiário.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ScannerDocumentos
            key={mode}
            onDadosExtraidos={setLastExtraction}
            corretorId={corretorId || undefined}
            registrarFilaProposta
            permitirLeadExistente
            onPropostaSalva={loadFila}
          />
        </div>

        <div className="space-y-4">
          <Card className="h-fit border-white/10 bg-black/30">
            <CardHeader>
              <CardTitle className="text-white text-base">Última extração</CardTitle>
              <CardDescription className="text-white/60">
                Resumo do último documento processado no fluxo atual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-white/80">
              <p>
                <span className="text-white/50">{extractionSummary.entityLabel}:</span> {extractionSummary.entityValue}
              </p>
              <p>
                <span className="text-white/50">{extractionSummary.peopleLabel}:</span> {extractionSummary.peopleValue}
              </p>
              <p>
                <span className="text-white/50">{extractionSummary.ageLabel}:</span> {extractionSummary.ageValue}
              </p>
              <p>
                <span className="text-white/50">Documento:</span> {extractionSummary.documentValue}
              </p>
              <p>
                <span className="text-white/50">Confiança:</span> {extractionSummary.confidenceValue}
              </p>
            </CardContent>
          </Card>

          {fila.length > 0 && (
            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="text-white text-base">Últimas propostas</CardTitle>
                <CardDescription className="text-white/60">
                  Status da sua fila operacional.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {fila.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-lg border border-white/10 bg-black/25 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {item.lead?.nome || 'Lead sem nome'}
                        </p>
                        <p className="text-xs text-white/45">
                          {item.categoria || 'Categoria não informada'} · {formatDate(item.created_at)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={PROPOSTA_FILA_STATUS_BADGE_CLASS[item.status]}
                      >
                        {PROPOSTA_FILA_STATUS_LABELS[item.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
