import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const DEFAULT_PYTHON_API = 'http://127.0.0.1:8000';
const VERTEX_MODEL = 'gemini-2.0-flash-001';
const VERTEX_LOCATION = 'us-central1';
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff']);
const TEXT_EXTENSIONS = new Set(['.txt', '.csv', '.json', '.xml', '.html', '.htm', '.md']);

type ExtractionScope = 'empresa' | 'adesao' | 'beneficiario';

type ExtractionContext = {
  scope?: ExtractionScope;
  doc_type?: string;
  proposal_category?: string;
  beneficiary_id?: string;
  beneficiary_name?: string;
  beneficiary_role?: string;
  partner_id?: string | null;
};

type ExtractedDocument = {
  idades: number[];
  operadora: string | null;
  valor_atual: number | null;
  tipo_plano: string | null;
  nome_beneficiarios: string[];
  nome_completo?: string | null;
  cpf?: string | null;
  rg?: string | null;
  ifp?: string | null;
  documento_identificacao_tipo?: 'rg' | 'cnh' | 'ifp' | 'outro' | null;
  data_expedicao?: string | null;
  orgao_expedidor?: string | null;
  numero_habilitacao?: string | null;
  cnpj?: string | null;
  razao_social?: string | null;
  inscricao_estadual?: string | null;
  data_abertura?: string | null;
  status_cnpj?: string | null;
  data_inicio_atividade?: string | null;
  nome_fantasia?: string | null;
  estado_civil?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  data_nascimento?: string | null;
  socios_detectados?: string[];
  total_socios?: number | null;
  observacoes: string | null;
  confianca: string;
  texto_extraido_preview: string | null;
  total_caracteres: number;
};

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function resolvePythonApiCandidates(): string[] {
  const envCandidates = [
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.BACKEND_URL,
  ]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .map(normalizeBaseUrl);

  const fallbackCandidates = [
    DEFAULT_PYTHON_API,
    'http://localhost:8000',
  ];

  return Array.from(new Set([...envCandidates, ...fallbackCandidates]));
}

function getVertexAI(): VertexAI {
  const saJSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJSON) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON não configurada');
  }

  const credentials = JSON.parse(saJSON) as {
    project_id?: string;
    client_email?: string;
  };

  if (!credentials.project_id) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON sem project_id');
  }

  logger.info('[PDF/GEMINI] Inicializando Vertex AI', {
    model: VERTEX_MODEL,
    project_id: credentials.project_id,
    client_email: credentials.client_email || null,
    location: VERTEX_LOCATION,
  });

  return new VertexAI({
    project: credentials.project_id,
    location: VERTEX_LOCATION,
    googleAuthOptions: {
      credentials,
    },
  });
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1500,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const message = lastError.message;
      const retryable =
        message.includes('429') ||
        message.includes('RESOURCE_EXHAUSTED') ||
        message.includes('quota') ||
        message.includes('UNAVAILABLE') ||
        message.includes('503');

      if (!retryable || attempt === maxRetries) {
        throw lastError;
      }

      const delay = initialDelayMs * Math.pow(2, attempt);
      logger.warn('[PDF/GEMINI] Retry de extração', {
        attempt: attempt + 1,
        max_attempts: maxRetries + 1,
        delay_ms: delay,
        error: message,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('Falha ao extrair com Gemini');
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex < 0) return '';
  return fileName.slice(dotIndex).toLowerCase();
}

function isImageDocument(fileName: string, fileType: string): boolean {
  const ext = getFileExtension(fileName);
  return IMAGE_EXTENSIONS.has(ext) || fileType.startsWith('image/');
}

function isPdfDocument(fileName: string, fileType: string, fileBytes: Buffer): boolean {
  return (
    getFileExtension(fileName) === '.pdf' ||
    fileType === 'application/pdf' ||
    fileBytes.subarray(0, 4).toString('utf-8') === '%PDF'
  );
}

