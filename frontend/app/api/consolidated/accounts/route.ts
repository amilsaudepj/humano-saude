// =====================================================
// API: /api/consolidated/accounts — Connected Accounts
// Gerenciamento de contas conectadas (Meta, Google, GA4)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { isMetaConfigured, getMetaConfig } from '@/lib/ads/meta-client';
import type { PlatformAccount } from '@/lib/consolidator';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

function toPropertyId(candidate: unknown): string | null {
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return `${Math.trunc(candidate)}`;
  if (typeof candidate !== 'string') return null;
  const cleaned = candidate.trim();
  if (!cleaned) return null;
  if (cleaned.startsWith('properties/')) {
    const id = cleaned.slice('properties/'.length).trim();
    return /^\d+$/.test(id) ? id : null;
  }
  return /^\d+$/.test(cleaned) ? cleaned : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function extractGa4PropertyFromSettingsRow(row: Record<string, unknown>): string | null {
  const config = asRecord(row.config);
  const encrypted = asRecord(row.encrypted_credentials);
  return (
    toPropertyId(row.ga4_property_id) ||
    toPropertyId(row.google_analytics_property_id) ||
    toPropertyId(config.ga4_property_id) ||
    toPropertyId(config.google_analytics_property_id) ||
    toPropertyId(config.google_analytics_id) ||
    toPropertyId(encrypted.ga4_property_id) ||
    null
  );
}

// =====================================================
// GET — List connected accounts
// =====================================================

export async function GET() {
  try {
    const accounts: PlatformAccount[] = [];

    // 1. Meta Ads
    const metaConfigured = isMetaConfigured();
    if (metaConfigured) {
      const config = getMetaConfig();
      accounts.push({
        id: 'meta-ads',
        platform: 'meta',
        name: 'Meta Ads (Facebook & Instagram)',
        accountId: config.adAccountId ? `act_${config.adAccountId}` : '—',
        isConnected: true,
        lastSync: new Date().toISOString(),
        status: 'active',
      });
    } else {
      accounts.push({
        id: 'meta-ads',
        platform: 'meta',
        name: 'Meta Ads (Facebook & Instagram)',
        accountId: '',
        isConnected: false,
        lastSync: '',
        status: 'expired',
      });
    }

    // 2. Google Ads (check env)
    const googleConfigured = !!(process.env.GOOGLE_ADS_CLIENT_ID && process.env.GOOGLE_ADS_REFRESH_TOKEN);
    accounts.push({
      id: 'google-ads',
      platform: 'google',
      name: 'Google Ads',
      accountId: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
      isConnected: googleConfigured,
      lastSync: googleConfigured ? new Date().toISOString() : '',
      status: googleConfigured ? 'active' : 'expired',
    });

    // 3. GA4 (check env or Supabase settings)
    let ga4Connected = false;
    let ga4PropertyId = process.env.GA4_PROPERTY_ID || '';
    try {
      const supabase = createServiceClient();
      const { data } = await supabase
        .from('integration_settings')
        .select('*')
        .limit(50);

      if (Array.isArray(data)) {
        for (const rawRow of data) {
          const propertyId = extractGa4PropertyFromSettingsRow(rawRow as Record<string, unknown>);
          if (propertyId) {
            ga4PropertyId = propertyId;
            break;
          }
        }
      }
      ga4Connected = !!ga4PropertyId;
    } catch {
      ga4Connected = !!ga4PropertyId;
    }

    accounts.push({
      id: 'ga4',
      platform: 'ga4',
      name: 'Google Analytics 4',
      accountId: ga4PropertyId,
      isConnected: ga4Connected,
      lastSync: ga4Connected ? new Date().toISOString() : '',
      status: ga4Connected ? 'active' : 'expired',
    });

    return NextResponse.json({
      success: true,
      accounts,
      summary: {
        total: accounts.length,
        connected: accounts.filter(a => a.isConnected).length,
        disconnected: accounts.filter(a => !a.isConnected).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Accounts API Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST — Save account configuration
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, accountId, accessToken } = body;

    if (!platform || !accountId) {
      return NextResponse.json(
        { success: false, error: 'Platform e accountId são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: existingRows } = await supabase
      .from('integration_settings')
      .select('id, integration_name, config, encrypted_credentials')
      .eq('integration_name', 'system_config')
      .limit(1);

    const existing = Array.isArray(existingRows) && existingRows.length > 0 ? existingRows[0] : null;
    const nextConfig = asRecord(existing?.config);
    const nextEncrypted = asRecord(existing?.encrypted_credentials);

    if (platform === 'meta') {
      nextConfig.meta_ad_account_id = accountId;
      if (typeof accessToken === 'string' && accessToken.trim()) {
        nextEncrypted.meta_access_token = accessToken.trim();
      }
    } else if (platform === 'google') {
      nextConfig.google_ads_customer_id = accountId;
    } else if (platform === 'ga4') {
      nextConfig.ga4_property_id = accountId;
      nextConfig.google_analytics_property_id = accountId;
    }

    let error: { message: string } | null = null;
    if (existing?.id) {
      const res = await supabase
        .from('integration_settings')
        .update({
          config: nextConfig,
          encrypted_credentials: nextEncrypted,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      error = res.error ? { message: res.error.message } : null;
    } else {
      const res = await supabase
        .from('integration_settings')
        .insert({
          integration_name: 'system_config',
          user_id: null,
          encrypted_credentials: nextEncrypted,
          config: nextConfig,
          is_active: true,
        });
      error = res.error ? { message: res.error.message } : null;
    }

    if (error) {
      logger.error('❌ Save account error:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar configuração' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Conta ${platform} configurada com sucesso`,
    });
  } catch (error) {
    logger.error('❌ Accounts POST Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
