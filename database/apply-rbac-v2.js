#!/usr/bin/env node
/**
 * Script para aplicar permissões granulares RBAC v2 via REST API do Supabase
 * Executa UPDATE nos corretores existentes com as novas chaves de sub-itens
 */

const fs = require('fs');
const path = require('path');

// Ler env
const envPath = path.join(__dirname, '../frontend/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/)?.[1]?.trim();
const SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY="?([^"\n]+)"?/)?.[1]?.trim();

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// Templates de permissões granulares por cargo
const TEMPLATES = {
  administrador: {
    nav_home:true,nav_comercial:true,nav_marketing:true,nav_social_flow:true,nav_ia_automacao:true,nav_operacoes:true,nav_comunicacao:true,nav_financeiro:true,nav_configuracoes:true,
    nav_comercial_pipeline:true,nav_comercial_leads:true,nav_comercial_crm:true,nav_comercial_crm_contatos:true,nav_comercial_crm_empresas:true,nav_comercial_cotacoes:true,nav_comercial_propostas:true,nav_comercial_propostas_fila:true,nav_comercial_propostas_ia:true,nav_comercial_propostas_manual:true,nav_comercial_contratos:true,nav_comercial_vendas:true,nav_comercial_planos:true,nav_comercial_crm_analytics:true,
    nav_mkt_geral:true,nav_mkt_google:true,nav_mkt_meta:true,nav_mkt_tiktok:true,
    nav_sf_dashboard:true,nav_sf_composer:true,nav_sf_calendario:true,nav_sf_biblioteca:true,nav_sf_aprovacao:true,nav_sf_connect:true,nav_sf_analytics:true,
    nav_ia_performance:true,nav_ia_regras:true,nav_ia_insights:true,nav_ia_scanner:true,nav_ia_automacoes:true,nav_ia_workflows:true,
    nav_ops_clientes:true,nav_ops_clientes_portal:true,nav_ops_documentos:true,nav_ops_tarefas:true,nav_ops_corretores:true,nav_ops_indicacoes:true,nav_ops_treinamento:true,
    nav_com_whatsapp:true,nav_com_chat:true,nav_com_email:true,nav_com_notificacoes:true,
    nav_fin_visao:true,nav_fin_producao:true,nav_fin_comissoes:true,nav_fin_faturamento:true,
    nav_config_geral:true,nav_config_apis:true,nav_config_usuarios:true,nav_config_perfil:true,nav_config_seguranca:true,
    action_create_lead:true,action_edit_lead:true,action_delete_lead:true,action_export_csv:true,action_create_proposta:true,action_edit_proposta:true,action_delete_proposta:true,action_approve_proposta:true,action_manage_corretores:true,action_manage_users:true,action_send_convite:true,action_generate_magic_link:true,action_manage_automacoes:true,action_manage_integracoes:true,
    fin_view_dashboard:true,fin_view_comissoes:true,fin_launch_comissoes:true,fin_view_grade:true,fin_edit_grade:true,fin_view_producao:true,fin_view_faturamento:true,
    mkt_view_meta_ads:true,mkt_edit_campanhas:true,mkt_view_analytics:true,mkt_view_leads_origem:true
  },
  corretor: {
    nav_home:true,nav_comercial:true,nav_marketing:false,nav_social_flow:false,nav_ia_automacao:false,nav_operacoes:false,nav_comunicacao:true,nav_financeiro:true,nav_configuracoes:false,
    nav_comercial_pipeline:true,nav_comercial_leads:true,nav_comercial_crm:true,nav_comercial_crm_contatos:true,nav_comercial_crm_empresas:false,nav_comercial_cotacoes:true,nav_comercial_propostas:true,nav_comercial_propostas_fila:true,nav_comercial_propostas_ia:false,nav_comercial_propostas_manual:true,nav_comercial_contratos:false,nav_comercial_vendas:false,nav_comercial_planos:true,nav_comercial_crm_analytics:false,
    nav_mkt_geral:false,nav_mkt_google:false,nav_mkt_meta:false,nav_mkt_tiktok:false,
    nav_sf_dashboard:false,nav_sf_composer:false,nav_sf_calendario:false,nav_sf_biblioteca:false,nav_sf_aprovacao:false,nav_sf_connect:false,nav_sf_analytics:false,
    nav_ia_performance:false,nav_ia_regras:false,nav_ia_insights:false,nav_ia_scanner:false,nav_ia_automacoes:false,nav_ia_workflows:false,
    nav_ops_clientes:false,nav_ops_clientes_portal:false,nav_ops_documentos:false,nav_ops_tarefas:false,nav_ops_corretores:false,nav_ops_indicacoes:false,nav_ops_treinamento:false,
    nav_com_whatsapp:true,nav_com_chat:true,nav_com_email:true,nav_com_notificacoes:true,
    nav_fin_visao:true,nav_fin_producao:true,nav_fin_comissoes:true,nav_fin_faturamento:false,
    nav_config_geral:false,nav_config_apis:false,nav_config_usuarios:false,nav_config_perfil:false,nav_config_seguranca:false,
    action_create_lead:true,action_edit_lead:true,action_delete_lead:false,action_export_csv:true,action_create_proposta:true,action_edit_proposta:true,action_delete_proposta:false,action_approve_proposta:false,action_manage_corretores:false,action_manage_users:false,action_send_convite:false,action_generate_magic_link:false,action_manage_automacoes:false,action_manage_integracoes:false,
    fin_view_dashboard:true,fin_view_comissoes:true,fin_launch_comissoes:false,fin_view_grade:true,fin_edit_grade:false,fin_view_producao:true,fin_view_faturamento:false,
    mkt_view_meta_ads:false,mkt_edit_campanhas:false,mkt_view_analytics:false,mkt_view_leads_origem:false
  }
};