function isTextLikeDocument(fileName: string, fileType: string): boolean {
  const ext = getFileExtension(fileName);
  return (
    TEXT_EXTENSIONS.has(ext) ||
    fileType.startsWith('text/') ||
    fileType.includes('json') ||
    fileType.includes('xml')
  );
}

function decodeText(fileBytes: Buffer): string | null {
  const decoders = [
    new TextDecoder('utf-8', { fatal: false }),
    new TextDecoder('latin1', { fatal: false }),
  ];

  for (const decoder of decoders) {
    try {
      const decoded = decoder.decode(fileBytes).trim();
      if (decoded.length > 0) return decoded;
    } catch {
      continue;
    }
  }

  return null;
}

function parseJsonSafe(rawText: string): Record<string, unknown> {
  try {
    return JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}

function parseCurrencyValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number(value.toFixed(2));
  }
  if (typeof value !== 'string') return null;

  const cleaned = value.trim();
  if (!cleaned) return null;

  const onlyChars = cleaned.replace(/[^\d,.-]/g, '');
  if (!onlyChars) return null;

  const commaCount = (onlyChars.match(/,/g) || []).length;
  const dotCount = (onlyChars.match(/\./g) || []).length;

  let normalized = onlyChars;
  if (commaCount > 0 && dotCount > 0) {
    if (onlyChars.lastIndexOf(',') > onlyChars.lastIndexOf('.')) {
      normalized = onlyChars.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = onlyChars.replace(/,/g, '');
    }
  } else if (commaCount > 0) {
    normalized = onlyChars.replace(',', '.');
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : null;
}

function normalizeTipoPlano(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

  if (!normalized) return null;
  if (normalized.includes('ADES')) return 'ADESAO';
  if (normalized.includes('PME')) return 'PME';
  if (normalized.includes('EMPRES')) return 'EMPRESARIAL';
  return null;
}

function parsePositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value !== 'string') return null;

  const onlyDigits = value.replace(/\D/g, '');
  if (!onlyDigits) return null;
  const parsed = Number.parseInt(onlyDigits, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseExtractionContext(value: FormDataEntryValue | null): ExtractionContext | null {
  if (!value || typeof value !== 'string') return null;

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const context: ExtractionContext = {};

    if (parsed.scope === 'empresa' || parsed.scope === 'adesao' || parsed.scope === 'beneficiario') {
      context.scope = parsed.scope;
    }

    if (typeof parsed.doc_type === 'string' && parsed.doc_type.trim().length > 0) {
      context.doc_type = parsed.doc_type.trim();
    }

    if (typeof parsed.proposal_category === 'string' && parsed.proposal_category.trim().length > 0) {
      context.proposal_category = parsed.proposal_category.trim();
    }

    if (typeof parsed.beneficiary_id === 'string' && parsed.beneficiary_id.trim().length > 0) {
      context.beneficiary_id = parsed.beneficiary_id.trim();
    }

    if (typeof parsed.beneficiary_name === 'string' && parsed.beneficiary_name.trim().length > 0) {
      context.beneficiary_name = parsed.beneficiary_name.trim();
    }

    if (typeof parsed.beneficiary_role === 'string' && parsed.beneficiary_role.trim().length > 0) {
      context.beneficiary_role = parsed.beneficiary_role.trim();
    }

    if (typeof parsed.partner_id === 'string' && parsed.partner_id.trim().length > 0) {
      context.partner_id = parsed.partner_id.trim();
    }

    return Object.keys(context).length > 0 ? context : null;
  } catch {
    return null;
  }
}

function parseOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseOptionalStringByKeys(raw: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const parsed = parseOptionalString(raw[key]);
    if (parsed) return parsed;
  }
  return null;
}

function sanitizeDigits(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
}

function normalizeDocumentNumber(value: string | null, expectedLength: 11 | 14): string | null {
  const digits = sanitizeDigits(value);
  if (!digits) return null;
  if (digits.length === expectedLength) return digits;
  return null;
}

function normalizeCivilStatus(value: string | null): string | null {
  if (!value) return null;
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized.includes('solteir')) return 'solteiro';
  if (normalized.includes('casad')) return 'casado';
  if (normalized.includes('uniao')) return 'uniao_estavel';
  if (normalized.includes('divorc')) return 'divorciado';
  if (normalized.includes('viuv')) return 'viuvo';
  return null;
}

