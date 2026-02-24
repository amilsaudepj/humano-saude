'use server';

import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { verifyToken } from '@/lib/auth-jwt';

const SLUG_CORRETOR_AFILIADOS_SEM_VINCULO = 'afiliados-sem-vinculo';

function gerarTokenUnico(): string {
  return randomBytes(8).toString('base64url').replace(/[-_]/g, 'x').slice(0, 12);
}

/** Gera senha temporária legível (2 letras + 4 números + 2 letras). */
function gerarSenhaTemporaria(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numeros = '23456789';
  return [
    letras[Math.floor(Math.random() * letras.length)],
    letras[Math.floor(Math.random() * letras.length)],
    numeros[Math.floor(Math.random() * numeros.length)],
    numeros[Math.floor(Math.random() * numeros.length)],
    numeros[Math.floor(Math.random() * numeros.length)],
    numeros[Math.floor(Math.random() * numeros.length)],
    letras[Math.floor(Math.random() * letras.length)].toLowerCase(),
    letras[Math.floor(Math.random() * letras.length)].toLowerCase(),
  ].join('');
}

/** Corretor padrão para afiliados/leads/indicações sem vínculo: Helcio Duarte Mattos */
const CORRETOR_SEM_VINCULO_EMAIL = 'helciodmtt@gmail.com';
const CORRETOR_SEM_VINCULO_SLUG = 'helcio-mattos';
const CORRETOR_SEM_VINCULO_NOME = 'Helcio Duarte Mattos';

/**
 * Retorna o corretor_id usado para afiliados/leads/indicações "sem vínculo".
 * Indicações entram no portal desse corretor (Leads + CRM). Prioridade:
 * 1) CORRETOR_ID_AFILIADOS_SEM_VINCULO (env)
 * 2) Corretor por e-mail helciodmtt@gmail.com (Helcio Duarte Mattos)
 * 3) Por slug helcio-mattos
 * 4) Por nome "Helcio Duarte Mattos"
 * 5) Slug genérico afiliados-sem-vinculo (fallback)
 */
export async function getOrCreateCorretorAfiliadosSemVinculo(): Promise<{
  success: boolean;
  corretor_id?: string;
  error?: string;
}> {
  try {
    const sb = createServiceClient();
    const envId = process.env.CORRETOR_ID_AFILIADOS_SEM_VINCULO?.trim();
    if (envId) {
      const { data, error } = await sb.from('corretores').select('id').eq('id', envId).maybeSingle();
      if (!error && data) return { success: true, corretor_id: data.id };
      logger.warn('[getOrCreateCorretorAfiliadosSemVinculo] CORRETOR_ID_AFILIADOS_SEM_VINCULO inválido', { envId });
    }

    // Sem vínculo → Helcio Duarte Mattos (leads/indicações entram no portal dele: Leads + CRM)
    const { data: byEmail } = await sb
      .from('corretores')
      .select('id')
      .eq('email', CORRETOR_SEM_VINCULO_EMAIL.toLowerCase())
      .eq('ativo', true)
      .maybeSingle();
    if (byEmail) return { success: true, corretor_id: byEmail.id };

    const { data: bySlug } = await sb
      .from('corretores')
      .select('id')
      .eq('slug', CORRETOR_SEM_VINCULO_SLUG)
      .eq('ativo', true)
      .maybeSingle();
    if (bySlug) return { success: true, corretor_id: bySlug.id };

    // Busca por nome (ex.: "Helcio Duarte Mattos") para garantir atrelamento ao Helcio
    const { data: byNome } = await sb
      .from('corretores')
      .select('id')
      .eq('ativo', true)
      .ilike('nome', `%${CORRETOR_SEM_VINCULO_NOME}%`)
      .limit(1)
      .maybeSingle();
    if (byNome) return { success: true, corretor_id: byNome.id };

    const { data: existente, error: errFind } = await sb
      .from('corretores')
      .select('id')
      .eq('slug', SLUG_CORRETOR_AFILIADOS_SEM_VINCULO)
      .maybeSingle();

    if (!errFind && existente) return { success: true, corretor_id: existente.id };

    const emailCorretor = process.env.AFILIADOS_SEM_VINCULO_EMAIL || 'afiliados@humanosaude.com.br';
    const { data: novo, error: errInsert } = await sb
      .from('corretores')
      .insert({
        nome: 'Humano Saúde - Afiliados',
        email: emailCorretor,
        slug: SLUG_CORRETOR_AFILIADOS_SEM_VINCULO,
        role: 'corretor',
        ativo: true,
      })
      .select('id')
      .single();

    if (errInsert) {
      logger.error('[getOrCreateCorretorAfiliadosSemVinculo] Erro ao criar corretor', errInsert);
      return { success: false, error: errInsert.message };
    }
    return { success: true, corretor_id: novo!.id };
  } catch (err) {
    logger.error('[getOrCreateCorretorAfiliadosSemVinculo]', err);
    return { success: false, error: 'Erro ao obter corretor para afiliados sem vínculo' };
  }
}

