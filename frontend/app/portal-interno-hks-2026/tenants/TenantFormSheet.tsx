'use client';

import { useState, useTransition, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X, Save, Upload, Plus, Trash2, Globe, Eye,
  Building2, Palette, Megaphone, Settings2, Crown,
  ChevronRight, CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { saveTenant, uploadTenantLogo, type TenantWithDomains, type TenantSavePayload } from '@/app/actions/tenant-admin';

// ─── Types ────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  tenant: TenantWithDomains | null;
  onSaved: () => void;
}

type Tab = 'basico' | 'visual' | 'marketing' | 'dominios' | 'config';

// ─── Preview Card (atualiza em tempo real) ─────────────────────

function TenantPreviewCard({
  name,
  slug,
  primary,
  secondary,
  accent,
  logoUrl,
}: {
  name: string;
  slug: string;
  primary: string;
  secondary: string;
  accent: string;
  logoUrl: string | null;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl border"
      style={{ borderColor: primary + '40', backgroundColor: secondary }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ backgroundColor: primary + '18', borderBottom: `1px solid ${primary}25` }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm"
          style={{ backgroundColor: primary + '30', color: primary }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="h-7 w-7 rounded object-contain" />
          ) : (
            (name || 'N').slice(0, 2).toUpperCase()
          )}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: primary }}>
            {name || 'Nome da Corretora'}
          </p>
          <p className="text-xs opacity-50" style={{ color: primary }}>
            /{slug || 'slug'}
          </p>
        </div>
      </div>

      {/* Sidebar simulada */}
      <div className="flex gap-0" style={{ backgroundColor: secondary }}>
        <div
          className="w-12 flex flex-col gap-1 py-3 px-2"
          style={{ backgroundColor: primary + '10', borderRight: `1px solid ${primary}20` }}
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 w-8 rounded-lg"
              style={{
                backgroundColor: i === 0 ? primary + '30' : primary + '08',
                border: i === 0 ? `1px solid ${primary}50` : 'none',
              }}
            />
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 p-3 space-y-2">
          {/* Título */}
          <div className="h-4 w-24 rounded" style={{ backgroundColor: primary + '40' }} />
          {/* Cards */}
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {[primary, accent, primary + '80'].map((c, i) => (
              <div
                key={i}
                className="rounded-lg p-2"
                style={{ backgroundColor: c + '20', border: `1px solid ${c}30` }}
              >
                <div className="h-2 w-8 rounded mb-1" style={{ backgroundColor: c + '60' }} />
                <div className="h-4 w-6 rounded" style={{ backgroundColor: c }} />
              </div>
            ))}
          </div>
          {/* Tabela simulada */}
          <div className="rounded-lg overflow-hidden mt-2" style={{ border: `1px solid ${primary}15` }}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex gap-2 px-2 py-1.5"
                style={{
                  backgroundColor: i % 2 === 0 ? 'transparent' : primary + '06',
                  borderBottom: i < 2 ? `1px solid ${primary}10` : 'none',
                }}
              >
                <div className="h-2 flex-1 rounded" style={{ backgroundColor: primary + '20' }} />
                <div
                  className="h-2 w-6 rounded"
                  style={{ backgroundColor: i === 0 ? accent : primary + '30' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2 text-center text-xs"
        style={{ backgroundColor: primary + '12', color: primary + 'aa' }}
      >
        Preview · {name || 'Corretora'}
      </div>
    </div>
  );
}

// ─── Color Picker Field ────────────────────────────────────────

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-gray-400">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative h-9 w-9 shrink-0 rounded-lg overflow-hidden border border-white/10 cursor-pointer">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <div className="h-full w-full rounded-lg" style={{ backgroundColor: value }} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
          }}
          maxLength={7}
          className="h-9 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-sm text-white focus:border-gold-500/50 focus:outline-none"
        />
      </div>
    </div>
  );
}

