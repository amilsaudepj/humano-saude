'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Laptop,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Rocket,
  ChevronDown,
  Phone,
  Mail,
  Target,
  GraduationCap,
  Home,
  FolderOpen,
  Share2,
  TrendingUp,
  DollarSign,
  Eye,
  UserPlus,
  Sparkles,
  Calculator,
  FileUp,
  Brain,
  Trophy,
  Heart,
  Car,
  ShieldCheck,
  BookOpen,
  Megaphone,
  Zap,
  Clock,
  Upload,
  FileCheck,
  MousePointerClick,
  Gift,
  Star,
  Send,
  Headphones,
  Palette,
  Wand2,
  Receipt,
  FileText,
  CreditCard,
  Award,
} from 'lucide-react';

// --- Animacoes ---
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// --- Operadoras/parceiros (size: medium | large; noFilter = cores originais; mobileLarger = um pouco maior no mobile) ---
const OPERADORAS_LOGOS: Array<{ name: string; url: string; size?: 'medium' | 'large'; noFilter?: boolean; mobileLarger?: boolean }> = [
  { name: 'Amil', url: '/images/operadoras/amil-logo.png' },
  { name: 'Bradesco', url: '/images/operadoras/bradesco-logo.png' },
  { name: 'SulAmérica', url: '/images/operadoras/sulamerica-logo.png' },
  { name: 'Unimed', url: '/images/operadoras/unimed-logo.png' },
  { name: 'Porto Saúde', url: '/images/operadoras/portosaude-logo.png', size: 'large' },
  { name: 'Assim Saúde', url: '/images/operadoras/assimsaude-logo.png' },
  { name: 'Leve Saúde', url: '/images/operadoras/levesaude-logo.png' },
  { name: 'MedSênior', url: '/images/operadoras/medsenior-logo.png' },
  { name: 'Prevent Senior', url: '/images/operadoras/preventsenior-logo.png' },
  { name: 'Klini', url: '/images/logos/logo-klini.png' },
  { name: 'Ampla', url: '/images/logos/logo-ampla.png', size: 'large' },
  { name: 'AZOS', url: '/images/logos/logo-azos.png' },
  { name: 'Porto Seguro', url: '/images/logos/logo-porto-seguro2.png', size: 'large', noFilter: true },
  { name: 'Hapvida', url: '/images/logos/logo-hapvida.png' },
  { name: 'Select', url: '/images/logos/logo-select.png' },
  { name: 'Qualicorp', url: '/images/logos/logo-qualicorp.png' },
  { name: 'Supermed', url: '/images/logos/logo-supermed.png', size: 'large' },
  { name: 'Odontoprev', url: '/images/logos/logo-odontoprev.png', size: 'medium', mobileLarger: true },
  { name: 'HDI Seguros', url: '/images/logos/logo-HDI.png' },
  { name: 'Allianz', url: '/images/logos/logo-allianz.png', mobileLarger: true },
  { name: 'Suhai Seguradora', url: '/images/logos/logo-suhai.png' },
  { name: 'Liberty Seguros', url: '/images/logos/logo-liberty.png', size: 'medium', noFilter: true, mobileLarger: true },
  { name: 'Tokio Marine', url: '/images/logos/logo-tokiomarine.png', size: 'medium', mobileLarger: true },
  { name: 'Nova Saúde', url: '/images/logos/logo-nova-saude.png', size: 'medium' },
];

const PRODUTOS = [
  { icon: Heart, title: 'Plano de saúde', desc: 'Planos individuais, familiares e empresariais. Ampla rede, cobertura nacional e flexibilidade de carências e reembolso.' },
  { icon: ShieldCheck, title: 'Seguro de vida', desc: 'Proteção para você e sua família. Coberturas para vida, invalidez e doenças graves, sob medida para cada perfil.' },
  { icon: Car, title: 'Seguro automotivo', desc: 'Proteção para carro, moto e frotas. Cotação comparativa automática e apólice digital à mão.' },
  { icon: Shield, title: 'Outros seguros', desc: 'Casa, viagens, saúde bucal e previdência. Múltiplas coberturas para você e seu patrimônio.' },
];

// --- DIFERENCIAIS (por seção: Comercial, Ensino, Marketing, Financeiro) ---
type CategoriaDiferencial = 'comercial' | 'ensino' | 'marketing' | 'financeiro';

