'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calculator, Share2, ArrowRight, Building2, User } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/5521988179407?text=Olá! Gostaria de falar com um especialista em planos de saúde.';

/** Ícone oficial do WhatsApp (verde #25D366) */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/** URLs dos sites Empresas e PF (podem ser outro domínio). Configure em .env: NEXT_PUBLIC_LINKS_URL_EMPRESAS, NEXT_PUBLIC_LINKS_URL_PF */
const URL_EMPRESAS =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LINKS_URL_EMPRESAS) || '/';
const URL_PF =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LINKS_URL_PF) || '/';

const PUBLIC_LINKS = [
  { href: URL_EMPRESAS, label: 'Humano Saúde Empresas', subtitle: 'Planos para empresas', icon: Building2 },
  { href: URL_PF, label: 'Humano Saúde Pessoa Física', subtitle: 'Planos para você e sua família', icon: User },
  { href: '/economizar', label: 'Calculadora de Planos', subtitle: 'Análise com IA: simule e encontre o melhor plano', icon: Calculator },
  { href: '/indicar', label: 'Indique um Cliente', subtitle: 'Quer ajudar alguém a economizar? Indique aqui', icon: Share2 },
  { href: WHATSAPP_URL, label: 'Falar com especialista', subtitle: 'Atendimento via WhatsApp', icon: WhatsAppIcon },
] as const;

export default function LinksPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-montserrat">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.12),transparent)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-4">
            <Image
              src="/images/logos/icon-humano.png"
              alt="Humano Saúde"
              width={64}
              height={64}
              className="rounded-2xl"
            />
            <span className="text-2xl font-bold text-white tracking-tight">Humano Saúde</span>
          </Link>
          <p className="text-white/50 text-sm">Links oficiais</p>
        </div>

        <ul className="space-y-3">
          {PUBLIC_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#D4AF37]/30 transition-all duration-200"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] group-hover:bg-[#D4AF37]/20 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-base font-medium text-white group-hover:text-[#D4AF37] transition-colors">
                      {item.label}
                    </span>
                    {item.subtitle && (
                      <span className="block text-sm text-white/50">{item.subtitle}</span>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-white/30 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all" />
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="text-center text-white/30 text-xs mt-12">
          © {new Date().getFullYear()} Humano Saúde. Todos os links são oficiais.
        </p>
      </div>
    </div>
  );
}