function normalizeIdentityDocumentType(value: string | null): 'rg' | 'cnh' | 'ifp' | 'outro' | null {
  if (!value) return null;
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized.includes('cnh') || normalized.includes('habilit')) return 'cnh';
  if (normalized.includes('ifp')) return 'ifp';
  if (normalized.includes('rg') || normalized.includes('identidade')) return 'rg';
  if (normalized.length > 0) return 'outro';
  return null;
}

function normalizePhone(value: string | null): string | null {
  const digits = sanitizeDigits(value);
  if (!digits) return null;
  if (digits.length < 10) return null;
  if (digits.length > 11) {
    return digits.slice(-11);
  }
  return digits;
}

function sanitizeExtraction(
  raw: Record<string, unknown>,
  defaults?: Partial<ExtractedDocument>,
): ExtractedDocument {
  const result: ExtractedDocument = {
    idades: [],
    operadora: null,
    valor_atual: null,
    tipo_plano: null,
    nome_beneficiarios: [],
    nome_completo: null,
    cpf: null,
    rg: null,
    ifp: null,
    documento_identificacao_tipo: null,
    data_expedicao: null,
    orgao_expedidor: null,
    numero_habilitacao: null,
    cnpj: null,
    razao_social: null,
    inscricao_estadual: null,
    data_abertura: null,
    status_cnpj: null,
    data_inicio_atividade: null,
    nome_fantasia: null,
    estado_civil: null,
    email: null,
    telefone: null,
    endereco: null,
    data_nascimento: null,
    socios_detectados: [],
    total_socios: null,
    observacoes: null,
    confianca: 'media',
    texto_extraido_preview: null,
    total_caracteres: 0,
  };

  if (Array.isArray(raw.idades)) {
    result.idades = raw.idades
      .map((value) => {
        if (typeof value === 'number' && Number.isFinite(value)) {
          return Math.trunc(value);
        }
        if (typeof value === 'string') {
          const onlyDigits = value.replace(/\D/g, '');
          if (!onlyDigits) return null;
          const parsed = Number.parseInt(onlyDigits, 10);
          return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
      })
      .filter((value): value is number => value !== null && value >= 0 && value <= 120);
  }

  if (typeof raw.operadora === 'string' && raw.operadora.trim().length > 0) {
    result.operadora = raw.operadora.trim().toUpperCase();
  }

  result.valor_atual = parseCurrencyValue(raw.valor_atual);
  result.tipo_plano = normalizeTipoPlano(raw.tipo_plano);

  if (Array.isArray(raw.nome_beneficiarios)) {
    result.nome_beneficiarios = raw.nome_beneficiarios
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value.length > 0);
  }

  result.nome_completo = parseOptionalString(raw.nome_completo);
  result.cpf = normalizeDocumentNumber(parseOptionalString(raw.cpf), 11);
  result.rg = sanitizeDigits(
    parseOptionalStringByKeys(raw, ['rg', 'registro_geral', 'numero_rg', 'numero_registro_geral']),
  );
  result.ifp = parseOptionalString(raw.ifp);
  result.documento_identificacao_tipo = normalizeIdentityDocumentType(
    parseOptionalString(raw.documento_identificacao_tipo),
  );
  result.data_expedicao = parseOptionalString(raw.data_expedicao);
  result.orgao_expedidor = parseOptionalString(raw.orgao_expedidor);
  result.numero_habilitacao = sanitizeDigits(parseOptionalString(raw.numero_habilitacao));
  result.cnpj = normalizeDocumentNumber(parseOptionalString(raw.cnpj), 14);
  result.razao_social = parseOptionalString(raw.razao_social);
  result.inscricao_estadual = parseOptionalString(raw.inscricao_estadual);
  result.data_abertura = parseOptionalString(raw.data_abertura);
  result.status_cnpj = parseOptionalString(raw.status_cnpj);
  result.data_inicio_atividade = parseOptionalString(raw.data_inicio_atividade);
  result.nome_fantasia = parseOptionalString(raw.nome_fantasia);
  result.estado_civil = normalizeCivilStatus(parseOptionalString(raw.estado_civil));
  result.email = parseOptionalString(raw.email)?.toLowerCase() || null;
  result.telefone = normalizePhone(parseOptionalString(raw.telefone));
  result.endereco = parseOptionalString(raw.endereco);
  result.data_nascimento = parseOptionalString(raw.data_nascimento);

  if (Array.isArray(raw.socios_detectados)) {
    result.socios_detectados = raw.socios_detectados
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value.length > 0);
  }

  const totalSocios = parsePositiveInt(raw.total_socios);
  if (totalSocios !== null) {
    result.total_socios = totalSocios;
  } else if ((result.socios_detectados?.length || 0) > 0) {
    result.total_socios = result.socios_detectados?.length || null;
  }

  if (typeof raw.observacoes === 'string' && raw.observacoes.trim().length > 0) {
    result.observacoes = raw.observacoes.trim();
  }

  if (typeof raw.confianca === 'string' && raw.confianca.trim().length > 0) {
    result.confianca = raw.confianca.trim();
  }

  if (!result.documento_identificacao_tipo) {
    if (result.numero_habilitacao) {
      result.documento_identificacao_tipo = 'cnh';
    } else if (result.ifp) {
      result.documento_identificacao_tipo = 'ifp';
    } else if (result.rg) {
      result.documento_identificacao_tipo = 'rg';
    }
  }

  return {
    ...result,
    ...defaults,
    nome_completo: defaults?.nome_completo ?? result.nome_completo,
    cpf: defaults?.cpf ?? result.cpf,
    rg: defaults?.rg ?? result.rg,
    ifp: defaults?.ifp ?? result.ifp,
    documento_identificacao_tipo:
      defaults?.documento_identificacao_tipo ?? result.documento_identificacao_tipo,
    data_expedicao: defaults?.data_expedicao ?? result.data_expedicao,
    orgao_expedidor: defaults?.orgao_expedidor ?? result.orgao_expedidor,
    numero_habilitacao: defaults?.numero_habilitacao ?? result.numero_habilitacao,
    cnpj: defaults?.cnpj ?? result.cnpj,
    razao_social: defaults?.razao_social ?? result.razao_social,
    inscricao_estadual: defaults?.inscricao_estadual ?? result.inscricao_estadual,
    data_abertura: defaults?.data_abertura ?? result.data_abertura,
    status_cnpj: defaults?.status_cnpj ?? result.status_cnpj,
    data_inicio_atividade: defaults?.data_inicio_atividade ?? result.data_inicio_atividade,
    nome_fantasia: defaults?.nome_fantasia ?? result.nome_fantasia,
    estado_civil: defaults?.estado_civil ?? result.estado_civil,
    email: defaults?.email ?? result.email,
    telefone: defaults?.telefone ?? result.telefone,
    endereco: defaults?.endereco ?? result.endereco,
    data_nascimento: defaults?.data_nascimento ?? result.data_nascimento,
  };
}