const DIFERENCIAIS: Array<{
  icon: typeof FolderOpen;
  title: string;
  desc: string;
  highlight: string;
  categoria: CategoriaDiferencial;
}> = [
  {
    icon: FolderOpen,
    title: 'Materiais organizados',
    desc: 'Todos os materiais das operadoras em um só lugar. Tabelas, lâminas, manuais e guias comerciais. Acesse de qualquer lugar, a qualquer hora.',
    highlight: 'Exclusivo',
    categoria: 'comercial',
  },
  {
    icon: Calculator,
    title: 'Multicálculo inteligente',
    desc: 'Compare planos de todas as operadoras simultaneamente. Gere cotações profissionais em segundos, com valores por faixa etária e tipo de contratação.',
    highlight: 'Multicotação',
    categoria: 'comercial',
  },
  {
    icon: FileUp,
    title: 'Envio de documentos facilitado',
    desc: 'Seu cliente arrasta e solta os documentos na plataforma. Nossa IA preenche automaticamente os dados. Sem digitação manual, sem erro.',
    highlight: 'Drag & Drop',
    categoria: 'comercial',
  },
  {
    icon: Brain,
    title: 'IA para análise de desempenho',
    desc: 'Inteligência artificial que analisa sua performance, identifica padrões de sucesso e sugere ações para você vender mais e melhor.',
    highlight: 'AI Powered',
    categoria: 'comercial',
  },
  {
    icon: Send,
    title: 'Propostas + assistente 24h',
    desc: 'Gere e envie propostas direto pela plataforma. Nosso assistente funciona 24h para encaminhar tudo às operadoras. Você não precisa esperar.',
    highlight: '24/7',
    categoria: 'comercial',
  },
  {
    icon: BarChart3,
    title: 'Dashboard em tempo real',
    desc: 'Acompanhe leads, propostas, vendas, comissões e performance. Tudo visual, intuitivo e atualizado em tempo real no seu painel.',
    highlight: 'Real-time',
    categoria: 'comercial',
  },
  {
    icon: Shield,
    title: 'Suporte de gestor dedicado',
    desc: 'Você não estará sozinho. Terá o apoio direto de um gestor para tirar dúvidas, orientar negociações e te ajudar a fechar mais vendas.',
    highlight: 'Dedicado',
    categoria: 'comercial',
  },
  {
    icon: Laptop,
    title: 'Plataforma completa (CRM)',
    desc: 'CRM profissional, gerador de cotações, propostas automatizadas. Tudo integrado em um painel moderno. De qualquer dispositivo.',
    highlight: 'All-in-One',
    categoria: 'comercial',
  },
  {
    icon: BookOpen,
    title: 'Blog e dicas de marketing',
    desc: 'Conteúdo exclusivo sobre marketing digital para corretores. Como atrair clientes nas redes sociais, criar autoridade e gerar leads.',
    highlight: 'Academy',
    categoria: 'ensino',
  },
  {
    icon: GraduationCap,
    title: 'Treinamentos contínuos',
    desc: 'Receba treinamentos práticos, atualizações de mercado, dicas de vendas exclusivas e novidades sobre produtos. Evolua constantemente.',
    highlight: 'Capacitação',
    categoria: 'ensino',
  },
  {
    icon: Share2,
    title: 'Ferramentas de divulgação',
    desc: 'Materiais prontos para redes sociais: banners, carrosséis, stories. Personalize com sua marca e divulgue no Instagram, WhatsApp e mais.',
    highlight: 'Redes sociais',
    categoria: 'marketing',
  },
  {
    icon: Palette,
    title: 'CriativoPRO',
    desc: 'Nosso criador de criativos profissionais. Gere banners, stories e artes para feed com operadora, plano, preço e sua marca. Templates prontos e IA para personalizar em segundos.',
    highlight: 'PRO',
    categoria: 'marketing',
  },
  {
    icon: Wand2,
    title: 'IA Clone',
    desc: 'Gere criativos e banners com inteligência artificial. Descreva o que precisa, escolha operadora e formato, e a IA gera a arte pronta para divulgar.',
    highlight: 'IA',
    categoria: 'marketing',
  },
  {
    icon: Award,
    title: 'Produção e parcelas',
    desc: 'Acompanhe sua produção por operadora e as parcelas de comissão. Veja o status de cada parcela (paga, pendente, atrasada) e previsão de pagamento.',
    highlight: 'Produção',
    categoria: 'financeiro',
  },
  {
    icon: FileText,
    title: 'Extrato e faturamento',
    desc: 'Extrato completo das movimentações financeiras e faturamento. Histórico organizado para sua gestão e declaração.',
    highlight: 'Extrato',
    categoria: 'financeiro',
  },
  {
    icon: BarChart3,
    title: 'Grade de comissões',
    desc: 'Visualize seus percentuais de comissão por produto: saúde PF e PJ, odonto, vida, empresarial e renovação. Transparência total na sua grade.',
    highlight: 'Transparência',
    categoria: 'financeiro',
  },
  {
    icon: Trophy,
    title: 'Metas e bonificações',
    desc: 'Campanhas de metas com prêmios e bonificações para quem se destaca. Quanto mais você vende, mais você ganha além das comissões.',
    highlight: 'Prêmios',
    categoria: 'financeiro',
  },
];

