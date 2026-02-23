// E-mail ao admin quando alguém solicita acesso ao Design System (com link para aprovar em 1 clique)
import { Heading, Text, Section, Button } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface DesignSystemSolicitacaoAdminEmailProps {
  emailSolicitante: string;
  approveLink: string;
}

export default function DesignSystemSolicitacaoAdminEmail({
  emailSolicitante = 'usuario@exemplo.com',
  approveLink = 'https://humanosaude.com.br/api/design-system/approve-from-email?request=id&token=xxx',
}: DesignSystemSolicitacaoAdminEmailProps) {
  return (
    <EmailLayout preview={`Solicitação de acesso ao Design System — ${emailSolicitante}`}>
      <Heading style={heading}>Nova solicitação de acesso</Heading>
      <Text style={paragraph}>
        <strong>{emailSolicitante}</strong> solicitou acesso à página <strong>Design System</strong> (identidade visual).
      </Text>
      <Section style={buttonSection}>
        <Button style={button} href={approveLink}>
          Aprovar acesso
        </Button>
      </Section>
      <Text style={small}>
        Ao clicar, o e-mail será adicionado à lista de aprovados e poderá acessar o conteúdo. Você também pode gerenciar em Operações → E-mails Design System.
      </Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#111827',
  margin: '0 0 16px 0',
};

const paragraph: React.CSSProperties = {
  fontSize: '15px',
  color: '#374151',
  lineHeight: 1.5,
  margin: '0 0 24px 0',
};

const buttonSection: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button: React.CSSProperties = {
  backgroundColor: '#B8941F',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '10px',
  fontSize: '15px',
  fontWeight: '700',
  textDecoration: 'none',
};

const small: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  lineHeight: 1.5,
  margin: '0',
};
