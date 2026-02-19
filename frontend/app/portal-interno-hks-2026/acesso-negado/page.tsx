"use client"

import { motion } from "framer-motion"
import { ShieldOff, ArrowLeft, Home, Mail } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function AcessoNegadoContent() {
  const searchParams = useSearchParams()
  const from = searchParams.get("from")

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Card */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6"
          >
            <ShieldOff className="h-10 w-10 text-red-400" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Acesso Negado
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/50 text-sm leading-relaxed mb-6"
          >
            Você não possui permissão para acessar esta área.
            <br />
            Solicite ao administrador a liberação do acesso necessário.
          </motion.p>

          {/* Route info */}
          {from && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-xl"
            >
              <p className="text-xs text-white/30 mb-1">Rota solicitada</p>
              <p className="text-xs text-red-300/60 font-mono break-all">{from}</p>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-3"
          >
            <Link
              href="/portal-interno-hks-2026"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-semibold rounded-xl transition-all duration-200 text-sm"
            >
              <Home className="h-4 w-4" />
              Voltar ao Painel
            </Link>

            <Link
              href="/portal-interno-hks-2026"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 rounded-xl transition-all duration-200 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Página Anterior
            </Link>
          </motion.div>

          {/* Help link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 pt-4 border-t border-white/5"
          >
            <a
              href="mailto:suporte@humanosaude.com.br"
              className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-[#D4AF37] transition-colors"
            >
              <Mail className="h-3 w-3" />
              Precisa de ajuda? Fale com o suporte
            </a>
          </motion.div>
        </div>

        {/* Decorative bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-center"
        >
          <p className="text-[10px] text-white/20">
            Humano Saúde — Sistema Interno v2.0
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function AcessoNegadoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="animate-pulse text-white/30 text-sm">Carregando...</div>
        </div>
      }
    >
      <AcessoNegadoContent />
    </Suspense>
  )
}
