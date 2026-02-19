import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Registra um login na tabela user_login_logs
 */
export async function registrarLogin(
    email: string,
    loginType: 'admin' | 'corretor' | 'user',
    request: NextRequest,
    userId?: string
): Promise<void> {
    try {
        // Tenta usar service role, se não tiver usa anon key
        const key = supabaseServiceKey || supabaseAnonKey;
        const supabase = createClient(supabaseUrl, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Extrai IP e User-Agent do request
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        const { error } = await supabase.from('user_login_logs').insert({
            user_email: email.toLowerCase().trim(),
            user_id: userId || null,
            login_at: new Date().toISOString(),
            ip_address: ip,
            user_agent: userAgent,
            login_type: loginType,
        });

        if (error) {
            logger.error('[LoginTracker] Erro ao inserir log', { error: error.message, email });
        } else {
            logger.info('[LoginTracker] Login registrado', { email, loginType, ip });
        }
    } catch (error) {
        // Não falhar o login se o registro falhar
        logger.error('[LoginTracker] Exception ao registrar login', { error, email });
    }
}

/**
 * Busca o último login de um usuário
 */
export async function buscarUltimoLogin(email: string): Promise<Date | null> {
    try {
        const key = supabaseServiceKey || supabaseAnonKey;
        const supabase = createClient(supabaseUrl, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        const { data, error } = await supabase
            .from('user_login_logs')
            .select('login_at')
            .eq('user_email', email.toLowerCase().trim())
            .order('login_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return null;

        return new Date(data.login_at);
    } catch (error) {
        logger.error('[LoginTracker] Erro ao buscar último login', { error, email });
        return null;
    }
}
