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
import ConfirmacaoLeadClienteEmail from '@/emails/ConfirmacaoLeadClienteEmail';
import DadosRecebidosCompletarCotacaoEmail from '@/emails/DadosRecebidosCompletarCotacaoEmail';
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
import DesignSystemSolicitacaoAdminEmail from '@/emails/DesignSystemSolicitacaoAdminEmail';
import DesignSystemSolicitacaoRecebidaEmail from '@/emails/DesignSystemSolicitacaoRecebidaEmail';
import DesignSystemAcessoAprovadoEmail from '@/emails/DesignSystemAcessoAprovadoEmail';

// ─── Resend client (lazy) ────────────────────────────────────
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Humano Saúde <noreply@humanosaude.com.br>';
// Destinatários do email "novo lead" (comercial): use RESEND_ADMIN_EMAILS e RESEND_CC_EMAILS (vírgula) para sobrescrever
const ADMIN_EMAILS = process.env.RESEND_ADMIN_EMAILS
  ? process.env.RESEND_ADMIN_EMAILS.split(',').map((e) => e.trim()).filter(Boolean)
  : ['comercial@humanosaude.com.br'];
const CC_EMAILS = process.env.RESEND_CC_EMAILS
  ? process.env.RESEND_CC_EMAILS.split(',').map((e) => e.trim()).filter(Boolean)
  : ['contato@helciomattos.com.br'];

const log = logger.child({ module: 'email' });

// ─── Helper: guard API key ──────────────────────────────────
function guardApiKey(): { ok: false; result: { success: false; error: string } } | { ok: true } {
  if (!process.env.RESEND_API_KEY) {
    log.warn('RESEND_API_KEY não configurada, pulando envio');
    return { ok: false, result: { success: false, error: 'API key não configurada' } };
  }
  return { ok: true };
}

// ─── Helper: send via Resend (with tracking/logging) ────────
async function sendViaResend(opts: SendEmailOptions): Promise<{ success: true; id?: string } | { success: false; error: string }> {
  const result = await sendTransactionalEmail({
    ...opts,
    emailType: opts.emailType || 'transactional',
    triggeredBy: opts.triggeredBy || 'system',
    saveHtmlContent: opts.saveHtmlContent !== false,
    injectTrackingPixel: opts.injectTrackingPixel !== false,
  });

  if (!result.success) {
    return { success: false, error: result.error || 'Falha ao enviar e-mail' };
  }

  return { success: true, id: result.id };
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
      templateName: 'confirmacao_cadastro',
      category: 'onboarding',
      tags: ['cadastro', 'corretor'],
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
  /** Link para aprovar em 1 clique (mesma lógica do design system). Se informado, o e-mail terá botão "Aprovar cadastro". */
  approveLink?: string | null;
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
        approveLink: dados.approveLink || undefined,
      })
    );

    const subject = `Novo Corretor — ${dados.nome} (${dados.tipoPessoa.toUpperCase()})`;

    // Preferencial: admin + CC no mesmo envio
    const primary = await sendViaResend({
      to: ADMIN_EMAILS,
      cc: CC_EMAILS,
      subject,
      html,
      templateName: 'novo_corretor_admin',
      category: 'onboarding',
      tags: ['admin', 'cadastro-corretor'],
      triggeredBy: 'system',
      metadata: {
        corretor_nome: dados.nome,
        corretor_email: dados.email,
        tipo_pessoa: dados.tipoPessoa,
      },
    });

    if (primary.success) {
      log.info('Notificacao admin enviada com CC', { id: primary.id });
      return primary;
    }

    // Fallback: envio sem CC e tentativa separada de cópia
    log.warn('CC falhou, enviando sem CC', { error: primary.error });

    const fallback = await sendViaResend({
      to: ADMIN_EMAILS,
      subject,
      html,
      templateName: 'novo_corretor_admin',
      category: 'onboarding',
      tags: ['admin', 'cadastro-corretor'],
      triggeredBy: 'system',
      metadata: {
        corretor_nome: dados.nome,
        corretor_email: dados.email,
        tipo_pessoa: dados.tipoPessoa,
        fallback_sem_cc: true,
      },
    });

    if (!fallback.success) {
      log.error('Erro ao notificar admin', fallback.error);
      return fallback;
    }

    const ccCopy = await sendViaResend({
      to: CC_EMAILS,
      subject: `[CC] ${subject}`,
      html,
      templateName: 'novo_corretor_admin_cc',
      category: 'onboarding',
      tags: ['admin', 'cadastro-corretor', 'cc'],
      triggeredBy: 'system',
      metadata: {
        corretor_nome: dados.nome,
        corretor_email: dados.email,
        tipo_pessoa: dados.tipoPessoa,
      },
    });

    if (!ccCopy.success) {
      log.warn('Copia CC falhou (nao critico)', { error: ccCopy.error });
    }

    return fallback;
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
      templateName: 'aprovacao_cadastro',
      category: 'onboarding',
      tags: ['aprovacao', 'corretor'],
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
      templateName: 'alteracao_bancaria_corretor',
      category: 'financeiro',
      tags: ['alteracao-bancaria'],
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
      templateName: 'alteracao_bancaria_admin',
      category: 'financeiro',
      tags: ['admin', 'alteracao-bancaria'],
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
      templateName: 'alteracao_bancaria_aprovada',
      category: 'financeiro',
      tags: ['alteracao-bancaria'],
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
      templateName: 'alteracao_bancaria_rejeitada',
      category: 'financeiro',
      tags: ['alteracao-bancaria'],
    });
  } catch (err) {
    log.error('enviarEmailAlteracaoBancariaRejeitada', err);
    return { success: false, error: 'Erro inesperado' };
  }
}

