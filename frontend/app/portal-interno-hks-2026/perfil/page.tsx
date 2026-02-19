'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { User, Camera, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminProfile, saveAdminProfile } from '@/app/actions/integrations';

export default function PerfilPage() {
  const [profile, setProfile] = useState({
    nome: 'Administrador',
    email: 'admin@humanosaude.com',
    telefone: '',
    cargo: 'Administrador',
    empresa: 'Humano Saúde',
    susep: '',
    foto_url: '' as string | null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const res = await getAdminProfile();
      if (res.success && res.data) {
        setProfile((prev) => ({ ...prev, ...(res.data as typeof prev) }));
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await saveAdminProfile(profile as unknown as Record<string, unknown>);
    setSaving(false);
    if (res.success) {
      toast.success('Perfil atualizado com sucesso');
    } else {
      toast.error('Erro ao salvar perfil', { description: res.error });
    }
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    setUploadingFoto(true);
    try {
      const formData = new FormData();
      formData.append('foto', file);

      const res = await fetch('/api/admin/foto', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        setProfile((prev) => ({ ...prev, foto_url: data.foto_url }));
        toast.success('Foto atualizada!');
      } else {
        toast.error(data.error || 'Erro ao enviar foto');
      }
    } catch {
      toast.error('Erro ao enviar foto');
    } finally {
      setUploadingFoto(false);
      if (fotoInputRef.current) fotoInputRef.current.value = '';
    }
  }

  async function handleFotoRemove() {
    setUploadingFoto(true);
    try {
      const res = await fetch('/api/admin/foto', { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setProfile((prev) => ({ ...prev, foto_url: null }));
        toast.success('Foto removida');
      } else {
        toast.error(data.error || 'Erro ao remover foto');
      }
    } catch {
      toast.error('Erro ao remover foto');
    } finally {
      setUploadingFoto(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-[#D4AF37]" style={{ fontFamily: 'Perpetua Titling MT, serif' }}>
            PERFIL
          </h1>
          <p className="mt-2 text-gray-400">Informações do seu perfil</p>
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

      {/* Avatar Section com Upload */}
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
        <div className="flex items-center gap-6">
          {/* Foto com hover overlay */}
          <div className="relative group">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-[#D4AF37] to-[#F6E05E] flex items-center justify-center">
              {profile.foto_url ? (
                <Image
                  src={profile.foto_url}
                  alt="Foto do perfil"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-black" />
              )}
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {uploadingFoto ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <>
                  <button
                    onClick={() => fotoInputRef.current?.click()}
                    className="rounded-full bg-[#D4AF37] p-1.5 text-white hover:bg-[#F6E05E] transition-colors"
                    title="Alterar foto"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  {profile.foto_url && (
                    <button
                      onClick={handleFotoRemove}
                      className="rounded-full bg-red-600 p-1.5 text-white hover:bg-red-500 transition-colors"
                      title="Remover foto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>

            <input
              ref={fotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFotoUpload}
              className="hidden"
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">{profile.nome}</h2>
            <p className="text-sm text-gray-400">{profile.cargo} — {profile.empresa}</p>
            <p className="text-sm text-[#D4AF37] mt-1">{profile.email}</p>
            <p className="text-xs text-gray-500 mt-1">Passe o mouse na foto para alterar</p>
          </div>
        </div>
      </div>

      {/* Informações Pessoais */}
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Informações Pessoais</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome Completo</label>
            <input
              type="text"
              value={profile.nome}
              onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-[#D4AF37]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-[#D4AF37]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Telefone</label>
            <input
              type="tel"
              value={profile.telefone}
              onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cargo</label>
            <select
              value={profile.cargo}
              onChange={(e) => setProfile({ ...profile, cargo: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white focus:border-[#D4AF37]/50 focus:outline-none"
            >
              <option value="Administrador">Administrador</option>
              <option value="Gestor de Tráfego">Gestor de Tráfego</option>
              <option value="Assistente">Assistente</option>
              <option value="Corretor">Corretor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dados Profissionais */}
      <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Dados Profissionais</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Registro SUSEP</label>
            <input
              type="text"
              value={profile.susep}
              onChange={(e) => setProfile({ ...profile, susep: e.target.value })}
              placeholder="Número SUSEP"
              className="w-full rounded-lg border border-white/10 bg-[#111] px-4 py-2 text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
