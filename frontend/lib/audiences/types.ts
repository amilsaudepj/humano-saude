export type AudienceType = 'custom' | 'lookalike' | 'saved';
export type AudienceSubtype = 'customer_list' | 'website' | 'app' | 'offline' | 'engagement';
export type AudienceStatus = 'populating' | 'ready' | 'error' | 'deleted';
export type SyncStatus = 'success' | 'partial' | 'failed' | 'pending';

export interface LookalikeSpec {
  country: string;
  ratio: number;
  starting_ratio?: number;
}

export interface AudienceRecord {
  id: string;
  meta_audience_id: string;
  meta_account_id: string;
  audience_type: AudienceType;
  subtype: AudienceSubtype | null;
  name: string;
  description: string | null;
  config: Record<string, unknown>;
  source_audience_id: string | null;
  lookalike_spec: LookalikeSpec | null;
  status: AudienceStatus;
  approximate_count: number;
  auto_sync: boolean;
  sync_frequency_hours: number;
  last_synced_at: string | null;
  sync_status: SyncStatus | null;
  campaigns_count: number;
  total_spend: number;
  total_conversions: number;
  avg_cpa: number | null;
  avg_roas: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateCustomAudienceInput {
  name: string;
  description?: string;
  subtype: AudienceSubtype;
  rule?: Record<string, unknown>;
  retention_days?: number;
  customer_file_source?: 'USER_PROVIDED_ONLY' | 'PARTNER_PROVIDED_ONLY' | 'BOTH_USER_AND_PARTNER_PROVIDED';
  prefill?: boolean;
  auto_sync?: boolean;
  sync_frequency_hours?: number;
}

export interface CreateLookalikeInput {
  sourceAudienceId: string;
  country: string;
  ratio: number;
  startingRatio?: number;
  name?: string;
  description?: string;
}

export interface UserData {
  email?: string;
  phone?: string;
  external_id?: string;
  fn?: string;
  ln?: string;
  ct?: string;
  st?: string;
  country?: string;
  zip?: string;
}

export interface HashedUserData {
  email?: string;
  phone?: string;
  external_id?: string;
  fn?: string;
  ln?: string;
  ct?: string;
  st?: string;
  country?: string;
  zip?: string;
}

export interface SyncResult {
  success: boolean;
  audience_id: string;
  users_added: number;
  users_removed: number;
  users_failed: number;
  batch_count: number;
  session_id: string | null;
  errors: Array<{ ref: string; error: string }>;
  duration_seconds: number;
}

export interface AudienceInsightRow {
  audience_id: string;
  reach: number;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  date_start: string;
  date_end: string;
}

export interface MetaAudienceSummary {
  id: string;
  name: string;
  subtype: string;
  approximate_count: number;
  status: string;
}
