// =============================================
// 💰 COMISSÕES — TIPOS DO MÓDULO FINANCEIRO
// =============================================

// ── Status do Ledger ──
export const LEDGER_STATUS = [
  'pending',
  'confirmed',
  'paid',
  'cancelled',
  'disputed',
] as const;
export type LedgerStatus = (typeof LEDGER_STATUS)[number];

// ── Status de Auditoria ──
export const AUDIT_STATUS = [
  'not_audited',
  'match',
  'divergent',
  'missing',
] as const;
export type AuditStatus = (typeof AUDIT_STATUS)[number];

// ── Regras de Bônus (JSON tipado) ──
export type BonusRules = {
  meta_mensal?: number;
  bonus_pct?: number;
  meta_trimestral?: number;
  bonus_trimestral_pct?: number;
  observacoes?: string;
};

// ── Commission Grade ──
export type CommissionGrade = {
  id: string;
  broker_id: string;
  operator_id: string | null;
  first_installment_pct: number;
  recurring_pct: number;
  bonus_rules: BonusRules;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type CommissionGradeInsert = Omit<CommissionGrade, 'id' | 'created_at' | 'updated_at'>;
export type CommissionGradeUpdate = Partial<Omit<CommissionGrade, 'id' | 'created_at'>>;

// ── Commissions Ledger ──
export type CommissionLedgerEntry = {
  id: string;
  proposal_id: string | null;
  broker_id: string;
  operator_id: string | null;
  grade_id: string | null;
  // Dados desnormalizados (auto-suficiente sem JOIN em propostas)
  titular_name: string | null;
  proposal_number: string | null;
  cpf_titular: string | null;
  amount: number;
  base_amount: number;
  applied_pct: number;
  installment_number: number;
  status: LedgerStatus;
  reference_month: string;
  expected_payment_date: string | null;
  actual_payment_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  audit_status: AuditStatus;
  audit_notes: string | null;
  audited_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CommissionLedgerInsert = Omit<CommissionLedgerEntry, 'id' | 'created_at' | 'updated_at'>;
export type CommissionLedgerUpdate = Partial<Omit<CommissionLedgerEntry, 'id' | 'created_at'>>;

// ── Ledger com dados expandidos (JOIN operadoras) ──
export type CommissionLedgerExpanded = CommissionLedgerEntry & {
  operadoras?: {
    nome: string;
    logo_url: string | null;
  } | null;
  broker_name?: string;
};

// ── Resumo Mensal (retorno da RPC) ──
export type CommissionsSummary = {
  month: string;
  total_payable: number;
  total_pending_operator: number;
  total_paid: number;
  total_cancelled: number;
  total_disputed: number;
  entries_count: number;
  pending_count: number;
  confirmed_count: number;
  paid_count: number;
  divergent_count: number;
  missing_count: number;
};

// ── Filtros da tabela ──
export type CommissionLedgerFilters = {
  broker_id?: string;
  status?: LedgerStatus;
  audit_status?: AuditStatus;
  reference_month?: string;
  operator_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
};

// ── Resultado de Auditoria Gemini ──
export type AuditDivergence = {
  proposal_number: string;
  titular_name: string;
  expected_amount: number;
  actual_amount: number | null;
  difference: number;
  type: 'amount_mismatch' | 'missing_in_statement' | 'missing_in_ledger' | 'extra_in_statement';
  details: string;
};

export type AuditResult = {
  operator_name: string;
  statement_month: string;
  total_expected: number;
  total_found: number;
  total_divergent: number;
  match_count: number;
  divergences: AuditDivergence[];
  raw_extracted_entries: number;
  processed_at: string;
};

// ── CSV para banco ──
export type PaymentCSVRow = {
  nome_corretor: string;
  cpf_corretor: string;
  banco: string;
  agencia: string;
  conta: string;
  valor: string;
  referencia: string;
};
