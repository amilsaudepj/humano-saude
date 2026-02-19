'use client';

import ComissoesPanel from '../../components/ComissoesPanel';
import GradeInfoCard from '../../components/GradeInfoCard';
import { useCorretorId } from '../../hooks/useCorretorToken';

export default function ComissoesPage() {
  const corretorId = useCorretorId();

  if (!corretorId) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <GradeInfoCard corretorId={corretorId} />
      <ComissoesPanel corretorId={corretorId} />
    </div>
  );
}
