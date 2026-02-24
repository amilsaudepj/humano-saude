// ─── React Email — Confirmação de cotação do simulador (enviado automaticamente) ─────
// Enviado ao cliente assim que os resultados do simulador são gerados (sem precisar clicar em botão).

import { Heading, Text, Section, Hr, Link } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

export interface CotacaoItem {
  nome: string;
  operadora: string;
  valorTotal: number;
  coparticipacao?: string;
  abrangencia?: string;
  reembolso?: string;
}

interface ConfirmacaoSimuladorClienteEmailProps {
  nome: string;
  email: string;
  telefone?: string;
  /** Cotações geradas pelo simulador (top 3 ou mais) */
  cotacoes: CotacaoItem[];
}

function formatValor(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

export default function ConfirmacaoSimuladorClienteEmail({
  nome = 'Cliente',
  email = '',
  cotacoes = [],
}: ConfirmacaoSimuladorClienteEmailProps) {
  const firstName = nome.split(' ')[0];
  const whatsappUrl = 'https://wa.me/5521988179407?text=' + encodeURIComponent(
    'Olá! Recebi a cotação do simulador e gostaria de falar com um especialista.'
  );

  return (
    <EmailLayout preview={`Sua cotação do simulador, ${firstName}!`} showSpamWarning>
      <div style={iconWrapper}>
        <Text style={iconText}>✓</Text>
      </div>

      <Heading style={heading}>Sua cotação foi enviada, {firstName}!</Heading>

      <Text style={paragraph}>
        Seguem os <strong style={{ color: '#B8941F' }}>planos que simulamos</strong> para sua empresa.
        Nossa equipe pode esclarecer dúvidas e fechar a melhor opção para você.
      </Text>
      <Text style={paragraph}>
        <strong>Em breve um de nossos especialistas irá entrar em contato.</strong>
      </Text>

      {cotacoes.length > 0 && (
        <Section style={planosBox}>
          <Text style={planosTitle}>Planos simulados</Text>
          {cotacoes.map((plano, i) => (
            <div key={i} style={planoCard}>
              <div style={planoHeader}>
                <Text style={planoNome}>{i === 0 ? '★ ' : ''}{plano.nome} — </Text>
                <Text style={planoValor}>{formatValor(plano.valorTotal)}/mês</Text>
              </div>
              <Text style={planoOperadora}>{plano.operadora}</Text>
              {(plano.abrangencia || plano.coparticipacao || plano.reembolso) && (
                <Text style={planoDetalhes}>
                  {[plano.abrangencia, plano.coparticipacao, plano.reembolso].filter(Boolean).join(' · ')}
                </Text>
              )}
            </div>
          ))}
        </Section>
      )}

      <Text style={ctaTitle}>Quer fechar ou tirar dúvidas? Fale com nosso especialista.</Text>

      <Section style={buttonWrap}>
        <Link href={whatsappUrl} style={primaryButton} className="email-cta-whatsapp">
          <span style={primaryButtonText} className="email-cta-text">Falar com especialista no WhatsApp →</span>
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
const planosBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  padding: '20px',
  margin: '20px 0',
};
const planosTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#B8941F',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};
const planoCard: React.CSSProperties = {
  backgroundColor: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '10px',
};
const planoHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px',
};
const planoNome: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: '700',
  color: '#111827',
  margin: 0,
};
const planoValor: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: '700',
  color: '#B8941F',
  margin: 0,
};
const planoOperadora: React.CSSProperties = {
  fontSize: '13px',
  color: '#6B7280',
  margin: '4px 0 0 0',
};
const planoDetalhes: React.CSSProperties = {
  fontSize: '12px',
  color: '#9CA3AF',
  margin: '4px 0 0 0',
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
