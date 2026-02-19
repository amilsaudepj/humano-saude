'use client';

import { useState, useEffect, useRef } from 'react';
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

// --- PRODUTOS que trabalhamos ---
const PRODUTOS = [
  { icon: Heart, title: 'Plano de saude', desc: 'Amil, Bradesco, SulAmerica, Unimed, NotreDame e mais' },
  { icon: ShieldCheck, title: 'Seguro de vida', desc: 'Individual, familiar e empresarial com as maiores seguradoras' },
  { icon: Car, title: 'Seguro automotivo', desc: 'Carro, moto e frotas com cotacao comparativa automatica' },
  { icon: Shield, title: 'Outros seguros', desc: 'Residencial, viagem, odontologico e previdencia privada' },
];

// --- DIFERENCIAIS ---
const DIFERENCIAIS = [
  {
    icon: FolderOpen,
    title: 'Materiais organizados',
    desc: 'Todos os materiais das operadoras em um so lugar. Tabelas, laminas, manuais e guias comerciais. Acesse de qualquer lugar, a qualquer hora.',
    highlight: 'Exclusivo',
  },
  {
    icon: Calculator,
    title: 'Multicalculo inteligente',
    desc: 'Compare planos de todas as operadoras simultaneamente. Gere cotacoes profissionais em segundos, com valores por faixa etaria e tipo de contratacao.',
    highlight: 'Multicotacao',
  },
  {
    icon: FileUp,
    title: 'Envio de documentos facilitado',
    desc: 'Seu cliente arrasta e solta os documentos na plataforma. Nossa IA preenche automaticamente os dados. Sem digitacao manual, sem erro.',
    highlight: 'Drag & Drop',
  },
  {
    icon: Brain,
    title: 'IA para analise de desempenho',
    desc: 'Inteligencia artificial que analisa sua performance, identifica padroes de sucesso e sugere acoes para voce vender mais e melhor.',
    highlight: 'AI Powered',
  },
  {
    icon: Send,
    title: 'Propostas + assistente 24h',
    desc: 'Gere e envie propostas direto pela plataforma. Nosso assistente funciona 24h para encaminhar tudo as operadoras. Voce nao precisa esperar.',
    highlight: '24/7',
  },
  {
    icon: Trophy,
    title: 'Metas e bonificacoes',
    desc: 'Campanhas de metas com premios e bonificacoes para quem se destaca. Quanto mais voce vende, mais voce ganha alem das comissoes.',
    highlight: 'Premios',
  },
  {
    icon: BookOpen,
    title: 'Blog e dicas de marketing',
    desc: 'Conteudo exclusivo sobre marketing digital para corretores. Como atrair clientes nas redes sociais, criar autoridade e gerar leads.',
    highlight: 'Academy',
  },
  {
    icon: Share2,
    title: 'Ferramentas de divulgacao',
    desc: 'Materiais prontos para redes sociais: banners, carrosséis, stories. Personalize com sua marca e divulgue no Instagram, WhatsApp e mais.',
    highlight: 'Marketing',
  },
  {
    icon: BarChart3,
    title: 'Dashboard em tempo real',
    desc: 'Acompanhe leads, propostas, vendas, comissoes e performance. Tudo visual, intuitivo e atualizado em tempo real no seu painel.',
    highlight: 'Real-time',
  },
  {
    icon: Shield,
    title: 'Suporte de gestor dedicado',
    desc: 'Voce nao estara sozinho. Tera o apoio direto de um gestor para tirar duvidas, orientar negociacoes e te ajudar a fechar mais vendas.',
    highlight: 'Dedicado',
  },
  {
    icon: GraduationCap,
    title: 'Treinamentos continuos',
    desc: 'Receba treinamentos praticos, atualizacoes de mercado, dicas de vendas exclusivas e novidades sobre produtos. Evolua constantemente.',
    highlight: 'Capacitacao',
  },
  {
    icon: Laptop,
    title: 'Plataforma completa (CRM)',
    desc: 'CRM profissional, gerador de cotacoes, propostas automatizadas. Tudo integrado em um painel moderno. De qualquer dispositivo.',
    highlight: 'All-in-One',
  },
];

// --- OPORTUNIDADES ---
const OPORTUNIDADES = [
  {
    icon: Home,
    title: 'Trabalhe de onde quiser',
    desc: 'Toda a operacao e digital. Trabalhe de casa, de um cafe ou de onde preferir. Basta ter internet e vontade de vender.',
  },
  {
    icon: DollarSign,
    title: 'Oportunidade real de renda',
    desc: 'O mercado de saude e seguros nao para de crescer. Aqui voce tem a estrutura certa para transformar isso em ganho financeiro concreto.',
  },
  {
    icon: Eye,
    title: 'Acompanhe suas vendas',
    desc: 'Veja em tempo real o status de cada proposta, cada lead e cada comissao. Transparencia total sobre tudo que e seu.',
  },
  {
    icon: UserPlus,
    title: 'Indique e ganhe',
    desc: 'Indique clientes diretamente pela plataforma e acompanhe cada indicacao ate a conversao. Mais uma fonte de receita para voce.',
  },
];

