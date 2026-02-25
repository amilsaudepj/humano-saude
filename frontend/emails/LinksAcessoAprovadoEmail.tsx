import { Heading, Text, Section, Button } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface LinksAcessoAprovadoEmailProps {
  email: string;
  linksUrl: string;
}

export default function LinksAcessoAprovadoEmail({
  email = 'usuario@exemplo.com',
  linksUrl = 'https://humanosaude.com.br/links',
}: LinksAcessoAprovadoEmailProps) {
  return (
    <EmailLayout preview="Acesso à página de links aprovado">
      <Heading style={heading}>Acesso aprovado</Heading>
      <Text style={paragraph}>
        Sua solicitação de acesso à página de links da Humano Saúde foi <strong>aprovada</strong>.
      </Text>
      <Section style={buttonSection}>
        <Button style={button} href={linksUrl}>
          Acessar página de links
        </Button>
      </Section>
      <Text style={small}>
        Use o e-mail <strong>{email}</strong> na tela de acesso ou guarde este link para entrar quando quiser.
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