// --- OPORTUNIDADES ---
const OPORTUNIDADES = [
  {
    icon: Home,
    title: 'Trabalhe de onde quiser',
    desc: 'Toda a operação é digital. Trabalhe de casa, de um café ou de onde preferir. Basta ter internet e vontade de vender.',
  },
  {
    icon: DollarSign,
    title: 'Oportunidade real de renda',
    desc: 'O mercado de saúde e seguros não para de crescer. Aqui você tem a estrutura certa para transformar isso em ganho financeiro concreto.',
  },
  {
    icon: Eye,
    title: 'Acompanhe suas vendas',
    desc: 'Veja em tempo real o status de cada proposta, cada lead e cada comissão. Transparência total sobre tudo que é seu.',
  },
  {
    icon: UserPlus,
    title: 'Indique e ganhe',
    desc: 'Indique clientes diretamente pela plataforma e acompanhe cada indicação até a conversão. Mais uma fonte de receita para você.',
  },
];

// --- Como funciona ---
const COMO_FUNCIONA = [
  {
    step: '01',
    title: 'Cadastre-se',
    desc: 'Preencha o formulário com seus dados profissionais. O processo é rápido, gratuito e sem burocracia nenhuma.',
    icon: Target,
  },
  {
    step: '02',
    title: 'Onboarding',
    desc: 'Nosso time valida seu perfil e libera seu acesso ao painel completo em até 24 horas. Você recebe tudo pronto para começar.',
    icon: CheckCircle,
  },
  {
    step: '03',
    title: 'Comece a vender',
    desc: 'Acesse os materiais, use o multicálculo, envie propostas e acompanhe tudo pelo dashboard. Simples assim.',
    icon: Rocket,
  },
];

// --- FAQ ---
const FAQ_ITEMS = [
  {
    q: 'Preciso pagar alguma coisa para começar?',
    a: 'Absolutamente nada. Não cobramos taxa de adesão, mensalidade ou licença. Todo o investimento em plataforma, tecnologia e marketing é por nossa conta.',
  },
  {
    q: 'Preciso trabalhar em horário fixo?',
    a: 'Não. Você define seus horários e sua rotina. A plataforma está disponível 24h para que você trabalhe quando e de onde preferir.',
  },
  {
    q: 'Posso trabalhar com outras corretoras ao mesmo tempo?',
    a: 'Sim, não exigimos exclusividade. Porém, nossa estrutura e diferenciais fazem com que a maioria dos corretores prefira concentrar suas operações conosco.',
  },
  {
    q: 'Quais produtos posso vender?',
    a: 'Planos de saúde, seguro de vida, seguro automotivo, odontológico, residencial e outros seguros. Todas as principais operadoras e seguradoras do Brasil.',
  },
  {
    q: 'Vou ter algum suporte ou fico sozinho?',
    a: 'Você terá um gestor dedicado, treinamentos contínuos, dicas de marketing e uma equipe de suporte para questões operacionais. Ninguém fica sozinho aqui.',
  },
  {
    q: 'Como funciona o multicálculo?',
    a: 'Você insere as idades dos beneficiários, seleciona o tipo de plano e a plataforma compara automaticamente dezenas de opções de diferentes operadoras, gerando uma cotação profissional.',
  },
  {
    q: 'A IA realmente preenche os documentos sozinha?',
    a: 'Sim. Quando o cliente faz upload de um documento (carteirinha, apólice, etc.), nossa IA extrai automaticamente os dados como nomes, idades, operadora e valores, e preenche tudo. Sem digitação.',
  },
];

// --- Logo de parceiro (size: medium | large; noFilter = sem filtro; mobileLarger = um pouco maior no mobile) ---
function PartnerLogo({ name, url, size, noFilter, mobileLarger }: { name: string; url: string; size?: 'medium' | 'large'; noFilter?: boolean; mobileLarger?: boolean }) {
  const [failed, setFailed] = useState(false);
  const sizeClass =
    size === 'large'
      ? 'h-16 md:h-20 lg:h-24 w-auto max-w-[200px] md:max-w-[240px]'
      : size === 'medium'
        ? mobileLarger
          ? 'h-14 md:h-14 lg:h-16 w-auto max-w-[165px] md:max-w-[180px]'
          : 'h-12 md:h-14 lg:h-16 w-auto max-w-[150px] md:max-w-[180px]'
        : mobileLarger
          ? 'h-11 md:h-12 w-auto max-w-[130px] md:max-w-[120px]'
          : 'h-10 md:h-12 w-auto max-w-[120px]';
  const minSize =
    size === 'large' ? 'min-w-[140px] md:min-w-[180px]' : size === 'medium' ? (mobileLarger ? 'min-w-[130px] md:min-w-[150px]' : 'min-w-[120px] md:min-w-[150px]') : mobileLarger ? 'min-w-[110px] md:min-w-[100px]' : 'min-w-[100px]';
  const minHeight = size === 'large' ? 'min-h-[80px] md:min-h-[96px]' : size === 'medium' ? (mobileLarger ? 'min-h-[60px] md:min-h-[64px]' : 'min-h-[56px] md:min-h-[64px]') : mobileLarger ? 'min-h-[52px] md:min-h-[48px]' : 'min-h-[48px]';
  const filterClass = noFilter ? 'opacity-90 hover:opacity-100' : 'brightness-0 invert opacity-90 hover:opacity-100';
  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center ${minSize} ${minHeight}`}>
        <span className={`font-semibold text-white/90 ${size === 'large' ? 'text-base md:text-lg' : size === 'medium' ? 'text-sm md:text-base' : 'text-sm'}`}>{name}</span>
      </div>
    );
  }
  return (
    <div className={`flex flex-col items-center gap-2 ${minSize}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={name}
        className={`${sizeClass} object-contain ${filterClass} transition-opacity`}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

// --- Variantes do Section (propagam para filhos diretos) ---
const sectionVariants = {
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.03 } },
  hidden: { transition: { staggerChildren: 0.02 } },
};

