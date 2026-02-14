'use client';

import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

export default function Testimonials() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

  const testimonials = [
    {
      name: 'Carlos Mendes',
      company: 'Empresário, 18 funcionários',
      text: 'Reduzi R$2.700 por mês sem perder nenhum hospital da rede. A Humano encontrou uma brecha legal que nem meu contador conhecia.',
      stars: 5,
    },
    {
      name: 'Fernanda Lima',
      company: 'Diretora de RH',
      text: 'Nunca imaginei que estava pagando por coberturas que minha equipe não usava. A análise técnica deles abriu meus olhos.',
      stars: 5,
    },
    {
      name: 'Roberto Santos',
      company: 'Advogado',
      text: 'Como advogado, eu sei ler contrato. Mas eles encontraram cláusulas que só quem vive o mercado conhece. Profissionalismo total.',
      stars: 5,
    },
  ];

  return (
    <section id="depoimentos" className="py-20 sm:py-32 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-20">
          <div className="inline-block px-6 py-2 rounded-full border border-gray-300 text-xs tracking-widest text-gray-600 font-bold mb-6 uppercase">
            Relatos Reais
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-[#bf953f] to-[#aa771c] bg-clip-text text-transparent font-cinzel leading-[1.1]">
            Quem Contratou, Aprova
          </h2>
        </div>

        {/* Mobile & Desktop Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex-[0_0_100%] md:flex-[0_0_calc(33.333%-1.5rem)] min-w-0"
              >
                <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-200 h-full flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: testimonial.stars }).map((_, i) => (
                      <svg
                        key={i}
                        className="w-5 h-5 text-[#bf953f]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-gray-700 text-lg leading-relaxed mb-8 flex-1">
                    "{testimonial.text}"
                  </p>

                  {/* Author */}
                  <div className="border-t border-gray-200 pt-6">
                    <p className="font-bold text-gray-900 text-lg">
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
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#bf953f] to-[#aa771c] px-10 py-4 rounded-xl text-xs uppercase tracking-widest font-black text-white hover:shadow-xl transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.417-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.305 1.652zm6.599-3.835c1.52.909 3.033 1.389 4.625 1.39 5.313 0 9.636-4.322 9.638-9.634.001-2.574-1.001-4.995-2.823-6.818-1.821-1.822-4.241-2.826-6.816-2.827-5.313 0-9.636 4.323-9.638 9.636-.001 1.761.474 3.483 1.378 5.008l-.995 3.633 3.731-.978zm10.748-6.377c-.283-.141-1.669-.824-1.928-.918-.258-.094-.446-.141-.634.141-.188.281-.727.918-.891 1.104-.164.187-.328.21-.611.069-.283-.141-1.194-.441-2.274-1.405-.841-.75-1.408-1.676-1.573-1.958-.164-.282-.018-.434.123-.574.127-.127.283-.329.424-.494.141-.164.188-.282.283-.47.094-.188.047-.353-.023-.494-.071-.141-.634-1.529-.868-2.094-.229-.553-.46-.478-.634-.487-.164-.007-.353-.008-.542-.008s-.494.07-.753.353c-.259.282-.988.965-.988 2.353s1.012 2.729 1.153 2.917c.141.188 1.992 3.041 4.825 4.264.674.291 1.2.464 1.61.594.677.215 1.293.185 1.781.112.544-.081 1.669-.682 1.904-1.341.235-.659.235-1.223.164-1.341-.07-.117-.258-.188-.541-.329z"/>
            </svg>
            Quero Esse Resultado
          </a>
        </div>
      </div>
    </section>
  );
}
