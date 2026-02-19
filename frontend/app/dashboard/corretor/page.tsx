import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardOverview from './components/DashboardOverview';
import { getCorretorById } from '@/app/actions/corretor-ops';
import { verifyToken } from '@/lib/auth-jwt';

export const metadata = {
  title: 'Visão Geral · Corretor | Humano Saúde',
};

export default async function CorretorDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('corretor_token')?.value;

  if (!token) {
    redirect('/dashboard/corretor/login');
  }

  const jwt = await verifyToken(token);
  const corretorId = jwt?.corretor_id;

  if (!corretorId) {
    redirect('/dashboard/corretor/login');
  }

  const result = await getCorretorById(corretorId);

  if (!result.success || !result.data) {
    redirect('/dashboard/corretor/login');
  }

  const dbCorretorId = String(result.data.id ?? '');
  const nomeCompleto = String(result.data.nome ?? 'Corretor');

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Bem-vindo, <span className="text-[#D4AF37]">{nomeCompleto.split(' ')[0]}</span>
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Painel Operacional · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>
      <div data-tour="corretor-overview">
        <DashboardOverview corretorId={dbCorretorId} />
      </div>
    </div>
  );
}
