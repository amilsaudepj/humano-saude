import Link from 'next/link';
import { ArrowLeft, Briefcase, Scale, ShieldCheck } from 'lucide-react';

const blocos = [
  {
    title: 'Fundamentos do mercado',
    items: ['Segmentação por porte e perfil de empresa', 'Modalidades (adesão, PME, individual)', 'Leitura de cenário competitivo'],
  },
  {
    title: 'Compliance e regulação',
    items: ['Boas práticas de comunicação comercial', 'Privacidade de dados (LGPD) no ciclo de proposta', 'Condução de documentação sem risco operacional'],
  },
  {
    title: 'Posicionamento consultivo',
    items: ['Argumentação baseada em economia real', 'Como defender valor sem reduzir credibilidade', 'Roteiros de follow-up e fechamento'],
  },
];

export default function AdminTreinamentoMercadoPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-[#D4AF37]/25 bg-[#0a0a0a]/80 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]/80">Treinamento • Etapa 3</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
          <Briefcase className="h-6 w-6 text-[#D4AF37]" />
          Treinamento de Mercado de Seguros
        </h1>
        <p className="mt-2 text-sm text-white/65">
          Base para tomada de decisão comercial com segurança técnica e discurso consistente.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {blocos.map((bloco) => (
          <article key={bloco.title} className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <h2 className="text-sm font-semibold text-white">{bloco.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {bloco.items.map((item) => (
                <li key={item} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <Scale className="h-4 w-4 text-[#D4AF37]" />
            Critério de qualidade
          </p>
          <p className="mt-2 text-sm text-white/65">
            Toda recomendação deve equilibrar custo, cobertura, elegibilidade documental e prazo de implantação.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
            Objetivo final
          </p>
          <p className="mt-2 text-sm text-white/65">
            Formar uma operação previsível: captura, qualificação, proposta e fechamento com menos retrabalho.
          </p>
        </div>
      </section>

      <Link
        href="/portal-interno-hks-2026/treinamento"
        className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para central
      </Link>
    </div>
  );
}
