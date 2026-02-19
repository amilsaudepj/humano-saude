'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import ScannerDocumentos from '../components/ScannerDocumentos';
import Logo from '../components/Logo';
import RealtimeVisitors from '@/components/dashboard/RealtimeVisitors';
import {
  Activity,
  AlertTriangle,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  ClipboardList,
  Sparkles,
  Target,
  UserCheck,
} from 'lucide-react';
import { getDashboardEssentials, type DashboardEssentials, type DashboardPeriod } from '@/app/actions/leads';
import type { PDFExtraido } from '../services/api';
import { getExtractionQuickSummary } from '@/lib/extraction-summary';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'mes', label: 'Mês atual' },
];

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  hoje: 'Hoje',
  ontem: 'Ontem',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  mes: 'Mês atual',
  dia: 'Hoje',
};

function GlassCard({
  children,
  className,
  gold = false,
  ...props
}: {
  children: ReactNode;
  className?: string;
  gold?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-2xl border backdrop-blur-xl p-5 relative overflow-hidden',
        gold
          ? 'bg-[#D4AF37]/5 border-[#D4AF37]/20 shadow-lg shadow-[#D4AF37]/5'
          : 'bg-white/[0.03] border-white/[0.08]',
        className,
      )}
    >
      {gold && (
        <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
      )}
      {children}
    </div>
  );
}

type MetricTone = 'white' | 'gold' | 'green' | 'blue' | 'red';

