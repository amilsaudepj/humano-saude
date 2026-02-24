'use client';

import { motion } from 'framer-motion';
import {
  Phone,
  Mail,
  Star,
  Sparkles,
  Gift,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Trash2,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CrmCardEnriched, KanbanColumnSlug } from '@/lib/types/corretor';

const COLUMN_LABELS: Record<KanbanColumnSlug, { label: string; color: string; bg: string }> = {
  novo_lead: { label: 'Novo Lead', color: 'text-blue-400', bg: 'bg-blue-500/15' },
  qualificado: { label: 'Qualificado', color: 'text-purple-400', bg: 'bg-purple-500/15' },
  proposta_enviada: { label: 'Proposta', color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  documentacao: { label: 'Documentação', color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  fechado: { label: 'Fechado', color: 'text-green-400', bg: 'bg-green-500/15' },
  perdido: { label: 'Perdido', color: 'text-red-400', bg: 'bg-red-500/15' },
};

const PRIORIDADE_STYLES: Record<string, string> = {
  urgente: 'bg-red-500/20 text-red-400 border-red-500/30',
  alta: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  media: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  baixa: 'bg-green-500/20 text-green-400 border-green-500/30',
};

function ScoreBadge({ score }: { score: number }) {
  const variant =
    score >= 70
      ? 'bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black'
      : score >= 40
        ? 'bg-yellow-500/20 text-yellow-400'
        : 'bg-white/10 text-white/60';

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', variant)}>
      <Star className="h-2.5 w-2.5" />
      {score}
    </span>
  );
}

function formatTime(hours: number): string {
  if (hours < 1) return 'agora';
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function LeadTable({
  leads,
  loading,
  total,
  page,
  totalPages,
  onPageChange,
  onCardClick,
  onDelete,
}: {
  leads: CrmCardEnriched[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onCardClick: (card: CrmCardEnriched) => void;
  onDelete?: (cardId: string) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
        <div className="p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-12 text-center">
        <div className="inline-flex h-16 w-16 rounded-full bg-white/5 items-center justify-center mb-4">
          <Eye className="h-7 w-7 text-white/20" />
        </div>
        <h3 className="text-lg font-semibold text-white/60 mb-1">Nenhum lead encontrado</h3>
        <p className="text-sm text-white/30">Tente ajustar os filtros ou adicione novos leads no Pipeline</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-xs font-semibold text-white/40 uppercase tracking-wider">
        <div className="col-span-3">Lead</div>
        <div className="col-span-2">Etapa</div>
        <div className="col-span-1 text-center">Score</div>
        <div className="col-span-2">Valor</div>
        <div className="col-span-1 text-center">Prioridade</div>
        <div className="col-span-2">Atualizado</div>
        <div className="col-span-1 text-right">Ações</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/[0.03]">
        {leads.map((lead, index) => {
          const colConfig = COLUMN_LABELS[lead.coluna_slug];
          return (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onCardClick(lead)}
              className={cn(
                'grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-3.5 cursor-pointer transition-all',
                'hover:bg-white/[0.03]',
                lead.is_hot && 'bg-[#D4AF37]/[0.02] hover:bg-[#D4AF37]/[0.04]',
              )}
            >
              {/* Lead info */}
              <div className="col-span-3 flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-white/5 flex items-center justify-center text-sm font-semibold text-white/60">
                  {lead.titulo.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium text-white truncate">{lead.titulo}</p>
                    {lead.lead?.origem === 'form_indicar_afiliado' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                        <Gift className="h-2.5 w-2.5" />
                        Indicação afiliado
                      </span>
                    )}
                    {lead.is_hot && <Sparkles className="h-3 w-3 text-[#D4AF37] flex-shrink-0" />}
                    {lead.is_stale && lead.coluna_slug !== 'fechado' && lead.coluna_slug !== 'perdido' && (
                      <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {lead.lead?.whatsapp && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://wa.me/${lead.lead?.whatsapp?.replace(/\D/g, '')}`, '_blank');
                        }}
                        className="text-[10px] text-green-400 hover:underline"
                      >
                        <Phone className="h-2.5 w-2.5 inline mr-0.5" />
                        WhatsApp
                      </button>
                    )}
                    {lead.lead?.email && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`mailto:${lead.lead?.email}`, '_blank');
                        }}
                        className="text-[10px] text-blue-400 hover:underline"
                      >
                        <Mail className="h-2.5 w-2.5 inline mr-0.5" />
                        Email
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Etapa */}
              <div className="col-span-2 flex items-center">
                <span className={cn('text-xs font-medium px-2.5 py-1 rounded-lg', colConfig.bg, colConfig.color)}>
                  {colConfig.label}
                </span>
              </div>

              {/* Score */}
              <div className="col-span-1 flex items-center justify-center">
                <ScoreBadge score={lead.score} />
              </div>

              {/* Valor */}
              <div className="col-span-2 flex items-center">
                {lead.valor_estimado && lead.valor_estimado > 0 ? (
                  <span className="text-sm text-white/70">
                    R$ {lead.valor_estimado.toLocaleString('pt-BR')}
                  </span>
                ) : (
                  <span className="text-xs text-white/20">—</span>
                )}
              </div>

              {/* Prioridade */}
              <div className="col-span-1 flex items-center justify-center">
                <span className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                  PRIORIDADE_STYLES[lead.prioridade] ?? PRIORIDADE_STYLES.media,
                )}>
                  {lead.prioridade.charAt(0).toUpperCase() + lead.prioridade.slice(1)}
                </span>
              </div>

              {/* Atualizado */}
              <div className="col-span-2 flex items-center gap-1 text-white/30">
                <Clock className="h-3 w-3" />
                <span className="text-xs">{formatTime(lead.hours_since_update)}</span>
                {lead.lead?.operadora_atual && (
                  <span className="text-[10px] text-white/20 ml-1 truncate">
                    · {lead.lead.operadora_atual}
                  </span>
                )}
              </div>

              {/* Ações */}
              <div className="col-span-1 flex items-center justify-end gap-1">
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(lead.id);
                    }}
                    className="h-7 w-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </button>
                )}
                <button className="h-7 w-7 rounded-lg hover:bg-white/5 flex items-center justify-center transition-colors">
                  <MoreVertical className="h-3.5 w-3.5 text-white/30" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
          <span className="text-xs text-white/30">
            {total} lead{total !== 1 ? 's' : ''} · Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-white/50" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-xs font-medium transition-colors',
                    page === pageNum
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                      : 'text-white/40 hover:bg-white/5',
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="h-8 w-8 rounded-lg hover:bg-white/5 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-white/50" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
