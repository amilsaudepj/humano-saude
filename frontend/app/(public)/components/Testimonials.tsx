'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

export default function Testimonials() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

  const testimonials = [
    {
      name: 'Patrícia Oliveira',
      company: 'Gerente Financeira, 67 vidas',
      text: 'Veio reajuste de 28% e a gente desesperou. Trouxeram três opções com a mesma rede. Conseguimos manter o que gastávamos. O acompanhamento depois da adesão é muito bom, qualquer dúvida eles respondem.',
    },
    {
      name: 'Fernanda Lima',
      company: 'Diretora de RH, 42 vidas',
      text: 'Queríamos melhorar a rede e sair do que pagávamos. Fizeram a análise e a migração sem carência. Hoje economizamos R$ 4.200 por mês e a rede credenciada ficou melhor.',
    },
    {
      name: 'Roberto Santos',
      company: 'MEI, 2 vidas',
      text: 'Eu e minha esposa pagávamos R$ 1.100 cada no plano de pessoa física. Com o CNPJ ativo entramos em plano nacional na tabela coletiva. R$ 680 por vida, mesma rede, menos custo.',
    },
    {
      name: 'Marcos Almeida',
      company: 'Proprietário, 12 vidas',
      text: 'Quase cancelei o plano da clínica por causa do preço. Acharam um plano com coparticipação que deu 39% de economia e ainda entrou odonto. Depois que fechamos, a equipe resolveu tudo rápido.',
    },
    {
      name: 'Carlos Mendes',
      company: 'CEO, 18 vidas',
      text: 'Estava pagando R$ 14.000 e caiu para R$ 8.400. Mantivemos os mesmos hospitais. Acharam um detalhe no contrato que nem o contador tinha visto. Em um ano foram R$ 32.000 a menos na despesa.',
    },
    {
      name: 'Luana Costa',
      company: 'Sócia, 24 vidas',
      text: 'Cansamos de pagar caro e não ter cobertura para usar fora do estado. Migramos para plano nacional com seguro de vida incluso. Mesmo custo que tínhamos, cobertura maior e menos burocracia.',
    },
  ];

  return (
    <section id="depoimentos" className="py-20 sm:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-20">
          <span className="inline-block px-5 py-1.5 bg-[#B8941F]/10 text-[#B8941F] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[#B8941F]/20">
            Depoimentos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-black">
            Empresas que <span className="text-[#B8941F]">reduziram custo</span>
          </h2>
          <p className="mt-3 text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            Quem contratou, aprova. Veja resultados reais de MEI, PME e empresariais.
          </p>
        </div>

        {/* Carousel — mesmo espaçamento em TODOS os cards (margin-right no card = gap igual inclusive no loop) */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex items-stretch min-w-0">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex-[0_0_calc(100%-1.5rem)] sm:flex-[0_0_calc(100%-2rem)] md:flex-[0_0_calc((100%-4rem)/3)] lg:flex-[0_0_calc((100%-5rem)/3)] min-w-0 shrink-0 flex pr-0"
              >
                <div className="bg-white p-10 rounded-2xl border border-gray-200 w-full flex flex-col hover:shadow-md transition-all duration-300 shadow-sm min-h-0 flex-1 min-w-0 mr-6 md:mr-8 lg:mr-10">
                  {/* Quote — flex-1 + min-h-0 para o rodapé ficar sempre alinhado entre os cards */}
                  <p className="text-gray-600 text-lg leading-relaxed mb-8 flex-1 min-h-0">
                    "{testimonial.text}"
                  </p>

                  {/* Author — sempre no final do card */}
                  <div className="border-t border-gray-100 pt-6 flex-shrink-0">
                    <p className="font-bold text-black text-lg">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <a
            href="https://wa.me/5521988179407?text=Quero%20economizar%20como%20esses%20clientes!"
            className="inline-flex items-center gap-2 bg-black hover:bg-gray-900 px-10 py-4 rounded-xl text-xs uppercase tracking-widest font-black text-white transition-all hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
            </svg>
            Quero esse resultado
          </a>
        </div>
      </div>
    </section>
  );
}
