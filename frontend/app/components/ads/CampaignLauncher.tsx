'use client';

// =====================================================
// COMPONENT: CampaignLauncher — Formulário de Lançamento
// Interface para criar e lançar campanhas via /api/ads/launch
// =====================================================

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Rocket,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Images,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

interface LaunchResult {
  success: boolean;
  partial?: boolean;
  warnings?: string[];
  data?: {
    campaignId: string;
    adSetId: string;
    creativeId?: string | null;
    adId?: string | null;
    adCreativeIds?: string[];
    adIds?: string[];
    campaignName: string;
    dailyBudget: string;
    status: string;
    imagesProcessed?: number;
    variationsCreated?: number;
    copy: { primaryText: string; headline: string; description: string };
  };
  error?: string;
}

const OBJECTIVES = [
  { value: 'CONVERSAO', label: 'Conversão (Vendas)' },
  { value: 'LEADS', label: 'Geração de Leads' },
  { value: 'TRAFEGO', label: 'Tráfego para o Site' },
  { value: 'ENGAJAMENTO', label: 'Engajamento' },
  { value: 'ALCANCE', label: 'Alcance / Awareness' },
];

const FUNNEL_STAGES = [
  { value: 'TOPO', label: 'Topo de Funil' },
  { value: 'MEIO', label: 'Meio de Funil' },
  { value: 'FUNDO', label: 'Fundo de Funil' },
];

const AUDIENCES = [
  { value: 'Empresas PME', label: 'Empresas PME' },
  { value: 'Plano Familiar', label: 'Famílias' },
  { value: 'Profissionais Autônomos', label: 'Autônomos / MEI' },
  { value: 'Médicos e Dentistas', label: 'Médicos e Dentistas' },
  { value: 'RH e Benefícios', label: 'RH e Benefícios' },
  { value: 'Saúde', label: 'Saúde (Geral)' },
];

const MAX_IMAGES = 5;

