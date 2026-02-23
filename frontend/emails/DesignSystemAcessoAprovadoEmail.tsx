// E-mail para quem solicitou acesso — aviso de que o acesso foi aprovado
import { Heading, Text, Section, Button } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface DesignSystemAcessoAprovadoEmailProps {
  email: string;
  designSystemUrl: string;
}

export default function DesignSystemAcessoAprovadoEmail({
  email = 'usuario@exemplo.com',
  designSystemUrl = 'https://humanosaude.com.br/design-system',
}: DesignSystemAcessoAprovadoEmailProps) {
  return (
    <EmailLayout preview="Acesso ao Design System aprovado">
      <Heading style={heading}>Acesso aprovado</Heading>
      <Text style={paragraph}>
        Seu acesso à página <strong>Design System</strong> (identidade visual da Humano Saúde) foi aprovado.
      </Text>
      <Section style={infoBox}>
        <Text style={infoText}>
          A partir de agora você pode acessar o material completo: paleta de cores, logos, tipografia e PDFs. Use o botão abaixo e informe o e-mail <strong>{email}</strong> para entrar.
        </Text>
      </Section>
      <Section style={buttonSection}>
        <Button style={button} href={designSystemUrl}>
          Acessar Design System
        </Button>
      </Section>
      <Text style={small}>
        Se o botão não funcionar, copie e cole no navegador: {designSystemUrl}
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
  margin: '0 0 20px 0',
};

const infoBox: React.CSSProperties = {
  backgroundColor: '#F0FDF4',
  border: '1px solid #BBF7D0',
  borderRadius: '12px',
  padding: '20px',
  margin: '20px 0',
};

const infoText: React.CSSProperties = {
  fontSize: '14px',
  color: '#374151',
  margin: 0,
  lineHeight: 1.6,
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
  margin: '0',
};
