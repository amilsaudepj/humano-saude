// E-mail ao admin quando alguém solicita acesso à página /links (com link para aprovar em 1 clique)
import { Heading, Text, Section, Button } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface LinksSolicitacaoAdminEmailProps {
  emailSolicitante: string;
  mensagem?: string;
  approveLink: string;
}

export default function LinksSolicitacaoAdminEmail({
  emailSolicitante = 'usuario@exemplo.com',
  mensagem,
  approveLink = 'https://humanosaude.com.br/api/links/approve-from-email?email=xxx&token=xxx',
}: LinksSolicitacaoAdminEmailProps) {
  return (
    <EmailLayout preview={`Solicitação de acesso à página de links — ${emailSolicitante}`}>
      <Heading style={heading}>Nova solicitação de acesso à página de links</Heading>
      <Text style={paragraph}>
        <strong>{emailSolicitante}</strong> solicitou acesso à página de <strong>links oficiais</strong> (vendas, acessos e indicações).
      </Text>
      {mensagem ? (
        <Section style={infoBox}>
          <Text style={infoLabel}>Mensagem do solicitante:</Text>
          <Text style={infoText}>{mensagem}</Text>
        </Section>
      ) : null}
      <Section style={buttonSection}>
        <Button style={button} href={approveLink}>
          Aprovar acesso
        </Button>
      </Section>
      <Text style={small}>
        Ao clicar, o e-mail será autorizado a acessar a página /links. Você também pode gerenciar em Configurações → Acesso à página /links.
      </Text>
    </EmailLayout>
  );
}

const heading: React.CSSProperties = { fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 16px 0' };
const paragraph: React.CSSProperties = { fontSize: '15px', color: '#374151', lineHeight: 1.5, margin: '0 0 24px 0' };
const infoBox: React.CSSProperties = { backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', margin: '20px 0' };
const infoLabel: React.CSSProperties = { fontSize: '12px', color: '#6b7280', margin: '0 0 8px 0', textTransform: 'uppercase' as const, letterSpacing: '0.5px' };
const infoText: React.CSSProperties = { fontSize: '14px', color: '#374151', margin: 0, lineHeight: 1.6 };
const buttonSection: React.CSSProperties = { textAlign: 'center' as const, margin: '24px 0' };
const button: React.CSSProperties = { backgroundColor: '#B8941F', color: '#ffffff', padding: '14px 28px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', textDecoration: 'none' };
const small: React.CSSProperties = { fontSize: '12px', color: '#6b7280', lineHeight: 1.5, margin: '0' };
