import { Heading, Text, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface DesignSystemSolicitacaoRecebidaEmailProps {
  email: string;
}

export default function DesignSystemSolicitacaoRecebidaEmail({
  email = 'usuario@exemplo.com',
}: DesignSystemSolicitacaoRecebidaEmailProps) {
  return (
    <EmailLayout preview="Solicitação de acesso ao Design System recebida">
      <Heading style={heading}>Solicitação recebida</Heading>
      <Text style={paragraph}>
        Sua solicitação de acesso à página <strong>Design System</strong> (identidade visual da Humano Saúde) foi registrada com sucesso.
      </Text>
      <Section style={infoBox}>
        <Text style={infoText}>
          Nossa equipe irá analisar e você receberá um <strong>novo e-mail</strong> assim que seu acesso for aprovado. A partir daí você poderá acessar o material completo.
        </Text>
      </Section>
      <Text style={small}>
        E-mail da solicitação: <strong>{email}</strong>
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
  backgroundColor: '#F9FAFB',
  border: '1px solid #E5E7EB',
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

const small: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0',
};
