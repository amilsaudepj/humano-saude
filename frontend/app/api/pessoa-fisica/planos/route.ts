import { NextResponse } from 'next/server';
import { getPlanos } from '@/app/actions/planos';
import type { PlanoComPrecos } from '@/app/actions/planos';

/** Logos oficiais das operadoras (pasta /images/operadoras). Uma por operadora. */
const OPERADORA_LOGO: Record<string, string> = {
  amil: '/images/operadoras/amil-logo.png',
  bradesco: '/images/operadoras/bradesco-logo.png',
  sulamerica: '/images/operadoras/sulamerica-logo.png',
  porto: '/images/operadoras/portosaude-logo.png',
  assim: '/images/operadoras/assimsaude-logo.png',
  preventsenior: '/images/operadoras/preventsenior-logo.png',
  levesaude: '/images/operadoras/levesaude-logo.png',
  medsenior: '/images/operadoras/medsenior-logo.png',
  unimed: '/images/operadoras/unimed-logo.png',
};

const FALLBACK_LOGO = '/images/logos/icon-humano.png';

/** Principais primeiro: Bradesco, SulAmérica, Amil; depois demais. */
const ORDEM_OPERADORAS = ['bradesco', 'sulamerica', 'amil', 'porto', 'assim', 'preventsenior', 'levesaude', 'medsenior'];

/** Placeholders para quando o banco não tem planos PF da operadora — principais sempre aparecem. */
const PLACEHOLDER_PRINCIPAIS: TabelaValorDTO[] = [
  { id: 'placeholder-bradesco', nomePlano: 'Planos PF', seguradora: 'Bradesco Saúde', logoSeguradora: OPERADORA_LOGO.bradesco, valorMensal: 'Consulte', beneficios: ['Rede nacional', 'Cobertura ampla', 'RJ'], destaque: true },
  { id: 'placeholder-sulamerica', nomePlano: 'Planos PF', seguradora: 'SulAmérica', logoSeguradora: OPERADORA_LOGO.sulamerica, valorMensal: 'Consulte', beneficios: ['Flexibilidade', 'Sem coparticipação', 'RJ'], destaque: false },
  { id: 'placeholder-amil', nomePlano: 'Planos PF', seguradora: 'Amil', logoSeguradora: OPERADORA_LOGO.amil, valorMensal: 'Consulte', beneficios: ['Rede nacional', 'Apartamento', 'RJ'], destaque: false },
];

export interface TabelaValorDTO {
  id: string;
  nomePlano: string;
  seguradora: string;
  logoSeguradora: string;
  valorMensal: string;
  beneficios: string[];
  destaque?: boolean;
}

function mapPlanoToTabelaValor(plano: PlanoComPrecos, index: number): TabelaValorDTO {
  const precos = (plano as PlanoComPrecos).precos_faixa ?? [];
  const minValor = precos.length
    ? Math.min(...precos.map((p) => Number(p.valor)))
    : 0;
  const valorMensal =
    minValor > 0 ? minValor.toFixed(2).replace('.', ',') : '—';

  const beneficios: string[] = [];
  if (plano.rede_hospitalar?.length) {
    beneficios.push(`Rede: ${plano.rede_hospitalar.slice(0, 3).join(', ')}${plano.rede_hospitalar.length > 3 ? ' e mais' : ''}`);
  }
  beneficios.push(plano.acomodacao || 'Apartamento');
  if (plano.coparticipacao) {
    beneficios.push(
      plano.coparticipacao_pct
        ? `Coparticipação ${Number(plano.coparticipacao_pct)}%`
        : 'Com coparticipação'
    );
  } else {
    beneficios.push('Sem coparticipação');
  }
  beneficios.push(plano.abrangencia || 'RJ');

  const operadoraKey = plano.operadora_id?.toLowerCase?.().replace(/\s+/g, '') ?? '';
  const logoSeguradora =
    OPERADORA_LOGO[operadoraKey] ?? FALLBACK_LOGO;

  return {
    id: plano.id,
    nomePlano: plano.plano_nome,
    seguradora: plano.operadora_nome,
    logoSeguradora,
    valorMensal,
    beneficios,
    destaque: index === 0,
  };
}

/** GET: lista planos PF para o carrossel — um plano por operadora (Amil, Bradesco, SulAmérica, Porto, ASSIM, PREVENT, LEVE, MED). */
export async function GET() {
  try {
    const result = await getPlanos({
      modalidade: 'PF',
      ativo: true,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    const planos = (result.data ?? []) as PlanoComPrecos[];
    const byOperadora = new Map<string, PlanoComPrecos>();
    for (const p of planos) {
      const key = (p.operadora_id ?? '').toLowerCase().replace(/\s+/g, '');
      if (!byOperadora.has(key)) byOperadora.set(key, p);
    }

    const ordered: PlanoComPrecos[] = [];
    for (const key of ORDEM_OPERADORAS) {
      const p = byOperadora.get(key);
      if (p) ordered.push(p);
    }
    for (const [key, p] of byOperadora) {
      if (!ORDEM_OPERADORAS.includes(key)) ordered.push(p);
    }

    let tabelaValores: TabelaValorDTO[] = ordered
      .map((p, i) => mapPlanoToTabelaValor(p, i));

    const operadoraKey = (nome: string) => (nome ?? '').toLowerCase().replace(/\s+/g, '');
    const hasOperadora = (key: string) => tabelaValores.some((t) => operadoraKey(t.seguradora) === key);
    const toPrepend: TabelaValorDTO[] = [];
    if (!hasOperadora('bradesco')) toPrepend.push(PLACEHOLDER_PRINCIPAIS[0]);
    if (!hasOperadora('sulamerica')) toPrepend.push(PLACEHOLDER_PRINCIPAIS[1]);
    if (!hasOperadora('amil')) toPrepend.push(PLACEHOLDER_PRINCIPAIS[2]);
    tabelaValores = [...toPrepend, ...tabelaValores];

    return NextResponse.json(tabelaValores);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro ao buscar planos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
