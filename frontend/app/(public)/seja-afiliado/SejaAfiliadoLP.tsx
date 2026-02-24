'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Share2,
  ArrowRight,
  ChevronDown,
  Phone,
  Mail,
  Sparkles,
  Gift,
  CheckCircle,
  Target,
  Zap,
  MessageCircle,
  HandHelping,
  Link2,
  TrendingUp,
  Banknote,
  Users,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const sectionVariants = {
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.03 } },
  hidden: { transition: { staggerChildren: 0.02 } },
};

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section ref={ref} id={id} className={`relative py-20 lg:py-28 ${className}`}>
      <motion.div
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0 } }, hidden: { transition: { staggerChildren: 0.02 } } }}
      >
        {children}
      </motion.div>
    </section>
  );
}

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

import CenaDeVendaAfiliado from './CenaDeVendaAfiliado';

const OPORTUNIDADES_AFILIADO = [
  { icon: MessageCircle, title: 'Só indicar', desc: 'Você não precisa atender cliente, fechar venda nem falar de plano. Só indica quem pode ter interesse. Nós cuidamos do resto.' },
  { icon: HandHelping, title: 'Sem compromisso de venda', desc: 'Não exige experiência em seguros, nem meta de vendas. Quem quiser só indicar e ajudar conhecidos a economizar, pode.' },
  { icon: Link2, title: 'Link exclusivo', desc: 'Receba um link seu para compartilhar. Quem preencher pelo link fica vinculado a você. Simples e rastreável.' },
  { icon: Zap, title: 'Rápido e simples', desc: 'Cadastre-se ou peça seu link, compartilhe por WhatsApp ou rede social. A pessoa indica e nossa equipe entra em contato.' },
];

const COMO_FUNCIONA_AFILIADO = [
  { step: '01', title: 'Cadastre-se ou peça seu link', desc: 'Preencha um formulário rápido ou fale com a gente. Você recebe um link exclusivo para indicar.', icon: Target },
  { step: '02', title: 'Compartilhe', desc: 'Envie o link por WhatsApp, redes sociais ou e-mail. Para quem você quer ajudar a economizar em plano de saúde.', icon: Share2 },
  { step: '03', title: 'A gente faz o resto', desc: 'A pessoa indicada é atendida pela nossa equipe. Você não precisa atender, vender nem dar suporte.', icon: CheckCircle },
];

const FAQ_AFILIADO = [
  { q: 'Preciso vender ou atender cliente?', a: 'Não. O programa de afiliado é só para indicar. Você envia o link, a pessoa se cadastra ou demonstra interesse, e nossa equipe faz o atendimento, a cotação e a venda. Você não precisa falar de plano, operadora nem fechar negócio.' },
  { q: 'Como ganho com isso?', a: 'Depende do programa que você se cadastrar. Pode ser por link exclusivo com um corretor parceiro (ele te dá o link e acompanha as indicações) ou indicação direta para a Humano Saúde. Entre em contato para saber as condições atuais.' },
  { q: 'Preciso ser corretor?', a: 'Não. Afiliado é diferente de corretor. Corretor vende e atende; afiliado só indica. Qualquer pessoa pode ser afiliada: influencer, parceiro, amigo que quer indicar conhecidos.' },
  { q: 'O que a pessoa indicada precisa fazer?', a: 'Ela acessa o link, preenche nome e telefone (e opcionalmente e-mail). Nossa equipe ou o corretor entra em contato para fazer a cotação e oferecer as melhores opções. Você não precisa fazer nada depois de indicar.' },
];

