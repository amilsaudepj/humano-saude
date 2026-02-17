import Link from 'next/link';
import { ArrowLeft, PlayCircle, Route, ShieldCheck } from 'lucide-react';

const modulosCorretor = [
  'DockSidebar com atalhos operacionais',
  'Visão geral de indicadores do corretor',
  'Acesso ao CRM (pipeline, leads e oportunidades)',
  'Fluxo de propostas e Scanner Inteligente',
  'Rotina de acompanhamento e produtividade',
];

export default function CorretorTourTreinamentoPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-[#D4AF37]/25 bg-[#0a0a0a]/80 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]/80">Treinamento • Etapa 1</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Tour da Plataforma (Corretor)</h1>
        <p className="mt-2 text-sm text-white/65">
          O tour usa sua visibilidade atual de corretor e destaca somente os módulos que você realmente opera.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard/corretor?tour=1"
            className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#E8C25B]"
          >
            <PlayCircle className="h-4 w-4" />
            Iniciar tour corretor
          </Link>
          <Link
            href="/dashboard/corretor/treinamento"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para central
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Route className="h-4 w-4 text-[#D4AF37]" />
            O que o tour cobre
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {modulosCorretor.map((item) => (
              <li key={item} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
            Regras de uso
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              O tour pode ser repetido sempre que necessário pela central de treinamento.
            </li>
            <li className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              O destaque visual guia onde clicar para operar cada módulo com segurança.
            </li>
            <li className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              Após concluir, avance para a trilha de produto e padronize o processo de proposta.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