// --- Como funciona ---
const COMO_FUNCIONA = [
  {
    step: '01',
    title: 'Cadastre-se',
    desc: 'Preencha o formulario com seus dados profissionais. O processo e rapido, gratuito e sem burocracia nenhuma.',
    icon: Target,
  },
  {
    step: '02',
    title: 'Onboarding',
    desc: 'Nosso time valida seu perfil e libera seu acesso ao painel completo em ate 24 horas. Voce recebe tudo pronto para comecar.',
    icon: CheckCircle,
  },
  {
    step: '03',
    title: 'Comece a vender',
    desc: 'Acesse os materiais, use o multicalculo, envie propostas e acompanhe tudo pelo dashboard. Simples assim.',
    icon: Rocket,
  },
];

// --- FAQ ---
const FAQ_ITEMS = [
  {
    q: 'Preciso ter SUSEP para me cadastrar?',
    a: 'Sim, e necessario ter registro ativo na SUSEP para atuar como corretor de planos de saude. Se voce esta em processo de obtencao, pode se cadastrar e informar quando obtiver.',
  },
  {
    q: 'Preciso pagar alguma coisa para comecar?',
    a: 'Absolutamente nada. Nao cobramos taxa de adesao, mensalidade ou licenca. Todo o investimento em plataforma, tecnologia e marketing e por nossa conta.',
  },
  {
    q: 'Preciso trabalhar em horario fixo?',
    a: 'Nao. Voce define seus horarios e sua rotina. A plataforma esta disponivel 24h para que voce trabalhe quando e de onde preferir.',
  },
  {
    q: 'Posso trabalhar com outras corretoras ao mesmo tempo?',
    a: 'Sim, nao exigimos exclusividade. Porem, nossa estrutura e diferenciais fazem com que a maioria dos corretores prefiram concentrar suas operacoes conosco.',
  },
  {
    q: 'Quais produtos posso vender?',
    a: 'Planos de saude, seguro de vida, seguro automotivo, odontologico, residencial e outros seguros. Todas as principais operadoras e seguradoras do Brasil.',
  },
  {
    q: 'Vou ter algum suporte ou fico sozinho?',
    a: 'Voce tera um gestor dedicado, treinamentos continuos, dicas de marketing e uma equipe de suporte para questoes operacionais. Ninguem fica sozinho aqui.',
  },
  {
    q: 'Como funciona o multicalculo?',
    a: 'Voce insere as idades dos beneficiarios, seleciona o tipo de plano e a plataforma compara automaticamente dezenas de opcoes de diferentes operadoras, gerando uma cotacao profissional.',
  },
  {
    q: 'A IA realmente preenche os documentos sozinha?',
    a: 'Sim. Quando o cliente faz upload de um documento (carteirinha, apolice, etc.), nossa IA extrai automaticamente os dados como nomes, idades, operadora e valores, e preenche tudo. Sem digitacao.',
  },
];