function buildFallbackExtraction(fileName: string, reason: string): ExtractedDocument {
  return {
    idades: [],
    operadora: null,
    valor_atual: null,
    tipo_plano: null,
    nome_beneficiarios: [],
    nome_completo: null,
    cpf: null,
    rg: null,
    ifp: null,
    documento_identificacao_tipo: null,
    data_expedicao: null,
    orgao_expedidor: null,
    numero_habilitacao: null,
    cnpj: null,
    razao_social: null,
    inscricao_estadual: null,
    data_abertura: null,
    status_cnpj: null,
    data_inicio_atividade: null,
    nome_fantasia: null,
    estado_civil: null,
    email: null,
    telefone: null,
    endereco: null,
    data_nascimento: null,
    socios_detectados: [],
    total_socios: null,
    observacoes: `Documento recebido (${fileName}). ${reason}`,
    confianca: 'baixa',
    texto_extraido_preview: 'Extração automática em modo de contingência.',
    total_caracteres: 0,
  };
}

function buildGeminiSystemPrompt(): string {
  return `Você é um especialista em leitura OCR de documentos para propostas de planos de saúde no Brasil.
Retorne SOMENTE JSON válido, sem markdown e sem explicações.

Campos do JSON:
{
  "idades": [34, 28],
  "operadora": "UNIMED",
  "valor_atual": 1299.90,
  "tipo_plano": "ADESAO|PME|EMPRESARIAL|null",
  "nome_beneficiarios": ["Nome 1", "Nome 2"],
  "nome_completo": "nome principal encontrado no documento",
  "cpf": "somente números",
  "rg": "somente números quando possível",
  "ifp": "registro/identificação IFP quando aplicável",
  "documento_identificacao_tipo": "rg|cnh|ifp|outro|null",
  "data_expedicao": "DD/MM/AAAA quando houver",
  "orgao_expedidor": "órgão emissor quando houver (ex.: SSP-RJ, DETRAN)",
  "numero_habilitacao": "somente números quando for CNH",
  "cnpj": "somente números",
  "razao_social": "razão social da empresa",
  "inscricao_estadual": "inscrição estadual da empresa quando houver",
  "data_abertura": "DD/MM/AAAA quando houver",
  "status_cnpj": "status cadastral da empresa quando houver",
  "data_inicio_atividade": "DD/MM/AAAA quando houver",
  "nome_fantasia": "nome fantasia quando houver",
  "estado_civil": "solteiro|casado|uniao_estavel|divorciado|viuvo|null",
  "email": "email detectado",
  "telefone": "somente números, DDD incluso",
  "endereco": "endereço principal detectado",
  "data_nascimento": "DD/MM/AAAA quando disponível",
  "socios_detectados": ["Sócio 1", "Sócio 2"],
  "total_socios": 2,
  "observacoes": "resumo curto",
  "confianca": "alta|media|baixa"
}

Regras:
- Se não encontrar um campo, retorne null (ou array vazio para listas).
- CPF deve ter 11 dígitos e CNPJ 14 dígitos quando encontrados.
- Em contrato social, priorize sócios, razão social, CNPJ, contatos e data de abertura.
- Em cartão CNPJ, priorize status cadastral, data de início de atividade e nome fantasia.
- Em identidade/CPF, priorize nome_completo, cpf, rg, data_nascimento, data_expedicao, orgao_expedidor e identificação do tipo de documento (RG/CNH/IFP).
- Em comprovante de residência, priorize endereco.
- Em certidões, priorize estado_civil, nome_completo e data_nascimento.
- Em carteirinha/carta de permanência, priorize operadora, tipo_plano, valor_atual e nomes de beneficiários.
- Nunca invente dados.`;
}

