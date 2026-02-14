'use client';

import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Como funciona a Migração Técnica para empresas?',
      answer:
        'Realizamos uma análise completa do contrato vigente da sua empresa: sinistralidade, perfil etário, rede credenciada utilizada e cláusulas contratuais. Com esses dados, negociamos diretamente com as operadoras para encontrar o plano que mantém a mesma cobertura com custo significativamente menor. É uma troca estratégica, não um downgrade.',
    },
    {
      question: 'Meus colaboradores perdem carência ao trocar de operadora?',
      answer:
        'Não. A portabilidade de carências é garantida pela ANS (Resolução Normativa 438). Todos os colaboradores e dependentes mantêm suas carências cumpridas integralmente. Cuidamos de toda a documentação técnica para que a transição seja transparente e sem interrupção de atendimento.',
    },
    {
      question: 'Quanto minha empresa pode economizar de verdade?',
      answer:
        'A redução média que entregamos é de 25% a 40% sobre o valor atual do contrato. Depende do perfil da empresa, sinistralidade e operadora atual. Fazemos a cotação técnica sem compromisso — você só decide depois de ver os números reais lado a lado.',
    },
    {
      question: 'Qual o custo da consultoria da Humano Saúde?',
      answer:
        'Zero. Nossa remuneração vem da operadora escolhida, já embutida na mensalidade padrão de mercado. Sua empresa paga exatamente o mesmo valor que pagaria contratando direto, mas com nossa assessoria técnica e acompanhamento vitalício inclusos.',
    },
    {
      question: 'Atendem empresas de qualquer porte?',
      answer:
        'Sim. De MEI com 2 vidas até grandes corporações com milhares de colaboradores. Nossa expertise é técnica: analisamos sinistralidade, faixa etária e utilização para encontrar a melhor negociação independente do tamanho da empresa.',
    },
    {
      question: 'E se o reajuste anual vier alto novamente?',
      answer:
        'Diferente de uma corretora tradicional, acompanhamos seu contrato de forma contínua. Monitoramos a sinistralidade ao longo do ano e, se necessário, antecipamos negociações ou novas migrações antes do reajuste. Nosso compromisso é manter o custo sob controle permanentemente.',
    },
  ];

  return (
    <section id="duvidas" className="py-20 sm:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-20">
          <div className="inline-block px-6 py-2 rounded-full border border-gray-300 text-xs tracking-widest text-gray-600 font-bold mb-6 uppercase">
            Dúvidas Frequentes
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-[#bf953f] to-[#aa771c] bg-clip-text text-transparent font-cinzel leading-[1.1]">
            Tire Suas Dúvidas<br />Antes de Decidir
          </h2>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-8 py-6 flex items-center justify-between text-left bg-white hover:bg-gray-50 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="text-lg font-bold text-gray-900 pr-8">
                  {faq.question}
                </span>
                <span
                  className={`text-2xl font-bold transition-transform duration-300 flex-shrink-0 ${
                    openIndex === index ? 'rotate-45' : ''
                  } text-[#bf953f]`}
                >
                  +
                </span>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-8 pb-6 text-gray-700 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <a
            href="https://wa.me/5521988179407?text=Tenho%20mais%20dúvidas%20sobre%20a%20redução"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#bf953f] to-[#aa771c] px-10 py-4 rounded-xl text-xs uppercase tracking-widest font-black text-white hover:shadow-xl transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
            </svg>
            Falar com Especialista
          </a>
        </div>
      </div>
    </section>
  );
}