// --- Componente de Secao ---
function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section ref={ref} id={id} className={`relative py-20 lg:py-28 ${className}`}>
      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {children}
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
        <span className="text-base sm:text-lg lg:text-xl font-semibold text-white pr-4">{q}</span>
        <ChevronDown className={`h-5 w-5 text-[#D4AF37] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="text-base sm:text-lg text-white/60 pb-5 leading-relaxed">{a}</p>
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
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-sm sm:text-base tracking-wider hover:bg-[#F6E05E] transition-all"
            >
              Quero ser corretor
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
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 font-cinzel"
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
            className="text-lg sm:text-xl md:text-2xl lg:text-2xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Venda <strong className="text-white">planos de saude, seguros de vida e automotivos</strong> com{' '}
            <strong className="text-white">multicalculo inteligente</strong>, propostas automaticas,{' '}
            <strong className="text-white">IA que preenche documentos</strong> e um assistente{' '}
            <strong className="text-white">24 horas</strong>. Tudo sem investir nada.
          </motion.p>

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
              href="#produtos"
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

      {/* ══════════════ PRODUTOS QUE TRABALHAMOS ══════════════ */}
      <Section id="produtos" className="bg-gradient-to-b from-[#050505] via-[#0a0804] to-[#050505]">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Produtos</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4">
              O que voce pode{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">vender</span>
            </h2>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Nao se limite a um produto so. Aqui voce tem acesso a um portfolio completo para atender qualquer necessidade do seu cliente.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PRODUTOS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  variants={fadeUp}
                  custom={i + 1}
                  className="text-center bg-white/[0.02] border border-white/5 rounded-2xl p-6 lg:p-8 hover:border-[#D4AF37]/20 transition-all"
                >
                  <div className="h-16 w-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-5">
                    <Icon className="h-8 w-8 text-[#D4AF37]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{p.title}</h3>
                  <p className="text-base text-white/50 leading-relaxed">{p.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ══════════════ DIFERENCIAIS ══════════════ */}
      <Section id="diferenciais" className="bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Nossos diferenciais</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4">
              Tudo que voce{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">recebe aqui</span>
            </h2>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Mais do que uma corretora. Uma estrutura completa com tecnologia, IA e suporte para voce construir sua carreira com as melhores ferramentas do mercado.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {DIFERENCIAIS.map((d, i) => {
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

                  <h3 className="text-lg lg:text-xl font-bold text-white mb-2">{d.title}</h3>
                  <p className="text-sm lg:text-base text-white/50 leading-relaxed">{d.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ══════════════ MOCKUP MULTICALCULO ══════════════ */}
      <Section className="bg-gradient-to-b from-[#050505] via-[#0a0804] to-[#050505]">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Multicalculo</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4">
              Compare{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">dezenas de planos</span>
              {' '}em segundos
            </h2>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Insira as idades, escolha o tipo e nossa plataforma compara automaticamente todas as operadoras. Cotacao profissional pronta para enviar ao cliente.
            </p>
          </motion.div>

          <motion.div variants={scaleIn} className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
            <div className="p-5 lg:p-8">
              {/* Header do multicalculo */}
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Multicalculo inteligente</p>
                  <p className="text-sm text-white/40">Compare operadoras lado a lado</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">Online</span>
                </div>
              </div>

              {/* Input area */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-white/30 mb-1">Beneficiarios</p>
                  <div className="flex gap-1.5">
                    {['32', '28', '5'].map((age, i) => (
                      <span key={i} className="px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded text-xs font-bold">{age} anos</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-white/30 mb-1">Tipo</p>
                  <p className="text-sm text-white font-semibold">PME</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-white/30 mb-1">Acomodacao</p>
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
                        <p className="text-sm text-white/40">{plano.op}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{plano.valor}</p>
                      <p className="text-[10px] text-white/30">/mes</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="text-center mt-8">
            <p className="text-sm sm:text-base text-white/40">Amil · Bradesco · SulAmerica · Unimed · NotreDame · Porto · Hapvida e mais</p>
          </motion.div>
        </div>
      </Section>

      {/* ══════════════ MOCKUP UPLOAD DOCUMENTOS (Drag & Drop + IA) ══════════════ */}
      <Section className="bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Documentacao inteligente</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4">
              Arraste, solte e{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">a IA faz o resto</span>
            </h2>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Seu cliente arrasta o documento para a plataforma. Nossa inteligencia artificial extrai todos os dados automaticamente. Sem digitacao, sem erro, sem perda de tempo.
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
                    <p className="text-base lg:text-lg font-bold text-white mb-2">Arraste seus documentos aqui</p>
                    <p className="text-xs lg:text-sm text-white/40 mb-4">ou clique para selecionar</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['PDF', 'JPG', 'PNG', 'Carteirinha', 'Apolice'].map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-full bg-white/5 text-[10px] text-white/40 font-medium">{t}</span>
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
                      { label: 'Beneficiarios', value: '3 (32, 28, 5 anos)', conf: '98%' },
                      { label: 'Plano atual', value: 'Amil 400 QC Nacional', conf: '97%' },
                      { label: 'Valor mensal', value: 'R$ 1.890,50', conf: '95%' },
                      { label: 'Tipo', value: 'PME - Empresarial', conf: '99%' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="text-[10px] text-white/30">{item.label}</p>
                          <p className="text-sm font-semibold text-white">{item.value}</p>
                        </div>
                        <span className="text-[10px] text-green-400 font-bold">{item.conf}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-[#D4AF37]/[0.05] border border-[#D4AF37]/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[#D4AF37]" />
                      <p className="text-xs text-[#D4AF37] font-semibold">Pronto para gerar cotacao automatica</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/50 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        </div>
      </Section>

      {/* ══════════════ MOCKUP DASHBOARD + PIPELINE ══════════════ */}
      <Section className="bg-gradient-to-b from-[#050505] via-[#0a0804] to-[#050505]">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Seu painel</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4">
              Dashboard{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">profissional</span>
            </h2>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              CRM completo, financeiro, IA e tudo que voce precisa . Acessivel de qualquer dispositivo.
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
                        <span className="text-[10px] sm:text-sm text-white/40">{card.label}</span>
                      </div>
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{card.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* CRM */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 h-44">
                  <p className="text-xs text-white/40 mb-3 font-semibold">CRM</p>
                  <div className="flex gap-2 h-28">
                    {[
                      { name: 'Novo', count: 12, color: 'bg-blue-500/20' },
                      { name: 'Qualificado', count: 8, color: 'bg-purple-500/20' },
                      { name: 'Proposta', count: 5, color: 'bg-orange-500/20' },
                      { name: 'Docs', count: 3, color: 'bg-cyan-500/20' },
                      { name: 'Fechado', count: 15, color: 'bg-green-500/20' },
                    ].map((col) => (
                      <div key={col.name} className={`flex-1 ${col.color} border border-white/5 rounded-lg p-1.5`}>
                        <p className="text-[9px] text-white/40 mb-1">{col.name}</p>
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
                  <p className="text-xs text-white/40 mb-3 font-semibold">Sua producao</p>
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
                <p className="text-xs text-white/60"><strong className="text-[#D4AF37]">IA Insight:</strong> Sua taxa de conversao subiu 12% esta semana. Continue priorizando leads de PME, seu ticket medio e 3x maior.</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none" />
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="text-center mt-8">
            <p className="text-sm sm:text-base text-white/40">CRM · Multicalculo · Financeiro · IA · Marketing. Tudo em um so lugar</p>
          </motion.div>
        </div>
      </Section>

      {/* ══════════════ MOCKUP FUNIL DE VENDAS ══════════════ */}
      <Section className="bg-[#050505]">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Funil visual</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4">
              Veja seu{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">funil de vendas</span>
            </h2>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              Visualize cada etapa do seu processo comercial. Do lead novo ao contrato fechado.
            </p>
          </motion.div>

          <motion.div variants={scaleIn} className="relative">
            <div className="space-y-2">
              {[
                { stage: 'Novos leads', count: 47, pct: 100, color: 'from-blue-500/40 to-blue-600/20' },
                { stage: 'Qualificados', count: 32, pct: 68, color: 'from-purple-500/40 to-purple-600/20' },
                { stage: 'Cotacao enviada', count: 23, pct: 49, color: 'from-orange-500/40 to-orange-600/20' },
                { stage: 'Proposta', count: 15, pct: 32, color: 'from-yellow-500/40 to-yellow-600/20' },
                { stage: 'Documentacao', count: 10, pct: 21, color: 'from-cyan-500/40 to-cyan-600/20' },
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
                        <span className="text-[10px] text-white/50">{s.pct}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ══════════════ OPORTUNIDADES ══════════════ */}
      <Section className="bg-gradient-to-b from-[#050505] via-[#0a0804] to-[#050505]">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Sua oportunidade</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-5">
              Ganhe dinheiro{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">com liberdade</span>
            </h2>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
              O mercado de planos de saude e seguros cresce a cada ano. Com a Humano Saude,
              voce tem tudo o que precisa para transformar essa oportunidade em renda real.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
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
                    <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-base lg:text-lg text-white/50 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div variants={fadeUp} custom={5} className="text-center mt-12">
            <Link
              href="/dashboard/corretor/cadastro"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#D4AF37] text-black font-bold text-base tracking-wider hover:bg-[#F6E05E] transition-all"
            >
              Quero essa oportunidade
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </Section>

      {/* ══════════════ Como funciona ══════════════ */}
      <Section className="bg-[#050505]">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Processo simples</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel">
              Como{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">funciona</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
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
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-base lg:text-lg text-white/50 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ══════════════ FAQ ══════════════ */}
      <Section id="faq" className="bg-gradient-to-b from-[#050505] via-[#0a0804] to-[#050505]">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Duvidas</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-cinzel">
              Perguntas{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">frequentes</span>
            </h2>
          </motion.div>

          <motion.div variants={fadeUp} custom={1}>
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </motion.div>
        </div>
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
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4">
              Pronto para{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">
                Comecar?
              </span>
            </h2>
            <p className="text-white/50 text-lg md:text-xl lg:text-2xl mb-8 max-w-xl mx-auto leading-relaxed">
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
              <span className="text-sm text-white/30">Programa de corretores 2026</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-white/40">
              <a href="mailto:comercial@humanosaude.com.br" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> comercial@humanosaude.com.br
              </a>
              <a href="https://wa.me/5521988179407" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> (21) 98817-9407
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-white/20">
              &copy; {new Date().getFullYear()} Humano Saude. Todos os direitos reservados. CNPJ: 50.216.907/0001-60 | SUSEP: 251174847
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
