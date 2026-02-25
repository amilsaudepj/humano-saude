'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function EmailConfirmadoPage() {
  const router = useRouter();
  const [segundos, setSegundos] = useState(5);

  useEffect(() => {
    const t = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          clearInterval(t);
          router.replace('/dashboard/corretor/login');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#D4AF37]/3 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/90 backdrop-blur-sm p-8 text-center shadow-xl"
      >
        <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-[#D4AF37]/15 flex items-center justify-center">
          <CheckCircle className="h-9 w-9 text-[#D4AF37]" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">E-mail confirmado</h1>
        <p className="text-white/60 text-sm mb-6">
          Seu e-mail foi confirmado com sucesso. Você já pode acessar o painel.
        </p>
        <p className="text-white/50 text-sm">
          Redirecionando para o login em <strong className="text-[#D4AF37]">{segundos}</strong> segundo{segundos !== 1 ? 's' : ''}...
        </p>
        <div className="mt-6 h-1 w-full rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full bg-[#D4AF37]"
            initial={{ width: '100%' }}
            animate={{ width: `${(segundos / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>
    </div>
  );
}
