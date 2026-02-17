// =====================================================
// 🔒 ENV VALIDATOR — Fase 3.1
// Valida variáveis de ambiente no startup do servidor.
// Produção: falha HARD se obrigatórias faltam.
// Dev: avisa mas continua rodando.
// =====================================================

import { z } from 'zod';

// ─── Schema ──────────────────────────────────────────────────
// Obrigatórias: sem .optional() → app não sobe sem elas
// Opcionais: .optional() → features degradam mas app roda

const envSchema = z.object({
  // ─── Core (obrigatórias) ─────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL deve ser URL válida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY muito curta'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY muito curta'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres'),
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL deve ser email válido'),

  // ─── Admin Auth ──────────────────────────────────────────
  // Hash bcrypt OU senha plain (legado) — pelo menos um
  ADMIN_PASSWORD_HASH: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),

  // ─── App URLs ────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),

  // ─── Resend (email) ──────────────────────────────────────
  RESEND_API_KEY: z.string().startsWith('re_', 'RESEND_API_KEY deve começar com re_').optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  RESEND_WEBHOOK_SECRET: z.string().optional(),

  // ─── Meta / Facebook Ads ─────────────────────────────────
  META_ACCESS_TOKEN: z.string().min(10).optional(),
  META_AD_ACCOUNT_ID: z.string().startsWith('act_', 'META_AD_ACCOUNT_ID deve começar com act_').optional(),
  META_PIXEL_ID: z.string().optional(),
  META_PAGE_ID: z.string().optional(),
  META_PAGE_ACCESS_TOKEN: z.string().optional(),
  META_INSTAGRAM_ID: z.string().optional(),
  META_TEST_EVENT_CODE: z.string().optional(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
  NEXT_PUBLIC_FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  // Aliases legados
  FACEBOOK_ACCESS_TOKEN: z.string().optional(),
  FACEBOOK_AD_ACCOUNT_ID: z.string().optional(),
  FACEBOOK_PIXEL_ID: z.string().optional(),
  FACEBOOK_PAGE_ID: z.string().optional(),

  // ─── Google ──────────────────────────────────────────────
  GA4_PROPERTY_ID: z.string().optional(),
  GOOGLE_PROJECT_ID: z.string().optional(),
  GOOGLE_CLIENT_EMAIL: z.string().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS_JSON: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  NEXT_PUBLIC_HOTJAR_SITE_ID: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  // Google Ads
  GOOGLE_ADS_CLIENT_ID: z.string().optional(),
  GOOGLE_ADS_CUSTOMER_ID: z.string().optional(),
  GOOGLE_ADS_REFRESH_TOKEN: z.string().optional(),

  // ─── OpenAI ──────────────────────────────────────────────
  OPENAI_API_KEY: z.string().startsWith('sk-', 'OPENAI_API_KEY deve começar com sk-').optional(),

  // ─── Rate Limiting (Upstash) ─────────────────────────────
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ─── Cron ────────────────────────────────────────────────
  CRON_SECRET: z.string().min(16, 'CRON_SECRET deve ter no mínimo 16 caracteres').optional(),

  // ─── Outros ──────────────────────────────────────────────
  UNSPLASH_ACCESS_KEY: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  NANO_BANANA_WEBHOOK_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

// ─── Grupos de features para relatório ───────────────────────
const FEATURE_GROUPS: Record<string, { envs: string[]; label: string }> = {
  email:     { envs: ['RESEND_API_KEY'], label: 'Envio de emails' },
  meta_ads:  { envs: ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'], label: 'Meta Ads' },
  analytics: { envs: ['GA4_PROPERTY_ID', 'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY'], label: 'Google Analytics' },
  ai:        { envs: ['OPENAI_API_KEY'], label: 'IA (OpenAI)' },
  gemini:    { envs: ['GOOGLE_AI_API_KEY'], label: 'Gemini (Google AI Studio)' },
  vertex_ai: { envs: ['GOOGLE_SERVICE_ACCOUNT_JSON'], label: 'Vertex AI (OCR)' },
  hotjar:    { envs: ['NEXT_PUBLIC_HOTJAR_SITE_ID'], label: 'Hotjar' },
  rate_limit:{ envs: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'], label: 'Rate Limiting' },
  cron:      { envs: ['CRON_SECRET'], label: 'Cron Jobs protegidos' },
};

// ─── Validação principal ─────────────────────────────────────

export interface EnvValidationResult {
  valid: boolean;
  env: Env;
  warnings: string[];
  features: Record<string, boolean>;
}

export function validateEnv(): EnvValidationResult {
  const warnings: string[] = [];
  const features: Record<string, boolean> = {};

  // 1. Validar schema
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // Separar erros de obrigatórias vs opcionais
    const criticalFields = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'ADMIN_EMAIL',
    ];

    const criticalErrors = parsed.error.issues.filter((i) =>
      criticalFields.includes(String(i.path[0]))
    );

    if (criticalErrors.length > 0) {
      console.error('\n🚨 VARIÁVEIS DE AMBIENTE CRÍTICAS FALTANDO:\n');
      criticalErrors.forEach((e) =>
        console.error(`  ❌ ${e.path.join('.')}: ${e.message}`)
      );
      console.error('\n📋 Confira .env.local.example para referência.\n');

      if (process.env.NODE_ENV === 'production') {
        console.error('⛔ Abortando — variáveis obrigatórias ausentes em produção.\n');
        process.exit(1);
      }
    }

    // Warnings para opcionais
    const optionalErrors = parsed.error.issues.filter(
      (i) => !criticalFields.includes(String(i.path[0]))
    );
    optionalErrors.forEach((e) =>
      warnings.push(`${e.path.join('.')}: ${e.message}`)
    );

    if (warnings.length > 0) {
      console.warn('\n⚠️  Variáveis opcionais com problema:');
      warnings.forEach((w) => console.warn(`  ⚠️  ${w}`));
      console.warn('');
    }
  }

  // 2. Verificar admin auth (precisa de hash OU senha)
  if (!process.env.ADMIN_PASSWORD_HASH && !process.env.ADMIN_PASSWORD) {
    warnings.push('Nem ADMIN_PASSWORD_HASH nem ADMIN_PASSWORD definidos — login admin não vai funcionar');
  }
  if (process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_HASH) {
    warnings.push('ADMIN_PASSWORD (plain text) em uso — migre para ADMIN_PASSWORD_HASH (bcrypt)');
  }

  // 3. Relatório de features
  for (const [key, group] of Object.entries(FEATURE_GROUPS)) {
    const allPresent = group.envs.every((envName) => !!process.env[envName]);
    features[key] = allPresent;
    if (!allPresent) {
      const missing = group.envs.filter((e) => !process.env[e]);
      warnings.push(`${group.label} desabilitada — faltam: ${missing.join(', ')}`);
    }
  }

  // 4. Log resumo
  const enabledCount = Object.values(features).filter(Boolean).length;
  const totalCount = Object.keys(features).length;

  console.info(
    `\n✅ ENV validadas — ${enabledCount}/${totalCount} features habilitadas\n`
  );

  return {
    valid: parsed.success ?? false,
    env: (parsed.success ? parsed.data : process.env) as Env,
    warnings,
    features,
  };
}

// ─── Flag para pular validação (CI/CD build) ─────────────────
const SKIP = process.env.SKIP_ENV_VALIDATION === 'true';

let _result: EnvValidationResult | null = null;

/** Resultado da validação (lazy, singleton) */
export function getEnvResult(): EnvValidationResult {
  if (!_result) {
    if (SKIP) {
      _result = {
        valid: true,
        env: process.env as unknown as Env,
        warnings: ['ENV validation skipped (SKIP_ENV_VALIDATION=true)'],
        features: {},
      };
    } else {
      _result = validateEnv();
    }
  }
  return _result;
}

/** Acesso tipado às envs (usa após validação) */
export function env(): Env {
  return getEnvResult().env;
}