/**
 * Cria afiliado no fluxo "sem vínculo" (landing seja afiliado sem link de corretor).
 * Cria conta com senha temporária e retorna os dados para envio do e-mail.
 */
export async function criarAfiliadoSemVinculo(payload: {
  nome: string;
  email: string;
  telefone: string;
  cpf?: string;
}): Promise<{
  success: boolean;
  afiliado_id?: string;
  token?: string;
  senhaTemporaria?: string;
  error?: string;
}> {
  try {
    const resolved = await getOrCreateCorretorAfiliadosSemVinculo();
    if (!resolved.success || !resolved.corretor_id) {
      return { success: false, error: resolved.error || 'Corretor para afiliados não configurado' };
    }

    const nome = payload.nome?.trim();
    const email = payload.email?.trim()?.toLowerCase() || '';
    const telefone = payload.telefone?.trim()?.replace(/\D/g, '') || '';
    if (!nome || !email || telefone.length < 10) {
      return { success: false, error: 'Nome, e-mail e telefone (com DDD) são obrigatórios.' };
    }

    const sb = createServiceClient();

    const cpfNorm = payload.cpf?.trim()?.replace(/\D/g, '') || null;

    const { data: existingSameCorretor } = await sb
      .from('corretor_afiliados')
      .select('id, token_unico')
      .eq('corretor_id', resolved.corretor_id)
      .eq('email', email)
      .eq('ativo', true)
      .maybeSingle();

    if (existingSameCorretor) {
      return {
        success: true,
        afiliado_id: existingSameCorretor.id,
        token: existingSameCorretor.token_unico,
        senhaTemporaria: undefined,
      };
    }

    const { data: existingGlobal } = await sb
      .from('corretor_afiliados')
      .select('id')
      .eq('email', email)
      .eq('ativo', true)
      .maybeSingle();
    if (existingGlobal) {
      return { success: false, error: 'Este e-mail já está cadastrado como afiliado. Use o mesmo e-mail para acessar o painel ou recupere a senha.' };
    }
    if (cpfNorm && cpfNorm.length === 11) {
      const { data: existingCpf } = await sb
        .from('corretor_afiliados')
        .select('id')
        .eq('cpf', cpfNorm)
        .eq('ativo', true)
        .maybeSingle();
      if (existingCpf) {
        return { success: false, error: 'Este CPF já está cadastrado como afiliado.' };
      }
    }

    const senhaTemporaria = gerarSenhaTemporaria();
    const password_hash = await bcrypt.hash(senhaTemporaria, 10);

    let tokenUnico = gerarTokenUnico();
    for (let t = 0; t < 5; t++) {
      const { data: ex } = await sb
        .from('corretor_afiliados')
        .select('id')
        .eq('token_unico', tokenUnico)
        .maybeSingle();
      if (!ex) break;
      tokenUnico = gerarTokenUnico();
    }

    const insertPayload: Record<string, unknown> = {
      corretor_id: resolved.corretor_id,
      nome,
      email,
      telefone: payload.telefone?.trim() || null,
      token_unico: tokenUnico,
      ativo: true,
      password_hash,
    };
    if (payload.cpf?.trim()) insertPayload.cpf = payload.cpf.trim().replace(/\D/g, '');

    const { data: inserted, error } = await sb
      .from('corretor_afiliados')
      .insert(insertPayload)
      .select('id, token_unico')
      .single();

    if (error) throw error;
    return {
      success: true,
      afiliado_id: inserted?.id,
      token: inserted?.token_unico,
      senhaTemporaria,
    };
  } catch (err) {
    logger.error('[criarAfiliadoSemVinculo]', err);
    return { success: false, error: 'Erro ao criar conta de afiliado.' };
  }
}