function buildGeminiUserPrompt(context: ExtractionContext | null, fileName: string): string {
  const scope = context?.scope || 'desconhecido';
  const docType = context?.doc_type || 'desconhecido';
  const proposalCategory = context?.proposal_category || 'desconhecida';
  const beneficiaryName = context?.beneficiary_name || 'não informado';
  const beneficiaryRole = context?.beneficiary_role || 'não informado';

  return `Analise o documento enviado e extraia os dados estruturados para proposta.

Contexto do upload:
- arquivo: ${fileName}
- escopo: ${scope}
- tipo_documento: ${docType}
- modalidade_proposta: ${proposalCategory}
- beneficiario_nome: ${beneficiaryName}
- beneficiario_tipo: ${beneficiaryRole}

Validação de consistência:
- Se o tipo_documento for "cartao_cnpj", priorize CNPJ, razão social, status cadastral, data de início de atividade e nome fantasia.
- Se for "contrato_social", detecte quantidade de sócios e seus nomes.
- Se for "identidade_cpf" ou "identidade_cpf_socios", extraia nome, CPF, RG/IFP/CNH, tipo do documento, data de nascimento, data de expedição e órgão expedidor.
- Se for "comprovante_residencia", extraia endereço completo e possível titular.
- Se for "certidao_casamento" ou "declaracao_uniao_estavel", identifique estado civil.
- Se for "certidao_nascimento", priorize nome e data de nascimento.

Retorne apenas JSON válido.`;
}

