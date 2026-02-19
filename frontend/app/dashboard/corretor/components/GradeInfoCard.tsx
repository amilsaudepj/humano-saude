'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  TrendingUp,
  Heart,
  Smile,
  Shield,
  Building2,
  Target,
  Gift,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCorretorGrade, type GradeComissionamento } from '@/app/actions/grades';

const GRADE_STYLES: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  interno: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: '🏢' },
  externo: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '🌐' },
  personalizado_1: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: '⭐' },
  personalizado_2: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: '💎' },
};

interface GradeInfoCardProps {
  corretorId: string;
}

export default function GradeInfoCard({ corretorId }: GradeInfoCardProps) {
  const [grade, setGrade] = useState<GradeComissionamento | null>(null);
  const [gradeId, setGradeId] = useState<string>('interno');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const result = await getCorretorGrade(corretorId);
      if (result.success && result.data) {
        setGrade(result.data.grade);
        setGradeId(result.data.gradeId);
      }
      setLoading(false);
    }
    load();
  }, [corretorId]);

  if (loading) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  if (!grade) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
        <p className="text-sm text-white/40 text-center">Grade de comissionamento não configurada</p>
      </div>
    );
  }

  const style = GRADE_STYLES[gradeId] || GRADE_STYLES.interno;
  const fmt = (v: number) => `${v.toFixed(1)}%`;
  const fmtCurrency = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const comissoes = [
    { label: 'Saúde PF', value: grade.comissao_saude_pf, icon: Heart },
    { label: 'Saúde PJ', value: grade.comissao_saude_pj, icon: Building2 },
    { label: 'Odonto PF', value: grade.comissao_odonto_pf, icon: Smile },
    { label: 'Odonto PJ', value: grade.comissao_odonto_pj, icon: Building2 },
    { label: 'Vida', value: grade.comissao_vida, icon: Shield },
    { label: 'Empresarial', value: grade.comissao_empresarial, icon: Building2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('border rounded-2xl p-6 space-y-5', style.bg, style.border)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center text-lg', style.bg)}>
            {style.icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className={cn('h-4 w-4', style.color)} />
              Minha Grade de Comissões
            </h3>
            <p className={cn('text-xs font-semibold uppercase tracking-wider', style.color)}>
              {grade.nome}
            </p>
          </div>
        </div>
      </div>

      {grade.descricao && (
        <p className="text-xs text-white/40">{grade.descricao}</p>
      )}

      {/* Comissões por Produto */}
      <div>
        <span className="text-xs text-white/40 uppercase tracking-wider block mb-3">Comissão por Produto</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {comissoes.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-black/20 rounded-xl p-3 flex items-center gap-2">
              <Icon className="h-4 w-4 text-white/30 shrink-0" />
              <div>
                <span className="text-xs text-white/40 block">{label}</span>
                <span className={cn('text-sm font-bold', value > 0 ? style.color : 'text-white/20')}>
                  {value > 0 ? fmt(value) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bônus e Metas */}
      <div className="grid grid-cols-2 gap-3">
        {grade.meta_mensal_valor > 0 && (
          <div className="bg-black/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="text-xs text-white/40">Meta Mensal</span>
            </div>
            <span className="text-sm font-bold text-white">{fmtCurrency(grade.meta_mensal_valor)}</span>
          </div>
        )}
        {grade.bonus_meta_mensal > 0 && (
          <div className="bg-black/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs text-white/40">Bônus Meta</span>
            </div>
            <span className="text-sm font-bold text-green-400">{fmt(grade.bonus_meta_mensal)}</span>
          </div>
        )}
        {grade.bonus_ativacao > 0 && (
          <div className="bg-black/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs text-white/40">Bônus Ativação</span>
            </div>
            <span className="text-sm font-bold text-purple-400">{fmtCurrency(grade.bonus_ativacao)}</span>
          </div>
        )}
        {grade.comissao_renovacao_pct > 0 && (
          <div className="bg-black/20 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs text-white/40">Renovação</span>
            </div>
            <span className="text-sm font-bold text-blue-400">{fmt(grade.comissao_renovacao_pct)}</span>
          </div>
        )}
      </div>

      {/* Nota */}
      <p className="text-[10px] text-white/20 text-center italic">
        Valores configurados pelo administrador • Atualizados automaticamente
      </p>
    </motion.div>
  );
}