export interface Afiliado {
  id: string;
  corretor_id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  token_unico: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/** Lista afiliados do corretor */
export async function listarAfiliados(corretorId: string): Promise<{
  success: boolean;
  data?: Afiliado[];
  error?: string;
}> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('corretor_afiliados')
      .select('*')
      .eq('corretor_id', corretorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: (data ?? []) as Afiliado[] };
  } catch (err) {
    logger.error('[listarAfiliados]', err);
    return { success: false, error: 'Erro ao listar afiliados' };
  }
}

/** Cria afiliado e retorna o link de indicação */
export async function criarAfiliado(
  corretorId: string,
  payload: { nome: string; email?: string; telefone?: string }
): Promise<{ success: boolean; afiliado?: Afiliado; link?: string; error?: string }> {
  try {
    const supabase = createServiceClient();
    const nome = payload.nome?.trim();
    if (!nome) return { success: false, error: 'Nome é obrigatório' };

    let tokenUnico = gerarTokenUnico();
    let tentativas = 0;
    const maxTentativas = 5;

    while (tentativas < maxTentativas) {
      const { data: existente } = await supabase
        .from('corretor_afiliados')
        .select('id')
        .eq('token_unico', tokenUnico)
        .maybeSingle();

      if (!existente) break;
      tokenUnico = gerarTokenUnico();
      tentativas++;
    }

    const { data, error } = await supabase
      .from('corretor_afiliados')
      .insert({
        corretor_id: corretorId,
        nome,
        email: payload.email?.trim() || null,
        telefone: payload.telefone?.trim() || null,
        token_unico: tokenUnico,
        ativo: true,
      })
      .select()
      .single();

    if (error) throw error;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';
    const link = `${baseUrl}/indicar?ref=${tokenUnico}`;

    return { success: true, afiliado: data as Afiliado, link };
  } catch (err) {
    logger.error('[criarAfiliado]', err);
    return { success: false, error: 'Erro ao cadastrar afiliado' };
  }
}

