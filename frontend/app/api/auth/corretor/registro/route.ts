import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { enviarEmailConfirmacaoCadastro, enviarEmailNotificacaoAdmin } from '@/lib/email';
import { signCorretorApproveToken } from '@/lib/corretor-approve-token';
import { logger } from '@/lib/logger';

// ─── Validadores Server-Side ───────────────────────────────
function validarCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '');
  if (nums.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(nums)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(nums[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(nums[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(nums[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(nums[10])) return false;

  return true;
}

function validarCNPJ(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(nums)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let soma = 0;
  for (let i = 0; i < 12; i++) soma += Number(nums[i]) * pesos1[i];
  let resto = soma % 11;
  const d1 = resto < 2 ? 0 : 11 - resto;
  if (Number(nums[12]) !== d1) return false;

  soma = 0;
  for (let i = 0; i < 13; i++) soma += Number(nums[i]) * pesos2[i];
  resto = soma % 11;
  const d2 = resto < 2 ? 0 : 11 - resto;
  if (Number(nums[13]) !== d2) return false;

  return true;
}

// ─── Garantir que a tabela existe ──────────────────────────
async function ensureTableExists(supabase: ReturnType<typeof createServiceClient>) {
  // Tenta um select simples — se der erro PGRST205, a tabela não existe
  const { error } = await supabase
    .from('solicitacoes_corretor')
    .select('id')
    .limit(1);

  if (error && (error.code === 'PGRST205' || error.message?.includes('Could not find'))) {
    // Criar a tabela via SQL (usando rpc ou raw query)
    // Como não temos acesso direto a SQL via Supabase JS,
    // vamos usar a função rpc se disponível, senão retornamos erro claro
    logger.error('[registro corretor] Tabela solicitacoes_corretor não encontrada. Execute a migration SQL no Supabase.');

    // Tentar criar via rpc (caso exista a função)
    const createResult = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS solicitacoes_corretor (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nome_completo TEXT NOT NULL,
          email TEXT NOT NULL,
          telefone TEXT NOT NULL,
          cpf TEXT,
          tipo_pessoa TEXT DEFAULT 'pf',
          cnpj TEXT,
          razao_social TEXT,
          nome_fantasia TEXT,
          registro_susep TEXT,
          experiencia_anos INT DEFAULT 0,
          operadoras_experiencia TEXT[],
          especialidade TEXT,
          motivacoes TEXT[],
          modalidade_trabalho TEXT DEFAULT 'digital',
          mensagem TEXT,
          termo_aceito BOOLEAN DEFAULT FALSE,
          status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
          motivo_rejeicao TEXT,
          aprovado_por TEXT,
          aprovado_em TIMESTAMPTZ,
          ip_origem TEXT,
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE solicitacoes_corretor ENABLE ROW LEVEL SECURITY;
        CREATE POLICY IF NOT EXISTS "Public insert solicitacoes" ON solicitacoes_corretor FOR INSERT WITH CHECK (true);
        CREATE POLICY IF NOT EXISTS "Public select solicitacoes" ON solicitacoes_corretor FOR SELECT USING (true);
        CREATE POLICY IF NOT EXISTS "Public update solicitacoes" ON solicitacoes_corretor FOR UPDATE USING (true);
        CREATE POLICY IF NOT EXISTS "Public delete solicitacoes" ON solicitacoes_corretor FOR DELETE USING (true);
      `,
    });

    if (createResult.error) {
      logger.info('[registro corretor] Não foi possível criar tabela via rpc, tentando insert direto...');
      // A função rpc não existe — vamos retornar false
      return false;
    }

    return true;
  }

  return !error;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tipo_pessoa,
      nome_completo,
      email,
      telefone,
      cpf,
      cnpj,
      razao_social,
      nome_fantasia,
      registro_susep,
      experiencia_anos,
      operadoras_experiencia,
      especialidade,
      motivacoes,
      modalidade_trabalho,
      como_conheceu,
      mensagem,
      termo_aceito,
    } = body;

    // ─── Validações obrigatórias ───────────────────────────
    if (!nome_completo?.trim() || !email?.trim() || !telefone?.trim()) {
      return NextResponse.json(
        { error: 'Nome, e-mail e telefone são obrigatórios' },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'E-mail inválido' },
        { status: 400 },
      );
    }

    // Validar tipo_pessoa
    const tipoPessoa = tipo_pessoa === 'pj' ? 'pj' : 'pf';

    // Validar documento
    if (tipoPessoa === 'pf') {
      if (!cpf) {
        return NextResponse.json({ error: 'CPF é obrigatório para Pessoa Física' }, { status: 400 });
      }
      if (!validarCPF(cpf)) {
        return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
      }
    } else {
      if (!cnpj) {
        return NextResponse.json({ error: 'CNPJ é obrigatório para Pessoa Jurídica' }, { status: 400 });
      }
      if (!validarCNPJ(cnpj)) {
        return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
      }
      if (!razao_social?.trim()) {
        return NextResponse.json({ error: 'Razão Social é obrigatória para Pessoa Jurídica' }, { status: 400 });
      }
    }

    // Validar aceite de termos
    if (!termo_aceito) {
      return NextResponse.json(
        { error: 'É obrigatório aceitar os Termos de Uso e Política de Privacidade' },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const ipAddress = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '';
    const userAgent = request.headers.get('user-agent') ?? '';

    // ─── Verificar se a tabela existe ──────────────────────
    const tableExists = await ensureTableExists(supabase);

    if (!tableExists) {
      // Tabela não existe e não conseguimos criar — dar mensagem clara
      return NextResponse.json(
        {
          error: 'A tabela de solicitações ainda não foi criada no banco de dados. Execute a migration SQL: database/migrations/20260210_create_solicitacoes_corretor.sql no seu Supabase.',
        },
        { status: 503 },
      );
    }

    // ─── Verificar duplicatas de E-MAIL ────────────────────
    const { data: existingEmail } = await supabase
      .from('solicitacoes_corretor')
      .select('id, status')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingEmail) {
      if (existingEmail.status === 'pendente') {
        return NextResponse.json(
          { error: 'Já existe uma solicitação pendente com este e-mail. Aguarde a análise.' },
          { status: 409 },
        );
      }
      if (existingEmail.status === 'aprovado') {
        return NextResponse.json(
          { error: 'Este e-mail já foi aprovado. Faça login normalmente.' },
          { status: 409 },
        );
      }
      // Se foi rejeitado, permite tentar novamente
      if (existingEmail.status === 'rejeitado') {
        await supabase
          .from('solicitacoes_corretor')
          .delete()
          .eq('id', existingEmail.id);
      }
    }

    // ─── Verificar duplicatas de CPF ────────────────────────
    const docNum = tipoPessoa === 'pf' ? cpf?.replace(/\D/g, '') : cnpj?.replace(/\D/g, '');
    if (docNum) {
      // Verificar na tabela de solicitações
      const docField = tipoPessoa === 'pf' ? 'cpf' : 'cnpj';
      const { data: existingDoc } = await supabase
        .from('solicitacoes_corretor')
        .select('id, status')
        .eq(docField, tipoPessoa === 'pf' ? cpf!.trim() : cnpj!.trim())
        .in('status', ['pendente', 'aprovado'])
        .single();

      if (existingDoc) {
        if (existingDoc.status === 'pendente') {
          return NextResponse.json(
            { error: `Já existe uma solicitação pendente com este ${tipoPessoa === 'pf' ? 'CPF' : 'CNPJ'}. Aguarde a análise.` },
            { status: 409 },
          );
        }
        if (existingDoc.status === 'aprovado') {
          return NextResponse.json(
            { error: `Este ${tipoPessoa === 'pf' ? 'CPF' : 'CNPJ'} já foi aprovado. Faça login normalmente.` },
            { status: 409 },
          );
        }
      }

      // Verificar na tabela de corretores ativos
      if (tipoPessoa === 'pf' && cpf) {
        const { data: existingCorretor } = await supabase
          .from('corretores')
          .select('id')
          .eq('cpf', cpf.trim())
          .eq('ativo', true)
          .single();

        if (existingCorretor) {
          return NextResponse.json(
            { error: 'Este CPF já está cadastrado como corretor ativo. Faça login normalmente.' },
            { status: 409 },
          );
        }
      }

      // Verificar email na tabela de corretores ativos
      const { data: existingCorretorEmail } = await supabase
        .from('corretores')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .eq('ativo', true)
        .single();

      if (existingCorretorEmail) {
        return NextResponse.json(
          { error: 'Este e-mail já está cadastrado como corretor ativo. Faça login normalmente.' },
          { status: 409 },
        );
      }
    }

    // ─── Inserir solicitação ───────────────────────────────
    const insertData: Record<string, unknown> = {
      nome_completo: nome_completo.trim(),
      email: email.toLowerCase().trim(),
      telefone: telefone.trim(),
      cpf: tipoPessoa === 'pf' ? cpf?.trim() : null,
      tipo_pessoa: tipoPessoa,
      cnpj: tipoPessoa === 'pj' ? cnpj?.trim() : null,
      razao_social: tipoPessoa === 'pj' ? razao_social?.trim() : null,
      nome_fantasia: tipoPessoa === 'pj' ? nome_fantasia?.trim() || null : null,
      registro_susep: registro_susep?.trim() || null,
      experiencia_anos: experiencia_anos ? Number(experiencia_anos) : 0,
      operadoras_experiencia: operadoras_experiencia || [],
      especialidade: especialidade || null,
      motivacoes: motivacoes || [],
      modalidade_trabalho: modalidade_trabalho || 'digital',
      como_conheceu: como_conheceu || null,
      mensagem: mensagem?.trim() || null,
      termo_aceito: true,
      ip_origem: ipAddress,
      user_agent: userAgent,
      status: 'pendente',
    };

    const { data, error } = await supabase
      .from('solicitacoes_corretor')
      .insert(insertData)
      .select('id')
      .single();

    if (error) {
      logger.error('[registro corretor]', error);

      // Se o erro é por colunas que não existem, tentar insert mínimo
      if (error.code === 'PGRST204' || error.message?.includes('column')) {
        logger.info('[registro corretor] Tentando insert com colunas base...');

        const minimalInsert: Record<string, unknown> = {
          nome_completo: nome_completo.trim(),
          email: email.toLowerCase().trim(),
          telefone: telefone.trim(),
          cpf: tipoPessoa === 'pf' ? cpf?.trim() : null,
          registro_susep: registro_susep?.trim() || null,
          experiencia_anos: experiencia_anos ? Number(experiencia_anos) : 0,
          operadoras_experiencia: operadoras_experiencia || [],
          especialidade: especialidade || null,
          mensagem: mensagem?.trim() || null,
          ip_origem: ipAddress,
          user_agent: userAgent,
          status: 'pendente',
        };

        const { data: data2, error: error2 } = await supabase
          .from('solicitacoes_corretor')
          .insert(minimalInsert)
          .select('id')
          .single();

        if (error2) {
          logger.error('[registro corretor] fallback insert failed', error2);
          return NextResponse.json(
            { error: `Erro ao salvar solicitação: ${error2.message}` },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Solicitação enviada com sucesso! Você receberá um e-mail quando for aprovado.',
          id: data2.id,
          note: 'Alguns campos extras não foram salvos. Execute a migration completa no Supabase.',
        });
      }

      return NextResponse.json(
        { error: `Erro ao salvar solicitação: ${error.message}` },
        { status: 500 },
      );
    }

    // ─── Registrar aceites de termos (se a tabela existir) ──
    try {
      const documento = tipoPessoa === 'pf' ? cpf?.trim() : cnpj?.trim();

      // Verificar se a tabela termos_aceites existe
      const { error: termosCheckError } = await supabase
        .from('termos_aceites')
        .select('id')
        .limit(1);

      if (!termosCheckError) {
        // Buscar versões ativas
        const { data: termoUso } = await supabase
          .from('termos_versoes')
          .select('id, versao')
          .eq('tipo', 'termos_uso')
          .eq('ativo', true)
          .single();

        const { data: termoLgpd } = await supabase
          .from('termos_versoes')
          .select('id, versao')
          .eq('tipo', 'lgpd')
          .eq('ativo', true)
          .single();

        const aceites = [];

        if (termoUso) {
          aceites.push({
            solicitacao_id: data.id,
            nome_completo: nome_completo.trim(),
            email: email.toLowerCase().trim(),
            documento: documento || '',
            termo_versao_id: termoUso.id,
            termo_tipo: 'termos_uso',
            termo_versao: termoUso.versao,
            ip_address: ipAddress,
            user_agent: userAgent,
          });
        }

        if (termoLgpd) {
          aceites.push({
            solicitacao_id: data.id,
            nome_completo: nome_completo.trim(),
            email: email.toLowerCase().trim(),
            documento: documento || '',
            termo_versao_id: termoLgpd.id,
            termo_tipo: 'lgpd',
            termo_versao: termoLgpd.versao,
            ip_address: ipAddress,
            user_agent: userAgent,
          });
        }

        if (aceites.length > 0) {
          const { error: aceiteError } = await supabase
            .from('termos_aceites')
            .insert(aceites);

          if (aceiteError) {
            logger.error('[termos aceite]', aceiteError);
          }
        }
      }
    } catch (termosErr) {
      logger.error('[termos aceite] non-critical error:', termosErr);
    }

    // ─── Link de aprovação por e-mail (mesma lógica do design system) ───
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://humanosaude.com.br';
    const token = signCorretorApproveToken(data.id);
    const approveLink = `${baseUrl}/api/corretor/approve-from-email?request=${encodeURIComponent(data.id)}&token=${encodeURIComponent(token)}`;

    // ─── Enviar e-mails (non-blocking) ───────────────────────
    try {
      // Email de confirmação para o corretor
      await enviarEmailConfirmacaoCadastro({
        nome: nome_completo.trim(),
        email: email.toLowerCase().trim(),
        tipoPessoa: tipoPessoa as 'pf' | 'pj',
      });

      // Email de notificação para admin (com link para aprovar em 1 clique)
      await enviarEmailNotificacaoAdmin({
        nome: nome_completo.trim(),
        email: email.toLowerCase().trim(),
        telefone: telefone.trim(),
        tipoPessoa: tipoPessoa as 'pf' | 'pj',
        cpf: tipoPessoa === 'pf' ? cpf?.trim() : null,
        cnpj: tipoPessoa === 'pj' ? cnpj?.trim() : null,
        experienciaAnos: experiencia_anos ? Number(experiencia_anos) : 0,
        comoConheceu: como_conheceu || null,
        motivacoes: motivacoes || [],
        modalidade: modalidade_trabalho || 'digital',
        approveLink,
      });
    } catch (emailErr) {
      logger.error('[email] non-critical error:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitação enviada com sucesso! Você receberá um e-mail quando for aprovado.',
      id: data.id,
    });
  } catch (err) {
    logger.error('[registro corretor] unexpected', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 },
    );
  }
}
