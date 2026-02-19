'use client';

import { useState, useEffect } from 'react';
import {
  Upload, FileText, FolderOpen, Loader2, Image as ImageIcon,
  Download, Search, File,
} from 'lucide-react';
import { toast } from 'sonner';

interface UploadItem {
  id: string;
  corretor_id: string;
  nome: string;
  file_path: string;
  file_url: string;
  tipo_arquivo: string;
  tamanho_bytes: number;
  pasta: string;
  created_at: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function UploadsAdminPage() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/corretor/uploads?all=true');
      const data = await res.json();
      if (data.success && data.uploads) {
        setUploads(data.uploads);
      }
    } catch {
      toast.error('Erro ao carregar uploads');
    } finally {
      setLoading(false);
    }
  };

  const filtered = uploads.filter((u) =>
    !search || u.nome?.toLowerCase().includes(search.toLowerCase()) ||
    u.pasta?.toLowerCase().includes(search.toLowerCase()),
  );

  const FileIcon = ({ tipo }: { tipo: string }) => {
    if (tipo?.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-400" />;
    if (tipo === 'application/pdf') return <FileText className="h-5 w-5 text-red-400" />;
    return <File className="h-5 w-5 text-white/40" />;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Upload className="h-7 w-7 text-[#D4AF37]" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">Uploads</h1>
        </div>
        <p className="text-white/60">Todos os arquivos enviados pelos corretores</p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por nome ou pasta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 text-sm focus:border-[#D4AF37]/50 focus:outline-none"
          />
        </div>
        <span className="flex items-center text-sm text-white/40">{filtered.length} arquivos</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <FolderOpen className="h-12 w-12 mb-3 opacity-40" />
          <p>Nenhum upload encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-[#D4AF37]/20 transition-all"
            >
              <FileIcon tipo={item.tipo_arquivo} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{item.nome}</p>
                <p className="text-xs text-white/40">
                  {item.pasta || 'Geral'} • {formatFileSize(item.tamanho_bytes)} • {new Date(item.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <a
                href={item.file_url}
                download
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