/** Cria afiliado com dados vindos do documento (IA) + telefone/email. Usado quando o corretor sobe o documento e a IA extrai os dados. */
export async function criarAfiliadoComDocumento(
  corretorId: string,
  payload: {
    nome: string;
    cpf?: string;
    email: string;
    telefone: string;
    doc_anexo_url?: string;
    senha?: string;
  },
): Promise<{ success: boolean; afiliado?: Afiliado; link?: string; error?: string }> {
  try {
    const supabase = createServiceClient();
    const nome = payload.nome?.trim();
    if (!nome) return { success: false, error: 'Nome é obrigatório' };
    const email = payload.email?.trim()?.toLowerCase() || '';
    const telefone = payload.telefone?.trim()?.replace(/\D/g, '') || '';
    if (telefone.length < 10) return { success: false, error: 'Telefone com DDD é obrigatório' };
    if (!email) return { success: false, error: 'E-mail é obrigatório' };

    let tokenUnico = gerarTokenUnico();
    let tentativas = 0;
    const maxTentativas = 5;
    while (tentativas < maxTentativas) {
      const { data: existente } = await supabase
        .from('corretor_afiliados')
        .select('id')
        .eq('token_unico', tokenUnico)
        .maybeSingle();
      if (!existente) break;
      tokenUnico = gerarTokenUnico();
      tentativas++;
    }

    const insertPayload: Record<string, unknown> = {
      corretor_id: corretorId,
      nome,
      email,
      telefone: payload.telefone?.trim() || null,
      token_unico: tokenUnico,
      ativo: true,
    };
    if (payload.cpf?.trim()) insertPayload.cpf = payload.cpf.trim().replace(/\D/g, '');
    if (payload.doc_anexo_url?.trim()) insertPayload.doc_anexo_url = payload.doc_anexo_url.trim();
    if (payload.senha?.trim()) {
      insertPayload.password_hash = await bcrypt.hash(payload.senha.trim(), 10);
    }

    const { data, error } = await supabase
      .from('corretor_afiliados')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';
    const link = `${baseUrl}/indicar?ref=${tokenUnico}`;
    return { success: true, afiliado: data as Afiliado, link };
  } catch (err) {
    logger.error('[criarAfiliadoComDocumento]', err);
    return { success: false, error: 'Erro ao cadastrar afiliado' };
  }
}

/** Atualiza ativo do afiliado */
export async function toggleAfiliadoAtivo(afiliadoId: string, corretorId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();
    const { data: atual } = await supabase
      .from('corretor_afiliados')
      .select('ativo')
      .eq('id', afiliadoId)
      .eq('corretor_id', corretorId)
      .single();

    if (!atual) return { success: false, error: 'Afiliado não encontrado' };

    const { error } = await supabase
      .from('corretor_afiliados')
      .update({ ativo: !atual.ativo })
      .eq('id', afiliadoId)
      .eq('corretor_id', corretorId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[toggleAfiliadoAtivo]', err);
    return { success: false, error: 'Erro ao atualizar' };
  }
}

/** Lista todos os afiliados (admin). Retorna com nome do corretor. */
export async function listarAfiliadosAdmin(): Promise<{
  success: boolean;
  data?: (Afiliado & { corretor_nome?: string; cpf?: string | null })[];
  error?: string;
}> {
  try {
    const sb = createServiceClient();
    const { data: afiliados, error } = await sb
      .from('corretor_afiliados')
      .select('id, corretor_id, nome, email, telefone, cpf, token_unico, ativo, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const ids = [...new Set((afiliados ?? []).map((a) => a.corretor_id))];
    const { data: corretores } = ids.length
      ? await sb.from('corretores').select('id, nome').in('id', ids)
      : { data: [] };
    const nomeByCorretorId = new Map((corretores ?? []).map((c: { id: string; nome: string }) => [c.id, c.nome]));
    const list = (afiliados ?? []).map((a) => ({
      ...a,
      corretor_nome: nomeByCorretorId.get(a.corretor_id) ?? undefined,
    }));
    return { success: true, data: list as (Afiliado & { corretor_nome?: string; cpf?: string | null })[] };
  } catch (err) {
    logger.error('[listarAfiliadosAdmin]', err);
    return { success: false, error: 'Erro ao listar afiliados' };
  }
}

/** Desativa afiliado (admin). */
export async function desativarAfiliadoAdmin(afiliadoId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = createServiceClient();
    const { error } = await sb
      .from('corretor_afiliados')
      .update({ ativo: false })
      .eq('id', afiliadoId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[desativarAfiliadoAdmin]', err);
    return { success: false, error: 'Erro ao desativar' };
  }
}

/** Reativa afiliado (admin). */
export async function reativarAfiliadoAdmin(afiliadoId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = createServiceClient();
    const { error } = await sb
      .from('corretor_afiliados')
      .update({ ativo: true })
      .eq('id', afiliadoId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[reativarAfiliadoAdmin]', err);
    return { success: false, error: 'Erro ao reativar' };
  }
}

/** Altera senha do afiliado (admin). */
export async function alterarSenhaAfiliadoAdmin(afiliadoId: string, novaSenha: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!novaSenha || novaSenha.length < 6) {
      return { success: false, error: 'Senha deve ter no mínimo 6 caracteres' };
    }
    const sb = createServiceClient();
    const password_hash = await bcrypt.hash(novaSenha.trim(), 10);
    const { error } = await sb
      .from('corretor_afiliados')
      .update({ password_hash })
      .eq('id', afiliadoId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[alterarSenhaAfiliadoAdmin]', err);
    return { success: false, error: 'Erro ao alterar senha' };
  }
}

