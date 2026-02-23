// ─── Blueprint 14: React Email — Shared Layout ──────────────
// Base layout for all Humano Saúde email templates.
// Força tema claro para exibição correta em dark mode (mobile e desktop).

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
  showSpamWarning?: boolean;
}

export function EmailLayout({ preview, children, showSpamWarning = false }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
        <style>{`
          :root { color-scheme: light only; }
          @media (prefers-color-scheme: dark) {
            body, .email-body { background-color: #ffffff !important; color: #111827 !important; }
            .email-container { background-color: #ffffff !important; }
            .email-content { background-color: #FAFAFA !important; color: #111827 !important; }
            .email-content * { border-color: #E5E7EB !important; }
            a.email-cta-whatsapp { background-color: #B8941F !important; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
            a.email-cta-whatsapp *, .email-cta-whatsapp *, .email-cta-text { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
            .email-spam { background-color: #FFFBEB !important; color: #92400E !important; }
            .email-spam * { color: #92400E !important; }
            .email-footer { background-color: transparent !important; color: #6b7280 !important; }
            .email-copyright { color: #6b7280 !important; }
            .email-footer-link { color: #D4AF37 !important; }
          }
        `}</style>
      </Head>
      <Body style={main} className="email-body">
        <Container style={container} className="email-container">
          <Section style={content} className="email-content">
            {children}
          </Section>

          {/* Spam Warning */}
          {showSpamWarning && (
            <Section style={spamBox} className="email-spam">
              <Text style={spamText}>
                <strong>⚠️ Importante:</strong> Nossos e-mails podem cair na pasta{' '}
                <strong>Spam/Lixo Eletrônico</strong>. Marque como &quot;Não é spam&quot; para receber
                os próximos comunicados.
              </Text>
            </Section>
          )}

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer} className="email-footer">
            <Text style={copyright} className="email-copyright">
              © {new Date().getFullYear()} Humano Saúde — Todos os direitos reservados
            </Text>
            <Link href="https://humanosaude.com.br" style={footerLink} className="email-footer-link">
              humanosaude.com.br
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const main: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  colorScheme: 'light',
};

const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '32px 16px',
};

const content: React.CSSProperties = {
  padding: '32px 40px',
  backgroundColor: '#FAFAFA',
  border: '1px solid #E5E7EB',
  borderRadius: '16px',
};

const spamBox: React.CSSProperties = {
  backgroundColor: '#FFFBEB',
  border: '1px solid #FDE68A',
  borderRadius: '12px',
  padding: '16px',
  marginTop: '20px',
};

const spamText: React.CSSProperties = {
  color: '#92400E',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: 0,
};

const divider: React.CSSProperties = {
  borderColor: '#E5E7EB',
  margin: '24px 0',
};

const footer: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '0 16px',
};

const copyright: React.CSSProperties = {
  color: '#9CA3AF',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0 0 4px 0',
};

const footerLink: React.CSSProperties = {
  color: '#D4AF37',
  fontSize: '12px',
  textDecoration: 'none',
};
