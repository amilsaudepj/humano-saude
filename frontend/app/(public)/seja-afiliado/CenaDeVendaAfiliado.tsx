'use client';

import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Lottie from 'lottie-react';

const LABEL_ATOR_1 = 'Você indica';
const LABEL_ATOR_2 = 'Parceria';
const LABEL_ATOR_3 = 'Venda fechada';
const EXEMPLO_VALOR = 5000;

const ICON_INDICAR = '/images/icons/add-group_4168008.png';
const ICON_PARCERIA = '/images/icons/business-partnership_11175504.png';
const ICON_VENDA = '/images/icons/rich_16859162.png';
const ICON_GOALS = '/images/icons/goals_4606518.png';
const LOTTIE_HANDSHAKE = '/lottie/handshake.json';
const LOTTIE_MONEY_CONFETTI = '/lottie/money-confetti.json';

const DURACAO_PARCERIA_ANTES_VENDA = 4500; // ms na fase "parceria" antes de ir para "venda" (automático)
const DURACAO_VENDA_ANTES_LOOP = 7000; // ms na fase "venda" antes de reiniciar (última etapa fica mais tempo)

export default function CenaDeVendaAfiliado() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, margin: '-80px' });

  const [fase, setFase] = useState<'idle' | 'indicando' | 'parceria' | 'venda'>('idle');
  const [keyReset, setKeyReset] = useState(0);
  const [handshakeData, setHandshakeData] = useState<object | null>(null);
  const [moneyConfettiData, setMoneyConfettiData] = useState<object | null>(null);

  // Lazy-load Lottie JSONs quando a seção entrar na viewport
  useEffect(() => {
    if (!isInView) return;
    let cancelled = false;
    Promise.all([
      fetch(LOTTIE_HANDSHAKE).then((r) => r.json()),
      fetch(LOTTIE_MONEY_CONFETTI).then((r) => r.json()),
    ]).then(([h, m]) => {
      if (!cancelled) {
        setHandshakeData(h);
        setMoneyConfettiData(m);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isInView]);

  // Auto-iniciar quando a seção entrar na viewport (lazy: só começa quando o usuário chega)
  useEffect(() => {
    if (isInView && fase === 'idle') {
      setFase('indicando');
      setKeyReset((k) => k + 1);
    }
    if (!isInView && fase !== 'idle') {
      setFase('idle');
    }
  }, [isInView, fase]);

  // Parceria → Venda: avançar automaticamente após alguns segundos (sem clicar)
  useEffect(() => {
    if (fase !== 'parceria' || !isInView) return;
    const t = setTimeout(() => setFase('venda'), DURACAO_PARCERIA_ANTES_VENDA);
    return () => clearTimeout(t);
  }, [fase, isInView]);

  // Loop: ao terminar a fase "venda", reiniciar automaticamente (se ainda em view)
  useEffect(() => {
    if (fase !== 'venda' || !isInView) return;
    const t = setTimeout(() => {
      setFase('indicando');
      setKeyReset((k) => k + 1);
    }, DURACAO_VENDA_ANTES_LOOP);
    return () => clearTimeout(t);
  }, [fase, isInView]);

  const iniciar = () => {
    setFase('indicando');
    setKeyReset((k) => k + 1);
  };

  const resetar = () => {
    setFase('idle');
    setKeyReset((k) => k + 1);
  };

  const avancarParaParceria = () => {
    setTimeout(() => setFase((f) => (f === 'indicando' ? 'parceria' : f)), 1400);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center min-h-0 py-2 px-4 lg:py-3 lg:px-5 overflow-hidden relative"
    >
      {fase === 'idle' && (
        <motion.div
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center z-10"
        >
          <p className="text-white/60 text-sm sm:text-base mb-6 max-w-md mx-auto">
            Veja uma simulação: você indica, a parceria fecha e a venda gera sua remuneração (até 100%).
          </p>
          <button
            type="button"
            onClick={iniciar}
            className="px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#F6E05E] transition-all shadow-lg shadow-[#D4AF37]/20"
          >
            Ver animação
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {fase === 'indicando' && (
          <motion.div
            key={`indicando-${keyReset}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md flex flex-col items-center justify-center min-h-[260px] z-10 gap-1"
          >
            <p className="text-[#D4AF37] text-xs font-bold tracking-widest uppercase mb-0.5">{LABEL_ATOR_1}</p>
            <motion.div
              initial={{ x: -120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={avancarParaParceria}
              className="w-40 h-40 sm:w-48 sm:h-48 relative flex-shrink-0"
            >
              <Image src={ICON_INDICAR} alt="Você indica" fill className="object-contain" sizes="192px" priority={false} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-1 text-white/80 text-sm font-medium"
            >
              Você compartilha o link
            </motion.div>
          </motion.div>
        )}

        {fase === 'parceria' && (
          <motion.div
            key={`parceria-${keyReset}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-md flex flex-col items-center justify-center min-h-[260px] z-10"
          >
            <p className="text-[#D4AF37] text-xs font-bold tracking-widest uppercase mb-0 pb-0 leading-tight -mb-[6.3rem]">{LABEL_ATOR_2}</p>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-72 h-72 sm:w-[22rem] sm:h-[22rem] relative flex-shrink-0 -mt-[3.9rem] -mb-10"
            >
              {handshakeData ? (
                <Lottie animationData={handshakeData} loop className="w-full h-full block" />
              ) : (
                <Image src={ICON_PARCERIA} alt="Parceria" fill className="object-contain" sizes="352px" />
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/80 text-sm font-medium text-center -mt-10 pt-0 leading-tight"
            >
              A equipe atende e fecha o negócio
            </motion.div>
          </motion.div>
        )}

        {fase === 'venda' && (
          <motion.div
            key={`venda-${keyReset}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full max-w-md flex flex-col items-center justify-center min-h-[260px] z-10 gap-1"
          >
            <p className="text-[#D4AF37] text-xs font-bold tracking-widest uppercase mb-0.5">{LABEL_ATOR_3}</p>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14 }}
              className="flex items-center gap-4 px-6 py-5 rounded-2xl bg-[#D4AF37]/15 border-2 border-[#D4AF37]/40"
            >
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image src={ICON_VENDA} alt="Sucesso" fill className="object-contain" sizes="80px" />
              </div>
              <div className="text-left">
                <p className="text-white/70 text-xs font-medium">Exemplo: venda PME</p>
                <p className="text-2xl sm:text-3xl font-black text-[#D4AF37] tabular-nums">
                  R$ {EXEMPLO_VALOR.toLocaleString('pt-BR')}
                </p>
                <p className="text-white/60 text-xs">até 100% = você ganha até R$ {EXEMPLO_VALOR.toLocaleString('pt-BR')}</p>
              </div>
            </motion.div>
            {/* Celebração: Lottie (chuva/confetti) ou fallback com ícones */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              {moneyConfettiData ? (
                <div className="w-full max-w-[420px] h-[360px] flex-shrink-0">
                  <Lottie animationData={moneyConfettiData} loop className="w-full h-full" />
                </div>
              ) : (
                Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -60, opacity: 0, x: (i - 4) * 36 }}
                    animate={{ y: 100, opacity: [0, 0.9, 0.9, 0] }}
                    transition={{
                      duration: 2,
                      delay: 0.25 + i * 0.1,
                      ease: 'circIn',
                    }}
                    className="absolute left-1/2 top-1/2 w-12 h-12 -ml-6 -mt-6"
                  >
                    <span className="relative block w-full h-full">
                      <Image src={ICON_GOALS} alt="" fill className="object-contain" sizes="48px" />
                    </span>
                  </motion.div>
                ))
              )}
            </div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-2 text-white/80 text-sm sm:text-base text-center max-w-sm font-medium"
            >
              Quanto mais você indicar, mais você ganha. Sem limite.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
