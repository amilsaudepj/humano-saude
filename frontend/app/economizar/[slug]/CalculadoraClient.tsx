'use client';

import CalculadoraEconomia from '../components/CalculadoraEconomia';
import type { CorretorPublico } from '@/app/actions/leads-indicacao';

export default function CalculadoraClient({
  corretor,
  afiliadoId,
}: {
  corretor: CorretorPublico;
  afiliadoId?: string;
}) {
  return <CalculadoraEconomia corretor={corretor} afiliadoId={afiliadoId} />;
}