/**
 * Resolve ref (slug do corretor ou token do afiliado) para corretor_id e opcionalmente afiliado_id.
 * Usado na landing /indicar e em qualquer fluxo que receba ref.
 */
export async function resolverRefParaCorretor(ref: string): Promise<{
  success: boolean;
  corretor_id?: string;
  afiliado_id?: string;
  nome_corretor?: string;
  nome_afiliado?: string;
  error?: string;
}> {
  if (!ref?.trim()) return { success: false, error: 'Ref obrigatória' };

  const supabase = createServiceClient();
  const r = ref.trim();

  // 1) Tentar como slug do corretor
  const { data: corretor, error: errCorretor } = await supabase
    .from('corretores')
    .select('id, nome')
    .eq('slug', r)
    .eq('ativo', true)
    .maybeSingle();

  if (!errCorretor && corretor) {
    return { success: true, corretor_id: corretor.id, nome_corretor: corretor.nome ?? undefined };
  }

  // 2) Tentar como token de afiliado
  const { data: afiliado, error: errAfiliado } = await supabase
    .from('corretor_afiliados')
    .select('id, corretor_id, nome')
    .eq('token_unico', r)
    .eq('ativo', true)
    .maybeSingle();

  if (!errAfiliado && afiliado) {
    return {
      success: true,
      corretor_id: afiliado.corretor_id,
      afiliado_id: afiliado.id,
      nome_afiliado: afiliado.nome ?? undefined,
    };
  }

  return { success: false, error: 'Link inválido ou expirado' };
}

/**
 * Cadastro público do afiliado (Step 1 da LP).
 * Ref = slug do corretor ou token de afiliado. Resolve corretor_id, cria ou reutiliza afiliado, retorna token para Step 2.
 */
