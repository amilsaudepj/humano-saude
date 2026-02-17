export type SalesPlaybookDay = {
  id: string;
  label: string;
  description: string;
  template: string;
};

export type SalesPlaybookPhase = {
  label: string;
  days: SalesPlaybookDay[];
};

export const salesPlaybook = {
  novo: {
    label: 'Novo',
    days: [
      {
        id: 'd1',
        label: 'Dia 1',
        description: 'Primeiro contato e diagnostico rapido',
        template:
          'Oi {{first_name}}, tudo bem? Sou da Humano Saude e vi seu interesse em reduzir custos no plano da {{company_profile}}. Posso te mostrar uma opcao com economia real e rede credenciada forte para o seu perfil?',
      },
      {
        id: 'd2',
        label: 'Dia 2',
        description: 'Reforco de proposta de valor',
        template:
          'Oi {{first_name}}! Separei uma analise inicial para sua operacao. Hoje voce paga em torno de {{current_price}} e temos alternativas com melhor custo-beneficio e rede credenciada mais aderente. Quer que eu te envie os detalhes?',
      },
      {
        id: 'd4',
        label: 'Dia 4',
        description: 'Chamada para acao curta',
        template:
          'Passando para facilitar sua decisao, {{first_name}}. A Humano Saude consegue apoiar a {{company_profile}} com economia recorrente e atendimento proximo. Podemos fechar uma simulacao em 10 minutos?',
      },
    ],
  },
  follow_up: {
    label: 'Follow-up',
    days: [
      {
        id: 'd1',
        label: 'Dia 1',
        description: 'Follow-up logo apos proposta',
        template:
          'Oi {{first_name}}, conseguiu olhar a proposta? Identificamos potencial de economia de {{economy_estimate}} sem perder acesso a uma rede credenciada completa. Posso te explicar ponto a ponto agora?',
      },
      {
        id: 'd3',
        label: 'Dia 3',
        description: 'Tratativa de objecoes',
        template:
          'Quero te ajudar a decidir com seguranca, {{first_name}}. Alem do ganho financeiro, voce passa a contar com rede credenciada de qualidade e suporte na implantacao. Qual ponto voce quer revisar primeiro?',
      },
      {
        id: 'd5',
        label: 'Dia 5',
        description: 'Encaminhamento para fechamento',
        template:
          'Se fizer sentido para voce, avancamos hoje e deixamos tudo pronto sem burocracia. A proposta foi pensada para economizar {{economy_estimate}} e manter cobertura robusta. Quer que eu finalize com voce?',
      },
    ],
  },
  recuperacao: {
    label: 'Recuperacao',
    days: [
      {
        id: 'd1',
        label: 'Dia 1',
        description: 'Reativacao com nova abordagem',
        template:
          'Oi {{first_name}}, retomei sua analise com condicoes atualizadas. Encontramos uma alternativa para {{company_profile}} com mais eficiencia de custo e boa rede credenciada. Posso te enviar a nova leitura em 2 minutos?',
      },
      {
        id: 'd3',
        label: 'Dia 3',
        description: 'Prova social e seguranca',
        template:
          'Reabrindo seu caso porque este tipo de perfil costuma ganhar previsibilidade de gasto ao trocar no momento certo. A economia media recente foi de {{economy_estimate}} com manutencao de atendimento de qualidade. Quer comparar com seu cenario atual?',
      },
      {
        id: 'd7',
        label: 'Dia 7',
        description: 'Ultima tentativa consultiva',
        template:
          'Ultimo toque, {{first_name}}: posso encerrar ou te mando uma versao objetiva com custo atual, economia potencial e principais beneficios da rede credenciada? Fica bem rapido de decidir.',
      },
    ],
  },
} as const satisfies Record<string, SalesPlaybookPhase>;

export type SalesPlaybookPhaseKey = keyof typeof salesPlaybook;

export type SalesTemplateVariables = {
  name: string;
  first_name: string;
  company_profile: string;
  current_price: string;
  economy_estimate: string;
};

export function resolvePlaybookTemplate(
  template: string,
  vars: SalesTemplateVariables,
): string {
  return template.replace(/{{\s*([a-z_]+)\s*}}/gi, (token, rawKey) => {
    const key = rawKey.toLowerCase() as keyof SalesTemplateVariables;
    const value = vars[key];
    if (!value || !value.trim()) return token;
    return value;
  });
}

export function getPlaybookDay(
  phase: SalesPlaybookPhaseKey,
  dayId: string,
): SalesPlaybookDay | null {
  const days = salesPlaybook[phase]?.days ?? [];
  return days.find((day) => day.id === dayId) ?? null;
}
