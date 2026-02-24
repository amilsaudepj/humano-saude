'use client';

import { Fragment, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  User,
  Phone,
  Mail,
  Building2,
  CreditCard,
  Users,
  FileText,
  Image as ImageIcon,
  Clock,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  BadgeDollarSign,
  Paperclip,
  ScanLine,
  BarChart3,
  Tag,
  Download,
  X,
  Eye,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ClientScannerQuickPanel from '@/app/components/ClientScannerQuickPanel';

// ============================================
// TYPES
// ============================================

interface LeadDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any | null;
}

// ============================================
// HELPERS
// ============================================

function formatCurrency(v: number | string | null | undefined): string {
  if (!v) return '—';
  const num = typeof v === 'string' ? parseFloat(v) : v;
  if (isNaN(num)) return '—';
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(d: string | null | undefined): string {
  if (!d) return '—';
  const date = new Date(d);
  return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5">
      <span className="text-xs text-white/40 shrink-0">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-[#D4AF37] hover:text-[#F6E05E] flex items-center gap-1 text-right">
          {value}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : (
        <span className="text-sm text-white text-right">{value || '—'}</span>
      )}
    </div>
  );
}

// ============================================
// PREVIEW MODAL (Popup para visualizar docs/faturas)
// ============================================

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(url);
}

function isPdfUrl(url: string): boolean {
  return /\.pdf/i.test(url);
}

function getFileName(url: string, fallback: string): string {
  try {
    const path = new URL(url).pathname;
    const name = path.split('/').pop() || fallback;
    return decodeURIComponent(name);
  } catch {
    return fallback;
  }
}

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  title: string;
}

