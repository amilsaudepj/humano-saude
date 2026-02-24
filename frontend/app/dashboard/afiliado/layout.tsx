'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, UserPlus } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { getAfiliadoLogado } from '@/app/actions/corretor-afiliados';

export default function AfiliadoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [tokenUnico, setTokenUnico] = useState<string | null>(null);
  const isLoginPage = pathname === '/dashboard/afiliado/login';

  useEffect(() => {
    if (!isLoginPage) {
      getAfiliadoLogado().then((res) => {
        if (res.success && res.afiliado?.token_unico) setTokenUnico(res.afiliado.token_unico);
      });
    }
  }, [isLoginPage]);

  if (isLoginPage) {
    return (
      <>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </>
    );
  }

  const handleLogout = () => {
    document.cookie = 'afiliado_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/dashboard/afiliado/login');
  };

  const indicarHref = tokenUnico ? `/indicar?ref=${encodeURIComponent(tokenUnico)}` : '/indicar';

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0a0a0a_0%,_#050505_50%,_#000000_100%)]" />
        <div className="absolute left-1/4 top-0 h-[400px] w-[400px] bg-[#D4AF37]/6 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] bg-[#F6E05E]/4 blur-[100px]" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/dashboard/afiliado" className="flex items-center gap-3">
            <Image src="/images/logos/LOGO 1 SEM FUNDO.png" alt="Humano Saúde" width={120} height={40} className="h-8 w-auto object-contain" />
            <span className="text-sm font-medium text-white/80 hidden sm:inline">Painel do Afiliado</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href={indicarHref} className="flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova indicação</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition-all">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
