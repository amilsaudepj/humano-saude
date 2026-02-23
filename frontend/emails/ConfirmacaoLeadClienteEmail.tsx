// ─── React Email — Confirmação de recebimento do cadastro para o cliente ─────
// Enviado ao e-mail do lead quando ele envia o formulário (hero ou calculadora).

import { Heading, Text, Section, Hr, Link, Img } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

// Ícone em data URI para carregar sem depender de imagem externa (evita bloqueio no iPhone/outros clientes)
const WHATSAPP_ICON_DATA_URI =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFFFFF"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
  );

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

      <Section style={buttonWrap}>
        <Link href={completarUrl} style={primaryButton} className="email-cta-whatsapp">
          <Img src={WHATSAPP_ICON_DATA_URI} width="22" height="22" alt="" style={ctaIcon} />
          <span style={primaryButtonText} className="email-cta-text">Falar com especialista</span>
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
const buttonWrap: React.CSSProperties = { textAlign: 'center' as const, margin: '24px 0' };
const primaryButton: React.CSSProperties = {
  backgroundColor: '#25D366',
  borderRadius: '8px',
  color: '#FFFFFF',
  fontSize: '15px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 28px',
  display: 'inline-block',
};
const ctaIcon: React.CSSProperties = {
  display: 'inline-block',
  verticalAlign: 'middle',
  marginRight: '8px',
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
