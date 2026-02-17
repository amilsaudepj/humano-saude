'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Building, Globe, Bell, Shield, Palette, Mail, Phone, Loader2, Users, Plus, MoreVertical, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { getSystemConfig, saveSystemConfig } from '@/app/actions/integrations';
import { getEquipe, convidarMembro, updateMembroRole, toggleMembroAtivo, removerMembro, type MembroEquipe } from '@/app/actions/equipe';
import { getInitials } from '@/lib/utils';

interface Config {
  empresa_nome: string;
  empresa_cnpj: string;
  empresa_telefone: string;
  empresa_email: string;
  empresa_site: string;
  whatsapp_api_token: string;
  meta_pixel_id: string;
  google_analytics_id: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  notificar_novo_lead: boolean;
  notificar_cotacao: boolean;
  notificar_proposta: boolean;
  tema: 'dark' | 'light';
}

const DEFAULT_CONFIG: Config = {
  empresa_nome: 'Humano Saúde',
  empresa_cnpj: '',
  empresa_telefone: '',
  empresa_email: '',
  empresa_site: '',
  whatsapp_api_token: '',
  meta_pixel_id: '',
  google_analytics_id: '',
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  notificar_novo_lead: true,
  notificar_cotacao: true,
  notificar_proposta: true,
  tema: 'dark',
};

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState('empresa');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [equipe, setEquipe] = useState<MembroEquipe[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState<{ nome: string; email: string; role: 'corretor' | 'supervisor' | 'admin' }>({ nome: '', email: '', role: 'corretor' });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    async function load() {
      const [res, membros] = await Promise.all([
        getSystemConfig(),
        getEquipe(),
      ]);
      if (res.success && res.data) {
        setConfig({ ...DEFAULT_CONFIG, ...res.data } as Config);
      }
      setEquipe(membros);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await saveSystemConfig(config as unknown as Record<string, unknown>);
    setSaving(false);
    if (res.success) {
      toast.success('Configurações salvas com sucesso');
    } else {
      toast.error('Erro ao salvar configurações', { description: res.error });
    }
  }

  const tabs = [
    { key: 'empresa', label: 'Empresa', icon: Building },
    { key: 'equipe', label: 'Equipe', icon: Users },
    { key: 'notificacoes', label: 'Notificações', icon: Bell },
    { key: 'integracoes', label: 'APIs', icon: Globe },
    { key: 'email', label: 'Email (SMTP)', icon: Mail },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            CONFIGURAÇÕES
          </h1>
          <p className="mt-2 text-gray-400">Configurações gerais do sistema</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white hover:bg-[#F6E05E] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === t.key
                ? 'bg-[#D4AF37] text-white'
                : 'border border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Empresa */}
      {activeTab === 'empresa' && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building className="h-5 w-5 text-[#D4AF37]" /> Dados da Empresa
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { key: 'empresa_nome', label: 'Nome da Empresa', type: 'text' },
              { key: 'empresa_cnpj', label: 'CNPJ', type: 'text' },
              { key: 'empresa_telefone', label: 'Telefone', type: 'tel' },
              { key: 'empresa_email', label: 'Email', type: 'email' },
              { key: 'empresa_site', label: 'Site', type: 'url' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  value={(config as any)[field.key]}
                  onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-500 focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notificações */}
      {activeTab === 'notificacoes' && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#D4AF37]" /> Notificações
          </h2>
          {[
            { key: 'notificar_novo_lead', label: 'Notificar quando novo lead for capturado' },
            { key: 'notificar_cotacao', label: 'Notificar quando cotação for gerada' },
            { key: 'notificar_proposta', label: 'Notificar quando proposta for aceita' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between p-4 rounded-lg border border-white/5 hover:bg-white/5 cursor-pointer">
              <span className="text-sm text-gray-300">{item.label}</span>
              <button
                onClick={() => setConfig({ ...config, [item.key]: !(config as any)[item.key] })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  (config as any)[item.key] ? 'bg-[#D4AF37]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    (config as any)[item.key] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      )}

      {/* APIs */}
      {activeTab === 'integracoes' && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#D4AF37]" /> APIs e Integrações
          </h2>
          {[
            { key: 'whatsapp_api_token', label: 'WhatsApp API Token', placeholder: 'Token da API do WhatsApp Business' },
            { key: 'meta_pixel_id', label: 'Meta Pixel ID', placeholder: 'ID do pixel do Facebook' },
            { key: 'google_analytics_id', label: 'GA4 Property ID (numérico)', placeholder: 'Ex: 123456789' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
              <input
                type="text"
                value={(config as any)[field.key]}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none font-mono text-sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* SMTP */}
      {activeTab === 'email' && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#D4AF37]" /> Configuração SMTP
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { key: 'smtp_host', label: 'Host SMTP', placeholder: 'smtp.gmail.com' },
              { key: 'smtp_port', label: 'Porta', placeholder: '587' },
              { key: 'smtp_user', label: 'Usuário', placeholder: 'email@empresa.com' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
                <input
                  type="text"
                  value={(config as any)[field.key]}
                  onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipe */}
      {activeTab === 'equipe' && (
        <div className="space-y-4">
          {/* Header equipe */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-[#D4AF37]" /> Equipe
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {equipe.filter(m => m.ativo).length} membros ativos de {equipe.length} total
              </p>
            </div>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white hover:bg-[#F6E05E] transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Convidar Membro
            </button>
          </div>

          {/* Modal convite */}
          {showInvite && (
            <div className="rounded-lg border border-[#D4AF37]/30 bg-[#0a0a0a] p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold">Novo Membro</h3>
                <button onClick={() => setShowInvite(false)} className="text-gray-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nome</label>
                  <input
                    type="text"
                    value={inviteData.nome}
                    onChange={(e) => setInviteData({ ...inviteData, nome: e.target.value })}
                    placeholder="Nome completo"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    placeholder="corretor@email.com"
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Função</label>
                  <select
                    value={inviteData.role}
                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as 'corretor' | 'supervisor' | 'admin' })}
                    className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-[#D4AF37]/50 focus:outline-none"
                  >
                    <option value="corretor">Corretor</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowInvite(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!inviteData.nome || !inviteData.email) {
                      toast.error('Preencha nome e email');
                      return;
                    }
                    setInviting(true);
                    const res = await convidarMembro(inviteData);
                    setInviting(false);
                    if (res.success) {
                      toast.success('Membro adicionado com sucesso!');
                      setShowInvite(false);
                      setInviteData({ nome: '', email: '', role: 'corretor' });
                      const updated = await getEquipe();
                      setEquipe(updated);
                    } else {
                      toast.error(res.error || 'Erro ao convidar');
                    }
                  }}
                  disabled={inviting}
                  className="flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-white hover:bg-[#F6E05E] transition-colors disabled:opacity-50"
                >
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {inviting ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          )}

          {/* Lista de membros */}
          <div className="space-y-3">
            {equipe.map((membro) => (
              <div
                key={membro.id}
                className={`rounded-lg border bg-[#0a0a0a] p-4 transition-all ${
                  membro.ativo ? 'border-white/10' : 'border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      {membro.foto_url ? (
                        <img
                          src={membro.foto_url}
                          alt={membro.nome}
                          className="h-10 w-10 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-sm font-bold text-[#D4AF37]">
                          {getInitials(membro.nome)}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a0a0a] ${
                          membro.ativo ? 'bg-green-500' : 'bg-gray-500'
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div>
                      <p className="text-sm font-medium text-white">{membro.nome}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {membro.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Role badge */}
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      membro.role === 'admin'
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
                        : membro.role === 'supervisor'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}>
                      <span className="flex items-center gap-1">
                        {membro.role === 'admin' ? <Shield className="h-3 w-3" /> : null}
                        {membro.role === 'admin' ? 'Admin' : membro.role === 'supervisor' ? 'Supervisor' : 'Corretor'}
                      </span>
                    </span>

                    {/* Comissão */}
                    <span className="text-xs text-gray-500 hidden md:block">
                      {membro.comissao_padrao_pct}% comissão
                    </span>

                    {/* Actions dropdown */}
                    <div className="relative group">
                      <button className="rounded-lg p-2 text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-white/10 bg-[#111] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        {/* Alterar role */}
                        {['admin', 'supervisor', 'corretor'].filter(r => r !== membro.role).map((role) => (
                          <button
                            key={role}
                            onClick={async () => {
                              const res = await updateMembroRole(membro.id, role as MembroEquipe['role']);
                              if (res.success) {
                                toast.success(`Função alterada para ${role}`);
                                const updated = await getEquipe();
                                setEquipe(updated);
                              } else {
                                toast.error(res.error || 'Erro');
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 first:rounded-t-lg"
                          >
                            Tornar {role === 'admin' ? 'Admin' : role === 'supervisor' ? 'Supervisor' : 'Corretor'}
                          </button>
                        ))}
                        <div className="border-t border-white/5" />
                        <button
                          onClick={async () => {
                            const res = await toggleMembroAtivo(membro.id, !membro.ativo);
                            if (res.success) {
                              toast.success(membro.ativo ? 'Acesso desativado' : 'Acesso reativado');
                              const updated = await getEquipe();
                              setEquipe(updated);
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-white/5"
                        >
                          {membro.ativo ? 'Desativar acesso' : 'Reativar acesso'}
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Remover ${membro.nome} da equipe?`)) return;
                            const res = await removerMembro(membro.id);
                            if (res.success) {
                              toast.success('Membro removido');
                              setEquipe(prev => prev.filter(m => m.id !== membro.id));
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 last:rounded-b-lg"
                        >
                          Remover da equipe
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {equipe.length === 0 && (
              <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-12 text-center">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Nenhum membro na equipe</p>
                <p className="text-sm text-gray-600 mt-1">Convide o primeiro corretor para começar</p>
              </div>
            )}
          </div>

          {/* Permissões por função */}
          <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#D4AF37]" /> Permissões por Função
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <PermissionCard
                role="Administrador"
                cor="text-[#D4AF37]"
                permissions={[
                  'Acesso total ao sistema',
                  'Gerenciar equipe e convites',
                  'Configurar pipelines e integrações',
                  'Relatórios financeiros completos',
                ]}
              />
              <PermissionCard
                role="Supervisor"
                cor="text-purple-400"
                permissions={[
                  'Gerenciar deals e contatos',
                  'Ver relatórios da equipe',
                  'Configurar pipelines',
                  'Não pode gerenciar membros',
                ]}
              />
              <PermissionCard
                role="Corretor"
                cor="text-gray-400"
                permissions={[
                  'Criar e gerenciar seus deals',
                  'Adicionar contatos e empresas',
                  'Ver relatórios pessoais',
                  'Acesso ao portal do corretor',
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PermissionCard({ role, cor, permissions }: { role: string; cor: string; permissions: string[] }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-3">
      <h4 className={`font-medium ${cor}`}>{role}</h4>
      <ul className="space-y-1.5">
        {permissions.map((p, i) => (
          <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
            <span className="text-[#D4AF37] mt-0.5">•</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
