// ─── React Email — Notificação de Novo Lead ─────────────────
// Enviado para comercial@humanosaude.com.br quando um novo lead
// é gerado via calculadora ou formulário do topo.

import { Heading, Text, Section, Hr, Row, Column } from '@react-email/components';
import * as React from 'react';
import { EmailLayout } from './_components/EmailLayout';

interface NovoLeadEmailProps {
  nome: string;
  email: string;
  telefone: string;
  cnpj?: string;
  perfil?: string;
  intencao?: string;
  perfilCnpj?: string;
  acomodacao?: string;
  bairro?: string;
  idades?: string;
  qtdVidas?: string;
  usaBypass?: boolean;
  origem: string;
  parcial?: boolean;
  dataCriacao: string;
}

export default function NovoLeadEmail({
  nome = '—',
  email = '—',
  telefone = '—',
  cnpj = '—',
  perfil = '—',
  intencao = '—',
  perfilCnpj = '—',
  acomodacao = '—',
  bairro = '—',
  idades = '—',
  qtdVidas = '—',
  usaBypass = false,
  origem = 'landing',
  parcial = false,
  dataCriacao = new Date().toISOString(),
}: NovoLeadEmailProps) {
  const origemLabel = origem === 'calculadora' ? 'Calculadora' : origem === 'hero_form' ? 'Formulário do topo' : origem === 'email_form' ? 'Formulário do e-mail' : 'Landing page';
  const intencaoLabel = intencao === 'reduzir' ? 'Reduzir custo atual' : intencao === 'contratar' ? 'Contratar 1º plano' : '—';
  const perfilLabel = perfilCnpj === 'mei' ? 'MEI' : perfilCnpj === 'pme' ? 'PME / Empresa' : '—';

  return (
    <EmailLayout preview={`${parcial ? '⚠️ Lead parcial' : '🔥 Novo lead'} — ${nome || 'Sem nome'} (${origemLabel})`}>
      <div style={iconWrapper}>
        <Text style={iconText}>{parcial ? '⚠️' : '🔥'}</Text>
      </div>

      <Heading style={heading}>
        {parcial ? 'Lead parcial (abandonou o formulário)' : 'Novo lead recebido!'}
      </Heading>

      {parcial && (
        <Section style={alertBox}>
          <Text style={alertText}>
            Este lead abandonou o formulário antes de concluir. Os dados abaixo são parciais.
            Entre em contato o mais rápido possível.
          </Text>
        </Section>
      )}

      <Section style={detailsBox}>
        <Text style={sectionTitle}>Dados do contato</Text>
        <Row style={detailRow}>
          <Column style={labelCol}>Nome</Column>
          <Column style={valueColBold}>{nome || '—'}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>E-mail</Column>
          <Column style={valueCol}>{email || '—'}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>WhatsApp</Column>
          <Column style={valueColGold}>{telefone || '—'}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>CNPJ</Column>
          <Column style={valueCol}>{cnpj || '—'}</Column>
        </Row>
      </Section>

      <Hr style={divider} />

      <Section style={detailsBox}>
        <Text style={sectionTitle}>Detalhes da simulação</Text>
        <Row style={detailRow}>
          <Column style={labelCol}>Origem</Column>
          <Column style={valueCol}>
            <span style={{ backgroundColor: origem === 'calculadora' ? '#FEF3C7' : '#DBEAFE', color: origem === 'calculadora' ? '#92400E' : '#1D4ED8', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
              {origemLabel.toUpperCase()}
            </span>
          </Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Intenção</Column>
          <Column style={valueCol}>{intencaoLabel}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Perfil CNPJ</Column>
          <Column style={valueCol}>{perfilLabel}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Acomodação</Column>
          <Column style={valueCol}>{acomodacao || '—'}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Localização</Column>
          <Column style={valueCol}>{bairro || '—'}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Beneficiários</Column>
          <Column style={valueCol}>{usaBypass ? `${qtdVidas} vidas (estimativa)` : idades || '—'}</Column>
        </Row>
        <Row style={detailRow}>
          <Column style={labelCol}>Perfil</Column>
          <Column style={valueCol}>{perfil || '—'}</Column>
        </Row>
      </Section>

      <Hr style={divider} />

      <Text style={footerNote}>
        Data: {new Date(dataCriacao).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
      </Text>
    </EmailLayout>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const iconWrapper: React.CSSProperties = {
  textAlign: 'center',
  margin: '24px 0 8px',
};

const iconText: React.CSSProperties = {
  fontSize: '48px',
  lineHeight: '1',
  margin: '0',
};

const heading: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '800',
  color: '#111827',
  textAlign: 'center' as const,
  margin: '0 0 24px',
  lineHeight: '1.3',
};

const alertBox: React.CSSProperties = {
  backgroundColor: '#FEF3C7',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '24px',
  border: '1px solid #F59E0B',
};

const alertText: React.CSSProperties = {
  color: '#92400E',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0',
};

const detailsBox: React.CSSProperties = {
  backgroundColor: '#F9FAFB',
  borderRadius: '12px',
  padding: '20px',
  marginBottom: '16px',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '700',
  color: '#B8941F',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 12px',
};

const detailRow: React.CSSProperties = {
  marginBottom: '8px',
};

const labelCol: React.CSSProperties = {
  width: '140px',
  fontSize: '13px',
  color: '#6B7280',
  verticalAlign: 'top' as const,
  paddingBottom: '6px',
};

const valueCol: React.CSSProperties = {
  fontSize: '13px',
  color: '#111827',
  verticalAlign: 'top' as const,
  paddingBottom: '6px',
};

const valueColBold: React.CSSProperties = {
  ...valueCol,
  fontWeight: '700',
};

const valueColGold: React.CSSProperties = {
  ...valueCol,
  color: '#B8941F',
  fontWeight: '700',
};

const divider: React.CSSProperties = {
  borderColor: '#E5E7EB',
  margin: '20px 0',
};

const footerNote: React.CSSProperties = {
  fontSize: '12px',
  color: '#9CA3AF',
  textAlign: 'center' as const,
  margin: '0',
};
