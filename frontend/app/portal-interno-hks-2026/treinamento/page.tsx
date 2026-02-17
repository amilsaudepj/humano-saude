import Link from 'next/link';
import { ArrowRight, BookOpen, Briefcase, Compass, GraduationCap } from 'lucide-react';

const trilhas = [
  {
    step: '1',
    title: 'Tour da Plataforma',
    description: 'Percurso guiado completo do painel admin, com foco no que é visível para seu perfil.',
    href: '/portal-interno-hks-2026/treinamento/tour',
    icon: Compass,
    badge: '10 min',
  },
  {
    step: '2',
    title: 'Treinamento de Produto',
    description: 'Padrão operacional para diagnóstico, scanner inteligente, proposta e acompanhamento.',
    href: '/portal-interno-hks-2026/treinamento/produto',
    icon: BookOpen,
    badge: '20 min',
  },
  {
    step: '3',
    title: 'Mercado de Seguros',
    description: 'Noções de mercado, argumentação comercial, compliance e posicionamento consultivo.',
    href: '/portal-interno-hks-2026/treinamento/mercado-seguros',
    icon: Briefcase,
    badge: '25 min',
  },
];

export default function AdminTreinamentoPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl border border-[#D4AF37]/25 bg-[#0a0a0a]/80 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]/80">Treinamento</p>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
              <GraduationCap className="h-6 w-6 text-[#D4AF37]" />
              Central de Treinamento (Admin)
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-white/65">
              Sequência recomendada: comece no tour guiado da plataforma, depois avance para produto e finalize
              em mercado de seguros.
            </p>
          </div>
          <Link
            href="/portal-interno-hks-2026/treinamento/tour"
            className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#E8C25B]"
          >
            Iniciar trilha
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {trilhas.map((trilha) => {
          const Icon = trilha.icon;
          return (
            <Link
              key={trilha.title}
              href={trilha.href}
              className="group rounded-2xl border border-white/10 bg-black/30 p-5 transition hover:border-[#D4AF37]/45 hover:bg-black/50"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-2.5 py-1 text-[11px] font-semibold text-[#D4AF37]">
                  Etapa {trilha.step}
                </span>
                <span className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] text-white/60">
                  {trilha.badge}
                </span>
              </div>

              <div className="mb-3 flex items-center gap-2 text-white">
                <Icon className="h-4 w-4 text-[#D4AF37]" />
                <h2 className="text-base font-semibold">{trilha.title}</h2>
              </div>

              <p className="text-sm text-white/65">{trilha.description}</p>

              <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#D4AF37]">
                Acessar trilha
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
