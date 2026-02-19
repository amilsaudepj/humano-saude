'use server';

import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ─── Tipos ────────────────────────────────────────────────

export interface GradeComissionamento {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  comissao_saude_pf: number;
  comissao_saude_pj: number;
  comissao_odonto_pf: number;
  comissao_odonto_pj: number;
  comissao_vida: number;
  comissao_empresarial: number;
  bonus_meta_mensal: number;
  meta_mensal_valor: number;
  bonus_ativacao: number;
  comissao_renovacao_pct: number;
  config_extra: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type GradeId = 'interno' | 'externo' | 'personalizado_1' | 'personalizado_2';

// ─── Listar todas as grades ───────────────────────────────

export async function getGrades() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('grades_comissionamento')
      .select('*')
      .order('id');

    if (error) {
      logger.error('[getGrades] Erro', { error: error.message });
      return { success: false, error: error.message, data: [] as GradeComissionamento[] };
    }

    return { success: true, data: (data || []) as GradeComissionamento[] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg, data: [] as GradeComissionamento[] };
  }
}

// ─── Buscar grade por ID ──────────────────────────────────

export async function getGrade(gradeId: string) {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('grades_comissionamento')
      .select('*')
      .eq('id', gradeId)
      .single();

    if (error || !data) {
      return { success: false, error: 'Grade não encontrada' };
    }

    return { success: true, data: data as GradeComissionamento };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}

// ─── Atualizar configuração de uma grade ──────────────────

export async function updateGrade(
  gradeId: string,
  updates: Partial<Omit<GradeComissionamento, 'id' | 'created_at' | 'updated_at'>>,
) {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('grades_comissionamento')
      .update(updates)
      .eq('id', gradeId);

    if (error) {
      logger.error('[updateGrade] Erro', { gradeId, error: error.message });
      return { success: false, error: error.message };
    }

    logger.info('[updateGrade] Grade atualizada', { gradeId, campos: Object.keys(updates) });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}

// ─── Atribuir grade a um corretor ─────────────────────────

export async function assignGradeToCorretor(corretorId: string, gradeId: string) {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('corretores')
      .update({
        grade_comissionamento: gradeId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', corretorId);

    if (error) {
      logger.error('[assignGradeToCorretor] Erro', { corretorId, gradeId, error: error.message });
      return { success: false, error: error.message };
    }

    logger.info('[assignGradeToCorretor] Grade atribuída', { corretorId, gradeId });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}

// ─── Buscar grade do corretor ─────────────────────────────

export async function getCorretorGrade(corretorId: string) {
  try {
    const supabase = createServiceClient();

    const { data: corretor, error: corretorError } = await supabase
      .from('corretores')
      .select('grade_comissionamento')
      .eq('id', corretorId)
      .single();

    if (corretorError || !corretor) {
      return { success: false, error: 'Corretor não encontrado' };
    }

    const gradeId = corretor.grade_comissionamento || 'interno';

    const { data: grade, error: gradeError } = await supabase
      .from('grades_comissionamento')
      .select('*')
      .eq('id', gradeId)
      .single();

    if (gradeError || !grade) {
      return { success: false, error: 'Grade não encontrada' };
    }

    return {
      success: true,
      data: {
        gradeId,
        grade: grade as GradeComissionamento,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}
