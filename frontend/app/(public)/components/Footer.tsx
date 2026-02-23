import Image from 'next/image';
import Link from 'next/link';

interface FooterProps {
  /** Oculta a coluna "Links Rápidos" (ex.: página completar-cotacao) */
  hideLinksRapidos?: boolean;
}

export default function Footer({ hideLinksRapidos = false }: FooterProps) {
  return (
    <footer className="bg-black text-white border-t border-white/5">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className={`grid gap-12 md:gap-8 ${hideLinksRapidos ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
          {/* Column 1: Logo + Description */}
          <div>
            <Image
              src="/images/logos/LOGO 1 SEM FUNDO.png"
              alt="Humano Saúde"
              width={180}
              height={60}
              className="mb-6"
            />
            <p className="text-gray-400 leading-relaxed text-sm">
              Consultoria especializada em redução de custos com planos de saúde. 
              Análise técnica, migração sem carência e acompanhamento vitalício.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://instagram.com/humanosaude"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-gold-400 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-gold-400">
              Contato
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="https://wa.me/5521988179407" className="text-gray-400 hover:text-gold-400 transition-colors">
                  (21) 98817-9407
                </a>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:comercial@humanosaude.com.br" className="text-gray-400 hover:text-gold-400 transition-colors">
                  comercial@humanosaude.com.br
                </a>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-400">
                  Rio de Janeiro, RJ
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links (oculto em completar-cotacao) */}
          {!hideLinksRapidos && (
            <div>
              <h3 className="text-lg font-bold mb-6 text-gold-400">
                Links Rápidos
              </h3>
              <ul className="space-y-4 text-sm">
                <li>
                  <Link href="#ia" className="text-gray-400 hover:text-gold-400 transition-colors">
                    Tecnologia IA
                  </Link>
                </li>
                <li>
                  <Link href="#pratica" className="text-gray-400 hover:text-gold-400 transition-colors">
                    Resultados Reais
                  </Link>
                </li>
                <li>
                  <Link href="#metodo" className="text-gray-400 hover:text-gold-400 transition-colors">
                    Método Tríade
                  </Link>
                </li>
                <li>
                  <Link href="#testimonials" className="text-gray-400 hover:text-gold-400 transition-colors">
                    Depoimentos
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="text-gray-400 hover:text-gold-400 transition-colors">
                    Dúvidas Frequentes
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>
              © {new Date().getFullYear()} Humano Saúde. Todos os direitos reservados.
            </p>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p>CNPJ: 50.216.907/0001-60</p>
              <span className="hidden md:inline">•</span>
              <p>SUSEP: 251174847</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
