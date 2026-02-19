'use server';

import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface Corretor {
    id: string;
    nome: string;
    cpf: string | null;
    email: string;
    telefone: string | null;
    whatsapp: string | null;
    susep: string | null;
    foto_url: string | null;
    slug: string | null;
    logo_personalizada_url: string | null;
    cor_primaria: string | null;
    role: string;
    ativo: boolean;
    data_admissao: string | null;
    comissao_padrao_pct: number | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface UpdateCorretorData {
    nome?: string;
    cpf?: string;
    email?: string;
    telefone?: string;
    whatsapp?: string;
    susep?: string;
    foto_url?: string;
    slug?: string;
    logo_personalizada_url?: string;
    cor_primaria?: string;
    role?: string;
    comissao_padrao_pct?: number;
    metadata?: Record<string, unknown>;
}

/**
 * Busca todos os corretores cadastrados (com filtros opcionais)
 */
export async function getCorretores(filtros?: {
    ativo?: boolean;
    role?: string;
    busca?: string;
}) {
    try {
        const supabase = createServiceClient();
        let query = supabase
            .from('corretores')
            .select('*')
            .order('created_at', { ascending: false });

        if (filtros?.ativo !== undefined) {
            query = query.eq('ativo', filtros.ativo);
        }

        if (filtros?.role) {
            query = query.eq('role', filtros.role);
        }

        if (filtros?.busca) {
            const busca = `%${filtros.busca}%`;
            query = query.or(`nome.ilike.${busca},email.ilike.${busca},cpf.ilike.${busca}`);
        }

        const { data, error } = await query;

        if (error) {
            logger.error('[getCorretores] Erro ao buscar corretores', { error: error.message });
            return { success: false, error: error.message, data: [] };
        }

        return { success: true, data: (data || []) as Corretor[] };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[getCorretores] Exception', { error: msg });
        return { success: false, error: msg, data: [] };
    }
}

/**
 * Busca um corretor por ID
 */
export async function getCorretorById(corretorId: string) {
    try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('corretores')
            .select('*')
            .eq('id', corretorId)
            .single();

        if (error) {
            logger.error('[getCorretorById] Erro ao buscar corretor', { corretorId, error: error.message });
            return { success: false, error: error.message, data: null };
        }

        return { success: true, data: data as Corretor };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[getCorretorById] Exception', { corretorId, error: msg });
        return { success: false, error: msg, data: null };
    }
}

/**
 * Atualiza dados de um corretor
 */
export async function updateCorretor(corretorId: string, dados: UpdateCorretorData) {
    try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('corretores')
            .update(dados)
            .eq('id', corretorId)
            .select()
            .single();

        if (error) {
            logger.error('[updateCorretor] Erro ao atualizar corretor', { corretorId, error: error.message });
            return { success: false, error: error.message };
        }

        logger.info('[updateCorretor] Corretor atualizado', { corretorId, dados });
        return { success: true, data: data as Corretor };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[updateCorretor] Exception', { corretorId, error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Suspende ou ativa um corretor (toggle do campo ativo)
 */
export async function toggleStatusCorretor(corretorId: string, ativo: boolean) {
    try {
        const supabase = createServiceClient();
        const { data, error } = await supabase
            .from('corretores')
            .update({ ativo })
            .eq('id', corretorId)
            .select()
            .single();

        if (error) {
            logger.error('[toggleStatusCorretor] Erro ao alterar status', { corretorId, ativo, error: error.message });
            return { success: false, error: error.message };
        }

        logger.info('[toggleStatusCorretor] Status alterado', { corretorId, ativo });
        return { success: true, data: data as Corretor };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[toggleStatusCorretor] Exception', { corretorId, error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Exclui um corretor (soft delete via campo ativo ou hard delete)
 * Por segurança, fazemos soft delete (ativo = false)
 */
export async function deleteCorretor(corretorId: string, hardDelete = false) {
    try {
        const supabase = createServiceClient();

        if (hardDelete) {
            const { error } = await supabase
                .from('corretores')
                .delete()
                .eq('id', corretorId);

            if (error) {
                logger.error('[deleteCorretor] Erro ao excluir corretor', { corretorId, error: error.message });
                return { success: false, error: error.message };
            }

            logger.warn('[deleteCorretor] Corretor excluído permanentemente', { corretorId });
            return { success: true };
        }

        // Soft delete
        const { error } = await supabase
            .from('corretores')
            .update({ ativo: false })
            .eq('id', corretorId);

        if (error) {
            logger.error('[deleteCorretor] Erro ao desativar corretor', { corretorId, error: error.message });
            return { success: false, error: error.message };
        }

        logger.info('[deleteCorretor] Corretor desativado (soft delete)', { corretorId });
        return { success: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[deleteCorretor] Exception', { corretorId, error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Busca estatísticas gerais dos corretores
 */
export async function getCorretoresStats() {
    try {
        const supabase = createServiceClient();

        const { count: total } = await supabase
            .from('corretores')
            .select('*', { count: 'exact', head: true });

        const { count: ativos } = await supabase
            .from('corretores')
            .select('*', { count: 'exact', head: true })
            .eq('ativo', true);

        const { count: inativos } = await supabase
            .from('corretores')
            .select('*', { count: 'exact', head: true })
            .eq('ativo', false);

        const { count: administradores } = await supabase
            .from('corretores')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'administrador')
            .eq('ativo', true);

        return {
            success: true,
            data: {
                total: total || 0,
                ativos: ativos || 0,
                inativos: inativos || 0,
                administradores: administradores || 0,
            },
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[getCorretoresStats] Exception', { error: msg });
        return {
            success: false,
            error: msg,
            data: { total: 0, ativos: 0, inativos: 0, administradores: 0 },
        };
    }
}