async function extractWithGemini(
  fileBytes: Buffer,
  fileName: string,
  fileType: string,
  context: ExtractionContext | null,
): Promise<ExtractedDocument | null> {
  const vertexAI = getVertexAI();
  const model = vertexAI.getGenerativeModel({
    model: VERTEX_MODEL,
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 3000,
    },
    systemInstruction: {
      role: 'system',
      parts: [{ text: buildGeminiSystemPrompt() }],
    },
  });

  const mimeType = fileType || 'application/octet-stream';
  const userParts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  const prompt = buildGeminiUserPrompt(context, fileName);

  const textDocument = isTextLikeDocument(fileName, fileType) ? decodeText(fileBytes) : null;
  if (textDocument && textDocument.trim().length > 20) {
    userParts.push({
      text: `${prompt}\n\nCONTEÚDO DO DOCUMENTO:\n${textDocument.slice(0, 15000)}`,
    });
  } else if (isPdfDocument(fileName, fileType, fileBytes) || isImageDocument(fileName, fileType)) {
    userParts.push({
      inlineData: {
        mimeType: isPdfDocument(fileName, fileType, fileBytes) ? 'application/pdf' : mimeType,
        data: fileBytes.toString('base64'),
      },
    });
    userParts.push({ text: prompt });
  } else {
    return null;
  }

  const rawText = await withRetry(async () => {
    const requestPayload = {
      contents: [
        {
          role: 'user',
          parts: userParts,
        },
      ],
    } as unknown as Parameters<typeof model.generateContent>[0];

    const response = await model.generateContent(requestPayload);
    const candidate = response.response.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const text = parts
      .map((part) => (typeof part.text === 'string' ? part.text : ''))
      .join('\n')
      .trim();
    if (!text) {
      throw new Error('Resposta vazia do Gemini');
    }
    return text;
  });

  const parsed = parseJsonSafe(rawText);
  const preview = textDocument
    ? textDocument.slice(0, 500)
    : `Documento analisado com Gemini (${fileName})`;

  return sanitizeExtraction(parsed, {
    texto_extraido_preview: preview,
    total_caracteres: textDocument?.length || 0,
  });
}

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

