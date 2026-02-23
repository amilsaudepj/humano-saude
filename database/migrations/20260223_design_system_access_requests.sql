-- Solicitações de acesso ao Design System (usuário pede acesso; admin aprova)
CREATE TABLE IF NOT EXISTS design_system_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_ds_requests_status ON design_system_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_ds_requests_email ON design_system_access_requests(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_ds_requests_created ON design_system_access_requests(created_at DESC);

ALTER TABLE design_system_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_ds_requests"
  ON design_system_access_requests FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