function PreviewModal({ open, onOpenChange, url, title }: PreviewModalProps) {
  const [zoom, setZoom] = useState(1);

  if (!url) return null;

  const isImage = isImageUrl(url);
  const isPdf = isPdfUrl(url);
  const fileName = getFileName(url, title);

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: abrir em nova aba
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); setZoom(1); }}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto bg-[#0a0a0a] border-white/[0.1] text-white p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-white/[0.06] flex flex-row items-center justify-between">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-sm font-semibold text-white truncate">{title}</DialogTitle>
            <DialogDescription className="text-[11px] text-white/30 truncate mt-0.5">{fileName}</DialogDescription>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-4">
            {isImage && (
              <>
                <button
                  onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  title="Reduzir zoom"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-[10px] text-white/30 w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  title="Aumentar zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg hover:bg-[#D4AF37]/20 text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors"
              title="Baixar arquivo"
            >
              <Download className="h-4 w-4" />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              title="Abrir em nova aba"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </DialogHeader>

        <div className="overflow-auto max-h-[calc(90vh-60px)] flex items-center justify-center bg-black/30 p-4">
          {isImage ? (
            <img
              src={url}
              alt={title}
              className="max-w-full transition-transform duration-200 rounded-lg"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              draggable={false}
            />
          ) : isPdf ? (
            <iframe
              src={url}
              className="w-full min-h-[70vh] rounded-lg border border-white/[0.06]"
              title={title}
              style={{ minWidth: '700px' }}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 py-12">
              <FileText className="h-16 w-16 text-white/20" />
              <p className="text-sm text-white/50">Preview não disponível para este tipo de arquivo</p>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-sm hover:bg-[#D4AF37]/20 transition-colors"
              >
                <Download className="h-4 w-4" />
                Baixar arquivo
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function LeadDetailDrawer({ open, onOpenChange, lead }: LeadDetailDrawerProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  if (!lead) return null;

  const dadosPdf = lead.dados_pdf || {};
  const dadosOcr = dadosPdf.dados_ocr || {};
  const dadosDigitados = dadosPdf.dados_digitados || {};
  const resultadoSim = dadosPdf.resultado_simulacao || {};
  const propostas = dadosPdf.propostas || [];
  const corretor = dadosPdf.corretor || null;
  const faturaUrl = dadosOcr.fatura_url || null;
  const historico: any[] = Array.isArray(lead.historico) ? lead.historico : [];
  const cotacoesSimuladorEntry = historico.find((h: any) => h.evento === 'cotacoes_simulador');
  let cotacoesSimulador: Array<{ nome: string; operadora: string; valorTotal: number; coparticipacao?: string; abrangencia?: string; reembolso?: string }> = [];
  if (cotacoesSimuladorEntry?.detalhes) {
    try {
      const parsed = JSON.parse(cotacoesSimuladorEntry.detalhes);
      cotacoesSimulador = Array.isArray(parsed) ? parsed : [];
    } catch {
      cotacoesSimulador = [];
    }
  }

  const openPreview = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[560px] bg-[#0a0a0a] border-l border-white/[0.08] text-white overflow-y-auto p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/[0.06] sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm z-10">
          <SheetTitle className="text-xl text-white font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-[#D4AF37]" />
            </div>
            <div>
              <p>{lead.nome || 'Lead sem nome'}</p>
              <p className="text-xs font-normal text-white/30 mt-0.5">
                {lead.origem === 'calculadora_economia'
                  ? '📊 Calculadora Economia'
                  : lead.origem === 'calculadora'
                    ? '📋 Simule seu plano (Landing)'
                    : lead.origem === 'email_form'
                      ? '📧 Completar cotação'
                      : lead.origem === 'scanner_pdf'
                        ? '📄 Scanner Inteligente'
                        : lead.origem === 'manual'
                          ? '✏️ Manual'
                          : lead.origem || 'Origem desconhecida'}
                {corretor?.slug && ` • Corretor: ${corretor.slug}`}
              </p>
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">Detalhes completos do lead</SheetDescription>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6">

          {/* ═══ DADOS PESSOAIS ═══ */}
          <Section title="Dados Pessoais" icon={User}>
            <InfoRow label="Nome" value={lead.nome} />
            <InfoRow
              label="WhatsApp"
              value={lead.whatsapp}
              href={lead.whatsapp ? `https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}` : undefined}
            />
            <InfoRow label="E-mail" value={lead.email || dadosDigitados.email} />
            {(lead.cnpj || lead.empresa) && (
              <>
                {lead.cnpj && <InfoRow label="CNPJ" value={lead.cnpj} />}
                {lead.empresa && <InfoRow label="Empresa" value={lead.empresa} />}
              </>
            )}
            <InfoRow label="Tipo" value={dadosDigitados.tipo_pessoa || lead.tipo_contratacao} />
            {dadosOcr.documento && <InfoRow label="Documento" value={dadosOcr.documento} />}
            {dadosOcr.titular && <InfoRow label="Titular" value={dadosOcr.titular} />}
            {dadosOcr.razao_social && <InfoRow label="Razão Social" value={dadosOcr.razao_social} />}
          </Section>

          {/* ═══ PLANO ATUAL ═══ */}
          <Section title="Plano Atual" icon={CreditCard}>
            <InfoRow label="Operadora" value={lead.operadora_atual} />
            <InfoRow label="Plano" value={dadosDigitados.plano || dadosOcr.plano} />
            <InfoRow label="Valor Atual" value={formatCurrency(lead.valor_atual)} />
            <InfoRow label="Vidas" value={lead.idades?.length || dadosDigitados.idades?.length || '—'} />
            {(lead.idades?.length > 0 || dadosDigitados.idades?.length > 0) && (
              <InfoRow
                label="Faixas etárias"
                value={(lead.idades || dadosDigitados.idades || []).join(', ')}
              />
            )}
          </Section>

          {/* ═══ COTAÇÕES DO SIMULADOR (landing) ═══ */}
          {cotacoesSimulador.length > 0 && (
            <Section title={`Cotações do simulador (${cotacoesSimulador.length})`} icon={BadgeDollarSign}>
              <div className="space-y-3">
                {cotacoesSimulador.map((c: any, i: number) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-lg border p-3 space-y-1',
                      i === 0
                        ? 'border-[#D4AF37]/20 bg-[#D4AF37]/5'
                        : 'border-white/[0.06] bg-white/[0.01]'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{c.nome}</span>
                      <span className="text-sm font-bold text-[#D4AF37]">{formatCurrency(c.valorTotal)}/mês</span>
                    </div>
                    {c.operadora && <p className="text-[11px] text-white/40">{c.operadora}</p>}
                    {(c.abrangencia || c.coparticipacao || c.reembolso) && (
                      <p className="text-[10px] text-white/30">
                        {[c.abrangencia, c.coparticipacao, c.reembolso].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ═══ FATURA ORIGINAL ═══ */}
          {faturaUrl && (
            <Section title="Fatura Original" icon={ImageIcon}>
              <div className="space-y-3">
                <button
                  onClick={() => openPreview(faturaUrl, 'Fatura Original')}
                  className="block w-full text-left group cursor-pointer"
                >
                  {faturaUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                    <div className="relative rounded-lg overflow-hidden border border-white/[0.1] group-hover:border-[#D4AF37]/40 transition-colors">
                      <img
                        src={faturaUrl}
                        alt="Fatura original"
                        className="w-full max-h-[400px] object-contain bg-black/50"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 flex items-center gap-2 text-xs font-semibold text-white bg-black/60 px-4 py-2 rounded-lg transition-opacity">
                          <Eye className="h-4 w-4" />
                          Visualizar
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.1] group-hover:border-[#D4AF37]/40 transition-colors">
                      <FileText className="h-8 w-8 text-[#D4AF37]" />
                      <div>
                        <p className="text-sm text-white font-medium">Ver fatura original</p>
                        <p className="text-xs text-white/30">Clique para visualizar</p>
                      </div>
                      <Eye className="h-4 w-4 text-white/20 ml-auto group-hover:text-[#D4AF37]" />
                    </div>
                  )}
                </button>
              </div>
            </Section>
          )}

          {/* ═══ DADOS OCR (EXTRAÍDOS DA FATURA) ═══ */}
          {(dadosOcr.operadora || dadosOcr.valor_total || dadosOcr.beneficiarios) && (
            <Section title="Dados Extraídos (OCR/IA)" icon={ScanLine}>
              {dadosOcr.operadora && <InfoRow label="Operadora detectada" value={dadosOcr.operadora} />}
              {dadosOcr.plano && <InfoRow label="Plano detectado" value={dadosOcr.plano} />}
              {dadosOcr.valor_total && <InfoRow label="Valor detectado" value={formatCurrency(dadosOcr.valor_total)} />}
              {dadosOcr.beneficiarios && <InfoRow label="Beneficiários" value={dadosOcr.beneficiarios} />}
              {dadosOcr.tipo_pessoa && <InfoRow label="Tipo pessoa" value={dadosOcr.tipo_pessoa} />}
              {dadosOcr.faixas_etarias?.length > 0 && (
                <InfoRow label="Faixas etárias" value={dadosOcr.faixas_etarias.join(', ')} />
              )}
            </Section>
          )}

          {/* ═══ RESULTADO DA SIMULAÇÃO ═══ */}
          {(lead.economia_estimada || propostas.length > 0) && (
            <Section title="Simulação" icon={BarChart3}>
              <div className="space-y-3">
                {/* Economia resumo */}
                {lead.economia_estimada && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                    <TrendingDown className="h-5 w-5 text-green-400 shrink-0" />
                    <div>
                      <p className="text-xs text-green-400/60">Economia estimada/mês</p>
                      <p className="text-lg font-bold text-green-400">{formatCurrency(lead.economia_estimada)}</p>
                    </div>
                  </div>
                )}

                {resultadoSim.qtdVidas && (
                  <InfoRow label="Vidas simuladas" value={resultadoSim.qtdVidas} />
                )}
                {resultadoSim.modalidade && (
                  <InfoRow label="Modalidade" value={resultadoSim.modalidade} />
                )}
                {lead.valor_proposto && (
                  <InfoRow label="Melhor valor proposto" value={formatCurrency(lead.valor_proposto)} />
                )}
              </div>
            </Section>
          )}

          {/* ═══ PROPOSTAS DETALHADAS ═══ */}
          {propostas.length > 0 && (
            <Section title={`Propostas (${propostas.length})`} icon={BadgeDollarSign}>
              <div className="space-y-3">
                {propostas.map((p: any, i: number) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-lg border p-3 space-y-2',
                      i === 0
                        ? 'border-[#D4AF37]/20 bg-[#D4AF37]/5'
                        : 'border-white/[0.06] bg-white/[0.01]'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {i === 0 && <Tag className="h-3.5 w-3.5 text-[#D4AF37]" />}
                        <span className="text-sm font-semibold text-white">
                          {p.operadora_nome}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {formatCurrency(p.valor_total)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/40">
                      <span>{p.plano_nome}</span>
                      {p.economia_valor && (
                        <span className="text-green-400">
                          Economia: {formatCurrency(p.economia_valor)} ({p.economia_pct}%)
                        </span>
                      )}
                      {p.coparticipacao && <span>Com copart.</span>}
                      {p.abrangencia && <span>{p.abrangencia}</span>}
                    </div>
                    {p.rede_hospitalar?.length > 0 && (
                      <p className="text-[10px] text-white/20">
                        Rede: {p.rede_hospitalar.join(', ')}
                      </p>
                    )}
                    {p.notas && (
                      <p className="text-[10px] text-white/20 italic">{p.notas}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ═══ DOCUMENTOS ANEXADOS ═══ */}
          {lead.dados_pdf?.documentos_adesao && (
            <Section title="Documentos de Adesão" icon={Paperclip}>
              <div className="space-y-2">
                {Object.entries(lead.dados_pdf.documentos_adesao).map(([key, url]: [string, any]) => (
                  <button
                    key={key}
                    onClick={() => openPreview(url, key)}
                    className="flex items-center gap-2 p-2 rounded-lg border border-white/[0.06] hover:border-[#D4AF37]/30 transition-colors group w-full text-left cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-white/30 group-hover:text-[#D4AF37]" />
                    <span className="text-xs text-white/60 group-hover:text-white flex-1">{key}</span>
                    <Eye className="h-3.5 w-3.5 text-white/20 group-hover:text-[#D4AF37]" />
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* ═══ CORRETOR ═══ */}
          {corretor && (
            <Section title="Corretor/Afiliado" icon={Building2}>
              <InfoRow label="Slug" value={corretor.slug} />
              {corretor.id && <InfoRow label="ID" value={corretor.id} />}
            </Section>
          )}

          {/* ═══ SCANNER INTELIGENTE ═══ */}
          <Section title="Scanner Inteligente" icon={Sparkles}>
            <ClientScannerQuickPanel
              context="admin"
              corretorId={lead.corretor_id || corretor?.id || null}
              leadId={lead.id || null}
              leadName={lead.nome || null}
              compact
            />
          </Section>

          {/* ═══ OBSERVAÇÕES ═══ */}
          {lead.observacoes && (
            <Section title="Observações" icon={FileText}>
              <p className="text-sm text-white/60 whitespace-pre-line">{lead.observacoes}</p>
            </Section>
          )}

          {/* ═══ HISTÓRICO ═══ */}
          {historico.length > 0 && (
            <Section title={`Histórico (${historico.length})`} icon={Clock}>
              <div className="space-y-0">
                {historico
                  .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((item: any, i: number) => (
                    <div
                      key={i}
                      className={cn(
                        'flex gap-3 py-2.5',
                        i < historico.length - 1 && 'border-b border-white/[0.04]'
                      )}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/40 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-white/70">
                            {item.evento === 'lead_criado'
                              ? '🆕 Lead criado'
                              : item.evento === 'mudanca_status'
                              ? `📋 ${item.status_anterior || '?'} → ${item.status_novo || '?'}`
                              : item.evento === 'nova_simulacao'
                              ? '🔄 Nova simulação'
                              : item.evento === 'documentos_enviados'
                              ? '📎 Documentos enviados'
                              : item.evento || 'Evento'}
                          </span>
                          <span className="text-[10px] text-white/20 shrink-0">
                            {formatDate(item.timestamp)}
                          </span>
                        </div>
                        {item.detalhes && (
                          <p className="text-[11px] text-white/30 mt-0.5">{item.detalhes}</p>
                        )}
                        {item.observacao && (
                          <p className="text-[11px] text-white/30 mt-0.5 italic">"{item.observacao}"</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </Section>
          )}

          {/* ═══ METADADOS ═══ */}
          <Section title="Info Técnica" icon={Tag}>
            <InfoRow label="ID" value={<span className="font-mono text-[11px]">{lead.id}</span>} />
            <InfoRow label="Origem" value={lead.origem} />
            <InfoRow label="Prioridade" value={lead.prioridade} />
            <InfoRow label="Criado em" value={formatDateTime(lead.created_at)} />
            <InfoRow label="Atualizado" value={formatDateTime(lead.updated_at)} />
            {dadosPdf.timestamp && <InfoRow label="Simulação em" value={formatDate(dadosPdf.timestamp)} />}
          </Section>

        </div>
      </SheetContent>

      {/* Modal de Preview (Fatura / Documentos) */}
      <PreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        url={previewUrl}
        title={previewTitle}
      />
    </Sheet>
  );
}
