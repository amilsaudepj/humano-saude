#!/usr/bin/env node
/**
 * Backfill de user_login_logs
 * 
 * Popula a tabela user_login_logs com dados históricos extraídos de:
 *   1. auth.users (last_sign_in_at) — via admin API
 *   2. corretores (created_at como proxy — não têm campo de último login)
 *   3. portal_client_accounts (ultimo_login_em)
 *   4. integration_settings (admin profile — created_at)
 * 
 * Só insere se NÃO existir registro prévio para aquele email.
 * Seguro para rodar múltiplas vezes (idempotente).
 * 
 * Uso:
 *   node scripts/backfill-login-logs.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🔄 Iniciando backfill de user_login_logs...\n');

  // Busca emails que já têm registro (para não duplicar)
  const { data: existingLogs, error: logErr } = await supabase
    .from('user_login_logs')
    .select('user_email');

  if (logErr) {
    console.error('❌ Erro ao ler user_login_logs:', logErr.message);
    process.exit(1);
  }

  const emailsComLog = new Set((existingLogs || []).map(l => l.user_email.toLowerCase()));
  console.log(`📋 ${emailsComLog.size} email(s) já têm registro de login.\n`);

  const inserts = [];

  // ─── 1. auth.users (last_sign_in_at) ───────────────────
  try {
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
    if (!authErr && authData?.users?.length > 0) {
      console.log(`👤 auth.users: ${authData.users.length} usuário(s) encontrados`);
      for (const user of authData.users) {
        const email = (user.email || '').toLowerCase().trim();
        if (!email || emailsComLog.has(email)) continue;
        const loginAt = user.last_sign_in_at || user.created_at;
        if (!loginAt) continue;
        inserts.push({
          user_email: email,
          user_id: user.id,
          login_at: loginAt,
          ip_address: 'backfill',
          user_agent: 'backfill-script',
          login_type: 'user',
        });
        emailsComLog.add(email);
      }
    } else {
      console.log('⚠️  auth.users: nenhum usuário retornado (ou erro). Prosseguindo com fallback.');
    }
  } catch {
    console.log('⚠️  auth.users: API indisponível. Prosseguindo com fallback.');
  }

  // ─── 2. corretores ─────────────────────────────────────
  const { data: corretores, error: corrErr } = await supabase
    .from('corretores')
    .select('id, email, nome, created_at');

  if (corrErr) {
    console.error('⚠️  Erro ao buscar corretores:', corrErr.message);
  } else {
    console.log(`🏢 corretores: ${(corretores || []).length} encontrado(s)`);
    for (const c of (corretores || [])) {
      const email = (c.email || '').toLowerCase().trim();
      if (!email || emailsComLog.has(email)) continue;
      inserts.push({
        user_email: email,
        user_id: c.id,
        login_at: c.created_at || new Date().toISOString(),
        ip_address: 'backfill',
        user_agent: 'backfill-script',
        login_type: 'corretor',
      });
      emailsComLog.add(email);
    }
  }

  // ─── 3. portal_client_accounts (ultimo_login_em) ───────
  try {
    const { data: clientes, error: cliErr } = await supabase
      .from('portal_client_accounts')
      .select('id, email, ultimo_login_em, created_at');

    if (!cliErr && clientes?.length) {
      console.log(`👥 portal_client_accounts: ${clientes.length} encontrado(s)`);
      for (const c of clientes) {
        const email = (c.email || '').toLowerCase().trim();
        if (!email || emailsComLog.has(email)) continue;
        const loginAt = c.ultimo_login_em || c.created_at;
        if (!loginAt) continue;
        inserts.push({
          user_email: email,
          user_id: c.id,
          login_at: loginAt,
          ip_address: 'backfill',
          user_agent: 'backfill-script',
          login_type: 'user',
        });
        emailsComLog.add(email);
      }
    } else {
      console.log('ℹ️  portal_client_accounts: nenhum registro ou tabela inexistente.');
    }
  } catch {
    console.log('ℹ️  portal_client_accounts: tabela não disponível.');
  }

  // ─── 4. Admin profile (integration_settings) ──────────
  try {
    const { data: admin } = await supabase
      .from('integration_settings')
      .select('config, created_at')
      .eq('integration_name', 'admin_profile')
      .single();

    if (admin?.config) {
      const cfg = admin.config;
      const email = (cfg.email || '').toLowerCase().trim();
      if (email && !emailsComLog.has(email)) {
        console.log(`🔑 admin profile: ${email}`);
        inserts.push({
          user_email: email,
          user_id: null,
          login_at: admin.created_at || new Date().toISOString(),
          ip_address: 'backfill',
          user_agent: 'backfill-script',
          login_type: 'admin',
        });
        emailsComLog.add(email);
      }
    }
  } catch {
    console.log('ℹ️  integration_settings: admin_profile não encontrado.');
  }

  // ─── Inserir ──────────────────────────────────────────
  if (inserts.length === 0) {
    console.log('\n✅ Nenhum registro novo para inserir. Tudo já está populado.');
    return;
  }

  console.log(`\n📝 Inserindo ${inserts.length} registro(s) de backfill...`);

  const { error: insertErr } = await supabase
    .from('user_login_logs')
    .insert(inserts);

  if (insertErr) {
    console.error('❌ Erro ao inserir:', insertErr.message);
    process.exit(1);
  }

  console.log(`✅ ${inserts.length} registro(s) inserido(s) com sucesso!`);

  // Resumo final
  console.log('\n── Resumo ──');
  for (const row of inserts) {
    console.log(`  • ${row.user_email} (${row.login_type}) → ${row.login_at}`);
  }
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