async function extractImageWithOpenAI(
  openai: OpenAI,
  fileBytes: Buffer,
  fileType: string,
  context: ExtractionContext | null,
): Promise<ExtractedDocument> {
  const imageMimeType = fileType.startsWith('image/') ? fileType : 'image/jpeg';
  const imageBase64 = fileBytes.toString('base64');

  const prompt = [
    'Analise esta imagem de documento de plano de saúde e retorne apenas JSON válido.',
    `Contexto: escopo=${context?.scope || 'desconhecido'}, tipo_documento=${context?.doc_type || 'desconhecido'}`,
    'Campos obrigatórios do JSON:',
    '- idades: lista de inteiros',
    '- operadora: string em MAIÚSCULAS ou null',
    '- valor_atual: número decimal ou null',
    '- tipo_plano: ADESAO, PME, EMPRESARIAL ou null',
    '- nome_beneficiarios: lista de nomes',
    '- nome_completo: string ou null',
    '- cpf: string só com números ou null',
    '- rg: string só com números ou null',
    '- ifp: string ou null',
    '- documento_identificacao_tipo: rg|cnh|ifp|outro|null',
    '- data_expedicao: DD/MM/AAAA ou null',
    '- orgao_expedidor: string ou null',
    '- numero_habilitacao: string só com números ou null',
    '- cnpj: string só com números ou null',
    '- razao_social: string ou null',
    '- inscricao_estadual: string ou null',
    '- data_abertura: DD/MM/AAAA ou null',
    '- status_cnpj: string ou null',
    '- data_inicio_atividade: DD/MM/AAAA ou null',
    '- nome_fantasia: string ou null',
    '- estado_civil: solteiro|casado|uniao_estavel|divorciado|viuvo|null',
    '- email: string ou null',
    '- telefone: string só com números ou null',
    '- endereco: string ou null',
    '- data_nascimento: DD/MM/AAAA ou null',
    '- socios_detectados: lista de nomes dos sócios quando for contrato social/empresa',
    '- total_socios: número de sócios quando identificável',
    '- observacoes: string curta ou null',
    '- confianca: alta/media/baixa',
  ].join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Você extrai dados estruturados de documentos de saúde e responde apenas com JSON válido.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:${imageMimeType};base64,${imageBase64}` },
          },
        ],
      },
    ],
  });

  const rawContent = completion.choices[0]?.message?.content || '{}';
  const parsed = parseJsonSafe(rawContent);

  return sanitizeExtraction(parsed, {
    texto_extraido_preview: 'Análise visual do documento em imagem',
    total_caracteres: 0,
  });
}

async function extractTextWithOpenAI(
  openai: OpenAI,
  text: string,
  context: ExtractionContext | null,
): Promise<ExtractedDocument> {
  const limitedText = text.slice(0, 12000);
  const prompt = `Analise o documento abaixo e retorne APENAS um JSON válido.
Contexto: escopo=${context?.scope || 'desconhecido'}, tipo_documento=${context?.doc_type || 'desconhecido'}.

Campos esperados:
- idades (array de inteiros)
- operadora (string em MAIÚSCULAS ou null)
- valor_atual (número decimal ou null)
- tipo_plano (ADESAO, PME, EMPRESARIAL ou null)
- nome_beneficiarios (array de strings)
- nome_completo (string ou null)
- cpf (string numérica ou null)
- rg (string numérica ou null)
- ifp (string ou null)
- documento_identificacao_tipo (rg|cnh|ifp|outro|null)
- data_expedicao (DD/MM/AAAA ou null)
- orgao_expedidor (string ou null)
- numero_habilitacao (string numérica ou null)
- cnpj (string numérica ou null)
- razao_social (string ou null)
- inscricao_estadual (string ou null)
- data_abertura (DD/MM/AAAA ou null)
- status_cnpj (string ou null)
- data_inicio_atividade (DD/MM/AAAA ou null)
- nome_fantasia (string ou null)
- estado_civil (solteiro|casado|uniao_estavel|divorciado|viuvo|null)
- email (string ou null)
- telefone (string numérica ou null)
- endereco (string ou null)
- data_nascimento (DD/MM/AAAA ou null)
- socios_detectados (array de strings com nomes de sócios quando aplicável)
- total_socios (número de sócios quando aplicável)
- observacoes (string curta ou null)
- confianca (alta/media/baixa)

DOCUMENTO:
${limitedText}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Você extrai dados estruturados de documentos de planos de saúde e responde apenas em JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const rawContent = completion.choices[0]?.message?.content || '{}';
  const parsed = parseJsonSafe(rawContent);
  const preview = limitedText.length > 500 ? `${limitedText.slice(0, 500)}...` : limitedText;

  return sanitizeExtraction(parsed, {
    texto_extraido_preview: preview,
    total_caracteres: text.length,
  });
}

async function tryLocalExtraction(
  fileBytes: Buffer,
  fileName: string,
  fileType: string,
  context: ExtractionContext | null,
): Promise<ExtractedDocument | null> {
  const openai = getOpenAIClient();
  if (!openai) return null;

  if (isImageDocument(fileName, fileType)) {
    return extractImageWithOpenAI(openai, fileBytes, fileType, context);
  }

  if (isPdfDocument(fileName, fileType, fileBytes)) {
    // Sem parser de PDF no fallback local: evita depender do backend Python quando indisponível.
    // Para PDF, o modo contingência retorna payload padrão sem bloquear o upload.
    return null;
  }

  if (isTextLikeDocument(fileName, fileType)) {
    const text = decodeText(fileBytes);
    if (text && text.trim().length >= 30) {
      return extractTextWithOpenAI(openai, text, context);
    }
  }

  return null;
}