/** Plano mais barato ~R$ 1.000 (média de custo de plano empresarial para 2 vidas); exemplos maiores. */
const MEDIA_PLANO = 1000;
const EXEMPLOS_PLANOS = [1000, 3500, 4000, 5000]; // R$ 1.000 (piso típico), R$ 3.500, R$ 4.000, PME R$ 5.000
/** Cenários: mix com plano ~R$ 1.000 + planos maiores (raro vender abaixo de R$ 1.000, salvo idades muito baixas). */
const CENARIOS_SIMULACAO = [
  { indicacoes: 2, label: '2 indicações', mix: [1000, 1000] },
  { indicacoes: 5, label: '5 indicações', mix: [1000, 1000, 1000, 3500, 4000] },
  { indicacoes: 10, label: '10 indicações', mix: [1000, 1000, 1000, 1000, 1000, 3500, 3500, 4000, 4000, 5000] },
  { indicacoes: 15, label: '15 indicações', mix: Array(10).fill(1000).concat([3500, 3500, 4000, 5000, 5000]) },
  { indicacoes: 20, label: '20 indicações', mix: Array(13).fill(1000).concat([3500, 3500, 3500, 4000, 4000, 5000, 5000]) },
];

function AnimatedNumber({ value, duration = 1.2, decimals = 0 }: { value: number; duration?: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round((start + (value - start) * eased) * Math.pow(10, decimals)) / Math.pow(10, decimals));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, value, duration, decimals]);

  return <span ref={ref}>{display.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

/** refParam: quando preenchido (slug corretor ou token afiliado), todos os CTAs levam a /indicar?ref=refParam (indicações atreladas ao corretor). */
export default function SejaAfiliadoLP({ refParam }: { refParam: string | null }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const indicarHref = refParam ? `/indicar?ref=${encodeURIComponent(refParam)}` : '/indicar';

  useEffect(() => {
    const h = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-montserrat overflow-x-hidden">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-lg shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <Link href="/">
            <Image src="/images/logos/LOGO 1 SEM FUNDO.png" alt="Humano Saúde" width={180} height={60} className="h-10 lg:h-14 w-auto" priority />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href={indicarHref} className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-sm sm:text-base tracking-wider hover:bg-[#F6E05E] transition-all">
              Quero indicar
              <Share2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            </Link>
            <Link href="/seja-corretor" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-white/90 text-sm font-semibold hover:bg-white/5 transition-all">
              Ser corretor
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#1a1508_0%,_#050505_50%,_#000_100%)]" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/5 blur-[150px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#D4AF37]/3 blur-[120px] rounded-full" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #D4AF37 1px, transparent 1px), linear-gradient(to bottom, #D4AF37 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 text-center pt-28 pb-20">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] text-sm font-bold tracking-widest mb-8">
            <Share2 className="h-3.5 w-3.5" /> Programa de afiliados
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 font-cinzel text-balance">
            <span className="text-white">Seja afiliado.</span><br />
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F6E05E] to-[#D4AF37] bg-clip-text text-transparent">Só indicar.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }} className="text-lg sm:text-xl md:text-2xl lg:text-2xl text-white max-w-3xl mx-auto mb-6 leading-relaxed text-pretty">
            <strong>Sem atender.</strong> <strong>Sem vender.</strong> Você indica quem pode querer economizar em plano de saúde. Nós fazemos o resto.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6 }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] font-black text-base sm:text-lg tracking-wide mb-10 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
            <Gift className="h-5 w-5" /> Zero burocracia
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={indicarHref} className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#aa771c] text-black font-bold text-base tracking-wider hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all">
              Quero indicar agora <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#ganhe" className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/10 text-white/80 text-base font-semibold hover:bg-white/5 transition-all">Quanto posso ganhar</a>
            <a href="#como-funciona" className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/10 text-white/80 text-base font-semibold hover:bg-white/5 transition-all">Como funciona</a>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}><ChevronDown className="h-6 w-6 text-[#D4AF37]/50" /></motion.div>
        </motion.div>
      </section>

      {/* GANHE: destaque remuneração + até 100% + exemplo PME + animação */}
      <Section id="ganhe" className="bg-gradient-to-b from-[#050505] via-[#0a0804] to-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Sua remuneração</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-5 text-balance">
              Quanto você <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">ganha</span> como afiliado
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed text-pretty mb-6">
              Sua comissão pode ser <strong className="text-[#D4AF37]">até 100%</strong> do valor do plano vendido. A média de custo de um plano empresarial para 2 vidas é <strong>R$ 1.000/mês</strong>: esse é o plano mais barato que o corretor costuma vender. Acima disso há fechamentos em R$ 3.500, R$ 4.000 ou mais.
            </p>
            <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-5 py-4">
              <strong>Exemplo:</strong> uma venda PME de <strong>R$ 5.000/mês</strong> = você pode ganhar <strong className="text-[#D4AF37]">até R$ 5.000</strong> (100%). Quanto mais indicações, maior a probabilidade de resultados que fazem a diferença.
            </p>
          </motion.div>

          {/* Animação: indicar → parceria → venda (exemplo R$ 5.000) */}
          <motion.div variants={fadeUp} custom={1} className="mb-12">
            <CenaDeVendaAfiliado />
          </motion.div>

          <motion.div variants={fadeUp} custom={2} className="relative rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 via-[#D4AF37]/10 to-transparent border-2 border-[#D4AF37]/30 p-6 lg:p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                <Banknote className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="text-xl lg:text-2xl font-black text-white mb-2 text-balance">
                  Até 100% da comissão. Sem limite de ganho.
                </h3>
                <p className="text-base lg:text-lg text-white/75 leading-relaxed text-pretty">
                  Você recebe até 100% do valor do plano fechado. Quanto mais indicar, mais ganha.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Section>

      {/* SIMULADOR DE RENDA MENSAL (plano mais barato ~R$ 1.000; acima disso planos maiores) */}
      <Section id="simulador" className="bg-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-5xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Simulação</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-5 text-balance">
              Quanto você pode <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">ganhar</span> por mês?
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty">
              Planos a partir de R$ 1.000/mês e exemplos maiores. Quanto mais indicações, maior a probabilidade de ganhos.
            </p>
          </motion.div>

          <motion.div variants={sectionVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
            {CENARIOS_SIMULACAO.map((c, i) => {
              const renda = c.mix.reduce((a, b) => a + b, 0);
              return (
                <motion.div
                  key={c.indicacoes}
                  variants={fadeUp}
                  custom={i + 1}
                  className="group relative rounded-2xl bg-white/[0.02] border border-white/5 p-5 lg:p-6 hover:border-[#D4AF37]/25 hover:bg-[#D4AF37]/5 transition-all duration-300"
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative">
                    <p className="text-sm font-semibold text-white/60 mb-1">{c.label} fechadas</p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#D4AF37] mb-0.5 tabular-nums">
                      R$ <AnimatedNumber value={renda} duration={1.2} />
                    </p>
                    <p className="text-xs text-white/50">/ mês estimado</p>
                    <p className="text-[10px] text-white/40 mt-1">plano ~R$ 1.000 + maiores</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Quadro destaque: renda que desejar */}
          <motion.div
            variants={fadeUp}
            custom={6}
            className="mt-10 rounded-2xl bg-gradient-to-r from-[#D4AF37]/15 to-[#D4AF37]/5 border-2 border-[#D4AF37]/30 p-6 lg:p-8 text-center"
          >
            <Banknote className="h-10 w-10 text-[#D4AF37] mx-auto mb-4" />
            <h3 className="text-xl lg:text-2xl font-black text-white mb-2 text-balance">
              Você pode fazer muito mais
            </h3>
            <p className="text-base lg:text-lg text-white/80 max-w-xl mx-auto leading-relaxed text-pretty">
              A renda que desejar por mês. Sem meta, sem limite. Quanto mais você indicar, mais ganha. Seu ritmo, seu resultado.
            </p>
            <Link href={indicarHref} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#F6E05E] transition-colors mt-4">
              Quero indicar e ganhar <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={7}
            className="mt-6 rounded-2xl bg-white/[0.02] border border-white/5 p-5 text-center"
          >
            <p className="text-sm text-white/60">
              Comissão <strong className="text-[#D4AF37]">até 100%</strong>. Os cenários misturam piso (R$ 1.000/mês) e planos maiores.
            </p>
          </motion.div>
        </motion.div>
      </Section>

      {/* BENEFÍCIOS */}
      <Section id="beneficios" className="bg-gradient-to-b from-[#050505] via-[#0a0804] to-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Benefícios</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-5 text-balance">
              O que você <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">conquista</span> como afiliado
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty">
              Remuneração atrativa, pagamento transparente e suporte para você só indicar e ganhar.
            </p>
          </motion.div>

          <motion.div variants={sectionVariants} className="grid sm:grid-cols-3 gap-6 lg:gap-8">
            <motion.div
              variants={fadeUp}
              custom={1}
              className="relative sm:col-span-2 rounded-2xl bg-gradient-to-br from-[#D4AF37]/15 via-[#D4AF37]/5 to-transparent border-2 border-[#D4AF37]/30 p-6 lg:p-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="h-16 w-16 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                  <Banknote className="h-8 w-8 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-2xl lg:text-3xl font-black text-white mb-2 text-balance">
                    Remuneração atrativa
                  </h3>
                  <p className="text-base lg:text-lg text-white/70 leading-relaxed text-pretty">
                    Você recebe até 100% do valor do plano fechado. Sem limite: quanto mais indicar, mais recebe.
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={2} className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 lg:p-8 hover:border-[#D4AF37]/15 transition-all">
              <div className="h-14 w-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-4">
                <Banknote className="h-7 w-7 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 text-balance">Pagamento transparente</h3>
              <p className="text-base text-white/70 leading-relaxed text-pretty">
                Acompanhe suas indicações e comissões. Pagamento conforme política do programa (corretor ou Humano Saúde).
              </p>
            </motion.div>
            <motion.div variants={fadeUp} custom={3} className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 lg:p-8 hover:border-[#D4AF37]/15 transition-all">
              <div className="h-14 w-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-7 w-7 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 text-balance">Sem meta, sem pressão</h3>
              <p className="text-base text-white/70 leading-relaxed text-pretty">
                Não há meta mínima. Você indica no seu ritmo e ganha por resultado. Ideal para quem quer renda extra indicando conhecidos.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="sm:col-span-2 rounded-2xl bg-white/[0.02] border border-white/5 p-6 lg:p-8 hover:border-[#D4AF37]/15 transition-all">
              <div className="h-14 w-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-4">
                <Users className="h-7 w-7 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 text-balance">Link exclusivo e rastreável</h3>
              <p className="text-base text-white/70 leading-relaxed text-pretty">
                Seu link exclusivo garante que toda indicação seja atribuída a você. Simples de compartilhar e de acompanhar.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </Section>

      {/* OPORTUNIDADE (reforço) */}
      <Section className="bg-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-6xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Sua oportunidade</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-5 text-balance">
              Indique e <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">deixe a gente cuidar do resto</span>
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed text-pretty">
              Você não precisa ser corretor, não precisa vender e não precisa atender ninguém. Só indica quem pode querer economizar. Nossa equipe ou um corretor parceiro faz o atendimento e a venda.
            </p>
          </motion.div>
          <motion.div variants={sectionVariants} className="grid sm:grid-cols-2 gap-6">
            {OPORTUNIDADES_AFILIADO.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.title} variants={fadeUp} custom={i + 1} className="flex gap-5 bg-white/[0.02] border border-white/5 rounded-2xl p-6 lg:p-8 hover:border-[#D4AF37]/15 transition-all">
                  <div className="h-14 w-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0"><Icon className="h-7 w-7 text-[#D4AF37]" /></div>
                  <div>
                    <h3 className="text-xl lg:text-2xl font-bold text-white mb-2 text-balance">{item.title}</h3>
                    <p className="text-base lg:text-lg text-white/70 leading-relaxed text-pretty">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
          <motion.div variants={fadeUp} custom={5} className="text-center mt-12">
            <Link href={indicarHref} className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#D4AF37] text-black font-bold text-base tracking-wider hover:bg-[#F6E05E] transition-all">Quero indicar <ArrowRight className="h-4 w-4" /></Link>
          </motion.div>
        </motion.div>
      </Section>

      <Section id="como-funciona" className="bg-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-5xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Processo simples</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel text-balance">Como <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">funciona</span></h2>
          </motion.div>
          <motion.div variants={sectionVariants} className="grid md:grid-cols-3 gap-8">
            {COMO_FUNCIONA_AFILIADO.map((item, i) => {
              const StepIcon = item.icon;
              return (
                <motion.div key={item.step} variants={fadeUp} custom={i + 1} className="text-center">
                  <div className="relative mx-auto mb-6">
                    <div className="h-20 w-20 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto"><StepIcon className="h-10 w-10 text-[#D4AF37]" /></div>
                    <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-[#D4AF37] text-black text-xs font-black flex items-center justify-center">{item.step}</span>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-3 text-balance">{item.title}</h3>
                  <p className="text-base lg:text-lg text-white/70 leading-relaxed text-pretty">{item.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </Section>

      <Section id="faq" className="bg-gradient-to-b from-[#050505] via-[#0a0804] to-[#050505]">
        <motion.div variants={sectionVariants} className="max-w-3xl mx-auto px-4 md:px-8">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
            <span className="text-[#D4AF37] text-sm font-bold tracking-[4px] mb-4 block">Dúvidas</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-cinzel text-balance">Perguntas <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">frequentes</span></h2>
          </motion.div>
          <motion.div variants={fadeUp} custom={1}>{FAQ_AFILIADO.map((item) => <FAQItem key={item.q} q={item.q} a={item.a} />)}</motion.div>
        </motion.div>
      </Section>

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-[#050505] to-[#D4AF37]/5" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <Sparkles className="h-12 w-12 text-[#D4AF37] mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black font-cinzel mb-4 text-balance">Pronto para <span className="bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] bg-clip-text text-transparent">indicar?</span></h2>
            <p className="text-white/70 text-lg md:text-xl lg:text-2xl mb-8 max-w-xl mx-auto leading-relaxed text-pretty">
              Use o link abaixo para indicar alguém agora. Sem cadastro. Ou fale com a gente para receber seu link exclusivo de afiliado.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={indicarHref} className="group flex items-center gap-2 px-8 sm:px-10 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#aa771c] text-black font-black text-sm sm:text-base tracking-widest hover:shadow-[0_0_60px_rgba(212,175,55,0.4)] transition-all">
                Quero indicar agora <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="https://wa.me/5521988179407?text=Olá! Tenho interesse em ser afiliado Humano Saúde. Quero indicar sem atender ou vender." target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 sm:px-8 py-4 rounded-2xl border border-[#D4AF37]/30 text-[#D4AF37] text-sm sm:text-base font-bold hover:bg-[#D4AF37]/5 transition-all">
                <Phone className="h-4 w-4" /> Falar com comercial
              </a>
            </div>
            <p className="mt-6 text-sm text-white/50">Quer vender e atender? <Link href="/seja-corretor" className="text-[#D4AF37] font-semibold hover:underline">Seja corretor</Link></p>
          </motion.div>
        </div>
      </section>

      <footer className="bg-black border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Image src="/images/logos/LOGO 1 SEM FUNDO.png" alt="Humano Saúde" width={140} height={47} className="h-10 w-auto" />
              <div className="h-6 w-px bg-white/10" />
              <span className="text-sm text-white/50">Programa de afiliados</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-white/75">
              <a href="mailto:comercial@humanosaude.com.br" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> comercial@humanosaude.com.br</a>
              <a href="https://wa.me/5521988179407" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> (21) 98817-9407</a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-white/40">&copy; {new Date().getFullYear()} Humano Saúde. Todos os direitos reservados. CNPJ: 50.216.907/0001-60 | SUSEP: 251174847</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
