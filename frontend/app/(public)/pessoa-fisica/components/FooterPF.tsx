import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Phone, Mail, MapPin } from 'lucide-react';

export default function FooterPF() {
  return (
    <footer className="bg-black text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid gap-12 md:gap-8 md:grid-cols-3">
          <div>
            <Image
              src="/images/logos/LOGO 1 SEM FUNDO.png"
              alt="Humano Saúde"
              width={180}
              height={60}
              className="mb-6"
            />
            <p className="text-gray-400 leading-relaxed text-sm">
              Corretora especializada em planos de saúde para você e sua família.
              Cotação grátis, comparação entre operadoras e suporte humanizado.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://instagram.com/humanosauderj"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#B8941F] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 text-[#D4AF37]">Contato</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <a href="https://wa.me/5521988179407?text=Olá!%20Gostaria%20de%20uma%20cotação%20de%20plano%20de%20saúde%20para%20pessoa%20física." target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                  (21) 98817-9407
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <a href="mailto:comercial@humanosaude.com.br" className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                  comercial@humanosaude.com.br
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">Rio de Janeiro, RJ</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 text-[#D4AF37]">Links Rápidos</h3>
            <ul className="space-y-4 text-sm">
              <li><Link href="#hero" className="text-gray-400 hover:text-[#D4AF37] transition-colors">Início</Link></li>
              <li><Link href="#rede" className="text-gray-400 hover:text-[#D4AF37] transition-colors">Rede</Link></li>
              <li><Link href="#como-funciona" className="text-gray-400 hover:text-[#D4AF37] transition-colors">Como funciona</Link></li>
              <li><Link href="#compare" className="text-gray-400 hover:text-[#D4AF37] transition-colors">Compare</Link></li>
              <li><Link href="#depoimentos" className="text-gray-400 hover:text-[#D4AF37] transition-colors">Depoimentos</Link></li>
              <li><Link href="#faq" className="text-gray-400 hover:text-[#D4AF37] transition-colors">Dúvidas Frequentes</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-[#D4AF37] transition-colors">Para empresas</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Humano Saúde. Todos os direitos reservados.</p>
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
