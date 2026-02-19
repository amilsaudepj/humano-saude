// ─────────────────────────────────────────────────────────────
// lib/email.ts — React Email powered transactional email sender
// Renders React Email templates to HTML, sends via Resend,
// logs to DB with tracking pixel injection.
// ─────────────────────────────────────────────────────────────

import { Resend } from 'resend';
import { render } from '@react-email/render';
import type { SendEmailOptions, SendEmailResult } from '@/lib/types/email';
import { logEmailToDb, updateEmailLog, injectTrackingPixel } from '@/lib/email-tracking';
import { logger } from '@/lib/logger';

// React Email templates
import ConfirmacaoCadastroEmail from '@/emails/ConfirmacaoCadastroEmail';
import NotificacaoAdminEmail from '@/emails/NotificacaoAdminEmail';
import AprovacaoEmail from '@/emails/AprovacaoEmail';
import AlteracaoBancariaCorretorEmail from '@/emails/AlteracaoBancariaCorretorEmail';
import AlteracaoBancariaAdminEmail from '@/emails/AlteracaoBancariaAdminEmail';
import AlteracaoBancariaAprovadaEmail from '@/emails/AlteracaoBancariaAprovadaEmail';
import AlteracaoBancariaRejeitadaEmail from '@/emails/AlteracaoBancariaRejeitadaEmail';
import AguardeVerificacaoEmail from '@/emails/AguardeVerificacaoEmail';
import OnboardingConcluidoAdminEmail from '@/emails/OnboardingConcluidoAdminEmail';
import ConviteCorretorEmail from '@/emails/ConviteCorretorEmail';
import BemVindoEmail from '@/emails/BemVindoEmail';
import CompraConfirmadaEmail from '@/emails/CompraConfirmadaEmail';
import PixPendenteEmail from '@/emails/PixPendenteEmail';

// ─── Resend client (lazy) ────────────────────────────────────
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Humano Saúde <noreply@humanosaude.com.br>';
const ADMIN_EMAILS = ['comercial@humanosaude.com.br'];
const CC_EMAILS = ['contato@helciomattos.com.br'];

const log = logger.child({ module: 'email' });

// ─── Helper: guard API key ──────────────────────────────────
function guardApiKey(): { ok: false; result: { success: false; error: string } } | { ok: true } {
  if (!process.env.RESEND_API_KEY) {
    log.warn('RESEND_API_KEY não configurada, pulando envio');
    return { ok: false, result: { success: false, error: 'API key não configurada' } };
  }
  return { ok: true };
}

// ─── Helper: send via Resend ─────────────────────────────────
async function sendViaResend(opts: {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string[];
}): Promise<{ success: true; id?: string } | { success: false; error: string }> {
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    cc: opts.cc,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    log.error('Resend error', error);
    return { success: false, error: error.message };
  }

  log.info('Email sent', { subject: opts.subject, to: opts.to, id: data?.id });
  return { success: true, id: data?.id };
}

// ─────────────────────────────────────────────────────────────
// 1. CONFIRMACAO DE CADASTRO (para o corretor)
// ─────────────────────────────────────────────────────────────
export async function enviarEmailConfirmacaoCadastro(dados: {
  nome: string;
  email: string;
  tipoPessoa: 'pf' | 'pj';
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const html = await render(
      ConfirmacaoCadastroEmail({ nome: dados.nome, tipoPessoa: dados.tipoPessoa })
    );

    return sendViaResend({
      to: dados.email,
      subject: 'Cadastro recebido — Humano Saúde',
      html,
    });
  } catch (err) {
    log.error('enviarEmailConfirmacaoCadastro', err);
    return { success: false, error: 'Erro inesperado ao enviar e-mail' };
  }
}

