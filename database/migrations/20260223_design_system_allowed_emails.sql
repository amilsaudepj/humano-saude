-- E-mails aprovados para acessar a página /design-system (identidade visual)
CREATE TABLE IF NOT EXISTS design_system_allowed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_design_system_emails_email ON design_system_allowed_emails(LOWER(email));
COMMENT ON TABLE design_system_allowed_emails IS 'E-mails aprovados pelo admin para visualizar a página Design System';

ALTER TABLE design_system_allowed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_design_system_emails"
  ON design_system_allowed_emails FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