// --- Componente de Secao ---
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const child = Array.isArray(children) ? children[0] : children;
  const isDiv = typeof child === 'object' && child !== null && React.isValidElement(child) && (child as React.ReactElement).type === 'div';
  const childProps = isDiv && child !== null && typeof child === 'object' && 'props' in child ? (child as React.ReactElement<{ className?: string; style?: React.CSSProperties; children?: React.ReactNode }>).props : null;

  return (
    <section ref={ref} id={id} className={`relative py-20 lg:py-28 ${className}`}>
      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={{
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0 } },
          hidden: { transition: { staggerChildren: 0.02 } },
        }}
      >
        {childProps && childProps.className ? (
          <motion.div variants={sectionVariants} className={childProps.className} style={childProps.style}>
            {childProps.children}
          </motion.div>
        ) : (
          children
        )}
      </motion.div>
    </section>
  );
}

// --- FAQ Accordion ---
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 lg:py-6 text-left cursor-pointer"
      >
        <span className="text-base sm:text-lg lg:text-xl font-semibold text-white pr-4 text-balance">{q}</span>
        <ChevronDown className={`h-5 w-5 text-[#D4AF37] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="text-base sm:text-lg text-white/75 pb-5 leading-relaxed text-pretty">{a}</p>
      </motion.div>
    </div>
  );
}

// --- Pagina Principal ---
export default function SejaCorretorPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const h = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-montserrat overflow-x-hidden">

      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-lg shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <Image
              src="/images/logos/LOGO 1 SEM FUNDO.png"
              alt="Humano Saude"
              width={180}
              height={60}
              className="h-10 lg:h-14 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/corretor/cadastro"
              className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-sm sm:text-base tracking-wider hover:bg-[#F6E05E] transition-all"
            >
              Quero ser corretor
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#1a1508_0%,_#050505_50%,_#000_100%)]" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/5 blur-[150px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#D4AF37]/3 blur-[120px] rounded-full" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(to right, #D4AF37 1px, transparent 1px), linear-gradient(to bottom, #D4AF37 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 text-center pt-28 pb-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] text-sm font-bold tracking-widest mb-8"
          >
            <Briefcase className="h-3.5 w-3.5" />
            Programa de corretores 2026
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 font-cinzel text-balance"
          >
            <span className="text-white">Seja especialista</span>
            <br />
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F6E05E] to-[#D4AF37] bg-clip-text text-transparent">
              em Seguros.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-2xl text-white max-w-3xl mx-auto mb-6 leading-relaxed text-pretty"
          >
            Venda <strong>planos de saúde, seguros de vida e automotivos</strong> com{' '}
            <strong>multicálculo inteligente</strong>, propostas automáticas,{' '}
            <strong>IA que preenche documentos</strong> e um assistente{' '}
            <strong>24 horas</strong>.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] font-black text-base sm:text-lg tracking-wide mb-10 shadow-[0_0_30px_rgba(212,175,55,0.2)]"
          >
            <Gift className="h-5 w-5" />
            Tudo sem investir nada
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/dashboard/corretor/cadastro"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#aa771c] text-black font-bold text-base tracking-wider hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all"
            >
              Quero fazer parte
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#como-funciona"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-white/80 text-base font-semibold hover:bg-white/5 transition-all"
            >
              Como funciona
              <ChevronDown className="h-4 w-4" />
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <ChevronDown className="h-6 w-6 text-[#D4AF37]/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════ GANHE DINHEIRO COM LIBERDADE (oportunidade logo após o hero) ══════════════ */}
      <Section id="oportunidades" className="bg-gradient-to-b from-[#050505] via-[#0a0804] to-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Sua oportunidade</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-5 text-balance">
              Ganhe dinheiro{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">com liberdade</span>
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty">
              O mercado de planos de saúde e seguros cresce a cada ano. Com a Humano Saúde,
              você tem tudo o que precisa para transformar essa oportunidade em renda real.
            </p>
          </motion.div>

          <motion.div variants={sectionVariants} className="grid sm:grid-cols-2 gap-6">
            {OPORTUNIDADES.map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  custom={i + 1}
                  className="flex gap-5 bg-white/[0.02] border border-white/5 rounded-2xl p-6 lg:p-8 hover:border-[#D4AF37]/15 transition-all"
                >
                  <div className="h-14 w-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                    <ItemIcon className="h-7 w-7 text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold text-white mb-2 text-balance">{item.title}</h3>
                    <p className="text-base lg:text-lg text-white/70 leading-relaxed text-pretty">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div variants={fadeUp} custom={5} className="text-center mt-12">
            <Link
              href="/dashboard/corretor/cadastro"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#D4AF37] text-black font-bold text-base tracking-wider hover:bg-[#F6E05E] transition-all"
            >
              Quero essa oportunidade
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </Section>

      {/* ══════════════ PRODUTOS QUE TRABALHAMOS ══════════════ */}
      <Section id="produtos" className="bg-gradient-to-b from-[#050505] via-[#0a0804] to-[#050505]">
        <motion.div
          variants={sectionVariants}
          className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16 sm:col-span-2 lg:col-span-4">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Produtos</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4 text-balance">
              O que você pode{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">vender</span>
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty">
              Não se limite a um produto só. Aqui você tem acesso a um portfólio completo para atender qualquer necessidade do seu cliente.
            </p>
          </motion.div>
          {PRODUTOS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                variants={fadeUp}
                custom={i + 1}
                className="flex flex-col text-center bg-white/[0.02] border border-white/5 rounded-2xl p-6 lg:p-8 hover:border-[#D4AF37]/20 transition-all min-h-[280px] min-w-0 lg:min-w-[240px]"
              >
                <div className="h-16 w-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-5 shrink-0">
                  <Icon className="h-8 w-8 text-[#D4AF37]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 whitespace-nowrap">{p.title}</h3>
                <p className="text-base text-white/70 leading-relaxed flex-1 break-words text-pretty">{p.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </Section>

      {/* ══════════════ NOSSOS PARCEIROS ══════════════ */}
      <Section id="parceiros" className="bg-gradient-to-b from-[#0a0804] via-[#050505] to-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-5xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Parceiros</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-cinzel mb-4 text-balance">
              Nossos parceiros
            </h2>
            <p className="text-lg text-white/70 max-w-xl mx-auto leading-relaxed text-pretty">
              Operadoras e redes com as quais trabalhamos para oferecer as melhores opções ao seu cliente.
            </p>
          </motion.div>
          <motion.div
            variants={fadeUp}
            custom={1}
            className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 md:gap-8 lg:gap-x-12 lg:gap-y-10 py-8 px-6 rounded-2xl bg-white/[0.02] border border-white/5 place-items-center"
          >
            {OPERADORAS_LOGOS.map((op) => (
              <PartnerLogo key={op.name} name={op.name} url={op.url} size={op.size} noFilter={op.noFilter} mobileLarger={op.mobileLarger} />
            ))}
            <span className="col-span-full w-full text-center text-sm text-white/70 font-medium">
              e muito mais…
            </span>
          </motion.div>
        </motion.div>
      </Section>

      {/* ══════════════ DIFERENCIAIS ══════════════ */}
      <Section id="diferenciais" className="bg-[#050505]">
        <motion.div
          variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }, hidden: {} }}
          className="max-w-7xl mx-auto px-4 md:px-8"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Nossos diferenciais</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4 text-balance">
              Tudo que você{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">recebe aqui</span>
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty">
              Mais do que uma corretora. Uma estrutura completa com tecnologia, IA e suporte para você construir sua carreira com as melhores ferramentas do mercado.
            </p>
          </motion.div>

          {(['comercial', 'ensino', 'marketing', 'financeiro'] as const).map((categoria, idxSec) => {
            const itens = DIFERENCIAIS.filter((d) => d.categoria === categoria);
            const titulos: Record<typeof categoria, string> = {
              comercial: 'Comercial',
              ensino: 'Ensino',
              marketing: 'Marketing',
              financeiro: 'Financeiro',
            };
            return (
              <motion.div key={categoria} variants={fadeUp} custom={idxSec + 1} className="mb-14 last:mb-0">
                <h3 className="text-lg font-bold text-[#D4AF37] tracking-wider mb-6 border-b border-white/10 pb-2 text-balance">
                  {titulos[categoria]}
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {itens.map((d, i) => {
                    const Icon = d.icon;
                    return (
                      <motion.div
                        key={d.title}
                        variants={fadeUp}
                        custom={i + 1}
                        className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-5 lg:p-6 hover:border-[#D4AF37]/20 hover:bg-[#D4AF37]/[0.02] transition-all duration-500"
                      >
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-[9px] font-bold tracking-wider">
                            {d.highlight}
                          </span>
                        </div>

                        <div className="h-11 w-11 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mb-4 group-hover:bg-[#D4AF37]/20 transition-colors">
                          <Icon className="h-5 w-5 text-[#D4AF37]" />
                        </div>

                        <h3 className="text-lg lg:text-xl font-bold text-white mb-2 text-balance">{d.title}</h3>
                        <p className="text-sm lg:text-base text-white/70 leading-relaxed text-pretty">{d.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </Section>

      {/* ══════════════ MOCKUP MULTICALCULO ══════════════ */}
      <Section className="bg-gradient-to-b from-[#050505] via-[#0a0804] to-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Multicálculo</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4 text-balance">
              Compare{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">dezenas de planos</span>
              {' '}em segundos
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty">
              Insira as idades, escolha o tipo e nossa plataforma compara automaticamente todas as operadoras. Cotação profissional pronta para enviar ao cliente.
            </p>
          </motion.div>

          <motion.div variants={scaleIn} className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
            <div className="p-5 lg:p-8">
              {/* Header do multicálculo */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Multicálculo inteligente</p>
                  <p className="text-sm text-white/75">Compare operadoras lado a lado</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>

              {/* Input area: no mobile 1 coluna para não invadir PME; a partir de sm 3 colunas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 min-w-0">
                  <p className="text-[10px] text-white/50 mb-1">Beneficiários</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['32', '28', '5'].map((age, i) => (
                      <span key={i} className="px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded text-xs font-bold shrink-0">{age} anos</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 min-w-0">
                  <p className="text-[10px] text-white/50 mb-1">Tipo</p>
                  <p className="text-sm text-white font-semibold">PME</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 min-w-0">
                  <p className="text-[10px] text-white/50 mb-1">Acomodação</p>
                  <p className="text-sm text-white font-semibold">Apartamento</p>
                </div>
              </div>

              {/* Resultados mockup */}
              <div className="space-y-3">
                {[
                  { op: 'Amil', plano: 'Amil 400 QC Nac', valor: 'R$ 1.247,90', dest: true },
                  { op: 'Bradesco', plano: 'Nacional Flex', valor: 'R$ 1.389,50', dest: false },
                  { op: 'SulAmerica', plano: 'Prestige', valor: 'R$ 1.520,00', dest: false },
                  { op: 'Unimed', plano: 'Classico Nacional', valor: 'R$ 1.198,30', dest: true },
                ].map((plano, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${plano.dest ? 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.03]' : 'border-white/5 bg-white/[0.02]'}`}>
                    <div className="flex items-center gap-3">
                      {plano.dest && <Star className="h-4 w-4 text-[#D4AF37]" />}
                      <div>
                        <p className="text-sm font-semibold text-white">{plano.plano}</p>
                        <p className="text-sm text-white/75">{plano.op}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{plano.valor}</p>
                      <p className="text-[10px] text-white/50">/mês</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="text-center mt-8">
            <p className="text-sm sm:text-base text-white/75">Amil · Bradesco · SulAmerica · Unimed · NotreDame · Porto · Hapvida e mais</p>
          </motion.div>
        </motion.div>
      </Section>

      {/* ══════════════ MOCKUP UPLOAD DOCUMENTOS (Drag & Drop + IA) ══════════════ */}
      <Section className="bg-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Documentação inteligente</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4 text-balance">
              Arraste, solte e{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">a IA faz o resto</span>
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty">
              Seu cliente arrasta o documento para a plataforma. Nossa inteligência artificial extrai todos os dados automaticamente. Sem digitação, sem erro, sem perda de tempo.
            </p>
          </motion.div>

          <motion.div variants={scaleIn} className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
            <div className="p-5 lg:p-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Area de Drag & Drop */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-full border-2 border-dashed border-[#D4AF37]/30 rounded-2xl p-8 lg:p-12 text-center bg-[#D4AF37]/[0.02] hover:border-[#D4AF37]/50 transition-colors">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    >
                      <Upload className="h-12 w-12 lg:h-16 lg:w-16 text-[#D4AF37]/50 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-base lg:text-lg font-bold text-white mb-2 text-balance">Arraste seus documentos aqui</p>
                    <p className="text-xs lg:text-sm text-white/75 mb-4 text-pretty">ou clique para selecionar</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['PDF', 'JPG', 'PNG', 'Carteirinha', 'Apólice'].map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-full bg-white/5 text-[10px] text-white/75 font-medium">{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Arquivo sendo processado */}
                  <div className="w-full mt-4 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <FileCheck className="h-5 w-5 text-green-400" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">carteirinha_amil.pdf</p>
                        <p className="text-xs text-green-400">Processado com sucesso</p>
                      </div>
                      <Brain className="h-5 w-5 text-[#D4AF37] animate-pulse" />
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Dados extraidos pela IA */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 lg:p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Brain className="h-5 w-5 text-[#D4AF37]" />
                    <p className="text-sm font-bold text-white">Dados extraidos pela IA</p>
                    <span className="ml-auto px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold">98.7% precisao</span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: 'Titular', value: 'Maria Silva Santos', conf: '99%' },
                      { label: 'Operadora', value: 'AMIL', conf: '100%' },
                      { label: 'Beneficiários', value: '3 (32, 28, 5 anos)', conf: '98%' },
                      { label: 'Plano atual', value: 'Amil 400 QC Nacional', conf: '97%' },
                      { label: 'Valor mensal', value: 'R$ 1.890,50', conf: '95%' },
                      { label: 'Tipo', value: 'PME - Empresarial', conf: '99%' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-[10px] text-white/50">{item.label}</p>
                          <p className="text-sm font-semibold text-white">{item.value}</p>
                        </div>
                        <span className="text-[10px] text-green-400 font-bold">{item.conf}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-[#D4AF37]/[0.05] border border-[#D4AF37]/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[#D4AF37]" />
                      <p className="text-xs text-[#D4AF37] font-semibold">Pronto para gerar cotação automática</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/50 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        </motion.div>
      </Section>

      {/* ══════════════ MOCKUP DASHBOARD + PIPELINE ══════════════ */}
      <Section className="bg-gradient-to-b from-[#050505] via-[#0a0804] to-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Seu painel</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4 text-balance">
              Dashboard{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">profissional</span>
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty">
              CRM completo, financeiro, IA e tudo que você precisa. Acessível de qualquer dispositivo.
            </p>
          </motion.div>

          <motion.div variants={scaleIn} className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
            <div className="p-5 lg:p-8">
              {/* Big Numbers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Leads ativos', value: '47', icon: Users, color: 'text-blue-400' },
                  { label: 'Propostas', value: '23', icon: Briefcase, color: 'text-green-400' },
                  { label: 'Comissoes', value: 'R$ 18.5K', icon: DollarSign, color: 'text-[#D4AF37]' },
                  { label: 'Conversao', value: '68%', icon: TrendingUp, color: 'text-purple-400' },
                ].map((card) => {
                  const CardIcon = card.icon;
                  return (
                    <div key={card.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <CardIcon className={`h-4 w-4 ${card.color}`} />
                        <span className="text-[10px] sm:text-sm text-white/75">{card.label}</span>
                      </div>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{card.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* CRM */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 h-44">
                  <p className="text-xs text-white/75 mb-3 font-semibold">CRM</p>
                  <div className="flex gap-2 h-28">
                    {[
                      { name: 'Novo', count: 12, color: 'bg-blue-500/20' },
                      { name: 'Qualificado', count: 8, color: 'bg-purple-500/20' },
                      { name: 'Proposta', count: 5, color: 'bg-orange-500/20' },
                      { name: 'Docs', count: 3, color: 'bg-cyan-500/20' },
                      { name: 'Fechado', count: 15, color: 'bg-green-500/20' },
                    ].map((col) => (
                      <div key={col.name} className={`flex-1 ${col.color} border border-white/5 rounded-lg p-1.5`}>
                        <p className="text-[9px] text-white/75 mb-1">{col.name}</p>
                        <p className="text-xs font-bold text-white">{col.count}</p>
                        {Array.from({ length: Math.min(col.count, 3) }).map((_, j) => (
                          <div key={j} className="h-3 rounded bg-white/5 mb-1 mt-1" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grafico de producao */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 h-44">
                  <p className="text-xs text-white/75 mb-3 font-semibold">Sua producao</p>
                  <div className="flex items-end gap-1.5 h-28 pb-2">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 95, 60, 75, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-[#D4AF37]/40 to-[#D4AF37]/10 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* IA Insights bar */}
              <div className="mt-4 flex items-center gap-3 p-3 bg-[#D4AF37]/[0.03] border border-[#D4AF37]/10 rounded-xl">
                <Brain className="h-5 w-5 text-[#D4AF37] flex-shrink-0" />
                <p className="text-xs text-white/75"><strong className="text-[#D4AF37]">IA Insight:</strong> Sua taxa de conversao subiu 12% esta semana. Continue priorizando leads de PME, seu ticket medio e 3x maior.</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="text-center mt-8">
            <p className="text-sm sm:text-base text-white/75">CRM · Multicálculo · Financeiro · IA · Marketing. Tudo em um só lugar</p>
          </motion.div>
        </motion.div>
      </Section>

      {/* ══════════════ MOCKUP FUNIL DE VENDAS ══════════════ */}
      <Section className="bg-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-5xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Funil visual</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4 text-balance">
              Veja seu{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">funil de vendas</span>
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty">
              Visualize cada etapa do seu processo comercial. Do lead novo ao contrato fechado.
            </p>
          </motion.div>

          <motion.div variants={scaleIn} className="relative">
            <motion.div variants={sectionVariants} className="space-y-2">
              {[
                { stage: 'Novos leads', count: 47, pct: 100, color: 'from-blue-500/40 to-blue-600/20' },
                { stage: 'Qualificados', count: 32, pct: 68, color: 'from-purple-500/40 to-purple-600/20' },
                { stage: 'Cotação enviada', count: 23, pct: 49, color: 'from-orange-500/40 to-orange-600/20' },
                { stage: 'Proposta', count: 15, pct: 32, color: 'from-yellow-500/40 to-yellow-600/20' },
                { stage: 'Documentação', count: 10, pct: 21, color: 'from-cyan-500/40 to-cyan-600/20' },
                { stage: 'Fechado', count: 8, pct: 17, color: 'from-green-500/40 to-green-600/20' },
              ].map((s, i) => (
                <motion.div key={s.stage} variants={fadeUp} custom={i + 1} className="relative">
                  <div
                    className={`bg-gradient-to-r ${s.color} border border-white/5 rounded-xl p-3 sm:p-4 transition-all`}
                    style={{ width: `${Math.max(s.pct, 50)}%`, marginLeft: 'auto', marginRight: 'auto' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white truncate">{s.stage}</span>
                      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <span className="text-base sm:text-lg font-black text-white">{s.count}</span>
                        <span className="text-[10px] text-white/70">{s.pct}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </Section>

      {/* ══════════════ Como funciona ══════════════ */}
      <Section id="como-funciona" className="bg-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-5xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Processo simples</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel text-balance">
              Como{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">funciona</span>
            </h2>
          </motion.div>

          <motion.div variants={sectionVariants} className="grid md:grid-cols-3 gap-8">
            {COMO_FUNCIONA.map((item, i) => {
              const StepIcon = item.icon;
              return (
                <motion.div key={item.step} variants={fadeUp} custom={i + 1} className="text-center">
                  <div className="relative mx-auto mb-6">
                    <div className="h-20 w-20 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto">
                      <StepIcon className="h-10 w-10 text-[#D4AF37]" />
                    </div>
                    <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-[#D4AF37] text-black text-xs font-black flex items-center justify-center">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 text-balance">{item.title}</h3>
                  <p className="text-base lg:text-lg text-white/70 leading-relaxed text-pretty">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </Section>

      {/* ══════════════ FAQ ══════════════ */}
      <Section id="faq" className="bg-gradient-to-b from-[#050505] via-[#0a0804] to-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-3xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Dúvidas</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-cinzel text-balance">
              Perguntas{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">frequentes</span>
            </h2>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </motion.div>
        </motion.div>
      </Section>

      {/* ══════════════ CTA FINAL ══════════════ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-[#050505] to-[#D4AF37]/5" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="h-12 w-12 text-[#D4AF37] mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4 text-balance">
              Pronto para{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">
                Comecar?
              </span>
            </h2>
            <p className="text-white/70 text-lg md:text-xl lg:text-2xl mb-8 max-w-xl mx-auto leading-relaxed text-pretty">
              Cadastre-se gratuitamente, receba acesso a plataforma completa
              e comece a construir sua renda no mercado de saude e seguros.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard/corretor/cadastro"
                className="group flex items-center gap-2 px-8 sm:px-10 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#aa771c] text-black font-black text-sm sm:text-base tracking-widest hover:shadow-[0_0_60px_rgba(212,175,55,0.4)] transition-all"
              >
                Quero fazer parte
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://wa.me/5521988179407?text=Ola! Tenho interesse em ser corretor Humano Saude."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 sm:px-8 py-4 rounded-2xl border border-[#D4AF37]/30 text-[#D4AF37] text-sm sm:text-base font-bold hover:bg-[#D4AF37]/5 transition-all"
              >
                <Phone className="h-4 w-4" />
                Falar com comercial
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="bg-black border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Image
                src="/images/logos/LOGO 1 SEM FUNDO.png"
                alt="Humano Saude"
                width={140}
                height={47}
                className="h-10 w-auto"
              />
              <div className="h-6 w-px bg-white/10" />
              <span className="text-sm text-white/50">Programa de corretores 2026</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-white/75">
              <a href="mailto:comercial@humanosaude.com.br" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> comercial@humanosaude.com.br
              </a>
              <a href="https://wa.me/5521988179407" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> (21) 98817-9407
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-white/40">
              &copy; {new Date().getFullYear()} Humano Saude. Todos os direitos reservados. CNPJ: 50.216.907/0001-60 | SUSEP: 251174847
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