// ─────────────────────────────────────────────────────────────
// DESIGN SYSTEM — Notificação admin (solicitação de acesso)
// ─────────────────────────────────────────────────────────────
export async function enviarEmailDesignSystemSolicitacaoAdmin(dados: {
  emailSolicitante: string;
  approveLink: string;
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const html = await render(
      DesignSystemSolicitacaoAdminEmail({
        emailSolicitante: dados.emailSolicitante,
        approveLink: dados.approveLink,
      })
    );

    const to = process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : ADMIN_EMAILS;
    return sendViaResend({
      to,
      subject: `Design System: ${dados.emailSolicitante} solicitou acesso`,
      html,
      templateName: 'design_system_solicitacao_admin',
      category: 'design-system',
      tags: ['design-system', 'admin', 'solicitacao'],
    });
  } catch (err) {
    log.error('enviarEmailDesignSystemSolicitacaoAdmin', err);
    return { success: false, error: 'Erro inesperado' };
  }
}

// ─────────────────────────────────────────────────────────────
// DESIGN SYSTEM — Confirmação para quem solicitou (solicitação recebida)
// ─────────────────────────────────────────────────────────────
export async function enviarEmailDesignSystemSolicitacaoRecebida(dados: { email: string }) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const html = await render(
      DesignSystemSolicitacaoRecebidaEmail({ email: dados.email })
    );

    return sendViaResend({
      to: dados.email,
      subject: 'Solicitação de acesso ao Design System recebida — Humano Saúde',
      html,
      templateName: 'design_system_solicitacao_recebida',
      category: 'design-system',
      tags: ['design-system', 'solicitante'],
    });
  } catch (err) {
    log.error('enviarEmailDesignSystemSolicitacaoRecebida', err);
    return { success: false, error: 'Erro inesperado' };
  }
}

// ─────────────────────────────────────────────────────────────
// DESIGN SYSTEM — Aviso de acesso aprovado (para quem solicitou)
// ─────────────────────────────────────────────────────────────
export async function enviarEmailDesignSystemAcessoAprovado(dados: {
  email: string;
  designSystemUrl: string;
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const html = await render(
      DesignSystemAcessoAprovadoEmail({
        email: dados.email,
        designSystemUrl: dados.designSystemUrl,
      })
    );

    return sendViaResend({
      to: dados.email,
      subject: 'Acesso ao Design System aprovado — Humano Saúde',
      html,
      templateName: 'design_system_acesso_aprovado',
      category: 'design-system',
      tags: ['design-system', 'aprovado'],
    });
  } catch (err) {
    log.error('enviarEmailDesignSystemAcessoAprovado', err);
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
      templateName: 'aguarde_verificacao',
      category: 'onboarding',
      tags: ['onboarding', 'corretor'],
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
      templateName: 'onboarding_concluido_admin',
      category: 'onboarding',
      tags: ['admin', 'onboarding'],
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
      templateName: 'convite_corretor',
      category: 'onboarding',
      tags: ['convite', 'corretor'],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('enviarEmailConviteCorretor', err);
    return { success: false, error: msg || 'Erro inesperado' };
  }
}