// ─────────────────────────────────────────────────────────────
// 2. NOTIFICACAO ADMIN (novo cadastro)
// ─────────────────────────────────────────────────────────────
export async function enviarEmailNotificacaoAdmin(dados: {
  nome: string;
  email: string;
  telefone: string;
  tipoPessoa: 'pf' | 'pj';
  cpf?: string | null;
  cnpj?: string | null;
  experienciaAnos?: number;
  comoConheceu?: string | null;
  motivacoes?: string[] | null;
  modalidade?: string | null;
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const documento = dados.tipoPessoa === 'pj'
      ? `CNPJ: ${dados.cnpj || '—'}`
      : `CPF: ${dados.cpf || '—'}`;

    const motivacoesText = dados.motivacoes?.map(m => m.replace(/_/g, ' ')).join(', ') || '—';

    const html = await render(
      NotificacaoAdminEmail({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        tipoPessoa: dados.tipoPessoa,
        documento,
        experienciaAnos: dados.experienciaAnos || 0,
        comoConheceu: dados.comoConheceu?.replace(/_/g, ' ') || '—',
        motivacoes: motivacoesText,
        modalidade: dados.modalidade || 'digital',
      })
    );

    // Send with CC fallback
    const emailOptions: {
      from: string;
      to: string[];
      cc?: string[];
      subject: string;
      html: string;
    } = {
      from: FROM_EMAIL,
      to: ADMIN_EMAILS,
      subject: `Novo Corretor — ${dados.nome} (${dados.tipoPessoa.toUpperCase()})`,
      html,
    };

    try {
      emailOptions.cc = CC_EMAILS;
      const { data, error } = await getResend().emails.send(emailOptions);

      if (error) {
        log.warn('CC falhou, enviando sem CC', { error: error.message });
        delete emailOptions.cc;
        const { data: data2, error: error2 } = await getResend().emails.send(emailOptions);

        if (error2) {
          log.error('Erro ao notificar admin', error2);
          return { success: false, error: error2.message };
        }

        try {
          await getResend().emails.send({
            from: FROM_EMAIL,
            to: CC_EMAILS,
            subject: `[CC] Novo Corretor — ${dados.nome} (${dados.tipoPessoa.toUpperCase()})`,
            html,
          });
        } catch (ccErr) {
          log.warn('Copia CC falhou (nao critico)', { error: ccErr instanceof Error ? ccErr.message : String(ccErr) });
        }

        return { success: true, id: data2?.id };
      }

      log.info('Notificacao admin enviada com CC', { id: data?.id });
      return { success: true, id: data?.id };
    } catch (err) {
      log.error('Erro inesperado notificacao admin', err);
      return { success: false, error: 'Erro inesperado' };
    }
  } catch (err) {
    log.error('enviarEmailNotificacaoAdmin', err);
    return { success: false, error: 'Erro inesperado' };
  }
}

// ─────────────────────────────────────────────────────────────
// 3. APROVACAO (com dados de acesso)
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAprovacao(dados: {
  nome: string;
  email: string;
  onboardingLink: string;
  senhaTemporaria?: string;
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const html = await render(
      AprovacaoEmail({
        nome: dados.nome,
        email: dados.email,
        onboardingLink: dados.onboardingLink,
        senhaTemporaria: dados.senhaTemporaria,
      })
    );

    return sendViaResend({
      to: dados.email,
      subject: 'Cadastro aprovado — Humano Saúde',
      html,
    });
  } catch (err) {
    log.error('enviarEmailAprovacao', err);
    return { success: false, error: 'Erro inesperado' };
  }
}

// ─────────────────────────────────────────────────────────────
// 4. ALTERACAO BANCARIA — Corretor
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAlteracaoBancariaCorretor(dados: {
  nome: string;
  email: string;
  bancoNovo: string;
  motivo: string;
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const html = await render(
      AlteracaoBancariaCorretorEmail({
        nome: dados.nome,
        bancoNovo: dados.bancoNovo,
        motivo: dados.motivo,
      })
    );

    return sendViaResend({
      to: dados.email,
      subject: 'Solicitação de alteração bancária recebida — Humano Saúde',
      html,
    });
  } catch (err) {
    log.error('enviarEmailAlteracaoBancariaCorretor', err);
    return { success: false, error: 'Erro inesperado' };
  }
}