export async function cadastrarAfiliadoPorRef(
  ref: string,
  payload: { nome: string; email: string; telefone: string; cpf?: string; senha?: string; indicado_por_afiliado_id?: string }
): Promise<{ success: boolean; token?: string; afiliado_id?: string; error?: string }> {
  try {
    const resolved = await resolverRefParaCorretor(ref.trim());
    if (!resolved.success || !resolved.corretor_id) {
      return { success: false, error: resolved.error || 'Link inválido' };
    }

    const nome = payload.nome?.trim();
    const email = payload.email?.trim()?.toLowerCase() || '';
    const telefone = payload.telefone?.trim()?.replace(/\D/g, '') || '';
    if (!nome || !email || telefone.length < 10) {
      return { success: false, error: 'Nome, e-mail e telefone (com DDD) são obrigatórios.' };
    }

    const supabase = createServiceClient();

    const { data: existingSameCorretor } = await supabase
      .from('corretor_afiliados')
      .select('id, token_unico')
      .eq('corretor_id', resolved.corretor_id)
      .eq('email', email)
      .eq('ativo', true)
      .maybeSingle();

    if (existingSameCorretor) {
      return {
        success: true,
        token: existingSameCorretor.token_unico,
        afiliado_id: existingSameCorretor.id,
      };
    }

    const cpfNorm = payload.cpf?.trim()?.replace(/\D/g, '') || null;
    const { data: existingGlobalEmail } = await supabase
      .from('corretor_afiliados')
      .select('id')
      .eq('email', email)
      .eq('ativo', true)
      .maybeSingle();
    if (existingGlobalEmail) {
      return { success: false, error: 'Este e-mail já está cadastrado como afiliado. Use o mesmo e-mail para acessar o painel ou recupere a senha.' };
    }
    if (cpfNorm && cpfNorm.length === 11) {
      const { data: existingCpf } = await supabase
        .from('corretor_afiliados')
        .select('id')
        .eq('cpf', cpfNorm)
        .eq('ativo', true)
        .maybeSingle();
      if (existingCpf) {
        return { success: false, error: 'Este CPF já está cadastrado como afiliado.' };
      }
    }

    let tokenUnico = gerarTokenUnico();
    let tentativas = 0;
    while (tentativas < 5) {
      const { data: existente } = await supabase
        .from('corretor_afiliados')
        .select('id')
        .eq('token_unico', tokenUnico)
        .maybeSingle();
      if (!existente) break;
      tokenUnico = gerarTokenUnico();
      tentativas++;
    }

    const insertPayload: Record<string, unknown> = {
      corretor_id: resolved.corretor_id,
      nome,
      email,
      telefone: payload.telefone?.trim() || null,
      token_unico: tokenUnico,
      ativo: true,
    };
    if (payload.cpf?.trim()) insertPayload.cpf = payload.cpf.trim().replace(/\D/g, '');
    if (payload.indicado_por_afiliado_id) insertPayload.indicado_por_afiliado_id = payload.indicado_por_afiliado_id;
    if (payload.senha?.trim()) {
      insertPayload.password_hash = await bcrypt.hash(payload.senha.trim(), 10);
    }

    const { data, error } = await supabase
      .from('corretor_afiliados')
      .insert(insertPayload)
      .select('id, token_unico')
      .single();

    if (error) throw error;

    const telefoneFormatado = payload.telefone?.trim() || '';
    let nomeCorretor = resolved.nome_corretor;
    if (!nomeCorretor && resolved.corretor_id) {
      const { data: corretor } = await supabase
        .from('corretores')
        .select('nome')
        .eq('id', resolved.corretor_id)
        .maybeSingle();
      nomeCorretor = corretor?.nome ?? undefined;
    }

    void (async () => {
      try {
        const { enviarEmailAfiliadoAcessoPainel, enviarEmailAdminNovoAfiliado } = await import('@/lib/email');
        await Promise.all([
          enviarEmailAfiliadoAcessoPainel({ to: email, nomeAfiliado: nome }),
          enviarEmailAdminNovoAfiliado({
            nome,
            email,
            telefone: telefoneFormatado,
            nomeCorretor,
          }),
        ]);
      } catch (emailErr) {
        logger.warn('[cadastrarAfiliadoPorRef] Falha ao enviar e-mails (afiliado/admin)', { error: emailErr });
      }
    })();

    return { success: true, token: data?.token_unico, afiliado_id: data?.id };
  } catch (err) {
    logger.error('[cadastrarAfiliadoPorRef]', err);
    return { success: false, error: 'Erro ao cadastrar. Tente novamente.' };
  }
}

