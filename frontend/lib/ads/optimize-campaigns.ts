// =====================================================
// OTIMIZAÇÃO AUTOMÁTICA DE CAMPANHAS
// Humano Saúde — PAUSE / SCALE / NO_ACTION
// =====================================================

import { createServiceClient } from '../supabase';
import {
  getAdInsights,
  updateAdStatus,
  updateAdSetBudget,
  getAdSetDetails,
} from './meta-client';
import type { AdMetrics, MetaAdsConfig, OptimizationLog, OptimizationRules } from './types';
import { logger } from '@/lib/logger';

// Regras padrão (em centavos para budget, reais para spend)
const DEFAULT_RULES: OptimizationRules = {
  pauseSpendThreshold: 50, // R$50 gastos sem compra → PAUSE
  scaleRoasThreshold: 3.0, // ROAS > 3x → SCALE
  scaleBudgetIncrease: 0.20, // +20% no budget
  maxDailyBudget: 500, // Máximo R$500/dia
  datePreset: 'last_7d',
};

// =====================================================
// CARREGAR REGRAS DO SUPABASE
// =====================================================

async function loadRulesFromDatabase(): Promise<OptimizationRules> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('ads_optimization_rules')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      return {
        pauseSpendThreshold: data.pause_spend_threshold,
        scaleRoasThreshold: data.scale_roas_threshold,
        scaleBudgetIncrease: data.scale_budget_increase,
        maxDailyBudget: data.max_daily_budget,
        datePreset: data.date_preset,
      };
    }
  } catch {
    logger.warn('⚠️ Usando regras padrão de otimização');
  }
  return DEFAULT_RULES;
}

// =====================================================
// ANALISAR E OTIMIZAR
// =====================================================

interface OptimizationResult {
  totalAds: number;
  paused: number;
  scaled: number;
  noAction: number;
  logs: OptimizationLog[];
  errors: string[];
}

export async function optimizeCampaigns(
  customRules?: Partial<OptimizationRules>,
  metaConfigOverrides?: Partial<MetaAdsConfig>
): Promise<OptimizationResult> {
  const dbRules = await loadRulesFromDatabase();
  const rules: OptimizationRules = { ...dbRules, ...customRules };

  const result: OptimizationResult = {
    totalAds: 0,
    paused: 0,
    scaled: 0,
    noAction: 0,
    logs: [],
    errors: [],
  };

  try {
    // Buscar métricas de todos os ads
    const metrics = await getAdInsights(undefined, rules.datePreset, metaConfigOverrides);
    result.totalAds = metrics.length;

    if (metrics.length === 0) {
      return result;
    }

    // Enriquecer com daily_budget de cada AdSet
    const adSetBudgets = new Map<string, number>();

    for (const ad of metrics) {
      let dailyBudget = adSetBudgets.get(ad.adSetId);
      if (dailyBudget === undefined) {
        try {
          const details = await getAdSetDetails(ad.adSetId, metaConfigOverrides);
          dailyBudget = parseInt(details.daily_budget, 10) || 0;
          adSetBudgets.set(ad.adSetId, dailyBudget);
        } catch {
          dailyBudget = 0;
        }
      }
      ad.dailyBudget = dailyBudget;
    }

    // Avaliar cada ad
    for (const ad of metrics) {
      const log = await evaluateAd(ad, rules, metaConfigOverrides);
      result.logs.push(log);

      switch (log.actionType) {
        case 'PAUSE':
          result.paused++;
          break;
        case 'SCALE':
          result.scaled++;
          break;
        default:
          result.noAction++;
      }
    }

    // Salvar logs no Supabase
    await saveOptimizationLogs(result.logs);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    result.errors.push(msg);
    logger.error('❌ Erro na otimização:', msg);
  }

  return result;
}

// =====================================================
// AVALIAR AD INDIVIDUAL
// =====================================================

