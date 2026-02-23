// Types para Calculadora
export interface Beneficiario {
  id: number;
  idade: string;
}

export interface PlanoResultado {
  id: string;
  nome: string;
  operadora: string;
  acomodacao: string;
  coparticipacao: string;
  abrangencia: string;
  reembolso: string;
  extras: string;
  valorTotal: number;
  destaque: boolean;
  logo_url?: string;
}

export interface CalculadoraState {
  step: number;
  intencao: 'reduzir' | 'contratar' | '';
  perfilCnpj: 'mei' | 'pme' | '';
  tipoContrato: 'PF' | 'PME' | '';
  cnpj: string;
  empresa: string;
  acomodacao: 'Enfermaria' | 'Apartamento' | '';
  beneficiarios: Beneficiario[];
  usaBypass: boolean;
  qtdVidasEstimada: string;
  bairro: string;
  nome: string;
  email: string;
  telefone: string;
  resultados: PlanoResultado[];
  isLoading: boolean;
}