export default function CampaignLauncher() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LaunchResult | null>(null);

  const [name, setName] = useState('');
  const [dailyBudget, setDailyBudget] = useState('50');
  const [objective, setObjective] = useState('CONVERSAO');
  const [funnelStage, setFunnelStage] = useState('TOPO');
  const [audience, setAudience] = useState('Empresas PME');
  const [primaryText, setPrimaryText] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('https://humanosaude.com.br');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [generateCopy, setGenerateCopy] = useState(false);
  const [launchPaused, setLaunchPaused] = useState(true);

  const fileSummary = useMemo(() => {
    if (!imageFiles.length) return 'Nenhuma imagem selecionada';
    return `${imageFiles.length} imagem(ns) pronta(s) para upload`;
  }, [imageFiles]);

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []).slice(0, MAX_IMAGES);
    setImageFiles(selected);
  }

  async function handleLaunch() {
    if (!name.trim()) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }

    if (!generateCopy && (!primaryText.trim() || !headline.trim())) {
      toast.error('Preencha o texto principal e título, ou ative a geração automática');
      return;
    }

    if (!linkUrl.trim()) {
      toast.error('URL de destino é obrigatória');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('dailyBudget', dailyBudget);
      formData.append('objective', objective);
      formData.append('funnelStage', funnelStage);
      formData.append('audience', audience);
      formData.append('description', description.trim());
      formData.append('linkUrl', linkUrl.trim());
      formData.append('status', launchPaused ? 'PAUSED' : 'ACTIVE');
      formData.append('generateCopy', String(generateCopy));

      if (imageUrl.trim()) {
        formData.append('imageUrl', imageUrl.trim());
      }

      if (!generateCopy) {
        formData.append('primaryText', primaryText.trim());
        formData.append('headline', headline.trim());
      }

      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      const res = await fetch('/api/ads/launch', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json()) as LaunchResult;
      setResult(data);

      if (data.success) {
        const partialSuffix = data.partial ? ' (com alertas)' : '';
        toast.success(`Campanha "${data.data?.campaignName}" criada com sucesso${partialSuffix}!`);
      } else {
        toast.error(data.error || 'Erro ao lançar campanha');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro de rede');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Lançar Campanha
        </CardTitle>
        <CardDescription>
          Crie uma campanha completa na Meta (Campaign → AdSet → Creative → Ads em lote)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="campaign-name">Nome da Campanha</Label>
          <Input
            id="campaign-name"
            placeholder="Ex: Black Friday PME"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Objetivo</Label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OBJECTIVES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Funil</Label>
            <Select value={funnelStage} onValueChange={setFunnelStage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FUNNEL_STAGES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Público</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="budget">Orçamento Diário (R$)</Label>
            <Input
              id="budget"
              type="number"
              min="5"
              step="5"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="link-url">URL de Destino</Label>
            <Input
              id="link-url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">Gerar copy com IA</p>
            <p className="text-xs text-muted-foreground">GPT-4o cria variações por imagem automaticamente</p>
          </div>
          <Switch checked={generateCopy} onCheckedChange={setGenerateCopy} />
        </div>

        {!generateCopy && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="primary-text">Texto Principal</Label>
              <Textarea
                id="primary-text"
                rows={3}
                placeholder="Texto que aparece acima da imagem no feed..."
                value={primaryText}
                onChange={(e) => setPrimaryText(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="headline">Título</Label>
                <Input
                  id="headline"
                  placeholder="Ex: Compare Planos de Saúde Grátis"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  placeholder="Texto abaixo do título"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Images className="h-4 w-4" />
            Upload de Imagens (até {MAX_IMAGES})
          </div>
          <label
            htmlFor="campaign-images"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-6 text-sm text-muted-foreground transition hover:bg-muted/40"
          >
            <Upload className="h-4 w-4" />
            {fileSummary}
          </label>
          <Input
            id="campaign-images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="hidden"
          />
          {imageFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
              {imageFiles.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="rounded-md border p-2 text-xs text-muted-foreground">
                  {file.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="image-url">URL de Imagem Externa (opcional)</Label>
          <Input
            id="image-url"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 rounded-lg border p-3">
          <div className="flex-1">
            <p className="text-sm font-medium">Lançar pausado</p>
            <p className="text-xs text-muted-foreground">Revise antes de ativar (recomendado)</p>
          </div>
          <Switch checked={launchPaused} onCheckedChange={setLaunchPaused} />
        </div>

        <Button
          onClick={handleLaunch}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando campanha...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              {launchPaused ? 'Criar Campanha (Pausada)' : 'Lançar Campanha'}
            </>
          )}
        </Button>

        {result && (
          <div
            className={`mt-4 rounded-lg border p-4 ${
              result.success
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
            }`}
          >
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
              )}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">
                  {result.success ? 'Campanha criada com sucesso!' : 'Erro ao criar campanha'}
                </p>

                {result.success && result.data && (
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <p>Campaign ID: <code>{result.data.campaignId}</code></p>
                    <p>AdSet ID: <code>{result.data.adSetId}</code></p>
                    <p>Ads criados: {result.data.adIds?.length || 0}</p>
                    <p>Criativos criados: {result.data.adCreativeIds?.length || 0}</p>
                    <p>Imagens processadas: {result.data.imagesProcessed || 0}</p>
                    <p>Variações criadas: {result.data.variationsCreated || 0}</p>
                    <p>Orçamento: {result.data.dailyBudget}/dia</p>
                    <p>Status: {result.data.status}</p>
                  </div>
                )}

                {result.partial && result.warnings && result.warnings.length > 0 && (
                  <div className="rounded border border-yellow-300 bg-yellow-100/60 p-2 text-xs text-yellow-900 dark:border-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-200">
                    <p className="font-semibold">Lançamento concluído com alertas:</p>
                    {result.warnings.slice(0, 5).map((warning, idx) => (
                      <p key={`${warning}-${idx}`}>• {warning}</p>
                    ))}
                  </div>
                )}

                {result.error && (
                  <p className="text-xs text-red-600">{result.error}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
