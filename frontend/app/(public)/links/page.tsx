'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Calculator,
  FileText,
  LogIn,
  UserPlus,
  Users,
  Share2,
  Palette,
  ArrowRight,
  Building2,
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'Vendas',
    description: 'Páginas de conversão e cotação',
    links: [
      { href: '/economizar', label: 'Economize no plano de saúde', subtitle: 'Calculadora e análise com IA', icon: Calculator },
      { href: '/formulario-cnpj', label: 'Cotação por CNPJ', subtitle: 'Empresas e MEI', icon: Building2 },
      { href: '/completar-cotacao', label: 'Completar cotação', subtitle: 'Finalize sua solicitação', icon: FileText },
    ],
  },
  {
    title: 'Acessos',
    description: 'Login e cadastro dos portais',
    links: [
      { href: '/dashboard/corretor/login', label: 'Login Corretor', subtitle: 'Painel do corretor', icon: LogIn },
      { href: '/dashboard/corretor/cadastro', label: 'Cadastro Corretor', subtitle: 'Solicitar acesso', icon: UserPlus },
      { href: '/dashboard/afiliado/login', label: 'Login Afiliado', subtitle: 'Painel do afiliado', icon: LogIn },
      { href: '/portal-cliente/login', label: 'Portal do Cliente', subtitle: 'Acesso do titular', icon: Users },
      { href: '/design-system', label: 'Design System', subtitle: 'Materiais e identidade visual', icon: Palette },
    ],
  },
  {
    title: 'Indicações',
    description: 'Afiliados e indicação de clientes',
    links: [
      { href: '/seja-afiliado', label: 'Seja um afiliado', subtitle: 'Cadastre-se como afiliado', icon: UserPlus },
      { href: '/indicar', label: 'Indicar cliente', subtitle: 'Formulário de indicação', icon: Share2 },
    ],
  },
] as const;

export default function LinksPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-montserrat">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.12),transparent)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-12 sm:py-16">
        {/* Logo + título */}
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
          <p className="text-white/50 text-sm">Links oficiais · Vendas, acessos e indicações</p>
        </div>

        {/* Seções */}
        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-1">
                {section.title}
              </h2>
              <p className="text-white/40 text-sm mb-4">{section.description}</p>
              <ul className="space-y-3">
                {section.links.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#D4AF37]/30 transition-all duration-200"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] group-hover:bg-[#D4AF37]/20 transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-white group-hover:text-[#D4AF37] transition-colors">
                            {item.label}
                          </span>
                          {item.subtitle && (
                            <span className="block text-xs text-white/50 truncate">{item.subtitle}</span>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-white/30 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-12">
          © {new Date().getFullYear()} Humano Saúde. Todos os links são oficiais.
        </p>
      </div>
    </div>
  );
}
