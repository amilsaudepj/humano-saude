// ─── Blueprint 14: Email System Types ───────────────────────
// Types for email_logs, email_events, stats, and Resend webhooks.

// ─── Email Log (matches email_logs table) ────────────────────
export interface EmailLog {
  id: string;
  resend_id: string | null;
  from_email: string;
  to_email: string;
  cc_emails: string[] | null;
  bcc_emails: string[] | null;
  reply_to: string | null;
  subject: string;
  template_name: string | null;
  template_version: string | null;
  html_content: string | null;
  text_content: string | null;
  email_type: EmailType;
  category: string | null;
  tags: string[] | null;
  status: EmailStatus;
  last_event: string | null;
  last_event_at: string | null;
  opened_count: number;
  clicked_count: number;
  first_opened_at: string | null;
  first_clicked_at: string | null;
  delivered_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  error_code: string | null;
  bounce_type: BounceType | null;
  triggered_by: string | null;
  reference_type: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Email Event (matches email_events table) ────────────────
export interface EmailEvent {
  id: string;
  email_log_id: string;
  resend_id: string | null;
  event_type: EmailEventType;
  event_data: Record<string, unknown>;
  click_url: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_type: DeviceType | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  bounce_type: BounceType | null;
  bounce_message: string | null;
  occurred_at: string;
  received_at: string;
  created_at: string;
}

// ─── Email Stats (matches email_stats view) ──────────────────
export interface EmailStats {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_complained: number;
  total_failed: number;
  delivery_rate: number | null;
  open_rate: number | null;
  click_rate: number | null;
  bounce_rate: number | null;
  transactional_count: number;
  marketing_count: number;
  system_count: number;
  calculated_at: string;
}

// ─── Enums (alinhados ao last_event da Resend) ─────────────────
export type EmailStatus =
  | 'queued'
  | 'sent'
  | 'scheduled'
  | 'delivered'
  | 'delivery_delayed'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed'
  | 'suppressed'
  | 'canceled';

export type EmailType = 'transactional' | 'marketing' | 'system';

export type EmailEventType =
  | 'sent'
  | 'delivered'
  | 'delivery_delayed'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'unsubscribed';

export type BounceType = 'hard' | 'soft';

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

// ─── Send Email Options ──────────────────────────────────────
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  from?: string;

  // Tracking & logging metadata
  templateName?: string;
  templateVersion?: string;
  emailType?: EmailType;
  category?: string;
  tags?: string[];
  triggeredBy?: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;

  // Options
  saveHtmlContent?: boolean;   // save HTML to email_logs (default: true)
  injectTrackingPixel?: boolean; // inject tracking pixel (default: true for transactional)
}

// ─── Send Email Result ───────────────────────────────────────
export interface SendEmailResult {
  success: boolean;
  id?: string;          // Resend email ID
  logId?: string;       // email_logs UUID
  error?: string;
}

// ─── Resend Webhook Payload ──────────────────────────────────
export interface ResendWebhookPayload {
  type: ResendWebhookEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Delivered / Opened / Clicked events
    headers?: Array<{ name: string; value: string }>;
    // Click event
    click?: {
      ipAddress: string;
      link: string;
      timestamp: string;
      userAgent: string;
    };
    // Open event
    open?: {
      ipAddress: string;
      timestamp: string;
      userAgent: string;
    };
    // Bounce event
    bounce?: {
      message: string;
      type: string; // 'hard' | 'soft'
    };
    // Complaint event
    complaint?: {
      complaintType: string;
      timestamp: string;
    };
  };
}

export type ResendWebhookEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.opened'
  | 'email.clicked'
  | 'email.bounced'
  | 'email.complained';

// ─── Admin API: List Emails Request ──────────────────────────
export interface ListEmailsParams {
  page?: number;
  limit?: number;
  status?: EmailStatus;
  emailType?: EmailType;
  category?: string;
  templateName?: string;
  search?: string;         // busca por to_email ou subject
  startDate?: string;
  endDate?: string;
  sortBy?: 'created_at' | 'updated_at' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// ─── Admin API: List Emails Response ─────────────────────────
export interface ListEmailsResponse {
  emails: EmailLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Admin API: Resend Email Request ─────────────────────────
export interface ResendEmailRequest {
  emailLogId: string;
  forceResend?: boolean;
}

// ─── Template definitions ────────────────────────────────────
export interface EmailTemplateProps {
  welcome: {
    nome: string;
    email: string;
  };
  purchase_confirmation: {
    nome: string;
    email: string;
    plano: string;
    operadora: string;
    valor: string;
    vigencia: string;
    protocolo: string;
  };
  pix_pending: {
    nome: string;
    email: string;
    valor: string;
    pixCode: string;
    expiresAt: string;
  };
}

export type EmailTemplateName = keyof EmailTemplateProps;

// ─── User Agent Parsing Result ───────────────────────────────
export interface ParsedUserAgent {
  device: DeviceType;
  os: string;
  browser: string;
}
