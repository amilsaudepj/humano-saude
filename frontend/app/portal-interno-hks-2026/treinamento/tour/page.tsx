import Link from 'next/link';
import { ArrowLeft, PlayCircle, Route, ShieldCheck } from 'lucide-react';

const modulosAdmin = [
  'DockSidebar e navegação principal',
  'Filtros de período e visão executiva',
  'Métricas principais e radar estratégico',
  'Scanner Inteligente e última extração da IA',
  'Fluxo de proposta manual e monitoramento',
];

export default function AdminTourTreinamentoPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-[#D4AF37]/25 bg-[#0a0a0a]/80 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]/80">Treinamento • Etapa 1</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Tour da Plataforma (Admin)</h1>
        <p className="mt-2 text-sm text-white/65">
          Este tour respeita a visibilidade do perfil admin e mostra os blocos críticos para operação diária.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/portal-interno-hks-2026?tour=1"
            className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#E8C25B]"
          >
            <PlayCircle className="h-4 w-4" />
            Iniciar tour admin
          </Link>
          <Link
            href="/portal-interno-hks-2026/treinamento"
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
            {modulosAdmin.map((item) => (
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
              O tour destaca somente elementos existentes e acessíveis no painel atual.
            </li>
            <li className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              Você pode repetir o tour sempre que necessário pela central de treinamento.
            </li>
            <li className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              Ao concluir o tour, avance para treinamento de produto para padronizar o fluxo operacional.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