/** Retorna o afiliado logado (via cookie afiliado_token). Usado no dashboard afiliado. */
export async function getAfiliadoLogado(): Promise<{
  success: boolean;
  afiliado?: {
    id: string;
    nome: string;
    email: string | null;
    token_unico: string | null;
    cadastro_completo: boolean | null;
    termo_assinado_em: string | null;
    banco_nome: string | null;
    banco_agencia: string | null;
    banco_conta: string | null;
    banco_tipo: string | null;
    pix: string | null;
    doc_anexo_url: string | null;
    doc_comprovante_residencia_url: string | null;
    termo_aceito: boolean | null;
  };
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('afiliado_token')?.value;
    if (!token) return { success: false, error: 'Não autorizado' };

    const jwt = await verifyToken(token);
    const afiliadoId = jwt?.afiliado_id;
    if (!afiliadoId) return { success: false, error: 'Token inválido' };

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('corretor_afiliados')
      .select('id, nome, email, token_unico, cadastro_completo, termo_assinado_em, banco_nome, banco_agencia, banco_conta, banco_tipo, pix, doc_anexo_url, doc_comprovante_residencia_url, termo_aceito')
      .eq('id', afiliadoId)
      .eq('ativo', true)
      .single();

    if (error || !data) return { success: false, error: 'Afiliado não encontrado' };
    return {
      success: true,
      afiliado: {
        id: data.id,
        nome: data.nome,
        email: data.email,
        token_unico: (data as { token_unico?: string | null }).token_unico ?? null,
        cadastro_completo: data.cadastro_completo ?? null,
        termo_assinado_em: data.termo_assinado_em ?? null,
        banco_nome: data.banco_nome ?? null,
        banco_agencia: data.banco_agencia ?? null,
        banco_conta: data.banco_conta ?? null,
        banco_tipo: data.banco_tipo ?? null,
        pix: data.pix ?? null,
        doc_anexo_url: data.doc_anexo_url ?? null,
        doc_comprovante_residencia_url: (data as { doc_comprovante_residencia_url?: string | null }).doc_comprovante_residencia_url ?? null,
        termo_aceito: data.termo_aceito ?? null,
      },
    };
  } catch (err) {
    logger.error('[getAfiliadoLogado]', err);
    return { success: false, error: 'Erro ao carregar perfil' };
  }
}

/** Atualiza cadastro completo do afiliado (banco, doc, termo). Só o afiliado logado (cookie). */
export async function atualizarCadastroCompletoAfiliado(payload: {
  banco_nome?: string;
  banco_agencia?: string;
  banco_conta?: string;
  banco_tipo?: string;
  pix?: string;
  doc_anexo_url?: string;
  doc_comprovante_residencia_url?: string;
  termo_aceito?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('afiliado_token')?.value;
    if (!token) return { success: false, error: 'Não autorizado' };

    const jwt = await verifyToken(token);
    const afiliadoId = jwt?.afiliado_id;
    if (!afiliadoId) return { success: false, error: 'Token inválido' };

    const supabase = createServiceClient();
    const updatePayload: Record<string, unknown> = {};
    if (payload.banco_nome !== undefined) updatePayload.banco_nome = payload.banco_nome || null;
    if (payload.banco_agencia !== undefined) updatePayload.banco_agencia = payload.banco_agencia || null;
    if (payload.banco_conta !== undefined) updatePayload.banco_conta = payload.banco_conta || null;
    if (payload.banco_tipo !== undefined) updatePayload.banco_tipo = payload.banco_tipo || null;
    if (payload.pix !== undefined) updatePayload.pix = payload.pix || null;
    if (payload.doc_anexo_url !== undefined) updatePayload.doc_anexo_url = payload.doc_anexo_url || null;
    if (payload.doc_comprovante_residencia_url !== undefined) updatePayload.doc_comprovante_residencia_url = payload.doc_comprovante_residencia_url || null;
    if (payload.termo_aceito !== undefined) {
      updatePayload.termo_aceito = payload.termo_aceito;
      if (payload.termo_aceito) {
        updatePayload.termo_assinado_em = new Date().toISOString();
        updatePayload.cadastro_completo = true;
      }
    }

    if (Object.keys(updatePayload).length === 0) return { success: true };

    const { error } = await supabase
      .from('corretor_afiliados')
      .update(updatePayload)
      .eq('id', afiliadoId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error('[atualizarCadastroCompletoAfiliado]', err);
    return { success: false, error: 'Erro ao atualizar cadastro' };
  }
}