// ─────────────────────────────────────────────────────────────
// 5. ALTERACAO BANCARIA — Admin
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAlteracaoBancariaAdmin(dados: {
  corretorNome: string;
  corretorEmail: string;
  bancoAntigo: string;
  bancoNovo: string;
  motivo: string;
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const html = await render(
      AlteracaoBancariaAdminEmail({
        corretorNome: dados.corretorNome,
        corretorEmail: dados.corretorEmail,
        bancoAntigo: dados.bancoAntigo,
        bancoNovo: dados.bancoNovo,
        motivo: dados.motivo,
      })
    );

    return sendViaResend({
      to: ADMIN_EMAILS,
      subject: `Alteração Bancária — ${dados.corretorNome}`,
      html,
    });
  } catch (err) {
    log.error('enviarEmailAlteracaoBancariaAdmin', err);
    return { success: false, error: 'Erro inesperado' };
  }
}

// ─────────────────────────────────────────────────────────────
// 6. ALTERACAO BANCARIA — Aprovada
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAlteracaoBancariaAprovada(dados: {
  nome: string;
  email: string;
  bancoNovo: string;
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const html = await render(
      AlteracaoBancariaAprovadaEmail({
        nome: dados.nome,
        bancoNovo: dados.bancoNovo,
      })
    );

    return sendViaResend({
      to: dados.email,
      subject: 'Alteração bancária aprovada — Humano Saúde',
      html,
    });
  } catch (err) {
    log.error('enviarEmailAlteracaoBancariaAprovada', err);
    return { success: false, error: 'Erro inesperado' };
  }
}

// ─────────────────────────────────────────────────────────────
// 7. ALTERACAO BANCARIA — Rejeitada
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAlteracaoBancariaRejeitada(dados: {
  nome: string;
  email: string;
  motivo: string;
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const html = await render(
      AlteracaoBancariaRejeitadaEmail({
        nome: dados.nome,
        motivo: dados.motivo,
      })
    );

    return sendViaResend({
      to: dados.email,
      subject: 'Alteração bancária não aprovada — Humano Saúde',
      html,
    });
  } catch (err) {
    log.error('enviarEmailAlteracaoBancariaRejeitada', err);
    return { success: false, error: 'Erro inesperado' };
  }
}

// ─────────────────────────────────────────────────────────────
// 8. AGUARDE VERIFICACAO (pos-onboarding)
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAguardeVerificacao(dados: {
  nome: string;
  email: string;
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const html = await render(
      AguardeVerificacaoEmail({ nome: dados.nome })
    );

    return sendViaResend({
      to: dados.email,
      subject: 'Onboarding concluído — Aguarde a verificação — Humano Saúde',
      html,
    });
  } catch (err) {
    log.error('enviarEmailAguardeVerificacao', err);
    return { success: false, error: 'Erro inesperado' };
  }
}

// ─────────────────────────────────────────────────────────────
// 9. ONBOARDING CONCLUIDO — Admin
// ─────────────────────────────────────────────────────────────
export async function enviarEmailOnboardingConcluidoAdmin(dados: {
  corretorNome: string;
  corretorEmail: string;
  corretorTelefone?: string;
  corretorCpf?: string;
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const html = await render(
      OnboardingConcluidoAdminEmail({
        corretorNome: dados.corretorNome,
        corretorEmail: dados.corretorEmail,
        corretorTelefone: dados.corretorTelefone,
        corretorCpf: dados.corretorCpf,
      })
    );

    return sendViaResend({
      to: ADMIN_EMAILS,
      subject: `Onboarding concluído — ${dados.corretorNome}`,
      html,
    });
  } catch (err) {
    log.error('enviarEmailOnboardingConcluidoAdmin', err);
    return { success: false, error: 'Erro inesperado' };
  }
}