// ─── Field helper ─────────────────────────────────────────────

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-gray-400">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
    </div>
  );
}

function Input({
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-gray-600 focus:border-gold-500/50 focus:outline-none ${props.className ?? ''}`}
    />
  );
}

// ─── Main Form Sheet ───────────────────────────────────────────

const FEATURE_FLAGS = [
  { key: 'ai_whatsapp',   label: 'IA WhatsApp' },
  { key: 'social_flow',   label: 'Social Flow' },
  { key: 'cotacoes',      label: 'Cotações' },
  { key: 'meta_ads',      label: 'Meta Ads' },
  { key: 'crm_advanced',  label: 'CRM Avançado' },
  { key: 'tenant_switcher', label: 'Tenant Switcher' },
];

export default function TenantFormSheet({ open, onClose, tenant, onSaved }: Props) {
  const isEdit = !!tenant;
  const [activeTab, setActiveTab] = useState<Tab>('basico');
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  // Derivar estado inicial do tenant — sem useEffect para evitar cascading renders
  const initialName = tenant?.name ?? '';
  const initialSlug = tenant?.slug ?? '';
  const initialIsActive = tenant?.is_active ?? true;
  const initialPrimary = tenant?.primary_color ?? '#D4AF37';
  const initialSecondary = tenant?.secondary_color ?? '#050505';
  const initialAccent = tenant?.accent_color ?? '#F6E05E';
  const initialLogoUrl = tenant?.logo_url ?? null;
  const initialPixelFb = tenant?.pixel_id_fb ?? '';
  const initialGtmId = tenant?.tag_manager_id ?? '';
  const initialGaId = tenant?.ga_measurement_id ?? '';
  const initialPlan = tenant?.plan ?? 'standard';
  const initialMaxCorretores = tenant?.max_corretores ?? 10;
  const initialGestorEmail = tenant?.gestor_email ?? '';
  const initialGestorPhone = tenant?.gestor_phone ?? '';
  const initialCnpj = tenant?.cnpj ?? '';
  const initialSupportEmail = tenant?.support_email ?? '';
  const initialSiteUrl = tenant?.site_url ?? '';
  const initialDomains = tenant?.domains.map(d => d.domain) ?? [];
  const initialFeatures = tenant?.features ?? {};

  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [primary, setPrimary] = useState(initialPrimary);
  const [secondary, setSecondary] = useState(initialSecondary);
  const [accent, setAccent] = useState(initialAccent);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [pixelFb, setPixelFb] = useState(initialPixelFb);
  const [gtmId, setGtmId] = useState(initialGtmId);
  const [gaId, setGaId] = useState(initialGaId);
  const [plan, setPlan] = useState(initialPlan);
  const [maxCorretores, setMaxCorretores] = useState(initialMaxCorretores);
  const [gestorEmail, setGestorEmail] = useState(initialGestorEmail);
  const [gestorPhone, setGestorPhone] = useState(initialGestorPhone);
  const [cnpj, setCnpj] = useState(initialCnpj);
  const [supportEmail, setSupportEmail] = useState(initialSupportEmail);
  const [siteUrl, setSiteUrl] = useState(initialSiteUrl);
  const [domains, setDomains] = useState<string[]>(initialDomains);
  const [newDomain, setNewDomain] = useState('');
  const [features, setFeatures] = useState<Record<string, boolean>>(initialFeatures);
  const [uploading, setUploading] = useState(false);

  // Auto-gerar slug a partir do nome
  function handleNameChange(v: string) {
    setName(v);
    if (!isEdit) {
      setSlug(
        v.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  }

  // Upload de logo
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('slug', slug || 'novo');
    const res = await uploadTenantLogo(fd);
    setUploading(false);
    if (res.success && res.url) {
      setLogoUrl(res.url);
      toast.success('Logo enviada com sucesso');
    } else {
      toast.error(res.error ?? 'Erro no upload');
    }
  }

  // Adicionar domínio
  function addDomain() {
    const clean = newDomain.trim().toLowerCase()
      .replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!clean) return;
    if (domains.includes(clean)) { toast.error('Domínio já adicionado'); return; }
    setDomains(prev => [...prev, clean]);
    setNewDomain('');
  }

  // Salvar
  function handleSave() {
    startTransition(async () => {
      const payload: TenantSavePayload = {
        id: tenant?.id,
        name, slug, is_active: isActive,
        primary_color: primary, secondary_color: secondary, accent_color: accent,
        logo_url: logoUrl,
        pixel_id_fb: pixelFb || null,
        tag_manager_id: gtmId || null,
        ga_measurement_id: gaId || null,
        plan, max_corretores: maxCorretores,
        features,
        gestor_email: gestorEmail || null,
        gestor_phone: gestorPhone || null,
        cnpj: cnpj || null,
        support_email: supportEmail || null,
        support_phone: null,
        site_url: siteUrl || null,
        domains,
      };
      const res = await saveTenant(payload);
      if (res.success) {
        toast.success(isEdit ? 'Corretora atualizada!' : 'Corretora criada!');
        onSaved();
      } else {
        toast.error(res.error ?? 'Erro ao salvar');
      }
    });
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'basico',    label: 'Básico',    icon: <Building2 className="h-3.5 w-3.5" /> },
    { id: 'visual',    label: 'Visual',    icon: <Palette className="h-3.5 w-3.5" /> },
    { id: 'marketing', label: 'Marketing', icon: <Megaphone className="h-3.5 w-3.5" /> },
    { id: 'dominios',  label: 'Domínios',  icon: <Globe className="h-3.5 w-3.5" /> },
    { id: 'config',    label: 'Config',    icon: <Settings2 className="h-3.5 w-3.5" /> },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="flex-1 bg-black/70 backdrop-blur-sm"
      />

      {/* Painel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="flex w-full max-w-5xl bg-[#0a0a0a] border-l border-gold-500/15 flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gold-500/15 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-500/15">
              <Building2 className="h-5 w-5 text-gold-500" />
            </div>
            <div>
              <h2 className="font-semibold text-white">
                {isEdit ? `Editar: ${tenant?.name}` : 'Nova Corretora'}
              </h2>
              <p className="text-xs text-gray-500">
                {isEdit ? `ID: ${tenant?.id?.slice(0, 8)}...` : 'Preencha os dados da nova corretora parceira'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — 2 colunas */}
        <div className="flex flex-1 overflow-hidden">

          {/* Coluna esquerda: formulário */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex gap-1 border-b border-gold-500/10 px-4 pt-3">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
                    activeTab === t.id
                      ? 'border-b-2 border-gold-500 text-gold-500 bg-gold-500/5'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* ── BÁSICO ── */}
              {activeTab === 'basico' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Field label="Nome da Corretora *">
                    <Input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Ex: Arcfy Saúde" />
                  </Field>

                  <Field label="Slug (identificador único) *" hint="Letras minúsculas, números e hífen. Ex: arcfy">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">/</span>
                      <Input
                        value={slug}
                        onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="arcfy"
                        disabled={isEdit && !!tenant?.is_master}
                        className={isEdit && tenant?.is_master ? 'opacity-50 cursor-not-allowed' : ''}
                      />
                    </div>
                  </Field>

                  <Field label="Gestor — E-mail">
                    <Input value={gestorEmail} onChange={e => setGestorEmail(e.target.value)} placeholder="gestor@corretora.com.br" type="email" />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Gestor — Telefone">
                      <Input value={gestorPhone} onChange={e => setGestorPhone(e.target.value)} placeholder="(11) 99999-9999" />
                    </Field>
                    <Field label="CNPJ">
                      <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
                    </Field>
                  </div>

                  <Field label="Site da Corretora">
                    <Input value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder="https://arcfysaude.com.br" type="url" />
                  </Field>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isActive ? 'bg-green-500' : 'bg-gray-700'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-sm ${isActive ? 'text-green-400' : 'text-gray-500'}`}>
                      {isActive ? 'Corretora Ativa' : 'Corretora Inativa'}
                    </span>
                    {tenant?.is_master && <Crown className="h-4 w-4 text-amber-400" />}
                  </div>
                </motion.div>
              )}

              {/* ── VISUAL ── */}
              {activeTab === 'visual' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  {/* Logo upload */}
                  <Field label="Logo da Corretora">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/10 overflow-hidden"
                        style={{ backgroundColor: primary + '20' }}
                      >
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="logo" className="h-full w-full object-contain" />
                        ) : (
                          <Building2 className="h-8 w-8" style={{ color: primary }} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs text-gold-500 hover:bg-gold-500/20 transition-colors disabled:opacity-50"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {uploading ? 'Enviando...' : 'Enviar Logo'}
                        </button>
                        <p className="text-xs text-gray-600">PNG, JPG ou SVG · máx 2 MB</p>
                        {logoUrl && (
                          <button type="button" onClick={() => setLogoUrl(null)} className="text-xs text-red-400 hover:underline">Remover</button>
                        )}
                      </div>
                    </div>
                  </Field>

                  <div className="grid grid-cols-3 gap-4">
                    <ColorField label="Cor Primária" value={primary} onChange={setPrimary} />
                    <ColorField label="Cor Secundária" value={secondary} onChange={setSecondary} />
                    <ColorField label="Cor Destaque" value={accent} onChange={setAccent} />
                  </div>

                  <div className="rounded-lg border border-white/5 bg-white/2 p-3 text-xs text-gray-500 space-y-1">
                    <p><strong className="text-gray-400">Primária</strong> — Cor do logo, títulos e botões principais</p>
                    <p><strong className="text-gray-400">Secundária</strong> — Cor de fundo do dashboard e sidebar</p>
                    <p><strong className="text-gray-400">Destaque</strong> — Badges, indicadores e hover states</p>
                  </div>
                </motion.div>
              )}

              {/* ── MARKETING ── */}
              {activeTab === 'marketing' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Field label="Facebook Pixel ID" hint="Apenas o ID numérico. Ex: 1234567890">
                    <Input value={pixelFb} onChange={e => setPixelFb(e.target.value)} placeholder="1234567890" />
                  </Field>
                  <Field label="Google Tag Manager ID" hint="Formato GTM-XXXXXXX">
                    <Input value={gtmId} onChange={e => setGtmId(e.target.value)} placeholder="GTM-XXXXXXX" />
                  </Field>
                  <Field label="Google Analytics 4 ID" hint="Formato G-XXXXXXXXXX">
                    <Input value={gaId} onChange={e => setGaId(e.target.value)} placeholder="G-XXXXXXXXXX" />
                  </Field>
                  <div className="rounded-lg border border-blue-900/30 bg-blue-900/10 p-3 text-xs text-blue-400">
                    Os pixels são injetados <strong>exclusivamente</strong> nas Landing Pages do tenant. O dashboard não carrega os pixels do parceiro.
                  </div>
                </motion.div>
              )}

              {/* ── DOMÍNIOS ── */}
              {activeTab === 'dominios' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <Field label="Adicionar Domínio" hint="Sem http:// — Ex: arcfysaude.com.br">
                    <div className="flex gap-2">
                      <Input
                        value={newDomain}
                        onChange={e => setNewDomain(e.target.value)}
                        placeholder="arcfysaude.com.br"
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                      />
                      <button
                        type="button"
                        onClick={addDomain}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-500/15 text-gold-500 hover:bg-gold-500/25 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </Field>

                  {domains.length > 0 ? (
                    <div className="space-y-2">
                      {domains.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2">
                          <Globe className="h-4 w-4 shrink-0 text-blue-400" />
                          <span className="flex-1 text-sm text-white">{d}</span>
                          {i === 0 && (
                            <span className="rounded-full bg-green-900/40 px-2 py-0.5 text-xs text-green-400">principal</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setDomains(prev => prev.filter((_, j) => j !== i))}
                            className="text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-8 text-gray-600 gap-2">
                      <Globe className="h-8 w-8 opacity-30" />
                      <p className="text-sm">Nenhum domínio cadastrado</p>
                    </div>
                  )}

                  <div className="rounded-lg border border-amber-900/30 bg-amber-900/10 p-3 text-xs text-amber-400 space-y-1">
                    <p><strong>Como funciona:</strong> Quando alguém acessa <code className="bg-amber-900/30 px-1 rounded">mattosconnect.com.br</code>, o sistema detecta o domínio, identifica o tenant e exibe a Landing Page com as cores e pixels desta corretora.</p>
                    <p className="mt-1">O primeiro domínio da lista é considerado o <strong>principal</strong>.</p>
                  </div>
                </motion.div>
              )}

              {/* ── CONFIG ── */}
              {activeTab === 'config' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Plano">
                      <select
                        value={plan}
                        onChange={e => setPlan(e.target.value)}
                        className="h-9 w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 text-sm text-white focus:border-gold-500/50 focus:outline-none"
                      >
                        <option value="trial">Trial</option>
                        <option value="standard">Standard</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </Field>
                    <Field label="Máx. Corretores">
                      <Input
                        type="number"
                        value={maxCorretores}
                        onChange={e => setMaxCorretores(Number(e.target.value))}
                        min={1}
                        max={9999}
                      />
                    </Field>
                  </div>

                  <Field label="E-mail de Suporte (exibido ao corretor)">
                    <Input value={supportEmail} onChange={e => setSupportEmail(e.target.value)} placeholder="suporte@corretora.com.br" type="email" />
                  </Field>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">Feature Flags</p>
                    <div className="grid grid-cols-2 gap-2">
                      {FEATURE_FLAGS.map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFeatures(prev => ({ ...prev, [key]: !prev[key] }))}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                            features[key]
                              ? 'border-gold-500/40 bg-gold-500/10 text-gold-500'
                              : 'border-white/8 bg-white/2 text-gray-500 hover:border-white/15'
                          }`}
                        >
                          <CheckCircle className={`h-3.5 w-3.5 ${features[key] ? 'text-gold-500' : 'text-gray-700'}`} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer de ações */}
            <div className="border-t border-gold-500/10 px-6 py-4 flex items-center justify-between">
              <button
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isPending || !name || !slug}
                className="flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2 text-sm font-semibold text-black hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"ed"
              >
                <Save className="h-4 w-4" />
                {isPending ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Corretora'}
              </button>
            </div>
          </div>

          {/* Coluna direita: preview */}
          <div className="hidden w-72 shrink-0 flex-col gap-4 border-l border-gold-500/10 bg-[#060606] p-5 xl:flex">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Eye className="h-3.5 w-3.5 text-gold-500" />
              <span className="text-gold-500 font-medium">Preview ao vivo</span>
            </div>

            <TenantPreviewCard
              name={name}
              slug={slug}
              primary={primary}
              secondary={secondary}
              accent={accent}
              logoUrl={logoUrl}
            />

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3 text-gold-500" />
                <span>Cores aplicadas em tempo real</span>
              </div>
              <div className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3 text-gold-500" />
                <span>Simula o visual do dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3 text-gold-500" />
                <span>Ao salvar, entra em vigor imediatamente</span>
              </div>
            </div>

            {/* Swatches das cores atuais */}
            <div className="space-y-2 mt-2">
              {[
                { label: 'Primária', value: primary },
                { label: 'Secundária', value: secondary },
                { label: 'Destaque', value: accent },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded border border-white/10" style={{ backgroundColor: value }} />
                  <span className="text-xs text-gray-500">{label}</span>
                  <code className="ml-auto text-xs text-gray-600">{value}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
