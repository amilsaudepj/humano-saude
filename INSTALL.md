# 🚀 Checklist de Instalação — Humano Saúde Enterprise

## ✅ PRÉ-REQUISITOS

- [ ] **Node.js 18+** instalado (`node -v`)
- [ ] **npm** ou **pnpm** instalado
- [ ] Conta no **Supabase** ([supabase.com](https://supabase.com))
- [ ] Conta no **Vercel** ([vercel.com](https://vercel.com))
- [ ] Conta no **Resend** ([resend.com](https://resend.com)) — para emails
- [ ] (Opcional) Conta **N8N** — para automações avançadas
- [ ] (Opcional) Meta Business Suite — para WhatsApp Business API

---

## 📦 PARTE 1: SETUP INICIAL

### 1.1 Clone e Instale Dependências

```bash
cd frontend
npm install
```

### 1.2 Configure Variáveis de Ambiente

Copie o `.env.example` ou crie `frontend/.env.local`:

```bash
# ─── Supabase (OBRIGATÓRIAS) ──────────────────
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# ─── App ───────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="https://humanosaude.com.br"

# ─── Admin Login (Custom JWT Auth) ─────────────
ADMIN_EMAIL="admin@seudominio.com.br"
ADMIN_PASSWORD="SenhaSegura123!"

# ─── OpenAI (para IA) ─────────────────────────
OPENAI_API_KEY="sk-proj-..."

# ─── Resend (Email) ───────────────────────────
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="Sua Empresa <noreply@seudominio.com.br>"
RESEND_WEBHOOK_SECRET=""  # Gerado no painel Resend

# ─── Meta Ads (Opcional) ──────────────────────
META_ACCESS_TOKEN=""
META_AD_ACCOUNT_ID=""
META_PAGE_ID=""
META_PIXEL_ID=""
NEXT_PUBLIC_META_PIXEL_ID=""

# ─── Google Analytics (Opcional) ──────────────
# Tracking no frontend (gtag)
NEXT_PUBLIC_GA_MEASUREMENT_ID=""
NEXT_PUBLIC_GTM_ID=""
# Data API no backend/admin (obrigatório para página GA4 do painel)
GA4_PROPERTY_ID="" # Somente números (ex.: 123456789)
GOOGLE_APPLICATION_CREDENTIALS_JSON="" # JSON da Service Account

# ─── Cron / Segurança ────────────────────────
CRON_SECRET="gere_uma_chave_aleatoria_aqui"

# ─── N8N Webhook (Opcional) ──────────────────
N8N_WEBHOOK_SECRET=""

# ─── WhatsApp Business API (Opcional) ─────────
WA_PHONE_NUMBER_ID=""
WA_ACCESS_TOKEN=""
WA_VERIFY_TOKEN=""
META_WEBHOOK_VERIFY_TOKEN=""
```

---

## 🗄️ PARTE 2: SETUP SUPABASE

### 2.1 Criar Projeto no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em **New Project**
3. Escolha organização, nome e senha do banco
4. Anote:
   - **URL**: `https://xxx.supabase.co`
   - **anon key**: Settings → API → `anon` (public)
   - **service_role key**: Settings → API → `service_role` (secret)

### 2.2 Executar Migrations SQL

⚠️ **IMPORTANTE**: Execute na ordem abaixo no **SQL Editor** do Supabase.

Copie e cole cada arquivo e clique em **Run**.

#### Grupo 1 — Base (10 de fev)
```
database/migrations/20260210_create_corretores_standalone.sql
database/migrations/20260210_create_corretor_module.sql
database/migrations/20260210_create_corretor_onboarding.sql
database/migrations/20260210_create_corretor_rpc_functions.sql
database/migrations/20260210_create_convites_corretor.sql
database/migrations/20260210_create_solicitacoes_corretor.sql
database/migrations/20260210_create_termos_aceites.sql
database/migrations/20260210_create_missing_tables.sql
database/migrations/20260210_add_unique_constraints_and_bank_history.sql
database/migrations/20260210_create_automacoes_regras_tables.sql
database/migrations/20260210_create_meta_ads_tables.sql
database/migrations/20260210_create_social_flow_tables.sql
```

#### Grupo 2 — Módulos (11 de fev)
```
database/migrations/20260211_create_crm_tables.sql
database/migrations/20260211_create_leads_indicacao.sql
database/migrations/20260211_create_producoes_parcelas.sql
database/migrations/20260211_create_storage_bucket.sql
database/migrations/20260211_create_tabelas_precos.sql
database/migrations/20260211_seed_tabelas_precos.sql
```

#### Grupo 3 — Email & RLS (12 de fev)
```
database/migrations/20260212_email_tracking_system.sql
database/migrations/20260212_rls_documentos_adesao.sql
```

#### Grupo 4 — CRM Avançado (13 de fev)
```
database/migrations/20260213_create_crm_advanced.sql       ← CRM pipelines, stages, deals, etc.
database/migrations/20260213_crm_detail_panel_tables.sql   ← Attachments, comments, quotes, notifications
database/migrations/20260213_unify_leads_tables.sql
database/migrations/20260213_analytics_dashboard_system.sql
database/migrations/20260213_create_ai_performance_tables.sql
```

#### Grupo 5 — Templates (14 de fev)
```
database/migrations/20260214_create_message_templates.sql  ← Templates email/WhatsApp + webhook_logs
```

### 2.3 Verificar Tabelas

No **Table Editor** do Supabase, confirme que existem:

**Core:**
- `corretores`, `convites_corretor`, `termos_aceite`
- `insurance_leads`, `operadoras`, `planos_operadora`, `precos_faixa`
- `cotacoes`, `propostas`, `comissoes`

**CRM:**
- `crm_pipelines`, `crm_stages`, `crm_deals`, `crm_activities`
- `crm_contacts`, `crm_companies`, `crm_products`
- `crm_comments`, `crm_attachments`, `crm_followers`
- `crm_changelog`, `crm_quotes`, `crm_quote_items`
- `crm_notifications`, `crm_workflows`, `crm_workflow_executions`

**Integrações:**
- `whatsapp_contacts`, `whatsapp_messages`
- `email_logs`, `email_events`
- `message_templates`, `webhook_logs`
- `ads_campaigns`, `ads_creatives`, `ads_audiences`
- `integration_settings`, `automacoes`

**Analytics:**
- `analytics_dashboard_snapshots`, `analytics_alerts`
- `ai_performance_metrics`, `ai_rules`

---

## 🚀 PARTE 3: RODAR O PROJETO

### 3.1 Desenvolvimento Local

```bash
cd frontend
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### 3.2 Login Admin

O portal admin fica em: `/portal-interno-hks-2026`

Use as credenciais definidas nas env vars:
- **Email**: valor de `ADMIN_EMAIL`
- **Senha**: valor de `ADMIN_PASSWORD`

> ⚠️ O sistema usa **Custom JWT Auth** (jose + bcrypt), **NÃO** Supabase Auth.
> Os tokens são salvos como cookies: `admin_token` e `corretor_token`.

### 3.3 Portal do Corretor

O portal do corretor fica em: `/portal-corretor`

Corretores se cadastram pelo formulário público e são aprovados pelo admin.

---

## 🌐 PARTE 4: DEPLOY (VERCEL)

### 4.1 Conectar ao Vercel

```bash
npx vercel link
```

### 4.2 Configurar Variáveis de Ambiente

No painel do Vercel → Settings → Environment Variables, adicione **todas** as variáveis do `.env.local`.

### 4.3 Deploy

```bash
npx vercel --prod
```

---

## 🔗 PARTE 5: WEBHOOKS (PRODUÇÃO)

### 5.1 Resend (Email tracking)

1. Acesse [resend.com/webhooks](https://resend.com/webhooks)
2. URL: `https://seudominio.com.br/api/webhooks/resend`
3. Eventos: `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`
4. Copie o secret → `RESEND_WEBHOOK_SECRET`

### 5.2 Meta / WhatsApp Business API

1. [developers.facebook.com](https://developers.facebook.com) → Seu App → Webhooks
2. URL WhatsApp: `https://seudominio.com.br/api/webhooks/whatsapp`
3. URL Meta Ads: `https://seudominio.com.br/api/webhooks/meta`
4. Verify Token: valor de `META_WEBHOOK_VERIFY_TOKEN`

### 5.3 N8N (Automações)

1. No N8N, configure workflows para chamar:
   `https://seudominio.com.br/api/webhooks/n8n`
2. Header: `x-n8n-signature` com HMAC-SHA256
3. Secret: valor de `N8N_WEBHOOK_SECRET`

**Eventos suportados:**
| Evento | Descrição |
|--------|-----------|
| `lead_created` | Criar lead no CRM |
| `lead_updated` | Atualizar lead existente |
| `deal_created` | Criar deal no pipeline |
| `deal_updated` | Atualizar deal |
| `deal_stage_changed` | Mover deal de estágio |
| `activity_scheduled` | Agendar atividade |
| `notification` | Criar notificação para corretor |
| `contact_enriched` | Enriquecer dados de contato |
| `send_email` | Logar intenção de envio de email |
| `send_whatsapp` | Logar intenção de envio WhatsApp |

---

## 🏗️ ESTRUTURA DO PROJETO

```
frontend/
├── app/
│   ├── (public)/            # Páginas públicas (home, cotação)
│   ├── admin-login/         # Login admin
│   ├── portal-interno-hks-2026/  # Portal admin (protegido)
│   │   ├── crm/             # CRM Kanban + Detail Panel
│   │   ├── leads/           # Gestão de leads
│   │   ├── corretores/      # Gestão de corretores
│   │   ├── configuracoes/   # Configurações (5 tabs)
│   │   ├── automacao/       # Automações IA + Workflows CRM
│   │   ├── analytics/       # Analytics dashboard
│   │   └── ...
│   ├── portal-corretor/     # Portal do corretor (protegido)
│   ├── actions/             # Server Actions
│   ├── api/                 # API Routes + Webhooks
│   └── components/          # Componentes de página
├── components/
│   ├── ui/                  # ShadcnUI (radix-ui v2)
│   ├── notifications/       # NotificationBell
│   └── error-boundary.tsx   # ErrorBoundary global
├── lib/
│   ├── supabase.ts          # Cliente Supabase
│   ├── email.ts             # Serviço de email (Resend)
│   ├── email-tracking.ts    # Tracking de email
│   ├── auth.ts              # Custom JWT Auth
│   ├── logger.ts            # Logger estruturado
│   └── types/               # TypeScript types
├── emails/                  # React Email templates
├── stores/                  # Zustand stores
└── database/
    └── migrations/          # 26 migrations SQL
```

---

## 📋 CHECKLIST FINAL

- [ ] `.env.local` configurado com todas as chaves
- [ ] Migrations SQL rodadas no Supabase (26 arquivos)
- [ ] `npm run dev` funciona sem erros
- [ ] Login admin funciona em `/portal-interno-hks-2026`
- [ ] CRM Kanban carrega com pipeline padrão
- [ ] Webhooks Resend configurados (produção)
- [ ] Webhooks WhatsApp configurados (produção)
- [ ] Deploy no Vercel com env vars
- [ ] Domínio customizado apontado

---

## 🎨 DESIGN SYSTEM

| Elemento | Valor |
|----------|-------|
| Background | `#050505` (Black Piano) |
| Accent | `#D4AF37` (Gold Premium) |
| Accent hover | `#F6E05E` (Gold Claro) |
| Glass | `bg-white/[0.03]` + `backdrop-blur` |
| Border | `border-white/10` |
| Fonte títulos | Perpetua Titling MT |
| Fonte corpo | Inter |
| UI Library | ShadcnUI via `radix-ui` v1.4.3 (unified) |

---

*Última atualização: 13 de fevereiro de 2026*