// ─────────────────────────────────────────────────────────────
// 10. CONVITE CORRETOR
// ─────────────────────────────────────────────────────────────
export async function enviarEmailConviteCorretor(dados: {
  emailConvidado: string;
  nomeConvidante: string;
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const html = await render(
      ConviteCorretorEmail({ nomeConvidante: dados.nomeConvidante })
    );

    return sendViaResend({
      to: [dados.emailConvidado],
      subject: 'Humano Saude te convidou para ser Especialista em Seguros',
      html,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('enviarEmailConviteCorretor', err);
    return { success: false, error: msg || 'Erro inesperado' };
  }
}

// ─────────────────────────────────────────────────────────────
// CENTRAL TRANSACTIONAL EMAIL SENDER
// Full tracking: DB log -> tracking pixel -> Resend -> update log
// ─────────────────────────────────────────────────────────────
export async function sendTransactionalEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const to = Array.isArray(options.to) ? options.to : [options.to];

    // 1. Pre-log to DB (status: queued)
    const logId = await logEmailToDb({
      ...options,
      status: 'queued',
      saveHtmlContent: options.saveHtmlContent !== false,
    });

    // 2. Inject tracking pixel
    let finalHtml = options.html;
    if (logId && options.injectTrackingPixel !== false) {
      finalHtml = injectTrackingPixel(finalHtml, logId);
    }

    // 3. Send via Resend
    const { data, error } = await getResend().emails.send({
      from: options.from || FROM_EMAIL,
      to,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      subject: options.subject,
      html: finalHtml,
      text: options.text,
    });

    if (error) {
      log.error('sendTransactionalEmail Resend error', error);
      if (logId) {
        await updateEmailLog(logId, {
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString(),
        });
      }
      return { success: false, error: error.message, logId: logId || undefined };
    }

    // 4. Update DB log
    if (logId && data?.id) {
      await updateEmailLog(logId, {
        resend_id: data.id,
        status: 'sent',
        html_content: options.saveHtmlContent !== false ? finalHtml : undefined,
      });
    }

    log.info('Transactional email sent', { subject: options.subject, to: to.join(', '), id: data?.id });
    return { success: true, id: data?.id, logId: logId || undefined };
  } catch (err) {
    log.error('sendTransactionalEmail unexpected', err);
    return { success: false, error: 'Erro inesperado ao enviar e-mail' };
  }
}

// ─────────────────────────────────────────────────────────────
// 11. WELCOME EMAIL (via central sender)
// ─────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(dados: {
  nome: string;
  email: string;
}): Promise<SendEmailResult> {
  const html = await render(BemVindoEmail({ nome: dados.nome }));

  return sendTransactionalEmail({
    to: dados.email,
    subject: 'Bem-vindo(a) à Humano Saúde! 👋',
    html,
    templateName: 'welcome',
    emailType: 'transactional',
    category: 'onboarding',
    tags: ['welcome', 'new-user'],
    triggeredBy: 'system',
  });
}

// ─────────────────────────────────────────────────────────────
// 12. PURCHASE CONFIRMATION (via central sender)
// ─────────────────────────────────────────────────────────────
export async function sendPurchaseConfirmationEmail(dados: {
  nome: string;
  email: string;
  plano: string;
  operadora: string;
  valor: string;
  vigencia: string;
  protocolo: string;
}): Promise<SendEmailResult> {
  const html = await render(
    CompraConfirmadaEmail({
      nome: dados.nome,
      plano: dados.plano,
      operadora: dados.operadora,
      valor: dados.valor,
      vigencia: dados.vigencia,
      protocolo: dados.protocolo,
    })
  );

  return sendTransactionalEmail({
    to: dados.email,
    subject: `Compra confirmada — ${dados.plano} — Humano Saúde`,
    html,
    templateName: 'purchase_confirmation',
    emailType: 'transactional',
    category: 'vendas',
    tags: ['purchase', 'confirmation', dados.operadora.toLowerCase()],
    triggeredBy: 'system',
    metadata: { protocolo: dados.protocolo, plano: dados.plano, operadora: dados.operadora },
  });
}

