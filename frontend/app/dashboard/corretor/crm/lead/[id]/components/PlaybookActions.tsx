'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Official WhatsApp SVG icon
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  type SalesPlaybookPhaseKey,
  type SalesTemplateVariables,
  getPlaybookDay,
  resolvePlaybookTemplate,
  salesPlaybook,
} from '@/lib/sales-playbook';

type PlaybookActionsProps = {
  cardId: string;
  leadId: string | null;
  leadName: string;
  leadWhatsapp: string | null;
  companyProfile: string | null;
  currentPrice: number | null;
  estimatedEconomy: number | null;
  onWhatsAppClick: (payload: PlaybookSendPayload) => Promise<void>;
};

export type PlaybookSendPayload = {
  message: string;
  phase: SalesPlaybookPhaseKey;
  dayId: string;
  dayLabel: string;
};

function formatMoney(value: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return 'valor em analise';
  }
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function extractFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return 'cliente';
  return trimmed.split(/\s+/)[0] ?? 'cliente';
}

export function PlaybookActions({
  cardId,
  leadId,
  leadName,
  leadWhatsapp,
  companyProfile,
  currentPrice,
  estimatedEconomy,
  onWhatsAppClick,
}: PlaybookActionsProps) {
  const [phase, setPhase] = useState<SalesPlaybookPhaseKey>('novo');
  const [dayId, setDayId] = useState<string>(salesPlaybook.novo.days[0]?.id ?? 'd1');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const phaseData = salesPlaybook[phase];

  useEffect(() => {
    if (phaseData.days.some((day) => day.id === dayId)) return;
    setDayId(phaseData.days[0]?.id ?? 'd1');
  }, [phaseData.days, dayId]);

  const selectedDay = getPlaybookDay(phase, dayId) ?? phaseData.days[0];

  const templateVars = useMemo<SalesTemplateVariables>(() => ({
    name: leadName.trim() || 'cliente',
    first_name: extractFirstName(leadName),
    company_profile: companyProfile?.trim() || 'empresa',
    current_price: formatMoney(currentPrice),
    economy_estimate: formatMoney(estimatedEconomy),
  }), [leadName, companyProfile, currentPrice, estimatedEconomy]);

  const hydratedTemplate = useMemo(() => {
    if (!selectedDay) return '';
    return resolvePlaybookTemplate(selectedDay.template, templateVars);
  }, [selectedDay, templateVars]);

  useEffect(() => {
    setMessage(hydratedTemplate);
  }, [hydratedTemplate]);

  const handleResetTemplate = useCallback(() => {
    setMessage(hydratedTemplate);
  }, [hydratedTemplate]);

  const handlePersonalize = useCallback(async () => {
    if (!leadId) {
      toast.error('Lead sem identificador para personalizacao.');
      return;
    }

    const baseMessage = message.trim();
    if (!baseMessage) {
      toast.error('Escreva uma mensagem antes de personalizar.');
      return;
    }

    try {
      setAiLoading(true);
      const res = await fetch('/api/leads/ai-personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          leadId,
          baseMessage,
          phase,
          dayId,
        }),
      });

      const data = await res.json() as { error?: string; personalizedText?: string };
      if (!res.ok || !data.personalizedText) {
        throw new Error(data.error ?? 'Nao foi possivel personalizar com IA.');
      }

      setMessage(data.personalizedText);
      toast.success('Mensagem personalizada com IA.');
    } catch (error) {
      const messageError = error instanceof Error ? error.message : 'Erro ao personalizar mensagem';
      toast.error(messageError);
    } finally {
      setAiLoading(false);
    }
  }, [cardId, leadId, message, phase, dayId]);

  const handleSend = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      toast.error('A mensagem esta vazia.');
      return;
    }
    if (!selectedDay) {
      toast.error('Selecione um dia da cadencia.');
      return;
    }
    if (!leadWhatsapp) {
      toast.error('Lead sem WhatsApp cadastrado.');
      return;
    }

    try {
      setSubmitting(true);
      await onWhatsAppClick({
        message: trimmedMessage,
        phase,
        dayId: selectedDay.id,
        dayLabel: selectedDay.label,
      });
    } finally {
      setSubmitting(false);
    }
  }, [message, selectedDay, leadWhatsapp, onWhatsAppClick, phase]);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
          <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
          Playbook de Vendas
        </h3>
        <span className="text-[10px] text-white/35">Cadencia WhatsApp</span>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] text-white/35 uppercase tracking-wide">Fase</p>
        <Select
          value={phase}
          onValueChange={(value) => setPhase(value as SalesPlaybookPhaseKey)}
        >
          <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-white">
            <SelectValue placeholder="Selecione a fase" />
          </SelectTrigger>
          <SelectContent className="bg-[#111] border-white/[0.1] text-white">
            {(Object.entries(salesPlaybook) as Array<[SalesPlaybookPhaseKey, (typeof salesPlaybook)[SalesPlaybookPhaseKey]]>)
              .map(([phaseKey, phaseValue]) => (
                <SelectItem key={phaseKey} value={phaseKey}>{phaseValue.label}</SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={dayId} onValueChange={setDayId}>
        <TabsList
          className="grid w-full h-auto bg-white/[0.03] border border-white/[0.08] p-1"
          style={{ gridTemplateColumns: `repeat(${phaseData.days.length}, minmax(0, 1fr))` }}
        >
          {phaseData.days.map((day) => (
            <TabsTrigger
              key={day.id}
              value={day.id}
              className="h-10 text-[13px] md:text-xs text-white/55 data-[state=active]:bg-[#D4AF37]/20 data-[state=active]:text-[#D4AF37]"
            >
              {day.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {selectedDay && (
        <p className="text-[11px] text-white/40">{selectedDay.description}</p>
      )}

      <div className="space-y-1.5">
        <p className="text-[11px] text-white/35 uppercase tracking-wide">Preview da mensagem</p>
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="min-h-[150px] bg-white/[0.03] border-white/[0.08] text-white leading-relaxed text-base md:text-sm resize-y"
          placeholder="Mensagem para WhatsApp..."
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={aiLoading || !leadId || !message.trim()}
          onClick={handlePersonalize}
          className="h-11 md:h-9 min-w-[185px] bg-transparent border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
        >
          <Sparkles className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
          {aiLoading ? 'Personalizando...' : 'Personalizar com IA'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleResetTemplate}
          className="h-11 md:h-9 bg-transparent border-white/15 text-white/60 hover:bg-white/5 hover:text-white/80"
        >
          <RotateCcw className="w-4 h-4" />
          Restaurar template
        </Button>
      </div>

      <div className="hidden md:block">
        <Button
          type="button"
          disabled={submitting || !leadWhatsapp || !message.trim()}
          onClick={handleSend}
          className="w-full h-11 text-base md:text-sm bg-[#128C7E] hover:bg-[#075E54] text-white font-semibold border-0"
        >
          <WhatsAppIcon className="w-4 h-4" />
          {submitting ? 'Abrindo WhatsApp...' : 'Enviar no WhatsApp'}
        </Button>
      </div>

      <div className="md:hidden h-16" />
      <div
        className="md:hidden fixed inset-x-4 z-40"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <Button
          type="button"
          disabled={submitting || !leadWhatsapp || !message.trim()}
          onClick={handleSend}
          className="w-full h-12 text-base bg-[#128C7E] hover:bg-[#075E54] text-white font-semibold shadow-lg shadow-[#128C7E]/30 border-0"
        >
          <WhatsAppIcon className="w-4 h-4" />
          {submitting ? 'Abrindo WhatsApp...' : 'Enviar no WhatsApp'}
        </Button>
      </div>
    </div>
  );
}
