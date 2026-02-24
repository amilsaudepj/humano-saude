// ─── React Email — Confirmação de recebimento do cadastro para o cliente ─────
// Enviado ao e-mail do lead quando ele envia o formulário (hero ou calculadora).

import { Heading, Text, Section, Hr, Link } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface ConfirmacaoLeadClienteEmailProps {
  nome: string;
  email: string;
  /** URL completa da página de completar cotação (montada no servidor) */
  completarUrl: string;
}

export default function ConfirmacaoLeadClienteEmail({
  nome = 'Cliente',
  email = '',
  completarUrl,
}: ConfirmacaoLeadClienteEmailProps) {
  const firstName = nome.split(' ')[0];

  return (
    <EmailLayout preview={`Recebemos seu cadastro, ${firstName}!`} showSpamWarning>
      <div style={iconWrapper}>
        <Text style={iconText}>✓</Text>
      </div>

      <Heading style={heading}>Recebemos seu cadastro, {firstName}!</Heading>

      <Text style={paragraph}>
        Obrigado por se cadastrar na{' '}
        <strong style={{ color: '#B8941F' }}>Humano Saúde</strong>. Sua solicitação foi
        recebida. Nossa equipe entrará em contato em breve para pedir algumas informações
        e gerar sua proposta personalizada.
      </Text>

      <Section style={infoBox}>
        <Text style={infoTitle}>O que acontece agora?</Text>
        <Text style={infoItem}>• Entraremos em contato por e-mail ou WhatsApp</Text>
        <Text style={infoItem}>• Pediremos algumas informações para personalizar sua análise:</Text>
        <Text style={infoSubItem}>– Quais idades vão entrar no plano</Text>
        <Text style={infoSubItem}>– Qual bairro de atendimento</Text>
        <Text style={infoSubItem}>– Se já possui plano de saúde ativo e, se sim, qual</Text>
        <Text style={infoItem}>• Geraremos sua proposta personalizada em até 10 minutos</Text>
      </Section>

      <Text style={ctaTitle}>Quer acelerar sua redução? Clique no botão abaixo.</Text>

      <Section style={buttonWrap}>
        <Link href={completarUrl} style={primaryButton} className="email-cta-whatsapp">
          <span style={primaryButtonText} className="email-cta-text">Realizar redução agora →</span>
        </Link>
      </Section>

      <Hr style={hr} />

      <Text style={footerText}>
        Dúvidas? Responda este e-mail ou escreva para{' '}
        <Link href="mailto:comercial@humanosaude.com.br" style={goldLink}>
          comercial@humanosaude.com.br
        </Link>
      </Text>
    </EmailLayout>
  );
}

const iconWrapper: React.CSSProperties = { textAlign: 'center' as const, marginBottom: '8px' };
const iconText: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#B8941F',
  lineHeight: '1',
  margin: 0,
};
const heading: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#111827',
  textAlign: 'center' as const,
  margin: '0 0 16px 0',
};
const paragraph: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 20px 0',
};
const infoBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  padding: '20px',
  margin: '20px 0',
};
const infoTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#B8941F',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};
const infoItem: React.CSSProperties = {
  fontSize: '14px',
  color: '#374151',
  margin: '0 0 6px 0',
  lineHeight: '1.5',
};
const infoSubItem: React.CSSProperties = {
  fontSize: '13px',
  color: '#6B7280',
  margin: '0 0 4px 0',
  lineHeight: '1.5',
  paddingLeft: '12px',
};
const ctaTitle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#111827',
  textAlign: 'center' as const,
  margin: '0 0 12px 0',
  lineHeight: '1.5',
};
const buttonWrap: React.CSSProperties = { textAlign: 'center' as const, margin: '24px 0' };
const primaryButton: React.CSSProperties = {
  backgroundColor: '#B8941F',
  borderRadius: '8px',
  color: '#FFFFFF',
  fontSize: '15px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
  display: 'inline-block',
};
const primaryButtonText: React.CSSProperties = {
  color: '#FFFFFF',
  margin: 0,
  verticalAlign: 'middle',
  WebkitTextFillColor: '#FFFFFF',
};
const hr: React.CSSProperties = { borderColor: '#E5E7EB', margin: '24px 0' };
const footerText: React.CSSProperties = {
  fontSize: '12px',
  color: '#9CA3AF',
  margin: 0,
  textAlign: 'center' as const,
  lineHeight: '1.5',
};
const goldLink: React.CSSProperties = { color: '#B8941F', textDecoration: 'none' };
