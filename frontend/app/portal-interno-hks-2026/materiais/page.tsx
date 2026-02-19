'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen, Palette, Upload, Image, Wand2 } from 'lucide-react';
import Link from 'next/link';

const P = '/portal-interno-hks-2026';

const sections = [
  { id: 'vendas', label: 'Material de Vendas', icon: FolderOpen, href: `${P}/materiais`, description: 'PDFs, apresentações e material comercial', color: 'from-blue-500/20 to-blue-600/10' },
  { id: 'banners', label: 'CriativoPRO', icon: Palette, href: `${P}/materiais/banners`, description: 'Gerador de banners e criativos personalizados', color: 'from-[#D4AF37]/20 to-yellow-600/10', badge: 'PRO' },
  { id: 'ia-clone', label: 'IA Clone', icon: Wand2, href: `${P}/materiais/ia-clone`, description: 'Clonagem inteligente de criativos com IA', color: 'from-purple-500/20 to-purple-600/10', badge: 'NOVO' },
  { id: 'galeria', label: 'Galeria Salvas', icon: Image, href: `${P}/materiais/galeria`, description: 'Imagens e criativos salvos', color: 'from-green-500/20 to-green-600/10' },
  { id: 'uploads', label: 'Meus Uploads', icon: Upload, href: `${P}/materiais/uploads`, description: 'Arquivos enviados organizados por pasta', color: 'from-cyan-500/20 to-cyan-600/10' },
];

export default function MateriaisAdminPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          📁 Materiais
        </h1>
        <p className="text-white/60">
          Central de materiais de apoio, criativos e arquivos do sistema
        </p>
      </div>

      {/* Grid de seções */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.id} href={section.href}>
              <div className={cn(
                'relative p-6 rounded-xl border border-white/10 bg-gradient-to-br transition-all duration-300',
                'hover:border-[#D4AF37]/30 hover:shadow-lg hover:shadow-[#D4AF37]/5 hover:scale-[1.02]',
                section.color,
              )}>
                {section.badge && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] text-black">
                    {section.badge}
                  </span>
                )}
                <Icon className="h-8 w-8 text-[#D4AF37] mb-3" />
                <h3 className="text-lg font-semibold text-white mb-1">{section.label}</h3>
                <p className="text-sm text-white/50">{section.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
