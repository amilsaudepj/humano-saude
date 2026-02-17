import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';

const topicos = [
  'Abordagem inicial e qualificação com foco em economia',
  'Uso do Scanner Inteligente e ScanFULL sem perder dados',
  'Validação de documentos por etapa e por beneficiário',
  'Registro de atividades no CRM e follow-up estruturado',
  'Critérios para avançar proposta com menor retrabalho',
];

export default function CorretorTreinamentoProdutoPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-2xl border border-[#D4AF37]/25 bg-[#0a0a0a]/80 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]/80">Treinamento • Etapa 2</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
          <BookOpen className="h-6 w-6 text-[#D4AF37]" />
          Treinamento de Produto
        </h1>
        <p className="mt-2 text-sm text-white/65">
          Guia prático para transformar lead em proposta completa com consistência operacional.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-sm font-semibold text-white">Passo a passo recomendado</h2>
        <div className="mt-3 space-y-2">
          {topicos.map((item, index) => (
            <div key={item} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
              <span className="mt-0.5 text-xs font-semibold text-[#D4AF37]">{index + 1}.</span>
              <p className="text-sm text-white/75">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          Objetivo da trilha
        </p>
        <p className="mt-2 text-sm text-emerald-100/90">
          Operar CRM + Scanner com previsibilidade e sem depender de retrabalho manual para concluir proposta.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/corretor/treinamento"
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para central
        </Link>
        <Link
          href="/dashboard/corretor/treinamento/mercado-seguros"
          className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#E8C25B]"
        >
          Próxima etapa
        </Link>
      </div>
    </div>
  );
}