async function evaluateAd(
  ad: AdMetrics,
  rules: OptimizationRules,
  metaConfigOverrides?: Partial<MetaAdsConfig>
): Promise<OptimizationLog> {
  const metricsBefore = {
    spend: ad.spend,
    purchases: ad.purchases,
    roas: ad.roas,
    dailyBudget: ad.dailyBudget,
  };

  // REGRA 1: PAUSE — Gastou muito sem converter
  if (ad.spend >= rules.pauseSpendThreshold && ad.purchases === 0) {
    try {
      await updateAdStatus(ad.adId, 'PAUSED', metaConfigOverrides);
      return {
        adId: ad.adId,
        adName: ad.adName,
        adSetId: ad.adSetId,
        campaignId: ad.campaignId,
        actionType: 'PAUSE',
        reason: `Gasto R$${ad.spend.toFixed(2)} sem nenhuma conversão nos últimos 7 dias`,
        metricsBefore,
        metricsAfter: { status: 'PAUSED' },
      };
    } catch (error) {
      return {
        adId: ad.adId,
        adName: ad.adName,
        adSetId: ad.adSetId,
        campaignId: ad.campaignId,
        actionType: 'NO_ACTION',
        reason: `Tentou pausar mas falhou: ${error instanceof Error ? error.message : 'erro'}`,
        metricsBefore,
      };
    }
  }

  // REGRA 2: SCALE — ROAS alto, aumentar budget
  if (ad.roas >= rules.scaleRoasThreshold && ad.purchases > 0) {
    try {
      const currentBudget = ad.dailyBudget; // Em centavos
      const newBudget = Math.round(currentBudget * (1 + rules.scaleBudgetIncrease));
      const maxBudgetCents = rules.maxDailyBudget * 100;

      if (newBudget <= maxBudgetCents && currentBudget > 0) {
        await updateAdSetBudget(ad.adSetId, newBudget, metaConfigOverrides);
        return {
          adId: ad.adId,
          adName: ad.adName,
          adSetId: ad.adSetId,
          campaignId: ad.campaignId,
          actionType: 'SCALE',
          reason: `ROAS ${ad.roas.toFixed(2)}x — Budget aumentado de R$${(currentBudget / 100).toFixed(2)} para R$${(newBudget / 100).toFixed(2)} (+${(rules.scaleBudgetIncrease * 100).toFixed(0)}%)`,
          metricsBefore,
          metricsAfter: { daily_budget: newBudget },
        };
      }
    } catch (error) {
      return {
        adId: ad.adId,
        adName: ad.adName,
        adSetId: ad.adSetId,
        campaignId: ad.campaignId,
        actionType: 'NO_ACTION',
        reason: `ROAS alto mas falhou ao escalar: ${error instanceof Error ? error.message : 'erro'}`,
        metricsBefore,
      };
    }
  }

  // NENHUMA REGRA ATINGIDA
  return {
    adId: ad.adId,
    adName: ad.adName,
    adSetId: ad.adSetId,
    campaignId: ad.campaignId,
    actionType: 'NO_ACTION',
    reason: `Spend R$${ad.spend.toFixed(2)}, ROAS ${ad.roas.toFixed(2)}x, ${ad.purchases} compras — dentro dos limites`,
    metricsBefore,
  };
}

// =====================================================
// SALVAR LOGS NO SUPABASE
// =====================================================

async function saveOptimizationLogs(logs: OptimizationLog[]): Promise<void> {
  if (logs.length === 0) return;

  try {
    const supabase = createServiceClient();
    const rows = logs.map((log) => ({
      ad_id: log.adId,
      ad_name: log.adName,
      adset_id: log.adSetId,
      campaign_id: log.campaignId,
      action_type: log.actionType,
      reason: log.reason,
      metrics_before: log.metricsBefore,
      metrics_after: log.metricsAfter || null,
    }));

    const { error } = await supabase.from('optimization_logs').insert(rows);
    if (error) {
      logger.error('❌ Erro ao salvar logs de otimização:', error.message);
    }
  } catch (error) {
    logger.error('❌ Erro ao conectar com Supabase para logs:', error);
  }
}