/**
 * POST /api/pdf
 * Extração de documentos via Gemini (principal) + fallback Python/OpenAI
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const context = parseExtractionContext(formData.get('context'));

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      );
    }

    const fileName =
      typeof (file as { name?: unknown }).name === 'string' && (file as { name: string }).name.trim().length > 0
        ? (file as { name: string }).name
        : 'documento';
    const fileType = file.type || 'application/octet-stream';
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = Buffer.from(fileBuffer);

    try {
      const geminiExtraction = await extractWithGemini(fileBytes, fileName, fileType, context);
      if (geminiExtraction) {
        logger.info('[PDF/GEMINI] Documento processado com sucesso', {
          file_name: fileName,
          scope: context?.scope || null,
          doc_type: context?.doc_type || null,
        });
        return NextResponse.json(geminiExtraction);
      }
    } catch (geminiError) {
      logger.warn('[PDF/GEMINI] Falha na extração principal, tentando fallback', {
        file_name: fileName,
        scope: context?.scope || null,
        doc_type: context?.doc_type || null,
        error: geminiError instanceof Error ? geminiError.message : String(geminiError),
      });
    }

    // Forward to Python backend
    const proxyForm = new FormData();
    proxyForm.append(
      'file',
      new Blob([fileBuffer], { type: fileType }),
      fileName,
    );
    if (context) {
      proxyForm.append('context', JSON.stringify(context));
    }

    const pythonApiCandidates = resolvePythonApiCandidates();
    let lastStatus = 500;
    let lastData: Record<string, unknown> = {};
    const networkErrors: string[] = [];
    let hasSuccessfulConnection = false;

    for (const pythonApi of pythonApiCandidates) {
      try {
        const response = await fetch(`${pythonApi}/api/v1/pdf/extrair`, {
          method: 'POST',
          body: proxyForm,
        });

        hasSuccessfulConnection = true;
        lastStatus = response.status;

        const rawBody = await response.text();
        let data: Record<string, unknown> = {};

        if (rawBody) {
          try {
            data = JSON.parse(rawBody) as Record<string, unknown>;
          } catch {
            data = { detail: rawBody };
          }
        }

        if (response.ok) {
          return NextResponse.json(data);
        }

        lastData = data;
      } catch {
        networkErrors.push(pythonApi);
      }
    }

    if (!hasSuccessfulConnection) {
      try {
        const localExtraction = await tryLocalExtraction(fileBytes, fileName, fileType, context);
        if (localExtraction) {
          logger.warn('Backend Python indisponível. Aplicando extração local de contingência.', {
            file_name: fileName,
            file_type: fileType,
            endpoints: networkErrors,
          });
          return NextResponse.json(localExtraction);
        }
      } catch (localError) {
        logger.error('Falha na extração local de contingência', localError);
      }

      return NextResponse.json(
        buildFallbackExtraction(
          fileName,
          `Não foi possível conectar ao backend de IA. Verifique o serviço Python. Endpoints testados: ${networkErrors.join(', ')}`,
        ),
      );
    }

    if (lastStatus >= 500) {
      try {
        const localExtraction = await tryLocalExtraction(fileBytes, fileName, fileType, context);
        if (localExtraction) {
          logger.warn('Backend Python retornou erro 5xx. Aplicando extração local de contingência.', {
            file_name: fileName,
            status: lastStatus,
          });
          return NextResponse.json(localExtraction);
        }
      } catch (localError) {
        logger.error('Falha na extração local após erro 5xx', localError);
      }
    }

    return NextResponse.json(
      {
        error:
          (typeof lastData.detail === 'string' && lastData.detail) ||
          (typeof lastData.error === 'string' && lastData.error) ||
          `Falha ao processar documento (${lastStatus})`,
      },
      { status: lastStatus },
    );
  } catch (error) {
    logger.error('❌ Erro no proxy de documentos:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message
            ? `Erro interno ao processar documento: ${error.message}`
            : 'Erro interno ao processar documento',
      },
      { status: 500 }
    );
  }
}