// ─────────────────────────────────────────────────────────────
// 10.1 CONFIRMAÇÃO DE E-MAIL (corretor — link único)
// ─────────────────────────────────────────────────────────────
export async function enviarEmailConfirmacaoCorretor(dados: {
  nome: string;
  email: string;
  confirmLink: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const html = `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <p>Olá, <strong>${dados.nome.split(' ')[0]}</strong>!</p>
        <p>Confirme seu e-mail para ativar sua conta no painel do corretor Humano Saúde.</p>
        <p><a href="${dados.confirmLink}" style="display: inline-block; background: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Confirmar e-mail</a></p>
        <p style="color: #666; font-size: 14px;">Se você não solicitou este e-mail, ignore-o. O link expira em 24 horas.</p>
        <p>— Equipe Humano Saúde</p>
      </div>
    `;

    const result = await sendTransactionalEmail({
      to: dados.email,
      subject: 'Confirme seu e-mail — Humano Saúde',
      html,
      templateName: 'corretor_confirmar_email',
      emailType: 'transactional',
      category: 'onboarding',
      tags: ['corretor', 'confirmar_email'],
      triggeredBy: 'system',
    });

    return result.success ? { success: true } : { success: false, error: result.error };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error('enviarEmailConfirmacaoCorretor', err);
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
// 14. CONFIRMAÇÃO LEAD — E-mail para o cliente que cadastrou
// ─────────────────────────────────────────────────────────────
export async function enviarEmailConfirmacaoLeadCliente(dados: {
  nome: string;
  email: string;
  telefone?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return { success: false, error: guard.result.error };

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br').replace(/\/$/, '');
    const params = new URLSearchParams({
      nome: dados.nome,
      email: dados.email,
    });
    if (dados.telefone?.trim()) params.set('telefone', dados.telefone.trim());
    const completarUrl = `${baseUrl}/completar-cotacao?${params.toString()}`;
    const html = await render(
      ConfirmacaoLeadClienteEmail({ nome: dados.nome, email: dados.email, completarUrl })
    );

    const result = await sendViaResend({
      to: dados.email,
      subject: 'Recebemos seu cadastro — Humano Saúde',
      html,
      templateName: 'confirmacao_lead_cliente',
      category: 'leads',
      tags: ['lead', 'confirmacao', 'cliente'],
      triggeredBy: 'system',
      metadata: { lead_email: dados.email },
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (err) {
    log.error('enviarEmailConfirmacaoLeadCliente', err);
    return { success: false, error: 'Erro ao enviar e-mail de confirmação' };
  }
}

// ─────────────────────────────────────────────────────────────
// 14c. CONFIRMAÇÃO SIMULADOR — E-mail para quem pediu cotação por e-mail (tela de resultados do simulador)
// ─────────────────────────────────────────────────────────────
export async function enviarEmailConfirmacaoSimuladorCliente(dados: {
  nome: string;
  email: string;
  telefone?: string;
  cotacoes: Array<{ nome: string; operadora: string; valorTotal: number; coparticipacao?: string; abrangencia?: string; reembolso?: string }>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return { success: false, error: guard.result.error };

    const ConfirmacaoSimuladorClienteEmail = (await import('@/emails/ConfirmacaoSimuladorClienteEmail')).default;
    const html = await render(
      ConfirmacaoSimuladorClienteEmail({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        cotacoes: dados.cotacoes,
      })
    );

    const result = await sendViaResend({
      to: dados.email,
      subject: 'Sua cotação do simulador — Humano Saúde',
      html,
      templateName: 'confirmacao_simulador_cliente',
      category: 'leads',
      tags: ['lead', 'simulador', 'cotacao'],
      triggeredBy: 'system',
      metadata: { lead_email: dados.email },
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (err) {
    log.error('enviarEmailConfirmacaoSimuladorCliente', err);
    return { success: false, error: 'Erro ao enviar e-mail de confirmação do simulador' };
  }
}

// ─────────────────────────────────────────────────────────────
// 14b. DADOS RECEBIDOS (completar cotação) — E-mail simples para quem já preencheu o link do e-mail
// ─────────────────────────────────────────────────────────────
export async function enviarEmailDadosRecebidosCompletarCotacao(dados: {
  nome: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return { success: false, error: guard.result.error };

    const html = await render(
      DadosRecebidosCompletarCotacaoEmail({ nome: dados.nome })
    );

    const result = await sendViaResend({
      to: dados.email,
      subject: 'Dados recebidos — Humano Saúde',
      html,
      templateName: 'dados_recebidos_completar_cotacao',
      category: 'leads',
      tags: ['lead', 'completar-cotacao', 'dados-recebidos'],
      triggeredBy: 'system',
      metadata: { lead_email: dados.email },
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (err) {
    log.error('enviarEmailDadosRecebidosCompletarCotacao', err);
    return { success: false, error: 'Erro ao enviar e-mail de confirmação' };
  }
}

// ─────────────────────────────────────────────────────────────
// 15. NOVO LEAD — Notificação para equipe comercial
// ─────────────────────────────────────────────────────────────
/** Rótulo da página de origem do lead (para exibir no e-mail e assunto) */
function getOrigemPageLabel(origem: string): string {
  const map: Record<string, string> = {
    email_form: 'Completar cotação',
    calculadora: 'Simule seu plano (Landing)',
    calculadora_economia: 'Calculadora Economia',
    hero_form: 'Formulário do topo',
    landing: 'Landing',
    site: 'Site',
    manual: 'Cadastro manual',
    scanner_pdf: 'Scanner Inteligente',
  };
  return map[origem] || origem || 'Landing';
}

export async function enviarEmailNovoLead(dados: {
  nome: string;
  email: string;
  telefone: string;
  cnpj?: string;
  empresa?: string;
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
  /** Top 3 planos (nomes) — ex.: "AMIL S380, SulAmérica..." */
  top3Planos?: string;
  /** Cotações completas geradas pelo simulador (para exibir no e-mail comercial) */
  cotacoesSimulador?: Array<{ nome: string; operadora: string; valorTotal: number; coparticipacao?: string; abrangencia?: string; reembolso?: string }>;
}) {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

    const NovoLeadEmail = (await import('@/emails/NovoLeadEmail')).default;
    const origemLabel = getOrigemPageLabel(dados.origem);

    const html = await render(
      NovoLeadEmail({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        cnpj: dados.cnpj || '—',
        empresa: dados.empresa || '—',
        perfil: dados.perfil || '—',
        intencao: dados.intencao || '—',
        perfilCnpj: dados.perfilCnpj || '—',
        acomodacao: dados.acomodacao || '—',
        bairro: dados.bairro || '—',
        idades: dados.idades || '—',
        qtdVidas: dados.qtdVidas || '—',
        usaBypass: dados.usaBypass || false,
        origem: dados.origem,
        origemLabel,
        parcial: dados.parcial || false,
        dataCriacao: new Date().toISOString(),
        top3Planos: dados.top3Planos,
        cotacoesSimulador: dados.cotacoesSimulador,
      })
    );
    const prefix = dados.parcial ? '⚠️ Lead parcial' : '🔥 Novo lead';

    // Nunca enviar "Novo lead" para o e-mail do lead — só para equipe (ADMIN + CC)
    const leadEmailLower = (dados.email || '').trim().toLowerCase();
    const toList = (leadEmailLower ? ADMIN_EMAILS.filter((e) => e.trim().toLowerCase() !== leadEmailLower) : [...ADMIN_EMAILS])
      .filter((e) => e.trim().toLowerCase() !== leadEmailLower);
    const ccList = (leadEmailLower ? CC_EMAILS.filter((e) => e.trim().toLowerCase() !== leadEmailLower) : [...CC_EMAILS])
      .filter((e) => e.trim().toLowerCase() !== leadEmailLower);

    if (toList.length === 0 && ccList.length === 0) {
      log.warn('enviarEmailNovoLead: nenhum destinatário após excluir o lead; não enviando e-mail de admin');
      return { success: true, id: undefined };
    }

    return sendViaResend({
      to: toList.length > 0 ? toList : ccList,
      cc: toList.length > 0 ? ccList : undefined,
      subject: `${prefix} — ${dados.nome || 'Sem nome'} (${origemLabel})`,
      html,
      templateName: 'novo_lead_admin',
      category: 'leads',
      tags: ['lead', 'admin', dados.origem || 'lead'],
    });
  } catch (err) {
    log.error('enviarEmailNovoLead', err);
    return { success: false, error: 'Erro ao enviar email de novo lead' };
  }
}

// ─────────────────────────────────────────────────────────────
// 16. ACESSO PORTAL CLIENTE — Envio de credenciais
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
    const guard = guardApiKey();
    if (!guard.ok) return guard.result;

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

    const result = await sendViaResend({
      to: dados.email,
      subject: 'Seus dados de acesso — Portal Humano Saúde',
      html,
      templateName: 'portal_cliente_acesso',
      category: 'portal-cliente',
      tags: ['portal-cliente', 'acesso'],
      triggeredBy: 'system',
      metadata: {
        portal_link: dados.portalLink,
        resumo: dados.resumo || null,
      },
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (err) {
    log.error('enviarEmailAcessoPortalCliente', err);
    return { success: false, error: 'Erro ao enviar email de acesso' };
  }
}

// ─────────────────────────────────────────────────────────────
// 14. AFILIADO — Acesso ao painel (cadastro concluído)
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAfiliadoAcessoPainel(dados: {
  to: string;
  nomeAfiliado: string;
  /** Senha temporária (ex.: cadastro sem vínculo). Se não informada, orienta a usar "Esqueci minha senha". */
  senhaTemporaria?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return { success: false, error: guard.result.error };

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br').replace(/\/$/, '');
    const linkLogin = `${baseUrl}/dashboard/afiliado/login`;

    const blocoSenha = dados.senhaTemporaria
      ? `
        <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:20px;margin:24px 0;">
          <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 12px 0;">Seus dados de acesso</p>
          <p style="font-size:15px;color:#374151;margin:0 0 8px 0;line-height:1.5;"><strong>E-mail:</strong> <a href="mailto:${escapeHtml(dados.to)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(dados.to)}</a></p>
          <p style="font-size:15px;color:#374151;margin:0;line-height:1.5;"><strong>Senha temporária:</strong> <span style="background:#E5E7EB;padding:6px 12px;border-radius:6px;font-family:monospace;font-size:15px;">${escapeHtml(dados.senhaTemporaria)}</span></p>
        </div>
        <p style="font-size:14px;color:#6B7280;margin:0 0 24px 0;line-height:1.5;">Recomendamos alterar a senha após o primeiro acesso (no painel).</p>
      `
      : `
        <p style="font-size:15px;color:#374151;margin:0 0 16px 0;line-height:1.6;">Na primeira vez, use <strong>Esqueci minha senha</strong> na tela de login (com este e-mail) para definir sua senha e entrar.</p>
        <p style="font-size:15px;color:#374151;margin:0 0 24px 0;line-height:1.6;">Depois você pode alterar sua senha quando quiser, dentro do painel.</p>
      `;

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 20px;font-size:16px;color:#111827;">
        <div style="text-align:center;margin-bottom:28px;">
          <h1 style="color:#D4AF37;font-size:24px;font-weight:700;margin:0;">Humano Saúde</h1>
        </div>
        <p style="font-size:16px;color:#374151;margin:0 0 20px 0;line-height:1.6;">Olá, <strong>${escapeHtml(dados.nomeAfiliado)}</strong>,</p>
        <p style="font-size:15px;color:#374151;margin:0 0 24px 0;line-height:1.6;">Sua conta de afiliado foi criada. Use o link abaixo para acessar o painel e acompanhar suas indicações.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${linkLogin}" style="display:inline-block;background:#D4AF37;color:#000;font-weight:700;font-size:16px;padding:16px 32px;text-decoration:none;border-radius:10px;">Acessar painel do afiliado</a>
        </div>
        ${blocoSenha}
        <p style="font-size:15px;color:#6B7280;margin:28px 0 0 0;line-height:1.5;">— Equipe Humano Saúde</p>
      </div>
    `;

    const result = await sendViaResend({
      to: dados.to,
      subject: 'Acesso ao painel do afiliado — Humano Saúde',
      html,
      templateName: 'afiliado_acesso_painel',
      category: 'afiliado',
      tags: ['afiliado', 'acesso', 'cadastro'],
      triggeredBy: 'system',
      metadata: {},
    });

    if (!result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (err) {
    log.error('enviarEmailAfiliadoAcessoPainel', err);
    return { success: false, error: 'Erro ao enviar e-mail' };
  }
}

// ─────────────────────────────────────────────────────────────
// 14b. ADMIN — Novo afiliado cadastrado
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAdminNovoAfiliado(dados: {
  nome: string;
  email: string;
  telefone: string;
  nomeCorretor?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return { success: false, error: guard.result.error };

    const corretorLabel = dados.nomeCorretor ? ` (corretor: ${escapeHtml(dados.nomeCorretor)})` : '';

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <p>Novo afiliado cadastrado${corretorLabel}:</p>
        <ul>
          <li><strong>Nome:</strong> ${escapeHtml(dados.nome)}</li>
          <li><strong>E-mail:</strong> ${escapeHtml(dados.email)}</li>
          <li><strong>Telefone:</strong> ${escapeHtml(dados.telefone)}</li>
        </ul>
        <p>— Sistema Humano Saúde</p>
      </div>
    `;

    const result = await sendViaResend({
      to: ADMIN_EMAILS,
      subject: `Novo afiliado cadastrado — ${dados.nome}`,
      html,
      templateName: 'admin_novo_afiliado',
      category: 'admin',
      tags: ['admin', 'afiliado', 'cadastro'],
      triggeredBy: 'system',
      metadata: { afiliado_nome: dados.nome },
    });

    if (!result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (err) {
    log.error('enviarEmailAdminNovoAfiliado', err);
    return { success: false, error: 'Erro ao enviar e-mail' };
  }
}

// ─────────────────────────────────────────────────────────────
// 14b2. ADMIN — Novo lead "quero ser afiliado" (sem vínculo)
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAdminLeadSejaAfiliado(dados: {
  nome: string;
  email: string;
  telefone: string;
  cpf?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return { success: false, error: guard.result.error };

    const cpfLine = dados.cpf ? `<li><strong>CPF:</strong> ${escapeHtml(dados.cpf)}</li>` : '';

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <p><strong>Novo interesse em ser afiliado</strong> (cadastro sem vínculo com corretor):</p>
        <ul>
          <li><strong>Nome:</strong> ${escapeHtml(dados.nome)}</li>
          <li><strong>E-mail:</strong> ${escapeHtml(dados.email)}</li>
          <li><strong>Telefone:</strong> ${escapeHtml(dados.telefone)}</li>
          ${cpfLine}
        </ul>
        <p>Lead disponível no portal interno. Após contato, você pode liberar acesso ao painel do afiliado.</p>
        <p>— Sistema Humano Saúde</p>
      </div>
    `;

    const result = await sendViaResend({
      to: ADMIN_EMAILS,
      subject: `Novo interesse em ser afiliado — ${dados.nome}`,
      html,
      templateName: 'admin_lead_seja_afiliado',
      category: 'admin',
      tags: ['admin', 'afiliado', 'lead'],
      triggeredBy: 'system',
      metadata: { afiliado_nome: dados.nome },
    });

    if (!result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (err) {
    log.error('enviarEmailAdminLeadSejaAfiliado', err);
    return { success: false, error: 'Erro ao enviar e-mail' };
  }
}

// ─────────────────────────────────────────────────────────────
// 14c. AFILIADO — Confirmação de interesse (cadastro sem vínculo com corretor)
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAfiliadoInteresseRecebido(dados: {
  to: string;
  nome: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return { success: false, error: guard.result.error };

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <p>Olá, <strong>${escapeHtml(dados.nome)}</strong>,</p>
        <p>Recebemos seu interesse em participar do programa de afiliados da <strong>Humano Saúde</strong>.</p>
        <p>Nossa equipe vai analisar seus dados e entrar em contato em breve para dar os próximos passos.</p>
        <p>Se você também enviou uma indicação, ela foi recebida e a pessoa indicada será contactada pela nossa equipe.</p>
        <p>— Equipe Humano Saúde</p>
      </div>
    `;

    const result = await sendViaResend({
      to: dados.to,
      subject: 'Recebemos seu interesse em ser afiliado — Humano Saúde',
      html,
      templateName: 'afiliado_interesse_recebido',
      category: 'afiliado',
      tags: ['afiliado', 'interesse', 'cadastro'],
      triggeredBy: 'system',
      metadata: {},
    });

    if (!result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (err) {
    log.error('enviarEmailAfiliadoInteresseRecebido', err);
    return { success: false, error: 'Erro ao enviar e-mail' };
  }
}

// ─────────────────────────────────────────────────────────────
// 15. AFILIADO — Mudança de status do lead indicado
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAfiliadoStatusLead(dados: {
  to: string;
  nomeAfiliado: string;
  nomeLead: string;
  novoStatus: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return { success: false, error: guard.result.error };

    const statusLabel: Record<string, string> = {
      simulou: 'Simulou',
      entrou_em_contato: 'Entrou em contato',
      em_analise: 'Em análise',
      proposta_enviada: 'Proposta enviada',
      fechado: 'Venda fechada',
      perdido: 'Não fechou',
    };
    const label = statusLabel[dados.novoStatus] || dados.novoStatus;

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <p>Olá, <strong>${escapeHtml(dados.nomeAfiliado)}</strong>,</p>
        <p>O status da sua indicação <strong>${escapeHtml(dados.nomeLead)}</strong> foi atualizado para: <strong>${escapeHtml(label)}</strong>.</p>
        <p>Acesse seu painel para acompanhar: <a href="${(process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br').replace(/\/$/, '')}/dashboard/afiliado">Painel do Afiliado</a>.</p>
        <p>— Equipe Humano Saúde</p>
      </div>
    `;

    const result = await sendViaResend({
      to: dados.to,
      subject: `Indicação: ${label} — ${dados.nomeLead}`,
      html,
      templateName: 'afiliado_status_lead',
      category: 'afiliado',
      tags: ['afiliado', 'indicacao', 'status'],
      triggeredBy: 'system',
      metadata: { lead_status: dados.novoStatus },
    });

    if (!result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (err) {
    log.error('enviarEmailAfiliadoStatusLead', err);
    return { success: false, error: 'Erro ao enviar e-mail' };
  }
}

// ─────────────────────────────────────────────────────────────
// 16. AFILIADO — E-mail na venda (valor, prazo, forma de pagamento)
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAfiliadoVenda(dados: {
  to: string;
  nomeAfiliado: string;
  nomeLead: string;
  valor?: string;
  prazo?: string;
  formaPagamento?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return { success: false, error: guard.result.error };

    const valor = dados.valor || 'A combinar';
    const prazo = dados.prazo || 'Conforme política';
    const forma = dados.formaPagamento || 'Conforme cadastro';

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <p>Olá, <strong>${escapeHtml(dados.nomeAfiliado)}</strong>,</p>
        <p>Ótima notícia: a indicação <strong>${escapeHtml(dados.nomeLead)}</strong> foi fechada!</p>
        <p><strong>Valor a receber:</strong> ${escapeHtml(valor)}</p>
        <p><strong>Prazo:</strong> ${escapeHtml(prazo)}</p>
        <p><strong>Forma de pagamento:</strong> ${escapeHtml(forma)}</p>
        <p>Acesse seu painel: <a href="${(process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br').replace(/\/$/, '')}/dashboard/afiliado">Painel do Afiliado</a>.</p>
        <p>— Equipe Humano Saúde</p>
      </div>
    `;

    const result = await sendViaResend({
      to: dados.to,
      subject: `Venda fechada — ${dados.nomeLead} | Comissão`,
      html,
      templateName: 'afiliado_venda',
      category: 'afiliado',
      tags: ['afiliado', 'venda', 'comissao'],
      triggeredBy: 'system',
      metadata: { lead_nome: dados.nomeLead },
    });

    if (!result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (err) {
    log.error('enviarEmailAfiliadoVenda', err);
    return { success: false, error: 'Erro ao enviar e-mail' };
  }
}

// ─────────────────────────────────────────────────────────────
// 17. AFILIADO — Confirmação de que a indicação foi recebida
// ─────────────────────────────────────────────────────────────
export async function enviarEmailAfiliadoIndicacaoRecebida(dados: {
  to: string;
  nomeAfiliado: string;
  nomeIndicado: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return { success: false, error: guard.result.error };

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <p>Olá, <strong>${escapeHtml(dados.nomeAfiliado)}</strong>,</p>
        <p>Sua indicação de <strong>${escapeHtml(dados.nomeIndicado)}</strong> foi recebida com sucesso.</p>
        <p>O corretor foi notificado e entrará em contato com a pessoa indicada. Você pode acompanhar o status no seu painel.</p>
        <p><a href="${(process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br').replace(/\/$/, '')}/dashboard/afiliado" style="display:inline-block;background:#D4AF37;color:#000;font-weight:700;padding:12px 24px;text-decoration:none;border-radius:8px;">Acessar painel do afiliado</a></p>
        <p>— Equipe Humano Saúde</p>
      </div>
    `;

    const result = await sendViaResend({
      to: dados.to,
      subject: `Indicação recebida — ${dados.nomeIndicado}`,
      html,
      templateName: 'afiliado_indicacao_recebida',
      category: 'afiliado',
      tags: ['afiliado', 'indicacao'],
      triggeredBy: 'system',
      metadata: { nome_indicado: dados.nomeIndicado },
    });

    if (!result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (err) {
    log.error('enviarEmailAfiliadoIndicacaoRecebida', err);
    return { success: false, error: 'Erro ao enviar e-mail' };
  }
}

// ─────────────────────────────────────────────────────────────
// 18. CORRETOR — Novo lead indicado pelo afiliado
// ─────────────────────────────────────────────────────────────
export async function enviarEmailCorretorNovoLeadAfiliado(dados: {
  to: string;
  nomeCorretor: string;
  nomeAfiliado: string;
  nomeLead: string;
  telefoneLead: string;
  emailLead?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guard = guardApiKey();
    if (!guard.ok) return { success: false, error: guard.result.error };

    const contato = [dados.telefoneLead, dados.emailLead].filter(Boolean).join(' · ') || 'Não informado';

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <p>Olá, <strong>${escapeHtml(dados.nomeCorretor)}</strong>,</p>
        <p>Seu afiliado <strong>${escapeHtml(dados.nomeAfiliado)}</strong> indicou um novo lead:</p>
        <p><strong>Nome:</strong> ${escapeHtml(dados.nomeLead)}<br/>
        <strong>Contato:</strong> ${escapeHtml(contato)}</p>
        <p>O lead já está no seu painel de Leads e no CRM para você dar sequência.</p>
        <p><a href="${(process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br').replace(/\/$/, '')}/dashboard/corretor/crm/leads" style="display:inline-block;background:#D4AF37;color:#000;font-weight:700;padding:12px 24px;text-decoration:none;border-radius:8px;">Ver meus leads</a></p>
        <p>— Equipe Humano Saúde</p>
      </div>
    `;

    const result = await sendViaResend({
      to: dados.to,
      subject: `Novo lead indicado por ${dados.nomeAfiliado} — ${dados.nomeLead}`,
      html,
      templateName: 'corretor_novo_lead_afiliado',
      category: 'corretor',
      tags: ['corretor', 'lead', 'afiliado'],
      triggeredBy: 'system',
      metadata: { nome_lead: dados.nomeLead, nome_afiliado: dados.nomeAfiliado },
    });

    if (!result.success) return { success: false, error: result.error };
    return { success: true };
  } catch (err) {
    log.error('enviarEmailCorretorNovoLeadAfiliado', err);
    return { success: false, error: 'Erro ao enviar e-mail' };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