function MetricCard({
  title,
  value,
  icon: Icon,
  loading = false,
  prefix = '',
  suffix = '',
  tone = 'white',
  delay = 0,
}: {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  prefix?: string;
  suffix?: string;
  tone?: MetricTone;
  delay?: number;
}) {
  const toneMap: Record<MetricTone, { bg: string; icon: string; text: string }> = {
    white: { bg: 'bg-white/5', icon: 'text-white/60', text: 'text-white' },
    gold: { bg: 'bg-[#D4AF37]/10', icon: 'text-[#D4AF37]', text: 'text-[#F6E05E]' },
    green: { bg: 'bg-green-500/10', icon: 'text-green-400', text: 'text-green-300' },
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', text: 'text-blue-300' },
    red: { bg: 'bg-red-500/10', icon: 'text-red-400', text: 'text-red-300' },
  };
  const currentTone = toneMap[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-xl transition-colors hover:border-white/15"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-white/70">{title}</p>
        {Icon && (
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', currentTone.bg)}>
            <Icon className={cn('h-4 w-4', currentTone.icon)} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <div className="h-8 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-14 animate-pulse rounded bg-white/10" />
        </div>
      ) : (
        <p className={cn('mt-4 text-4xl font-bold tracking-tight', currentTone.text)}>
          {prefix}
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          {suffix}
        </p>
      )}
    </motion.div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('hoje');
  const [stats, setStats] = useState<DashboardEssentials | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [lastExtraction, setLastExtraction] = useState<PDFExtraido | null>(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);

    try {
      const result = await getDashboardEssentials(period);
      if (result.success && result.data) {
        setStats(result.data);
      }
    } finally {
      setStatsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void loadStats();

    const interval = setInterval(() => {
      void loadStats();
    }, 45000);

    return () => clearInterval(interval);
  }, [loadStats]);

  const periodLabel = PERIOD_LABELS[stats?.periodo || period];
  const rangeLabel =
    stats &&
    `${new Date(stats.inicio).toLocaleDateString('pt-BR')} · ${new Date(stats.fim).toLocaleDateString('pt-BR')}`;
  const extractionSummary = getExtractionQuickSummary(lastExtraction);
  const semContatoCritico = stats?.clientes_sem_contato_48h || 0;
  const estagnadosCriticos = (stats?.leads_estagnados_7d || 0) + (stats?.pipeline_deals_estagnados || 0);

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
        <div data-tour="admin-overview" className="flex items-center gap-4">
          <Logo variant="1" size="lg" className="max-w-[240px]" withBackground={false} />
          <div className="h-12 w-px bg-white/10" />
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-white">
              Dashboard Admin
            </h1>
            <p className="text-sm text-white/60">
              Métricas essenciais e início de proposta com Scanner Inteligente
            </p>
          </div>
        </div>

        <div data-tour="admin-period-filters" className="flex flex-wrap items-center gap-2">
          <RealtimeVisitors className="mr-1" showTopPage={false} />
          {PERIOD_OPTIONS.map((option) => {
            const active = period === option.value;
            return (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant="outline"
                className={
                  active
                    ? 'border-[#D4AF37] bg-[#D4AF37] text-black hover:bg-[#E4C061] hover:text-black'
                    : 'border-white/25 bg-black/50 text-white/85 hover:border-white/40 hover:bg-black/70 hover:text-white'
                }
                onClick={() => setPeriod(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
          <span className="ml-1 rounded-full border border-blue-500/40 bg-blue-500/15 px-2.5 py-1 text-xs text-blue-200">
            {periodLabel}
          </span>
        </div>
      </div>

      <div data-tour="admin-kpis" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Leads no período"
          value={stats?.leads_periodo || 0}
          icon={Activity}
          loading={statsLoading}
          tone="blue"
        />

        <MetricCard
          title="Propostas enviadas"
          value={stats?.propostas_enviadas || 0}
          icon={FileText}
          loading={statsLoading}
          tone="gold"
          delay={0.05}
        />

        <MetricCard
          title="Vendas fechadas"
          value={stats?.vendas_fechadas || 0}
          icon={CheckCircle2}
          loading={statsLoading}
          tone="green"
          delay={0.1}
        />

        <MetricCard
          title="Documentos processados"
          value={stats?.pdfs_processados || 0}
          icon={Sparkles}
          loading={statsLoading}
          tone="gold"
          delay={0.15}
        />

        <MetricCard
          title="Taxa de fechamento"
          value={stats?.taxa_fechamento || 0}
          icon={Target}
          suffix="%"
          loading={statsLoading}
          tone="white"
          delay={0.2}
        />
      </div>

      <div data-tour="admin-radar" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Radar Estratégico</h2>
          <span className="text-xs text-white/50">
            Decisão rápida sobre contatos e potencial de conversão
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Clientes em aberto (potencial)"
            value={stats?.clientes_abertos_potencial || 0}
            icon={Briefcase}
            loading={statsLoading}
          />
          <MetricCard
            title="Clientes sem contato"
            value={stats?.clientes_sem_contato || 0}
            icon={UserCheck}
            loading={statsLoading}
          />
          <MetricCard
            title="Sem contato há 48h+"
            value={stats?.clientes_sem_contato_48h || 0}
            icon={Clock}
            loading={statsLoading}
            tone="gold"
          />
          <MetricCard
            title="Leads estagnados 7d+"
            value={stats?.leads_estagnados_7d || 0}
            icon={AlertTriangle}
            loading={statsLoading}
            tone={stats && stats.leads_estagnados_7d > 0 ? 'red' : 'white'}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Potencial financeiro em aberto"
            value={Number(stats?.valor_potencial_aberto || 0).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            prefix="R$ "
            icon={DollarSign}
            loading={statsLoading}
            tone="gold"
          />
          <MetricCard
            title="Oportunidades abertas no pipeline"
            value={stats?.pipeline_deals_abertos || 0}
            icon={FileText}
            loading={statsLoading}
          />
          <MetricCard
            title="Oportunidades estagnadas no pipeline"
            value={stats?.pipeline_deals_estagnados || 0}
            icon={AlertTriangle}
            loading={statsLoading}
            tone={stats && stats.pipeline_deals_estagnados > 0 ? 'red' : 'white'}
          />
          <MetricCard
            title="Valor aberto no pipeline"
            value={Number(stats?.pipeline_valor_aberto || 0).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            prefix="R$ "
            icon={Target}
            loading={statsLoading}
            tone="blue"
          />
        </div>

        <GlassCard>
          <div className="text-sm text-white/80">
            <p className="font-medium text-white">Prioridades sugeridas agora</p>
            <p className="mt-1">
              {semContatoCritico > 0
                ? `${semContatoCritico} cliente(s) estão sem contato há mais de 48h.`
                : 'Sem clientes críticos de primeiro contato no momento.'}
            </p>
            <p>
              {estagnadosCriticos > 0
                ? `${estagnadosCriticos} oportunidade(s) estão estagnadas e pedem follow-up imediato.`
                : 'Fluxo saudável: sem estagnação crítica detectada agora.'}
            </p>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-white/70">
            <CalendarClock className="h-4 w-4 text-[#D4AF37]" />
            Intervalo analisado: {rangeLabel || 'carregando...'}
          </div>
          <div className="text-white/70">
            Receita em aberto no pipeline:{' '}
            <span className="font-semibold text-[#D4AF37]">
              {stats
                ? `R$ ${stats.pipeline_valor_aberto.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}`
                : 'R$ 0,00'}
            </span>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ScannerDocumentos onDadosExtraidos={setLastExtraction} />
        </div>

        <div className="space-y-4">
          <GlassCard data-tour="admin-proposta-manual" gold className="border-yellow-500/20 bg-yellow-500/5">
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-base font-semibold text-yellow-300">
                <ClipboardList className="h-5 w-5" />
                Nova proposta manual
              </h3>
              <p className="text-sm text-yellow-100/85">
                Preenchimento um a um com anexos por documento.
              </p>
              <p>
                Ideal para propostas que precisam ser montadas manualmente, beneficiário por beneficiário.
              </p>
              <Button asChild type="button" className="w-full bg-[#D4AF37] text-black hover:bg-[#E8C25B] hover:text-black">
                <Link href="/portal-interno-hks-2026/propostas/manual">
                  Abrir proposta manual
                </Link>
              </Button>
            </div>
          </GlassCard>

          <GlassCard data-tour="admin-last-extraction">
            <div className="space-y-2 text-sm text-white/80">
              <h3 className="text-base font-semibold text-white">Última extração da IA</h3>
              <p className="text-white/60">
                Resumo do último documento processado no scanner.
              </p>
              <p>
                <span className="text-white/50">{extractionSummary.entityLabel}:</span>{' '}
                {extractionSummary.entityValue}
              </p>
              <p>
                <span className="text-white/50">{extractionSummary.peopleLabel}:</span>{' '}
                {extractionSummary.peopleValue}
              </p>
              <p>
                <span className="text-white/50">{extractionSummary.ageLabel}:</span>{' '}
                {extractionSummary.ageValue}
              </p>
              <p>
                <span className="text-white/50">Documento:</span>{' '}
                {extractionSummary.documentValue}
              </p>
              <p>
                <span className="text-white/50">Confiança:</span>{' '}
                {extractionSummary.confidenceValue}
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
