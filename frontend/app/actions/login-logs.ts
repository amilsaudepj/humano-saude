'use server';

import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/**
 * Registra um login no sistema
 */
export async function registrarLogin(dados: {
    userEmail: string;
    userId?: string;
    loginType: 'admin' | 'corretor' | 'user';
    ipAddress?: string;
    userAgent?: string;
}) {
    try {
        const supabase = createServiceClient();

        const { error } = await supabase.from('user_login_logs').insert({
            user_email: dados.userEmail,
            user_id: dados.userId,
            login_type: dados.loginType,
            ip_address: dados.ipAddress,
            user_agent: dados.userAgent,
            login_at: new Date().toISOString(),
        });

        if (error) {
            logger.error('[registrarLogin] Erro', { error: error.message, email: dados.userEmail });
            return { success: false, error: error.message };
        }

        logger.info('[registrarLogin] Login registrado', { email: dados.userEmail, tipo: dados.loginType });
        return { success: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[registrarLogin] Exception', { error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Busca o último login de um usuário por email
 */
export async function getUltimoLogin(userEmail: string) {
    try {
        const supabase = createServiceClient();

        const { data, error } = await supabase
            .from('user_login_logs')
            .select('*')
            .eq('user_email', userEmail)
            .order('login_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows returned (não é erro fatal)
            logger.error('[getUltimoLogin] Erro', { error: error.message, email: userEmail });
            return { success: false, error: error.message, data: null };
        }

        return { success: true, data };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[getUltimoLogin] Exception', { error: msg });
        return { success: false, error: msg, data: null };
    }
}

/**
 * Busca todos os últimos logins (um por usuário)
 */
export async function getUltimosLogins() {
    try {
        const supabase = createServiceClient();

        // Busca o último login de cada usuário usando DISTINCT ON
        const { data, error } = await supabase
            .from('user_login_logs')
            .select('user_email, user_id, login_at, ip_address, user_agent, login_type')
            .order('user_email')
            .order('login_at', { ascending: false });

        if (error) {
            logger.error('[getUltimosLogins] Erro', { error: error.message });
            return { success: false, error: error.message, data: null };
        }

        // Agrupa por email e pega o mais recente de cada um
        const loginsMap = new Map();
        data?.forEach((log) => {
            if (!loginsMap.has(log.user_email)) {
                loginsMap.set(log.user_email, log);
            }
        });

        const ultimosLogins = Array.from(loginsMap.values());

        return { success: true, data: ultimosLogins };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[getUltimosLogins] Exception', { error: msg });
        return { success: false, error: msg, data: null };
    }
}
