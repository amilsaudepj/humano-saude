import Link from 'next/link';
import { ArrowLeft, Briefcase, Scale, ShieldCheck } from 'lucide-react';

const blocos = [
  {
    title: 'Leitura de mercado',
    items: ['Diferença entre adesão, PME e individual', 'Como mapear perfil e risco do cliente', 'Quando priorizar custo vs. cobertura'],
  },
  {
    title: 'Argumentação comercial',
    items: ['Técnicas de descoberta de dor real', 'Como explicar economia sem promessa indevida', 'Roteiros de negociação e contorno de objeções'],
  },
  {
    title: 'Postura consultiva',
    items: ['Condução ética e transparente', 'Follow-up com contexto e timing', 'Consolidação de confiança para fechamento'],
  },
];

export default function CorretorTreinamentoMercadoPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-[#D4AF37]/25 bg-[#0a0a0a]/80 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]/80">Treinamento • Etapa 3</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
          <Briefcase className="h-6 w-6 text-[#D4AF37]" />
          Treinamento de Mercado de Seguros
        </h1>
        <p className="mt-2 text-sm text-white/65">
          Estrutura para conversar com segurança técnica e aumentar taxa de conversão de leads qualificados.
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
            Qualidade de recomendação
          </p>
          <p className="mt-2 text-sm text-white/65">
            Toda proposta precisa equilibrar preço, cobertura, elegibilidade e prazo para manter confiança do cliente.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
            Resultado esperado
          </p>
          <p className="mt-2 text-sm text-white/65">
            Mais clareza nas decisões comerciais e avanço consistente do pipeline até documentação final.
          </p>
        </div>
      </section>

      <Link
        href="/dashboard/corretor/treinamento"
        className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para central
      </Link>
    </div>
  );
}