// ─────────────────────────────────────────────────────────────
// 13. PIX PENDING EMAIL (via central sender)
// ─────────────────────────────────────────────────────────────
export async function sendPixPendingEmail(dados: {
  nome: string;
  email: string;
  valor: string;
  pixCode: string;
  expiresAt: string;
}): Promise<SendEmailResult> {
  const html = await render(
    PixPendenteEmail({
      nome: dados.nome,
      valor: dados.valor,
      pixCode: dados.pixCode,
      expiresAt: dados.expiresAt,
    })
  );

  return sendTransactionalEmail({
    to: dados.email,
    subject: `PIX pendente — R$ ${dados.valor} — Humano Saúde`,
    html,
    templateName: 'pix_pending',
    emailType: 'transactional',
    category: 'financeiro',
    tags: ['pix', 'payment', 'pending'],
    triggeredBy: 'system',
    metadata: { valor: dados.valor },
  });
}

// ─── Re-export getResend for admin resend route ──────────────
export { getResend as _getResend };

// ─────────────────────────────────────────────────────────────
// 14. NOVO LEAD — Notificação para equipe comercial
// ─────────────────────────────────────────────────────────────
export async function enviarEmailNovoLead(dados: {
  nome: string;
  email: string;
  telefone: string;
  cnpj?: string;
  perfil?: string;
  intencao?: string;
  perfilCnpj?: string;
  acomodacao?: string;
  bairro?: string;
  idades?: string;
  qtdVidas?: string;
  usaBypass?: boolean;
  origem: string;
  parcial?: boolean;
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const NovoLeadEmail = (await import('@/emails/NovoLeadEmail')).default;

    const html = await render(
      NovoLeadEmail({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        cnpj: dados.cnpj || '—',
        perfil: dados.perfil || '—',
        intencao: dados.intencao || '—',
        perfilCnpj: dados.perfilCnpj || '—',
        acomodacao: dados.acomodacao || '—',
        bairro: dados.bairro || '—',
        idades: dados.idades || '—',
        qtdVidas: dados.qtdVidas || '—',
        usaBypass: dados.usaBypass || false,
        origem: dados.origem,
        parcial: dados.parcial || false,
        dataCriacao: new Date().toISOString(),
      })
    );

    const origemLabel = dados.origem === 'calculadora' ? 'Calculadora' : dados.origem === 'hero_form' ? 'Formulário' : 'Landing';
    const prefix = dados.parcial ? '⚠️ Lead parcial' : '🔥 Novo lead';

    return sendViaResend({
      to: ADMIN_EMAILS,
      cc: CC_EMAILS,
      subject: `${prefix} — ${dados.nome || 'Sem nome'} (${origemLabel})`,
      html,
    });
  } catch (err) {
    log.error('enviarEmailNovoLead', err);
    return { success: false, error: 'Erro ao enviar email de novo lead' };
  }
}

// ─────────────────────────────────────────────────────────────
// 15. ACESSO PORTAL CLIENTE — Envio de credenciais
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAcessoPortalCliente(dados: {
  nome: string;
  email: string;
  senhaTemporaria: string;
  portalLink: string;
  resumo?: {
    operadoraAtual?: string | null;
    valorAtual?: number;
    qtdVidas?: number;
  };
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    if (!resend) return { success: false, error: 'Resend não configurado' };

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="text-align:center;margin-bottom:20px">
          <h1 style="color:#D4AF37;font-size:24px">Humano Saúde</h1>
        </div>
        <p>Olá <strong>${dados.nome}</strong>,</p>
        <p>Suas credenciais de acesso ao Portal do Cliente foram criadas com sucesso!</p>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:20px 0">
          <p style="margin:4px 0"><strong>E-mail:</strong> ${dados.email}</p>
          <p style="margin:4px 0"><strong>Senha temporária:</strong> ${dados.senhaTemporaria}</p>
        </div>
        <div style="text-align:center;margin:24px 0">
          <a href="${dados.portalLink}" style="background:#D4AF37;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">
            Acessar Portal
          </a>
        </div>
        <p style="font-size:12px;color:#888">Recomendamos alterar a senha temporária no primeiro acesso.</p>
      </div>
    `;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: dados.email,
      subject: 'Seus dados de acesso — Portal Humano Saúde',
      html,
    });

    return { success: true };
  } catch (err) {
    log.error('enviarEmailAcessoPortalCliente', err);
    return { success: false, error: 'Erro ao enviar email de acesso' };
  }
}
