// ─── React Email — Notificação Admin (Novo Corretor) ─────────
// Enviado ao admin quando um novo corretor solicita cadastro.

import { Heading, Text, Section, Hr, Button, Row, Column } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface NotificacaoAdminEmailProps {
  nome: string;
  email: string;
  telefone: string;
  tipoPessoa: 'pf' | 'pj';
  documento?: string;
  experienciaAnos?: number;
  comoConheceu?: string;
  motivacoes?: string;
  modalidade?: string;
  /** Link para aprovar o cadastro em 1 clique (mesma lógica do design system). Se informado, o botão principal será "Aprovar cadastro". */
  approveLink?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://humanosaude.com.br';

export default function NotificacaoAdminEmail({
  nome = 'Corretor Exemplo',
  email = 'corretor@email.com',
  telefone = '(21) 99999-9999',
  tipoPessoa = 'pf',
  documento = '—',
  experienciaAnos = 0,
  comoConheceu = '—',
  motivacoes = '—',
  modalidade = 'digital',
  approveLink,
}: NotificacaoAdminEmailProps) {
  const tipoBadge = tipoPessoa === 'pj'
    ? { label: 'PESSOA JURÍDICA', bg: '#DBEAFE', color: '#1D4ED8' }
    : { label: 'PESSOA FÍSICA', bg: '#F3E8FF', color: '#7C3AED' };

  return (
    <EmailLayout preview={`Novo Corretor — ${nome} (${tipoPessoa.toUpperCase()})`}>
      <div style={iconWrapper}>
        <Text style={iconText}>🆕</Text>
      </div>

      <Heading style={heading}>Nova solicitação de cadastro</Heading>

      <Section style={detailsBox}>
        <Row style={detailRow}>
          <Column style={labelCol}>Nome</Column>
          <Column style={valueColBold}>{nome}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Tipo</Column>
          <Column style={valueCol}>
            <span style={{ backgroundColor: tipoBadge.bg, color: tipoBadge.color, padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
              {tipoBadge.label}
            </span>
          </Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>E-mail</Column>
          <Column style={valueColGold}>{email}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Telefone</Column>
          <Column style={valueCol}>{telefone}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Documento</Column>
          <Column style={valueCol}>{documento}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Experiência</Column>
          <Column style={valueCol}>{experienciaAnos} anos</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Motivações</Column>
          <Column style={valueCol}>{motivacoes}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Modalidade</Column>
          <Column style={valueCol}>{modalidade}</Column>
        </Row>
        <Row style={{ padding: '8px 0' }}>
          <Column style={labelCol}>Como conheceu</Column>
          <Column style={valueCol}>{comoConheceu}</Column>
        </Row>
      </Section>

      <Section style={buttonWrap}>
        {approveLink ? (
          <>
            <Button style={primaryButton} href={approveLink}>
              Aprovar cadastro
            </Button>
            <Button style={secondaryButton} href={`${BASE_URL}/portal-interno-hks-2026/corretores`}>
              Ver no portal
            </Button>
          </>
        ) : (
          <Button style={primaryButton} href={`${BASE_URL}/portal-interno-hks-2026/corretores`}>
            Analisar Solicitação →
          </Button>
        )}
      </Section>
      {approveLink ? (
        <Text style={small}>
          Ao clicar em &quot;Aprovar cadastro&quot;, o corretor será criado e receberá o e-mail de boas-vindas com link de onboarding.
        </Text>
      ) : null}

      <Hr style={hr} />
    </EmailLayout>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const iconWrapper: React.CSSProperties = { textAlign: 'center' as const, marginBottom: '8px' };
const iconText: React.CSSProperties = { fontSize: '48px', lineHeight: '1', margin: 0 };
const heading: React.CSSProperties = {
  fontSize: '24px', fontWeight: '700', color: '#111827',
  textAlign: 'center' as const, margin: '0 0 20px 0',
};
const detailsBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
  borderRadius: '12px', padding: '20px', margin: '16px 0',
};
const detailRow: React.CSSProperties = { borderBottom: '1px solid #F3F4F6', padding: '8px 0' };
const labelCol: React.CSSProperties = {
  fontSize: '12px', color: '#6B7280', fontWeight: '600', width: '120px', textTransform: 'uppercase',
};
const valueCol: React.CSSProperties = { fontSize: '14px', color: '#374151' };
const valueColBold: React.CSSProperties = { fontSize: '14px', color: '#111827', fontWeight: '600' };
const valueColGold: React.CSSProperties = { fontSize: '14px', color: '#D4AF37', fontWeight: '500' };
const buttonWrap: React.CSSProperties = { textAlign: 'center' as const, margin: '24px 0' };
const primaryButton: React.CSSProperties = {
  backgroundColor: '#D4AF37', borderRadius: '12px', color: '#FFFFFF',
  fontSize: '14px', fontWeight: '700', textDecoration: 'none',
  textAlign: 'center' as const, padding: '14px 36px', display: 'inline-block',
};
const secondaryButton: React.CSSProperties = {
  backgroundColor: 'transparent', borderRadius: '12px', color: '#D4AF37',
  fontSize: '14px', fontWeight: '600', textDecoration: 'none',
  textAlign: 'center' as const, padding: '14px 24px', display: 'inline-block',
  border: '2px solid #D4AF37', marginLeft: '12px',
};
const small: React.CSSProperties = {
  fontSize: '12px', color: '#6b7280', lineHeight: 1.5, margin: '8px 0 0 0',
};
const hr: React.CSSProperties = { borderColor: '#E5E7EB', margin: '24px 0' };
