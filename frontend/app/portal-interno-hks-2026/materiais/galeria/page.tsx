'use client';

import { useState, useEffect } from 'react';
import {
  Image as ImageIcon, Download, Trash2, Loader2, FolderOpen,
  Search, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SavedImage {
  id: string;
  corretor_id: string;
  nome_corretor: string;
  template_id: string;
  status: string;
  imagem_url: string;
  metadata: {
    provider?: string;
    operadora?: string;
    plano?: string;
    formato?: string;
    savedAt?: string;
    persistent?: boolean;
  };
  created_at: string;
}

export default function GaleriaAdminPage() {
  const [images, setImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/corretor/banners/save-image?corretorId=all');
      const data = await res.json();
      if (data.success && data.images) {
        setImages(data.images);
      }
    } catch {
      toast.error('Erro ao carregar galeria');
    } finally {
      setLoading(false);
    }
  };

  const filtered = images.filter((img) =>
    !search || img.nome_corretor?.toLowerCase().includes(search.toLowerCase()) ||
    img.metadata?.operadora?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ImageIcon className="h-7 w-7 text-[#D4AF37]" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">Galeria de Criativos</h1>
        </div>
        <p className="text-white/60">Todos os criativos salvos pelos corretores</p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por corretor ou operadora..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 text-sm focus:border-[#D4AF37]/50 focus:outline-none"
          />
        </div>
        <span className="flex items-center text-sm text-white/40">{filtered.length} imagens</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <FolderOpen className="h-12 w-12 mb-3 opacity-40" />
          <p>Nenhuma imagem encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((img) => (
            <div key={img.id} className="group relative rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-[#D4AF37]/30 transition-all">
              <div className="aspect-square relative">
                <img src={img.imagem_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewUrl(img.imagem_url)}
                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <a href={img.imagem_url} download target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white">
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs text-white/70 truncate">{img.nome_corretor || 'Corretor'}</p>
                <p className="text-[10px] text-white/40">{img.metadata?.operadora || '—'} • {new Date(img.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setPreviewUrl('')}>
          <img src={previewUrl} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}