// Chaves antigas para remover
const OLD_KEYS = ['nav_leads', 'nav_crm', 'nav_propostas', 'nav_calculadora', 'nav_corretores', 'nav_usuarios'];

async function main() {
  console.log('🔄 RBAC v2: Atualizando permissões granulares...\n');

  // 1. Buscar todos os corretores
  const res = await fetch(`${SUPABASE_URL}/rest/v1/corretores?select=id,nome,role,permissions`, {
    headers: HEADERS
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('❌ Erro ao buscar corretores:', err);
    process.exit(1);
  }

  const corretores = await res.json();
  console.log(`📋 Encontrados ${corretores.length} corretores\n`);

  // 2. Para cada corretor, fazer merge das permissões
  for (const c of corretores) {
    const role = c.role || 'corretor';
    const template = TEMPLATES[role] || TEMPLATES.corretor;
    const existing = c.permissions || {};

    // Merge: template como base, override com valores existentes que o user já tinha
    // Mas apenas para chaves que existiam no antigo sistema
    const merged = { ...template };

    // Preservar customizações existentes do antigo sistema (chaves que existem em ambos)
    for (const [key, val] of Object.entries(existing)) {
      if (key in merged && !OLD_KEYS.includes(key)) {
        merged[key] = val;
      }
    }

    // Remover chaves antigas
    for (const oldKey of OLD_KEYS) {
      delete merged[oldKey];
    }

    // 3. PATCH no corretor
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/corretores?id=eq.${c.id}`,
      {
        method: 'PATCH',
        headers: { ...HEADERS, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ permissions: merged })
      }
    );

    if (updateRes.ok) {
      const keyCount = Object.keys(merged).length;
      const trueCount = Object.values(merged).filter(v => v === true).length;
      console.log(`  ✅ ${c.nome || c.id} (${role}) → ${keyCount} chaves (${trueCount} ativas)`);
    } else {
      const err = await updateRes.text();
      console.error(`  ❌ ${c.nome || c.id}: ${err}`);
    }
  }

  console.log('\n✅ Permissões granulares atualizadas com sucesso!');
  console.log('   Agora a UI de permissões mostrará sub-itens dentro de cada seção.\n');
}

main().catch(e => {
  console.error('❌ Erro:', e.message);
  process.exit(1);
});
