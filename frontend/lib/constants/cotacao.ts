// Bairros do RJ por zona (para o formulário de cotação)
export const BAIRROS_POR_ZONA: { zona: string; bairros: string[] }[] = [
  { zona: 'Zona Sul', bairros: ['Copacabana', 'Ipanema', 'Leblon', 'Leme', 'Botafogo', 'Flamengo', 'Laranjeiras', 'Catete', 'Glória', 'Santa Teresa'] },
  { zona: 'Zona Norte', bairros: ['Tijuca', 'Vila Isabel', 'Grajaú', 'Méier', 'Engenho Novo', 'Riachuelo', 'Madureira', 'Campo Grande', 'Pavuna', 'Ilha do Governador'] },
  { zona: 'Zona Oeste', bairros: ['Barra da Tijuca', 'Recreio dos Bandeirantes', 'Jacarepaguá', 'Taquara', 'Curicica', 'Campo Grande', 'Santa Cruz', 'Guaratiba'] },
  { zona: 'Centro', bairros: ['Centro', 'Lapa', 'Saúde', 'Gamboa', 'Cidade Nova', 'São Cristóvão'] },
  { zona: 'Baixada Fluminense', bairros: ['Niterói', 'São Gonçalo', 'Nova Iguaçu', 'Duque de Caxias', 'Belford Roxo', 'Mesquita'] },
  { zona: 'Outros', bairros: ['Outros'] },
];

// Lista flat de todos os bairros (para validação)
export const TODOS_BAIRROS = BAIRROS_POR_ZONA.flatMap((z) => z.bairros);

// Operadoras de saúde (conforme solicitado)
export const OPERADORAS = [
  'AMIL',
  'BRADESCO',
  'SULAMERICA',
  'PORTO SEGURO',
  'ASSIM',
  'UNIMED FERJ',
  'UNIMED LESTE FLUMINENSE',
  'UNIMED SEGUROS',
  'LEVE SAUDE',
  'MEDSENIOR',
  'PREVENT SENIOR AMPLA',
  'HAPVIDA NOTREDAME',
  'KLINI',
  'ONMED',
  'SELECT',
  'SAMOC',
  'OUTROS',
] as const;

export const FAIXAS_ETARIAS = [
  '0-18',
  '19-23',
  '24-28',
  '29-33',
  '34-38',
  '39-43',
  '44-48',
  '49-53',
  '54-58',
  '59+',
] as const;
