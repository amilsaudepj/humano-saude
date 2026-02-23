import { z } from 'zod';

// ============================================
// HELPERS
// ============================================

/** Remove todos os caracteres não-numéricos de string (ex.: telefone, CPF, CNPJ). */
const cleanPhone = (phone: string) => phone.replace(/\D/g, '');

/** Retorna a primeira mensagem de erro de um ZodError (útil para toasts). */
export function getFirstErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError && error.issues.length > 0) {
    return error.issues[0].message;
  }
  if (error instanceof Error) return error.message;
  return 'Erro de validação';
}

/** Valida telefone brasileiro (10-11 dígitos, DDD 11-99, não repetido) */
export const isValidBrazilianPhone = (phone: string): boolean => {
  const digits = cleanPhone(phone);
  if (digits.length < 10 || digits.length > 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const ddd = parseInt(digits.substring(0, 2));
  return ddd >= 11 && ddd <= 99;
};

/** Valida nome (min 3 chars, pelo menos 1 letra, não só números) */
const isValidName = (name: string): boolean => {
  if (name.trim().length < 3) return false;
  if (!/[a-zA-ZÀ-ÿ]/.test(name)) return false;
  if (/^\d+$/.test(name.trim())) return false;
  return true;
};

/** Valida CPF brasileiro com dígitos verificadores */
export function validarCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  // Rejeitar sequências repetidas (000.000.000-00 etc)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(digits[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(digits[9])) return false;

  // Segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(digits[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(digits[10])) return false;

  return true;
}

/** Valida CNPJ brasileiro com dígitos verificadores */
export function validarCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  // Primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) soma += parseInt(digits[i]) * pesos1[i];
  let resto = soma % 11;
  const dig1 = resto < 2 ? 0 : 11 - resto;
  if (dig1 !== parseInt(digits[12])) return false;

  // Segundo dígito verificador
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) soma += parseInt(digits[i]) * pesos2[i];
  resto = soma % 11;
  const dig2 = resto < 2 ? 0 : 11 - resto;
  if (dig2 !== parseInt(digits[13])) return false;

  return true;
}

/** Valida CPF ou CNPJ automaticamente pelo tamanho */
export function validarDocumento(doc: string): boolean {
  const digits = doc.replace(/\D/g, '');
  if (digits.length === 11) return validarCPF(doc);
  if (digits.length === 14) return validarCNPJ(doc);
  return false;
}

// ============================================
// SCHEMAS – LANDING PAGE HERO LEAD
// ============================================

export const heroLeadSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .refine(isValidName, 'Nome inválido'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
  telefone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .refine(isValidBrazilianPhone, 'Telefone inválido. Ex: (21) 98888-7777'),
  perfil: z
    .string()
    .min(1, 'Selecione seu perfil'),
});

export type HeroLeadInput = z.infer<typeof heroLeadSchema>;

// ============================================
// SCHEMAS – LP V2 LEAD (VALUE-BASED BIDDING)
// ============================================

export const lpLeadSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .refine(isValidName, 'Nome inválido'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
  whatsapp: z
    .string()
    .min(1, 'WhatsApp é obrigatório')
    .refine(isValidBrazilianPhone, 'Telefone inválido. Ex: (21) 98888-7777'),
  vidas: z
    .string()
    .min(1, 'Selecione a quantidade de vidas'),
});

export type LpLeadInput = z.infer<typeof lpLeadSchema>;

// ============================================
// SCHEMAS – CALCULADORA WIZARD LEAD
// ============================================

export const calculatorLeadSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .refine(isValidName, 'Nome inválido'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
  telefone: z
    .string()
    .min(1, 'WhatsApp é obrigatório')
    .refine(isValidBrazilianPhone, 'Telefone inválido'),
  perfil: z.string().optional(),
  tipo_contratacao: z.string().optional(),
  cnpj: z.string().nullable().optional(),
  acomodacao: z.string().optional(),
  idades_beneficiarios: z.array(z.string()).optional(),
  bairro: z.string().optional(),
  top_3_planos: z.array(z.string()).optional(),
});

export type CalculatorLeadInput = z.infer<typeof calculatorLeadSchema>;

// ============================================
// SCHEMAS – COTAÇÃO (PORTAL INTERNO)
// ============================================

export const cotacaoInputSchema = z.object({
  idades: z
    .array(z.number().int().min(0).max(120))
    .min(1, 'Adicione pelo menos uma idade'),
  tipo: z.string().min(1, 'Selecione o tipo de contratação'),
  operadora: z.string().min(1, 'Selecione uma operadora'),
});

export type CotacaoInputValidated = z.infer<typeof cotacaoInputSchema>;

// ============================================
// SCHEMAS – API /api/leads (SERVER-SIDE)
// ============================================

const emailOptional = z
  .string()
  .optional()
  .default('')
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'E-mail inválido');

const telefoneOptional = z
  .string()
  .optional()
  .default('')
  .refine((v) => !v || isValidBrazilianPhone(v), 'Telefone inválido. Use DDD + número (10 ou 11 dígitos), ex: (21) 98888-7777');

export const apiLeadSchema = z
  .object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional().default(''),
    email: emailOptional,
    telefone: telefoneOptional,
    perfil: z.string().optional().default(''),
    intencao: z.enum(['reduzir', 'contratar']).optional(),
    perfil_cnpj: z.enum(['mei', 'pme']).optional(),
    usa_bypass: z.boolean().optional(),
    qtd_vidas_estimada: z.union([z.number(), z.string()]).optional(),
    tipo_contratacao: z.string().optional(),
    cnpj: z.string().nullable().optional(),
    acomodacao: z.string().optional(),
    idades_beneficiarios: z.array(z.string()).optional(),
    bairro: z.string().optional(),
    operadora_atual: z.string().optional().nullable(),
    top_3_planos: z.union([z.string(), z.array(z.string())]).optional(),
    origem: z.enum(['calculadora', 'hero_form', 'landing', 'email_form']).optional(),
    parcial: z.boolean().optional(),
    source: z.string().optional(),
    lead_score_value: z.number().optional(),
    empresa: z.string().optional(),
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.parcial === true) return true;
      const nomeOk = (data.nome ?? '').trim().length >= 2;
      const emailOk = (data.email ?? '').trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((data.email ?? '').trim());
      const telOk = (data.telefone ?? '').trim().length > 0 && isValidBrazilianPhone((data.telefone ?? '').trim());
      return nomeOk && (emailOk || telOk);
    },
    { message: 'Lead completo exige nome (mín. 2 caracteres) e e-mail válido ou telefone válido.' }
  );

export type ApiLeadInput = z.infer<typeof apiLeadSchema>;

// ============================================
// HELPERS: Erros Zod
// ============================================

/** Mapeia erros Zod por campo (path.join('.')) para exibição em formulários. */
export function getZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
