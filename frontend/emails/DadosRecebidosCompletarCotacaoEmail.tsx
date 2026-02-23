// ─── E-mail enviado ao cliente após preencher "Completar cotação" (link do e-mail)
// Mensagem simples: dados recebidos; em breve receberá a cotação com redução para o CNPJ.

import { Heading, Text, Section, Hr, Link } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface DadosRecebidosCompletarCotacaoEmailProps {
  nome: string;
}

export default function DadosRecebidosCompletarCotacaoEmail({
  nome = 'Cliente',
}: DadosRecebidosCompletarCotacaoEmailProps) {
  const firstName = nome.split(' ')[0];

  return (
    <EmailLayout preview={`Dados recebidos, ${firstName}!`} showSpamWarning>
      <div style={iconWrapper}>
        <Text style={iconText}>✓</Text>
      </div>

      <Heading style={heading}>Dados recebidos com sucesso!</Heading>

      <Text style={paragraph}>
        Olá, <strong>{firstName}</strong>!
      </Text>

      <Text style={paragraph}>
        Confirmamos o recebimento das informações que você enviou. Nossa equipe está
        preparando sua cotação com foco na <strong style={{ color: '#B8941F' }}>redução de custo para o CNPJ</strong>.
      </Text>

      <Text style={paragraph}>
        Em breve você receberá sua proposta personalizada por e-mail ou WhatsApp.
      </Text>

      <Hr style={hr} />

      <Text style={footerText}>
        Dúvidas? Escreva para{' '}
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
  margin: '0 0 16px 0',
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
