'use server';

import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface Usuario {
    id: string;
    email: string;
    email_confirmed_at: string | null;
    phone: string | null;
    created_at: string;
    updated_at: string | null;
    last_sign_in_at: string | null;
    ultimo_login?: string | null; // Novo campo
    banned_until?: string | null;
    app_metadata: {
        provider?: string;
        providers?: string[];
    };
    user_metadata: {
        nome?: string;
        avatar_url?: string;
    };
    // Dados do corretor vinculado (se houver)
    corretor?: {
        id: string;
        nome: string;
        role: string;
        ativo: boolean;
        cpf: string | null;
        telefone: string | null;
        whatsapp: string | null;
    };
}

export interface UsuarioStats {
    total: number;
    confirmados: number;
    nao_confirmados: number;
    com_corretor: number;
    sem_corretor: number;
    ultimos_7_dias: number;
}

/**
 * Busca todos os usuários do sistema (auth.users + corretores)
 */
export async function getUsuarios() {
    try {
        const supabase = createServiceClient();

        // Verifica se o service role key está configurado
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            logger.error('[getUsuarios] SUPABASE_SERVICE_ROLE_KEY não configurada');
            return {
                success: false,
                error: 'Configuração de acesso admin não encontrada. Configure SUPABASE_SERVICE_ROLE_KEY no .env.local'
            };
        }

        logger.info('[getUsuarios] Tentando buscar usuários do auth.users...');
        // Busca usuários da tabela auth.users
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        logger.info('[getUsuarios] Resposta do auth.admin.listUsers', {
            temDados: !!authUsers,
            totalUsuarios: authUsers?.users?.length || 0,
            temErro: !!authError,
            erro: authError?.message
        });

        if (authError) {
            logger.error('[getUsuarios] Erro ao buscar usuários', { error: authError.message });

            // Fallback: Se não conseguir acessar auth.users, retorna apenas corretores
            logger.warn('[getUsuarios] Tentando fallback: apenas corretores');
            const { data: corretores, error: corretoresError } = await supabase
                .from('corretores')
                .select('*')
                .order('created_at', { ascending: false });

            if (corretoresError) {
                return { success: false, error: 'Erro ao acessar dados de usuários: ' + corretoresError.message };
            }

            // Mapeia corretores como usuários
            const usuarios: Usuario[] = (corretores || []).map((corretor) => ({
                id: corretor.id,
                email: corretor.email || '',
                email_confirmed_at: corretor.created_at,
                phone: corretor.telefone || null,
                created_at: corretor.created_at,
                updated_at: corretor.updated_at || null,
                last_sign_in_at: null,
                app_metadata: { provider: 'email' },
                user_metadata: { nome: corretor.nome },
                corretor: {
                    id: corretor.id,
                    nome: corretor.nome,
                    role: corretor.role,
                    ativo: corretor.ativo,
                    cpf: corretor.cpf,
                    telefone: corretor.telefone,
                    whatsapp: corretor.whatsapp,
                },
            }));

            logger.info('[getUsuarios] Fallback: corretores carregados', { total: usuarios.length });
            return { success: true, data: usuarios };
        }

        // Busca todos os corretores para fazer o join
        const { data: corretores, error: corretoresError } = await supabase
            .from('corretores')
            .select('id, nome, role, ativo, cpf, telefone, whatsapp, email, created_at, updated_at');

        if (corretoresError) {
            logger.warn('[getUsuarios] Erro ao buscar corretores', { error: corretoresError.message });
        }

        // Se não há usuários no auth.users, usa corretores + admins como fallback
        if (authUsers.users.length === 0) {
            logger.warn('[getUsuarios] Nenhum usuário encontrado em auth.users, usando corretores + admins como fallback');

            // Busca admins da integration_settings
            const { data: adminProfile } = await supabase
                .from('integration_settings')
                .select('config, created_at, updated_at')
                .eq('integration_name', 'admin_profile')
                .single();

            const usuarios: Usuario[] = [];

            // Adiciona corretores
            (corretores || []).forEach((corretor) => {
                usuarios.push({
                    id: corretor.id,
                    email: corretor.email || '',
                    email_confirmed_at: null,
                    phone: corretor.telefone || null,
                    created_at: corretor.created_at || new Date().toISOString(),
                    updated_at: corretor.updated_at || null,
                    last_sign_in_at: null,
                    app_metadata: { provider: 'email' },
                    user_metadata: { nome: corretor.nome },
                    corretor: {
                        id: corretor.id,
                        nome: corretor.nome,
                        role: corretor.role,
                        ativo: corretor.ativo,
                        cpf: corretor.cpf,
                        telefone: corretor.telefone,
                        whatsapp: corretor.whatsapp,
                    },
                });
            });

            // Adiciona admin se existir
            if (adminProfile?.config) {
                const config = adminProfile.config as Record<string, unknown>;
                // Usa uma data fixa antiga para o admin (já que não temos a data real)
                const adminCreatedAt = '2024-01-01T00:00:00.000Z';
                usuarios.push({
                    id: 'admin-profile',
                    email: (config.email as string) || 'admin@humanosaude.com',
                    email_confirmed_at: adminCreatedAt,
                    phone: (config.telefone as string) || null,
                    created_at: adminCreatedAt,
                    updated_at: adminProfile.updated_at || null,
                    last_sign_in_at: null,
                    app_metadata: { provider: 'email' },
                    user_metadata: { nome: (config.nome as string) || 'Administrador' },
                    corretor: {
                        id: 'admin-profile',
                        nome: (config.nome as string) || 'Administrador',
                        role: 'administrador',
                        ativo: true,
                        cpf: null,
                        telefone: (config.telefone as string) || null,
                        whatsapp: null,
                    },
                });
            }

            logger.info('[getUsuarios] Fallback: usuários carregados', { total: usuarios.length, corretores: corretores?.length || 0, admins: adminProfile?.config ? 1 : 0 });

            // Busca últimos logins
            const { data: loginLogs } = await supabase
                .from('user_login_logs')
                .select('user_email, login_at')
                .order('login_at', { ascending: false });

            const ultimosLoginsMap = new Map<string, string>();
            loginLogs?.forEach((log) => {
                if (!ultimosLoginsMap.has(log.user_email)) {
                    ultimosLoginsMap.set(log.user_email, log.login_at);
                }
            });

            // Adiciona último login a cada usuário
            usuarios.forEach((usuario) => {
                usuario.ultimo_login = ultimosLoginsMap.get(usuario.email) || null;
            });

            return { success: true, data: usuarios };
        }

        // Faz o merge dos dados
        const usuarios: Usuario[] = authUsers.users.map((user) => {
            const corretor = corretores?.find((c) => c.email === user.email);
            return {
                id: user.id,
                email: user.email || '',
                email_confirmed_at: user.email_confirmed_at || null,
                phone: user.phone || null,
                created_at: user.created_at,
                updated_at: user.updated_at || null,
                last_sign_in_at: user.last_sign_in_at || null,
                app_metadata: user.app_metadata || {},
                user_metadata: user.user_metadata || {},
                corretor: corretor ? {
                    id: corretor.id,
                    nome: corretor.nome,
                    role: corretor.role,
                    ativo: corretor.ativo,
                    cpf: corretor.cpf,
                    telefone: corretor.telefone,
                    whatsapp: corretor.whatsapp,
                } : undefined,
            };
        });

        // Busca últimos logins de todos os usuários
        const { data: loginLogs } = await supabase
            .from('user_login_logs')
            .select('user_email, login_at')
            .order('login_at', { ascending: false });

        // Cria um mapa de últimos logins por email
        const ultimosLoginsMap = new Map<string, string>();
        loginLogs?.forEach((log) => {
            if (!ultimosLoginsMap.has(log.user_email)) {
                ultimosLoginsMap.set(log.user_email, log.login_at);
            }
        });

        // Adiciona o último login a cada usuário
        usuarios.forEach((usuario) => {
            usuario.ultimo_login = ultimosLoginsMap.get(usuario.email) || null;
        });

        logger.info('[getUsuarios] Usuários carregados', { total: usuarios.length });
        return { success: true, data: usuarios };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[getUsuarios] Exception', { error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Busca estatísticas dos usuários
 */
export async function getUsuariosStats(): Promise<{ success: boolean; data?: UsuarioStats; error?: string }> {
    try {
        const supabase = createServiceClient();

        const { data: authUsers, error } = await supabase.auth.admin.listUsers();

        if (error) {
            logger.error('[getUsuariosStats] Erro ao listar usuários', { error: error.message });
            // Fallback: contar diretamente dos corretores + integration_settings
            const { data: corretores } = await supabase
                .from('corretores')
                .select('id, email, created_at');

            const { data: admins } = await supabase
                .from('integration_settings')
                .select('id, created_at');

            const totalCorretores = corretores?.length || 0;
            const totalAdmins = admins?.length || 0;
            const total = totalCorretores + totalAdmins;

            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const ultimos_7_dias = (corretores || []).filter(
                (c) => c.created_at && new Date(c.created_at) >= sevenDaysAgo
            ).length;

            return {
                success: true,
                data: {
                    total,
                    confirmados: totalCorretores, // Assumimos que corretores estão confirmados
                    nao_confirmados: totalAdmins, // Assumimos que admins precisam confirmar
                    com_corretor: totalCorretores,
                    sem_corretor: totalAdmins,
                    ultimos_7_dias,
                },
            };
        }

        // Busca corretores em todos os cenários (precisamos para stats)
        const { data: corretores } = await supabase
            .from('corretores')
            .select('id, email, created_at, ativo');

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Se auth retornou 0 users, faz fallback usando corretores + admin (mesmo padrão de getUsuarios)
        if (authUsers.users.length === 0) {
            logger.warn('[getUsuariosStats] auth retornou 0 users, usando fallback corretores + admin');

            const { data: adminProfile } = await supabase
                .from('integration_settings')
                .select('id, config, created_at')
                .eq('integration_name', 'admin_profile')
                .single();

            const totalCorretores = corretores?.length || 0;
            const totalAdmins = adminProfile ? 1 : 0;
            const total = totalCorretores + totalAdmins;

            const ultimos_7_dias = (corretores || []).filter(
                (c) => c.created_at && new Date(c.created_at) >= sevenDaysAgo
            ).length;

            return {
                success: true,
                data: {
                    total,
                    confirmados: totalAdmins, // Admin tem email confirmado
                    nao_confirmados: totalCorretores, // Corretores sem confirmação de email
                    com_corretor: totalCorretores,
                    sem_corretor: totalAdmins,
                    ultimos_7_dias,
                },
            };
        }

        const total = authUsers.users.length;
        const confirmados = authUsers.users.filter((u) => u.email_confirmed_at).length;
        const nao_confirmados = total - confirmados;
        const ultimos_7_dias = authUsers.users.filter(
            (u) => new Date(u.created_at) >= sevenDaysAgo
        ).length;

        const emailsCorretores = new Set(corretores?.map((c) => c.email) || []);
        const com_corretor = authUsers.users.filter((u) => emailsCorretores.has(u.email || '')).length;
        const sem_corretor = total - com_corretor;

        return {
            success: true,
            data: {
                total,
                confirmados,
                nao_confirmados,
                com_corretor,
                sem_corretor,
                ultimos_7_dias,
            },
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[getUsuariosStats] Exception', { error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Busca um usuário específico por ID
 */
export async function getUsuarioById(userId: string) {
    try {
        const supabase = createServiceClient();

        const { data, error } = await supabase.auth.admin.getUserById(userId);

        if (error) {
            logger.error('[getUsuarioById] Erro', { userId, error: error.message });
            return { success: false, error: error.message };
        }

        // Busca corretor vinculado
        const { data: corretor } = await supabase
            .from('corretores')
            .select('id, nome, role, ativo, cpf, telefone, whatsapp')
            .eq('email', data.user.email)
            .single();

        const usuario: Usuario = {
            id: data.user.id,
            email: data.user.email || '',
            email_confirmed_at: data.user.email_confirmed_at || null,
            phone: data.user.phone || null,
            created_at: data.user.created_at,
            updated_at: data.user.updated_at || null,
            last_sign_in_at: data.user.last_sign_in_at || null,
            app_metadata: data.user.app_metadata || {},
            user_metadata: data.user.user_metadata || {},
            corretor: corretor || undefined,
        };

        return { success: true, data: usuario };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[getUsuarioById] Exception', { userId, error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Suspender usuário (banir do sistema)
 */
export async function suspenderUsuario(userId: string) {
    try {
        const supabase = createServiceClient();

        const { error } = await supabase.auth.admin.updateUserById(userId, {
            ban_duration: 'none', // Suspensão permanente até reativar
        });

        if (error) {
            logger.error('[suspenderUsuario] Erro', { userId, error: error.message });
            return { success: false, error: error.message };
        }

        logger.info('[suspenderUsuario] Usuário suspenso', { userId });
        return { success: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[suspenderUsuario] Exception', { userId, error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Reativar usuário suspenso
 */
export async function reativarUsuario(userId: string) {
    try {
        const supabase = createServiceClient();

        const { error } = await supabase.auth.admin.updateUserById(userId, {
            ban_duration: '0s', // Remove suspensão
        });

        if (error) {
            logger.error('[reativarUsuario] Erro', { userId, error: error.message });
            return { success: false, error: error.message };
        }

        logger.info('[reativarUsuario] Usuário reativado', { userId });
        return { success: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[reativarUsuario] Exception', { userId, error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Atualizar dados do usuário
 */
export async function atualizarUsuario(
    userId: string,
    dados: {
        email?: string;
        phone?: string;
        user_metadata?: Record<string, unknown>;
    }
) {
    try {
        const supabase = createServiceClient();

        const { error } = await supabase.auth.admin.updateUserById(userId, dados);

        if (error) {
            logger.error('[atualizarUsuario] Erro', { userId, error: error.message });
            return { success: false, error: error.message };
        }

        logger.info('[atualizarUsuario] Usuário atualizado', { userId, dados });
        return { success: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[atualizarUsuario] Exception', { userId, error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Redefinir senha do usuário
 */
export async function redefinirSenhaUsuario(userId: string, novaSenha: string) {
    try {
        const supabase = createServiceClient();

        const { error } = await supabase.auth.admin.updateUserById(userId, {
            password: novaSenha,
        });

        if (error) {
            logger.error('[redefinirSenhaUsuario] Erro', { userId, error: error.message });
            return { success: false, error: error.message };
        }

        logger.info('[redefinirSenhaUsuario] Senha redefinida', { userId });
        return { success: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[redefinirSenhaUsuario] Exception', { userId, error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Excluir usuário do sistema
 */
export async function excluirUsuario(userId: string) {
    try {
        const supabase = createServiceClient();

        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
            logger.error('[excluirUsuario] Erro', { userId, error: error.message });
            return { success: false, error: error.message };
        }

        logger.info('[excluirUsuario] Usuário excluído', { userId });
        return { success: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[excluirUsuario] Exception', { userId, error: msg });
        return { success: false, error: msg };
    }
}

/**
 * Reenviar e-mail de confirmação
 */
export async function reenviarEmailConfirmacao(email: string) {
    try {
        const supabase = createServiceClient();

        // Reenvia o email de confirmação usando o Supabase Auth
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });

        if (error) {
            logger.error('[reenviarEmailConfirmacao] Erro', { email, error: error.message });
            return { success: false, error: error.message };
        }

        logger.info('[reenviarEmailConfirmacao] E-mail reenviado', { email });
        return { success: true };
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        logger.error('[reenviarEmailConfirmacao] Exception', { email, error: msg });
        return { success: false, error: msg };
    }
}
