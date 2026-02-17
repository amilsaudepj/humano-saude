'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  ExternalLink,
  Loader2,
  Mail,
  Plus,
  Phone,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService, type DocumentoExtractionContext, type PDFExtraido } from '@/app/services/api';
import { saveScannedLead } from '@/app/actions/leads';
import { getCorretoresList } from '@/app/actions/crm';

type ProposalCategory = '' | 'adesao' | 'pessoa_fisica' | 'pessoa_juridica';
type CompanyDataMode = '' | 'scanner' | 'scanfull' | 'manual';
type CivilStatus = 'solteiro' | 'casado' | 'uniao_estavel' | 'divorciado' | 'viuvo';
type MarriageProofMode = 'certidao' | 'declaracao';
type BeneficiaryRole = 'titular' | 'socio' | 'funcionario' | 'dependente';
type IdentityDocumentType = 'rg' | 'cnh' | 'ifp' | 'outro';

type CompanyDocumentType =
  | 'contrato_social'
  | 'cartao_cnpj'
  | 'comprovante_endereco_empresa'
  | 'alteracao_contratual'
  | 'identidade_cpf_socios'
  | 'relacao_funcionarios';

type AdesaoDocumentType =
  | 'documento_elegibilidade'
  | 'formulario_associacao';

type BeneficiaryDocumentType =
  | 'identidade_cpf'
  | 'comprovante_residencia'
  | 'carteirinha_plano_atual'
  | 'carta_permanencia'
  | 'certidao_casamento'
  | 'declaracao_uniao_estavel'
  | 'certidao_nascimento'
  | 'selfie';

type UploadTarget =
  | { scope: 'empresa'; docType: CompanyDocumentType; partnerId?: string }
  | { scope: 'adesao'; docType: AdesaoDocumentType }
  | { scope: 'beneficiario'; beneficiaryId: string; docType: BeneficiaryDocumentType };

interface ScannerDocumentosProps {
  onDadosExtraidos?: (dados: PDFExtraido) => void;
  corretorId?: string;
  registrarFilaProposta?: boolean;
  permitirLeadExistente?: boolean;
  onPropostaSalva?: () => void | Promise<void>;
}

interface CorretorAssignableOption {
  id: string;
  nome: string;
  foto_url: string | null;
}

interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  extracted: PDFExtraido;
  requirementLabel: string;
  previewUrl?: string | null;
  linkedEntityId?: string | null;
}

interface CompanyPartnerProfile {
  id: string;
  nome: string;
  documento_tipo?: IdentityDocumentType | null;
  cpf?: string;
  rg?: string;
  ifp?: string;
  dataNascimento?: string;
  dataExpedicao?: string;
  orgaoExpedidor?: string;
  numeroHabilitacao?: string;
}

interface CompanyPartnerDocStatus {
  partner: CompanyPartnerProfile;
  done: boolean;
  filesCount: number;
}

interface ScanFullBatchResult {
  processed: number;
  classified: number;
  unclassified: number;
  distributedSummary: string[];
}

interface BeneficiaryForm {
  id: string;
  role: BeneficiaryRole;
  nome: string;
  idade: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  estadoCivil: CivilStatus;
  comprovacaoConjugal: MarriageProofMode;
  documentos: Partial<Record<BeneficiaryDocumentType, UploadedDocument[]>>;
}

interface RequirementStatus {
  id: string;
  label: string;
  required: boolean;
  done: boolean;
  helper?: string;
}

interface StepDefinition {
  id: 'modalidade' | 'estrutura' | 'empresa' | 'beneficiarios' | 'resumo';
  label: string;
}

const CATEGORY_LABELS: Record<Exclude<ProposalCategory, ''>, string> = {
  adesao: 'Adesão',
  pessoa_fisica: 'Pessoa Física',
  pessoa_juridica: 'Pessoa Jurídica',
};

const CIVIL_STATUS_OPTIONS: Array<{ value: CivilStatus; label: string }> = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'uniao_estavel', label: 'União estável' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
];

const COMPANY_DOC_LABELS: Record<CompanyDocumentType, string> = {
  contrato_social: 'Contrato social',
  cartao_cnpj: 'Cartão CNPJ',
  comprovante_endereco_empresa: 'Comprovante de endereço da empresa',
  alteracao_contratual: 'Alteração contratual',
  identidade_cpf_socios: 'Identidade e CPF dos sócios',
  relacao_funcionarios: 'GFIP ou relação de funcionários',
};

const BENEFICIARY_DOC_LABELS: Record<BeneficiaryDocumentType, string> = {
  identidade_cpf: 'Identidade e CPF',
  comprovante_residencia: 'Comprovante de residência',
  carteirinha_plano_atual: 'Carteirinha do plano atual',
  carta_permanencia: 'Carta de permanência',
  certidao_casamento: 'Certidão de casamento',
  declaracao_uniao_estavel: 'Declaração marital/união estável',
  certidao_nascimento: 'Certidão de nascimento',
  selfie: 'Selfie (opcional)',
};

const ADESAO_DOC_LABELS: Record<AdesaoDocumentType, string> = {
  documento_elegibilidade: 'Documento de elegibilidade',
  formulario_associacao: 'Formulário de associação',
};

function getBeneficiaryDocTypeFromLabel(label: string): BeneficiaryDocumentType | null {
  const docType = (Object.keys(BENEFICIARY_DOC_LABELS) as BeneficiaryDocumentType[]).find(
    (value) => BENEFICIARY_DOC_LABELS[value] === label,
  );

  return docType || null;
}

const ALLOWED_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.bmp',
  '.tif',
  '.tiff',
  '.docx',
  '.txt',
  '.csv',
  '.json',
  '.xml',
  '.html',
  '.htm',
  '.md',
] as const;

const ALLOWED_DOCUMENT_EXTENSIONS_SET = new Set<string>(ALLOWED_DOCUMENT_EXTENSIONS);
const FILE_INPUT_ACCEPT = ALLOWED_DOCUMENT_EXTENSIONS.join(',');

const BASE_STEPS: StepDefinition[] = [
  { id: 'modalidade', label: 'Modalidade' },
  { id: 'estrutura', label: 'Estrutura' },
  { id: 'beneficiarios', label: 'Beneficiários' },
  { id: 'resumo', label: 'Resumo' },
];

const DARK_SELECT_TRIGGER =
  'w-full border-white/20 bg-black/40 text-white data-[placeholder]:text-white/45 focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/30';
const DARK_SELECT_CONTENT = 'border-white/20 bg-[#0a0a0a] text-white';
const DARK_SELECT_ITEM = 'text-white focus:bg-white/10 focus:text-white';
const DARK_INPUT =
  'border-white/20 bg-black/40 text-white placeholder:text-white/45 focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/30';
const DARK_OUTLINE_BUTTON =
  'border-white/20 bg-black/30 text-white hover:bg-black/50 hover:text-white focus-visible:text-white';
const CHECKLIST_BADGE_DONE = 'border-green-400/35 bg-green-500/25 text-green-100';
const CHECKLIST_BADGE_PENDING = 'border-yellow-400/35 bg-yellow-500/25 text-yellow-100';
const CHECKLIST_BADGE_OPTIONAL = 'border-white/45 bg-white/10 text-white';
const FIELD_ERROR_CLASS = 'border-red-500/70 bg-red-950/20 focus-visible:border-red-500 focus-visible:ring-red-500/30';
const PANEL_ERROR_CLASS = 'border-red-500/60 bg-red-500/10';

function getChecklistBadgeVariant(done: boolean, required: boolean): 'success' | 'warning' | 'outline' {
  if (done) return 'success';
  if (required) return 'warning';
  return 'outline';
}

function getChecklistBadgeClass(done: boolean, required: boolean): string {
  if (done) return CHECKLIST_BADGE_DONE;
  if (required) return CHECKLIST_BADGE_PENDING;
  return CHECKLIST_BADGE_OPTIONAL;
}

function isSameUploadTarget(a: UploadTarget | null, b: UploadTarget): boolean {
  if (!a || a.scope !== b.scope) return false;

  if (a.scope === 'empresa' && b.scope === 'empresa') {
    return a.docType === b.docType && (a.partnerId || null) === (b.partnerId || null);
  }

  if (a.scope === 'adesao' && b.scope === 'adesao') {
    return a.docType === b.docType;
  }

  if (a.scope === 'beneficiario' && b.scope === 'beneficiario') {
    return a.beneficiaryId === b.beneficiaryId && a.docType === b.docType;
  }

  return false;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function uniqueNumbers(values: number[]): number[] {
  return Array.from(new Set(values.filter((value) => Number.isFinite(value))));
}

function toConfidenceNumber(value: string): number {
  const sanitized = value.replace('%', '').replace(',', '.').trim();
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatRole(role: BeneficiaryRole): string {
  if (role === 'titular') return 'Titular';
  if (role === 'socio') return 'Sócio';
  if (role === 'funcionario') return 'Funcionário';
  return 'Dependente';
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

function getDocumentExtension(fileName: string): string {
  const extension = fileName.split('.').pop();
  return extension ? extension.toLowerCase() : '';
}

const EXTENSION_MIME_TYPE: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  json: 'application/json',
  xml: 'application/xml',
  html: 'text/html',
  htm: 'text/html',
};

function inferDocumentMimeType(fileName: string, providedMimeType?: string): string {
  const normalizedProvided = (providedMimeType || '').trim().toLowerCase();
  const isGeneric =
    normalizedProvided.length === 0 ||
    normalizedProvided === 'application/octet-stream' ||
    normalizedProvided === 'binary/octet-stream';
  if (!isGeneric) return normalizedProvided;

  const byExtension = EXTENSION_MIME_TYPE[getDocumentExtension(fileName)];
  return byExtension || 'application/octet-stream';
}

function isPreviewableDocument(document: UploadedDocument): boolean {
  const fileType = document.fileType?.toLowerCase() || '';
  if (fileType.startsWith('image/')) return true;
  if (fileType.startsWith('text/')) return true;
  if (fileType === 'application/pdf') return true;

  const extension = getDocumentExtension(document.fileName);
  return ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'bmp', 'tif', 'tiff', 'txt', 'md', 'csv', 'json', 'xml', 'html', 'htm'].includes(extension);
}

function isImagePreviewDocument(document: UploadedDocument): boolean {
  const fileType = document.fileType?.toLowerCase() || '';
  if (fileType.startsWith('image/')) return true;
  const extension = getDocumentExtension(document.fileName);
  return ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tif', 'tiff'].includes(extension);
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

function formatPhoneInput(value: string): string {
  const digits = normalizePhone(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCnpjInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function normalizeEmailInput(value: string): string {
  return value.trim().toLowerCase();
}

function formatCpfInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatRgInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 14);
}

function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function inferAgeFromBirthDate(dateValue: string): string {
  const parts = dateValue.split('/');
  if (parts.length !== 3) return '';
  const day = Number.parseInt(parts[0], 10);
  const month = Number.parseInt(parts[1], 10);
  const year = Number.parseInt(parts[2], 10);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return '';
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return '';

  const birthDate = new Date(year, month - 1, day);
  if (Number.isNaN(birthDate.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasNotHadBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (hasNotHadBirthday) age -= 1;

  if (!Number.isFinite(age) || age < 0 || age > 120) return '';
  return String(age);
}

function normalizeCivilStatusFromExtraction(value?: string | null): CivilStatus | null {
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

function normalizeIdentityDocTypeFromExtraction(value?: string | null): IdentityDocumentType | null {
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

function inferIdentityDocTypeFromExtraction(extracted: PDFExtraido): IdentityDocumentType | null {
  const explicit = normalizeIdentityDocTypeFromExtraction(extracted.documento_identificacao_tipo);
  if (explicit) return explicit;
  if (extracted.numero_habilitacao) return 'cnh';
  if (extracted.ifp) return 'ifp';
  if (extracted.rg) return 'rg';
  return null;
}

function getIdentityDocTypeLabel(value?: IdentityDocumentType | null): string {
  if (value === 'rg') return 'RG';
  if (value === 'cnh') return 'CNH';
  if (value === 'ifp') return 'IFP';
  if (value === 'outro') return 'Outro';
  return 'Não identificado';
}

function normalizeTextMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function containsAnyKeyword(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

function isLikelySamePerson(candidateName: string, optionName: string): boolean {
  const candidate = normalizeTextMatch(candidateName);
  const option = normalizeTextMatch(optionName);
  if (!candidate || !option) return false;
  if (candidate === option) return true;
  return candidate.includes(option) || option.includes(candidate);
}

function isPlaceholderPartnerName(value: string): boolean {
  const normalized = normalizeTextMatch(value);
  if (!normalized) return true;
  return /^socio\s*\d+$/.test(normalized) || /^socia\s*\d+$/.test(normalized);
}

function scoreAddressCandidate(value: string): number {
  const normalized = value.trim();
  if (!normalized) return 0;

  let score = 0;
  if (/\d{5}-?\d{3}/.test(normalized)) score += 4; // CEP
  if (/\b\d{1,5}\b/.test(normalized)) score += 2; // número
  if (/\b(?:ac|al|ap|am|ba|ce|df|es|go|ma|mt|ms|mg|pa|pb|pr|pe|pi|rj|rn|rs|ro|rr|sc|sp|se|to)\b/i.test(normalized)) {
    score += 2; // UF
  }
  if (normalized.length >= 20) score += 2;
  if (normalized.length >= 35) score += 1;
  return score;
}

function getBestAddressCandidate(values: Array<string | null | undefined>): string | null {
  const candidates = values
    .map((value) => (value || '').trim())
    .filter((value) => value.length > 0);
  if (candidates.length === 0) return null;

  const ranked = candidates
    .map((value) => ({ value, score: scoreAddressCandidate(value) }))
    .sort((a, b) => b.score - a.score || b.value.length - a.value.length);

  return ranked[0]?.value || null;
}

function hasUploadedDocs(value?: UploadedDocument[]): boolean {
  return Boolean(value && value.length > 0);
}

type ExtractionField = {
  label: string;
  value: string;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getExtractionFields(extracted: PDFExtraido): ExtractionField[] {
  const fields: ExtractionField[] = [];
  const pushField = (label: string, value?: string | null) => {
    if (!value) return;
    const normalized = value.trim();
    if (!normalized) return;
    fields.push({ label, value: normalized });
  };

  pushField('Nome completo', extracted.nome_completo || null);

  if (extracted.nome_beneficiarios.length > 0) {
    pushField('Beneficiários/Sócios', uniqueStrings(extracted.nome_beneficiarios).join(', '));
  }

  if (extracted.idades.length > 0) {
    pushField('Idades', uniqueNumbers(extracted.idades).join(', '));
  }

  pushField('CPF', extracted.cpf ? formatCpfInput(extracted.cpf) : null);
  pushField('RG', extracted.rg || null);
  pushField('IFP', extracted.ifp || null);
  const detectedIdentityType = inferIdentityDocTypeFromExtraction(extracted);
  if (detectedIdentityType) {
    pushField('Tipo de documento', getIdentityDocTypeLabel(detectedIdentityType));
  }
  pushField('Nº da habilitação', extracted.numero_habilitacao || null);
  pushField('Data de nascimento', extracted.data_nascimento || null);
  pushField('Data de expedição', extracted.data_expedicao || null);
  pushField('Órgão expedidor', extracted.orgao_expedidor || null);

  pushField('CNPJ', extracted.cnpj ? formatCnpjInput(extracted.cnpj) : null);
  pushField('Razão social', extracted.razao_social || null);
  pushField('Nome fantasia', extracted.nome_fantasia || null);
  pushField('Inscrição estadual', extracted.inscricao_estadual || null);
  pushField('Data de abertura', extracted.data_abertura || null);
  pushField('Status CNPJ', extracted.status_cnpj || null);
  pushField('Data início atividade', extracted.data_inicio_atividade || null);

  pushField('Operadora', extracted.operadora || null);
  pushField('Tipo de plano', extracted.tipo_plano || null);
  if (typeof extracted.valor_atual === 'number') {
    pushField('Valor atual', formatCurrency(extracted.valor_atual));
  }

  pushField('Estado civil', extracted.estado_civil || null);
  pushField('E-mail', extracted.email || null);
  pushField('Telefone', extracted.telefone ? formatPhoneInput(extracted.telefone) : null);
  pushField('Endereço', extracted.endereco || null);

  if (extracted.socios_detectados && extracted.socios_detectados.length > 0) {
    pushField('Sócios detectados', uniqueStrings(extracted.socios_detectados).join(', '));
  }
  if (typeof extracted.total_socios === 'number' && extracted.total_socios > 0) {
    pushField('Total de sócios', String(extracted.total_socios));
  }

  pushField('Observações', extracted.observacoes || null);
  pushField('Confiança', extracted.confianca || null);

  return fields;
}

function buildExtractionCopyText(extracted: PDFExtraido): string {
  return getExtractionFields(extracted)
    .map((field) => `${field.label}: ${field.value}`)
    .join('\n');
}

function getUnifiedExtractionFromDocuments(docs: UploadedDocument[]): PDFExtraido {
  const merged: PDFExtraido = {
    idades: [],
    operadora: null,
    valor_atual: null,
    tipo_plano: null,
    nome_beneficiarios: [],
    observacoes: null,
    confianca: 'baixa',
    texto_extraido_preview: null,
    total_caracteres: 0,
    socios_detectados: [],
    total_socios: null,
  };

  const assignLatestString = (
    key:
      | 'operadora'
      | 'tipo_plano'
      | 'nome_completo'
      | 'cpf'
      | 'rg'
      | 'ifp'
      | 'documento_identificacao_tipo'
      | 'data_expedicao'
      | 'orgao_expedidor'
      | 'numero_habilitacao'
      | 'cnpj'
      | 'razao_social'
      | 'inscricao_estadual'
      | 'data_abertura'
      | 'status_cnpj'
      | 'data_inicio_atividade'
      | 'nome_fantasia'
      | 'estado_civil'
      | 'email'
      | 'telefone'
      | 'endereco'
      | 'data_nascimento'
      | 'observacoes'
      | 'confianca',
    value?: string | null,
  ) => {
    if (!value) return;
    const normalized = value.trim();
    if (!normalized) return;
    (merged as PDFExtraido & Record<string, string | null>)[key] = normalized;
  };

  docs.forEach((document) => {
    const extracted = document.extracted;
    merged.idades = uniqueNumbers([...(merged.idades || []), ...(extracted.idades || [])]);
    merged.nome_beneficiarios = uniqueStrings([
      ...(merged.nome_beneficiarios || []),
      ...(extracted.nome_beneficiarios || []),
    ]);
    merged.socios_detectados = uniqueStrings([
      ...(merged.socios_detectados || []),
      ...(extracted.socios_detectados || []),
    ]);
    merged.total_caracteres += extracted.total_caracteres || 0;

    if (typeof extracted.valor_atual === 'number' && Number.isFinite(extracted.valor_atual)) {
      merged.valor_atual = extracted.valor_atual;
    }

    if (typeof extracted.total_socios === 'number' && extracted.total_socios > 0) {
      merged.total_socios = Math.max(merged.total_socios || 0, extracted.total_socios);
    }

    assignLatestString('operadora', extracted.operadora);
    assignLatestString('tipo_plano', extracted.tipo_plano);
    assignLatestString('nome_completo', extracted.nome_completo);
    assignLatestString('cpf', extracted.cpf);
    assignLatestString('rg', extracted.rg);
    assignLatestString('ifp', extracted.ifp);
    assignLatestString('documento_identificacao_tipo', extracted.documento_identificacao_tipo || null);
    assignLatestString('data_expedicao', extracted.data_expedicao);
    assignLatestString('orgao_expedidor', extracted.orgao_expedidor);
    assignLatestString('numero_habilitacao', extracted.numero_habilitacao);
    assignLatestString('cnpj', extracted.cnpj);
    assignLatestString('razao_social', extracted.razao_social);
    assignLatestString('inscricao_estadual', extracted.inscricao_estadual);
    assignLatestString('data_abertura', extracted.data_abertura);
    assignLatestString('status_cnpj', extracted.status_cnpj);
    assignLatestString('data_inicio_atividade', extracted.data_inicio_atividade);
    assignLatestString('nome_fantasia', extracted.nome_fantasia);
    assignLatestString('estado_civil', extracted.estado_civil || null);
    assignLatestString('email', extracted.email || null);
    assignLatestString('telefone', extracted.telefone || null);
    assignLatestString('endereco', extracted.endereco || null);
    assignLatestString('data_nascimento', extracted.data_nascimento || null);
    assignLatestString('observacoes', extracted.observacoes || null);
    assignLatestString('confianca', extracted.confianca || null);
  });

  if (!merged.confianca) {
    merged.confianca = 'baixa';
  }

  return merged;
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = window.document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  window.document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = window.document.execCommand('copy');
  window.document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('Falha ao copiar');
  }
}

function createCompanyPartner(index: number, name?: string): CompanyPartnerProfile {
  return {
    id: `company-partner-${Date.now()}-${index}-${Math.random().toString(16).slice(2, 8)}`,
    nome: name?.trim() || `Sócio ${index + 1}`,
    documento_tipo: null,
    cpf: '',
    rg: '',
    ifp: '',
    dataNascimento: '',
    dataExpedicao: '',
    orgaoExpedidor: '',
    numeroHabilitacao: '',
  };
}

function getExtractedCompanyPartners(extracted: PDFExtraido): string[] {
  const extractedWithPartners = extracted as PDFExtraido & {
    socios_detectados?: string[];
  };

  const explicitPartners = Array.isArray(extractedWithPartners.socios_detectados)
    ? extractedWithPartners.socios_detectados
    : [];

  return uniqueStrings([...explicitPartners, ...extracted.nome_beneficiarios]);
}

function getExtractedCompanyPartnersTotal(extracted: PDFExtraido, names: string[]): number {
  const extractedWithPartners = extracted as PDFExtraido & {
    total_socios?: number | null;
  };

  const explicitTotal = extractedWithPartners.total_socios;
  if (typeof explicitTotal === 'number' && Number.isFinite(explicitTotal) && explicitTotal > 0) {
    return Math.trunc(explicitTotal);
  }

  return names.length;
}

function getLastExtractedValue(
  docs: UploadedDocument[],
  pick: (extracted: PDFExtraido) => string | null | undefined,
): string | null {
  for (let index = docs.length - 1; index >= 0; index -= 1) {
    const candidate = pick(docs[index].extracted);
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
}

function getContractSocialExtractionSummary(docs: UploadedDocument[]): {
  cnpj: string | null;
  razaoSocial: string | null;
  inscricaoEstadual: string | null;
  dataAbertura: string | null;
} {
  return {
    cnpj: getLastExtractedValue(docs, (extracted) => extracted.cnpj),
    razaoSocial: getLastExtractedValue(docs, (extracted) => extracted.razao_social),
    inscricaoEstadual: getLastExtractedValue(docs, (extracted) => extracted.inscricao_estadual),
    dataAbertura: getLastExtractedValue(docs, (extracted) => extracted.data_abertura),
  };
}

function getCnpjCardExtractionSummary(docs: UploadedDocument[]): {
  status: string | null;
  dataInicio: string | null;
  nomeFantasia: string | null;
} {
  return {
    status: getLastExtractedValue(docs, (extracted) => extracted.status_cnpj),
    dataInicio: getLastExtractedValue(docs, (extracted) => extracted.data_inicio_atividade),
    nomeFantasia: getLastExtractedValue(docs, (extracted) => extracted.nome_fantasia),
  };
}

type CompanyPartnerIdentitySummary = {
  documentoTipo: IdentityDocumentType | null;
  cpf: string;
  rg: string;
  ifp: string;
  numeroHabilitacao: string;
  dataNascimento: string;
  dataExpedicao: string;
  orgaoExpedidor: string;
};

function buildCompanyPartnerIdentityCopyText(
  partnerName: string,
  summary: CompanyPartnerIdentitySummary,
): string {
  const lines: string[] = [];
  if (partnerName.trim()) lines.push(`Sócio: ${partnerName.trim()}`);
  if (summary.documentoTipo) lines.push(`Documento: ${getIdentityDocTypeLabel(summary.documentoTipo)}`);
  if (summary.cpf) lines.push(`CPF: ${formatCpfInput(summary.cpf)}`);
  if (summary.rg) lines.push(`RG: ${summary.rg}`);
  if (summary.ifp) lines.push(`IFP: ${summary.ifp}`);
  if (summary.numeroHabilitacao) lines.push(`Nº da habilitação: ${summary.numeroHabilitacao}`);
  if (summary.dataNascimento) lines.push(`Data de nascimento: ${summary.dataNascimento}`);
  if (summary.dataExpedicao) lines.push(`Data de expedição: ${summary.dataExpedicao}`);
  if (summary.orgaoExpedidor) lines.push(`Órgão expedidor: ${summary.orgaoExpedidor}`);
  return lines.join('\n');
}

function getCompanyPartnerIdentitySummary(
  partner: CompanyPartnerProfile,
  identityDocs: UploadedDocument[],
): CompanyPartnerIdentitySummary {
  const linkedDocs = identityDocs.filter((document) => document.linkedEntityId === partner.id);
  const documentTypeFromDocs = (() => {
    for (let index = linkedDocs.length - 1; index >= 0; index -= 1) {
      const detected = inferIdentityDocTypeFromExtraction(linkedDocs[index].extracted);
      if (detected) return detected;
    }
    return null;
  })();

  return {
    documentoTipo: partner.documento_tipo || documentTypeFromDocs || null,
    cpf: partner.cpf || getLastExtractedValue(linkedDocs, (extracted) => extracted.cpf) || '',
    rg: partner.rg || getLastExtractedValue(linkedDocs, (extracted) => extracted.rg) || '',
    ifp: partner.ifp || getLastExtractedValue(linkedDocs, (extracted) => extracted.ifp) || '',
    numeroHabilitacao:
      partner.numeroHabilitacao ||
      getLastExtractedValue(linkedDocs, (extracted) => extracted.numero_habilitacao) ||
      '',
    dataNascimento:
      partner.dataNascimento ||
      formatDateInput(getLastExtractedValue(linkedDocs, (extracted) => extracted.data_nascimento) || '') ||
      '',
    dataExpedicao:
      partner.dataExpedicao ||
      formatDateInput(getLastExtractedValue(linkedDocs, (extracted) => extracted.data_expedicao) || '') ||
      '',
    orgaoExpedidor:
      partner.orgaoExpedidor ||
      getLastExtractedValue(linkedDocs, (extracted) => extracted.orgao_expedidor) ||
      '',
  };
}

function getCompanyPartnerDocStatuses(
  partners: CompanyPartnerProfile[],
  docs: UploadedDocument[],
): CompanyPartnerDocStatus[] {
  if (partners.length === 0) return [];

  const linkedDocsCount = new Map<string, number>();
  let unlinkedDocsCount = 0;

  docs.forEach((document) => {
    const linkedEntityId = document.linkedEntityId;
    if (linkedEntityId) {
      linkedDocsCount.set(linkedEntityId, (linkedDocsCount.get(linkedEntityId) || 0) + 1);
      return;
    }
    unlinkedDocsCount += 1;
  });

  return partners.map((partner) => {
    const directCount = linkedDocsCount.get(partner.id) || 0;
    if (directCount > 0) {
      return { partner, done: true, filesCount: directCount };
    }

    if (unlinkedDocsCount > 0) {
      unlinkedDocsCount -= 1;
      return { partner, done: true, filesCount: 1 };
    }

    return { partner, done: false, filesCount: 0 };
  });
}

function mapDocumentsForPayload<TDocumentType extends string>(
  docsByType: Partial<Record<TDocumentType, UploadedDocument[]>>,
) {
  const entries = Object.entries(docsByType) as Array<[TDocumentType, UploadedDocument[] | undefined]>;

  return entries.flatMap(([docType, docs]) =>
    (docs || []).map((document) => ({
      tipo_documento: docType,
      label: document.requirementLabel,
      arquivo: document.fileName,
      tamanho: document.fileSize,
      processado_em: document.uploadedAt,
      entidade_vinculada_id: document.linkedEntityId || null,
      dados_extraidos: {
        nome_completo: document.extracted.nome_completo || null,
        cpf: document.extracted.cpf || null,
        rg: document.extracted.rg || null,
        ifp: document.extracted.ifp || null,
        documento_identificacao_tipo: document.extracted.documento_identificacao_tipo || null,
        data_expedicao: document.extracted.data_expedicao || null,
        orgao_expedidor: document.extracted.orgao_expedidor || null,
        numero_habilitacao: document.extracted.numero_habilitacao || null,
        cnpj: document.extracted.cnpj || null,
        razao_social: document.extracted.razao_social || null,
        inscricao_estadual: document.extracted.inscricao_estadual || null,
        data_abertura: document.extracted.data_abertura || null,
        status_cnpj: document.extracted.status_cnpj || null,
        data_inicio_atividade: document.extracted.data_inicio_atividade || null,
        nome_fantasia: document.extracted.nome_fantasia || null,
        estado_civil: document.extracted.estado_civil || null,
        email: document.extracted.email || null,
        telefone: document.extracted.telefone || null,
        endereco: document.extracted.endereco || null,
        data_nascimento: document.extracted.data_nascimento || null,
        socios_detectados: document.extracted.socios_detectados || [],
        total_socios: document.extracted.total_socios ?? null,
      },
    })),
  );
}

function parsePositiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseNonNegativeInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : -1;
}

function isBeneficiaryMinor(age: string): boolean {
  const parsed = Number.parseInt(age, 10);
  return Number.isFinite(parsed) && parsed < 18;
}

function getCompanyRequirements(params: {
  enabled: boolean;
  hasEmployees: boolean;
  companyDocs: Partial<Record<CompanyDocumentType, UploadedDocument[]>>;
  partnerDocStatuses: CompanyPartnerDocStatus[];
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyDataMode: CompanyDataMode;
}): RequirementStatus[] {
  if (!params.enabled) return [];

  const totalPartners = params.partnerDocStatuses.length;
  const donePartners = params.partnerDocStatuses.filter((status) => status.done).length;
  const hasPartnerIdentityDocs = hasUploadedDocs(params.companyDocs.identidade_cpf_socios);

  const requirements: RequirementStatus[] = [
    {
      id: 'contato_empresa',
      label: 'Telefone e e-mail do titular da empresa',
      required: true,
      done: params.companyEmail.trim().length > 0 && params.companyPhone.trim().length > 0,
    },
    {
      id: 'endereco_empresa',
      label: 'Endereço da empresa (apenas modo manual)',
      required: params.companyDataMode === 'manual',
      done: params.companyDataMode !== 'manual' || params.companyAddress.trim().length > 0,
      helper:
        params.companyDataMode === 'manual'
          ? 'Informe manualmente apenas se optar por preencher a proposta no modo manual.'
          : 'A IA preenche automaticamente com base nos documentos enviados.',
    },
    {
      id: 'contrato_social',
      label: 'Contrato social',
      required: true,
      done: hasUploadedDocs(params.companyDocs.contrato_social),
    },
    {
      id: 'cartao_cnpj',
      label: 'Cartão CNPJ',
      required: true,
      done: hasUploadedDocs(params.companyDocs.cartao_cnpj),
    },
    {
      id: 'comprovante_endereco_empresa',
      label: 'Comprovante de endereço da empresa',
      required: true,
      done: hasUploadedDocs(params.companyDocs.comprovante_endereco_empresa),
    },
    {
      id: 'alteracao_contratual',
      label: 'Alteração contratual',
      required: false,
      done: hasUploadedDocs(params.companyDocs.alteracao_contratual),
      helper: 'Obrigatório apenas se houver alteração.',
    },
    {
      id: 'identidade_cpf_socios',
      label: 'Identidade e CPF de todos os sócios',
      required: true,
      done: totalPartners > 0 ? donePartners >= totalPartners : hasPartnerIdentityDocs,
      helper:
        totalPartners > 0
          ? `${donePartners}/${totalPartners} sócio(s) com documento vinculado.`
          : undefined,
    },
    {
      id: 'relacao_funcionarios',
      label: 'GFIP ou relação de funcionários',
      required: params.hasEmployees,
      done: hasUploadedDocs(params.companyDocs.relacao_funcionarios),
      helper: params.hasEmployees
        ? undefined
        : 'Ative "Empresa com funcionários" quando este documento for obrigatório.',
    },
  ];

  return requirements;
}

function getBeneficiaryRequirements(beneficiary: BeneficiaryForm): RequirementStatus[] {
  const isMarried = beneficiary.estadoCivil === 'casado' || beneficiary.estadoCivil === 'uniao_estavel';

  const requirements: RequirementStatus[] = [
    {
      id: `${beneficiary.id}-nome`,
      label: 'Nome completo',
      required: true,
      done: beneficiary.nome.trim().length > 0,
    },
    {
      id: `${beneficiary.id}-idade`,
      label: 'Idade',
      required: true,
      done: parseNonNegativeInt(beneficiary.idade) >= 0,
    },
    {
      id: `${beneficiary.id}-estado-civil`,
      label: 'Estado civil',
      required: true,
      done: Boolean(beneficiary.estadoCivil),
    },
    {
      id: `${beneficiary.id}-identidade`,
      label: 'Identidade e CPF',
      required: true,
      done: hasUploadedDocs(beneficiary.documentos.identidade_cpf),
    },
    {
      id: `${beneficiary.id}-residencia`,
      label: 'Comprovante de residência',
      required: true,
      done: hasUploadedDocs(beneficiary.documentos.comprovante_residencia),
    },
    {
      id: `${beneficiary.id}-carteirinha`,
      label: 'Carteirinha do plano atual',
      required: true,
      done: hasUploadedDocs(beneficiary.documentos.carteirinha_plano_atual),
    },
    {
      id: `${beneficiary.id}-permanencia`,
      label: 'Carta de permanência',
      required: true,
      done: hasUploadedDocs(beneficiary.documentos.carta_permanencia),
    },
  ];

  if (isMarried) {
    const requiresMarriageDoc = beneficiary.comprovacaoConjugal === 'certidao'
      ? 'certidao_casamento'
      : 'declaracao_uniao_estavel';

    requirements.push({
      id: `${beneficiary.id}-casamento`,
      label:
        beneficiary.comprovacaoConjugal === 'certidao'
          ? 'Certidão de casamento'
          : 'Declaração marital/união estável',
      required: true,
      done: hasUploadedDocs(beneficiary.documentos[requiresMarriageDoc]),
    });
  }

  if (isBeneficiaryMinor(beneficiary.idade)) {
    requirements.push({
      id: `${beneficiary.id}-nascimento`,
      label: 'Certidão de nascimento',
      required: true,
      done: hasUploadedDocs(beneficiary.documentos.certidao_nascimento),
    });
  }

  requirements.push({
    id: `${beneficiary.id}-selfie`,
    label: BENEFICIARY_DOC_LABELS.selfie,
    required: false,
    done: hasUploadedDocs(beneficiary.documentos.selfie),
    helper: 'Opcional para validação facial.',
  });

  return requirements;
}

function getAdesaoRequirements(params: {
  enabled: boolean;
  adesaoDocs: Partial<Record<AdesaoDocumentType, UploadedDocument[]>>;
}): RequirementStatus[] {
  if (!params.enabled) return [];

  return [
    {
      id: 'adesao-elegibilidade',
      label: ADESAO_DOC_LABELS.documento_elegibilidade,
      required: true,
      done: hasUploadedDocs(params.adesaoDocs.documento_elegibilidade),
    },
    {
      id: 'adesao-formulario',
      label: ADESAO_DOC_LABELS.formulario_associacao,
      required: true,
      done: hasUploadedDocs(params.adesaoDocs.formulario_associacao),
    },
  ];
}

function createBeneficiary(role: BeneficiaryRole, index: number, existing?: BeneficiaryForm): BeneficiaryForm {
  if (existing) {
    return {
      ...existing,
      role,
    };
  }

  return {
    id: `benef-${Date.now()}-${index}`,
    role,
    nome: '',
    idade: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    email: '',
    telefone: '',
    estadoCivil: 'solteiro',
    comprovacaoConjugal: 'certidao',
    documentos: {},
  };
}

export default function ScannerDocumentos({
  onDadosExtraidos,
  corretorId,
  registrarFilaProposta,
  permitirLeadExistente,
  onPropostaSalva,
}: ScannerDocumentosProps) {
  const [category, setCategory] = useState<ProposalCategory>('');
  const [totalLives, setTotalLives] = useState('1');
  const [partnerCount, setPartnerCount] = useState('1');
  const [employeeCount, setEmployeeCount] = useState('0');
  const [hasEmployees, setHasEmployees] = useState(false);
  const [isStructureReady, setIsStructureReady] = useState(false);

  const [primaryEmail, setPrimaryEmail] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [companyLegalName, setCompanyLegalName] = useState('');
  const [companyEmailTouched, setCompanyEmailTouched] = useState(false);
  const [companyPhoneTouched, setCompanyPhoneTouched] = useState(false);
  const [companyAddressTouched, setCompanyAddressTouched] = useState(false);
  const [companyPartners, setCompanyPartners] = useState<CompanyPartnerProfile[]>([]);

  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryForm[]>([]);
  const [companyDocs, setCompanyDocs] = useState<Partial<Record<CompanyDocumentType, UploadedDocument[]>>>({});
  const [adesaoDocs, setAdesaoDocs] = useState<Partial<Record<AdesaoDocumentType, UploadedDocument[]>>>({});
  const [companyDataMode, setCompanyDataMode] = useState<CompanyDataMode>('');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedAdesaoDocType, setSelectedAdesaoDocType] = useState<AdesaoDocumentType>('documento_elegibilidade');
  const [selectedAdesaoManageDocType, setSelectedAdesaoManageDocType] = useState<AdesaoDocumentType>('documento_elegibilidade');
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>('');
  const [selectedBeneficiaryDocType, setSelectedBeneficiaryDocType] = useState<BeneficiaryDocumentType>('identidade_cpf');
  const [selectedBeneficiaryManageDocType, setSelectedBeneficiaryManageDocType] = useState<BeneficiaryDocumentType>('identidade_cpf');
  const [expandedCompanyDocPanels, setExpandedCompanyDocPanels] = useState<Partial<Record<CompanyDocumentType, boolean>>>({});
  const [expandedBeneficiaryDocPanels, setExpandedBeneficiaryDocPanels] = useState<Record<string, boolean>>({});
  const [validationAttemptedStep, setValidationAttemptedStep] = useState<StepDefinition['id'] | null>(null);
  const [previewDialogDocument, setPreviewDialogDocument] = useState<UploadedDocument | null>(null);
  const [previewRenderFailed, setPreviewRenderFailed] = useState(false);
  const [corretorOptions, setCorretorOptions] = useState<CorretorAssignableOption[]>([]);
  const [selectedCorretorId, setSelectedCorretorId] = useState('');
  const [loadingCorretorOptions, setLoadingCorretorOptions] = useState(false);

  const [pendingUploadTarget, setPendingUploadTarget] = useState<UploadTarget | null>(null);
  const [activeUploadTarget, setActiveUploadTarget] = useState<UploadTarget | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [scanFullResult, setScanFullResult] = useState<ScanFullBatchResult | null>(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanFullInputRef = useRef<HTMLInputElement>(null);
  const uploadedDocumentsRef = useRef<UploadedDocument[]>([]);

  const visibleSteps = useMemo<StepDefinition[]>(() => {
    if (category === 'pessoa_juridica') {
      return [
        { id: 'modalidade', label: 'Modalidade' },
        { id: 'estrutura', label: 'Estrutura' },
        { id: 'empresa', label: 'Documentos da Empresa' },
        { id: 'beneficiarios', label: 'Beneficiários' },
        { id: 'resumo', label: 'Resumo' },
      ];
    }

    return BASE_STEPS;
  }, [category]);

  useEffect(() => {
    if (currentStepIndex >= visibleSteps.length) {
      setCurrentStepIndex(visibleSteps.length - 1);
    }
  }, [currentStepIndex, visibleSteps.length]);

  useEffect(() => {
    if (!corretorId) return;
    setSelectedCorretorId(corretorId);
  }, [corretorId]);

  useEffect(() => {
    if (corretorId) return;

    let active = true;
    setLoadingCorretorOptions(true);

    void (async () => {
      const result = await getCorretoresList();
      if (!active) return;

      if (result.success && result.data) {
        setCorretorOptions(result.data);
      } else {
        setCorretorOptions([]);
        if (result.error) {
          toast.error('Não foi possível carregar a lista de corretores.', {
            description: result.error,
          });
        }
      }

      setLoadingCorretorOptions(false);
    })();

    return () => {
      active = false;
    };
  }, [corretorId]);

  useEffect(() => {
    if (corretorId || !selectedCorretorId) return;
    const exists = corretorOptions.some((option) => option.id === selectedCorretorId);
    if (!exists) {
      setSelectedCorretorId('');
    }
  }, [corretorId, corretorOptions, selectedCorretorId]);

  useEffect(() => {
    if (category !== 'pessoa_juridica') return;

    if (!companyEmailTouched) {
      setCompanyEmail(primaryEmail);
    }

    if (!companyPhoneTouched) {
      setCompanyPhone(primaryPhone);
    }
  }, [category, primaryEmail, primaryPhone, companyEmailTouched, companyPhoneTouched]);

  useEffect(() => {
    if (category !== 'pessoa_juridica') {
      setCompanyPartners([]);
      return;
    }

    const totalPartners = parsePositiveInt(partnerCount);
    if (totalPartners <= 0) {
      setCompanyPartners([]);
      return;
    }

    setCompanyPartners((prev) =>
      Array.from({ length: totalPartners }, (_, index) => {
        const existing = prev[index];
        if (existing) {
          return {
            ...existing,
            nome: existing.nome.trim() || `Sócio ${index + 1}`,
          };
        }

        return createCompanyPartner(index);
      }),
    );
  }, [category, partnerCount]);

  const companyPartnerDocStatuses = useMemo(
    () => getCompanyPartnerDocStatuses(companyPartners, companyDocs.identidade_cpf_socios || []),
    [companyDocs.identidade_cpf_socios, companyPartners],
  );
  const pendingCompanyPartnerDocStatuses = useMemo(
    () => companyPartnerDocStatuses.filter((status) => !status.done),
    [companyPartnerDocStatuses],
  );

  const companyRequirements = useMemo(
    () =>
      getCompanyRequirements({
        enabled: category === 'pessoa_juridica',
        hasEmployees,
        companyDocs,
        partnerDocStatuses: companyPartnerDocStatuses,
        companyEmail,
        companyPhone,
        companyAddress,
        companyDataMode,
      }),
    [
      category,
      companyAddress,
      companyDataMode,
      companyDocs,
      companyEmail,
      companyPartnerDocStatuses,
      companyPhone,
      hasEmployees,
    ],
  );

  const suggestedCompanyAddress = useMemo(() => {
    const companyDocAddresses = Object.values(companyDocs)
      .flatMap((docs) => docs || [])
      .map((document) => document.extracted.endereco || null);
    return getBestAddressCandidate(companyDocAddresses);
  }, [companyDocs]);

  useEffect(() => {
    if (category !== 'pessoa_juridica') return;
    if (companyAddressTouched) return;
    if (companyAddress.trim().length > 0) return;
    if (!suggestedCompanyAddress) return;

    setCompanyAddress(suggestedCompanyAddress);
  }, [category, companyAddress, companyAddressTouched, suggestedCompanyAddress]);

  const adesaoRequirements = useMemo(
    () =>
      getAdesaoRequirements({
        enabled: category === 'adesao',
        adesaoDocs,
      }),
    [adesaoDocs, category],
  );

  const beneficiaryRequirementsMap = useMemo(
    () =>
      new Map(
        beneficiaries.map((beneficiary) => [beneficiary.id, getBeneficiaryRequirements(beneficiary)]),
      ),
    [beneficiaries],
  );

  const allUploadedDocuments = useMemo(() => {
    const companyUploaded = Object.values(companyDocs).flatMap((docs) => docs || []);
    const adesaoUploaded = Object.values(adesaoDocs).flatMap((docs) => docs || []);
    const beneficiaryUploaded = beneficiaries.flatMap((beneficiary) =>
      Object.values(beneficiary.documentos).flatMap((docs) => docs || []),
    );

    return [...companyUploaded, ...adesaoUploaded, ...beneficiaryUploaded];
  }, [adesaoDocs, beneficiaries, companyDocs]);

  const extractedSummary = useMemo(() => {
    const extracted = allUploadedDocuments.map((document) => document.extracted);

    const names = uniqueStrings(extracted.flatMap((item) => item.nome_beneficiarios));
    const ages = uniqueNumbers(extracted.flatMap((item) => item.idades)).sort((a, b) => a - b);

    const operator = extracted.find((item) => item.operadora)?.operadora ?? null;
    const planType = extracted.find((item) => item.tipo_plano)?.tipo_plano ?? null;
    const currentValue = extracted.find((item) => item.valor_atual != null)?.valor_atual ?? null;

    const confidenceValues = extracted
      .map((item) => toConfidenceNumber(item.confianca))
      .filter((value) => value > 0);

    const averageConfidence = confidenceValues.length
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
      : null;

    return {
      names,
      ages,
      operator,
      planType,
      currentValue,
      averageConfidence,
      totalDocuments: allUploadedDocuments.length,
      totalCharacters: extracted.reduce((sum, item) => sum + (item.total_caracteres || 0), 0),
    };
  }, [allUploadedDocuments]);

  const resolvedCorretorId = (corretorId || selectedCorretorId || '').trim();
  const assignedCorretorLabel = useMemo(() => {
    if (corretorId) return 'Corretor autenticado';
    if (!selectedCorretorId) return 'Sem responsável';
    return (
      corretorOptions.find((option) => option.id === selectedCorretorId)?.nome ||
      'Responsável selecionado'
    );
  }, [corretorId, corretorOptions, selectedCorretorId]);

  const categoryComplete = category !== '';

  const totalLivesNumber = parsePositiveInt(totalLives);
  const partnerCountNumber = parsePositiveInt(partnerCount);
  const employeeCountNumber =
    category === 'pessoa_juridica' && hasEmployees ? parsePositiveInt(employeeCount) : 0;
  const maxPartnersAllowed =
    category === 'pessoa_juridica' ? Math.max(totalLivesNumber - employeeCountNumber, 1) : 1;
  const dependentsCountNumber =
    category === 'pessoa_juridica'
      ? Math.max(totalLivesNumber - partnerCountNumber - employeeCountNumber, 0)
      : Math.max(totalLivesNumber - 1, 0);

  const structureComplete =
    isStructureReady &&
    totalLivesNumber > 0 &&
    beneficiaries.length === totalLivesNumber &&
    normalizePhone(primaryPhone).length >= 10 &&
    primaryEmail.trim().length > 0;

  const companyComplete =
    category !== 'pessoa_juridica' ||
    companyRequirements.filter((item) => item.required && !item.done).length === 0;

  const adesaoComplete =
    category !== 'adesao' ||
    adesaoRequirements.filter((item) => item.required && !item.done).length === 0;

  const beneficiariesComplete =
    beneficiaries.length > 0 &&
    beneficiaries.every((beneficiary) => {
      const requirements = beneficiaryRequirementsMap.get(beneficiary.id) || [];
      return requirements.every((requirement) => !requirement.required || requirement.done);
    });

  const stepCompletion: Record<StepDefinition['id'], boolean> = {
    modalidade: categoryComplete,
    estrutura: structureComplete,
    empresa: companyComplete,
    beneficiarios: beneficiariesComplete && adesaoComplete,
    resumo: categoryComplete && structureComplete && companyComplete && beneficiariesComplete && adesaoComplete,
  };

  const currentStep = visibleSteps[currentStepIndex];

  const getMissingByStep = useCallback(
    (stepId: StepDefinition['id']): { missingIds: string[]; missingMessages: string[] } => {
      const missingIds: string[] = [];
      const missingMessages: string[] = [];
      const appendMissing = (id: string, message: string) => {
        missingIds.push(id);
        missingMessages.push(message);
      };

      if (stepId === 'modalidade') {
        if (!categoryComplete) {
          appendMissing('modalidade-categoria', 'Selecione a modalidade da proposta.');
        }
        return { missingIds, missingMessages };
      }

      if (stepId === 'estrutura') {
        if (totalLivesNumber <= 0) {
          appendMissing('estrutura-total-vidas', 'Informe um total de vidas válido.');
        }

        if (category === 'pessoa_juridica') {
          if (partnerCountNumber <= 0 || partnerCountNumber > totalLivesNumber) {
            appendMissing('estrutura-socios', 'Quantidade de sócios inválida para o total de vidas.');
          }

          if (hasEmployees && employeeCountNumber <= 0) {
            appendMissing('estrutura-funcionarios', 'Informe a quantidade de funcionários.');
          }

          if (partnerCountNumber + employeeCountNumber > totalLivesNumber && totalLivesNumber > 0) {
            appendMissing('estrutura-distribuicao', 'A soma de sócios e funcionários não pode exceder o total de vidas.');
          }
        }

        if (primaryEmail.trim().length === 0) {
          appendMissing('estrutura-contato-email', 'Preencha o e-mail de contato principal.');
        }
        if (normalizePhone(primaryPhone).length < 10) {
          appendMissing('estrutura-contato-telefone', 'Preencha o telefone principal com DDD.');
        }

        return { missingIds, missingMessages };
      }

      if (stepId === 'empresa') {
        if (category !== 'pessoa_juridica') return { missingIds, missingMessages };

        if (!companyDataMode) {
          appendMissing('empresa-modo', 'Selecione como deseja preencher os dados da empresa.');
        }

        companyRequirements
          .filter((item) => item.required && !item.done)
          .forEach((item) => {
            appendMissing(`empresa-${item.id}`, `Empresa: ${item.label}`);
          });

        return { missingIds, missingMessages };
      }

      if (stepId === 'beneficiarios') {
        if (category === 'adesao') {
          adesaoRequirements
            .filter((item) => item.required && !item.done)
            .forEach((item) => {
              appendMissing(`beneficiarios-adesao-${item.id}`, `Adesão: ${item.label}`);
            });
        }

        beneficiaries.forEach((beneficiary, index) => {
          const requirements = beneficiaryRequirementsMap.get(beneficiary.id) || [];
          requirements
            .filter((item) => item.required && !item.done)
            .forEach((item) => {
              appendMissing(
                item.id,
                `Beneficiário ${index + 1} (${beneficiary.nome || formatRole(beneficiary.role)}): ${item.label}`,
              );
            });
        });

        return { missingIds, missingMessages };
      }

      if (!categoryComplete) {
        appendMissing('resumo-modalidade', 'Selecione a modalidade da proposta.');
      }
      if (!structureComplete) {
        appendMissing('resumo-estrutura', 'Conclua a estrutura da proposta (vidas + contato principal).');
      }
      companyRequirements
        .filter((item) => item.required && !item.done)
        .forEach((item) => appendMissing(`resumo-empresa-${item.id}`, `Empresa: ${item.label}`));
      adesaoRequirements
        .filter((item) => item.required && !item.done)
        .forEach((item) => appendMissing(`resumo-adesao-${item.id}`, `Adesão: ${item.label}`));
      beneficiaries.forEach((beneficiary, index) => {
        const requirements = beneficiaryRequirementsMap.get(beneficiary.id) || [];
        requirements
          .filter((item) => item.required && !item.done)
          .forEach((item) =>
            appendMissing(
              `resumo-${item.id}`,
              `Beneficiário ${index + 1} (${beneficiary.nome || formatRole(beneficiary.role)}): ${item.label}`,
            ),
          );
      });
      return { missingIds, missingMessages };
    },
    [
      adesaoRequirements,
      beneficiaryRequirementsMap,
      beneficiaries,
      category,
      categoryComplete,
      companyDataMode,
      companyRequirements,
      structureComplete,
      employeeCountNumber,
      hasEmployees,
      partnerCountNumber,
      primaryEmail,
      primaryPhone,
      totalLivesNumber,
    ],
  );

  const currentStepMissing = useMemo(
    () => (currentStep ? getMissingByStep(currentStep.id) : { missingIds: [], missingMessages: [] }),
    [currentStep, getMissingByStep],
  );

  const shouldHighlightCurrentStep = Boolean(currentStep && validationAttemptedStep === currentStep.id);
  const currentStepMissingIdSet = useMemo(
    () => new Set(currentStepMissing.missingIds),
    [currentStepMissing.missingIds],
  );
  const isMissingField = useCallback(
    (fieldId: string): boolean => shouldHighlightCurrentStep && currentStepMissingIdSet.has(fieldId),
    [currentStepMissingIdSet, shouldHighlightCurrentStep],
  );

  const selectedBeneficiary = useMemo(
    () => beneficiaries.find((beneficiary) => beneficiary.id === selectedBeneficiaryId) || null,
    [beneficiaries, selectedBeneficiaryId],
  );

  const adesaoPendingUploadOptions = useMemo(
    () =>
      (Object.keys(ADESAO_DOC_LABELS) as AdesaoDocumentType[])
        .filter((docType) => !hasUploadedDocs(adesaoDocs[docType]))
        .map((docType) => ({
          value: docType,
          label: ADESAO_DOC_LABELS[docType],
        })),
    [adesaoDocs],
  );

  const adesaoManageDocOptions = useMemo(
    () =>
      (Object.keys(ADESAO_DOC_LABELS) as AdesaoDocumentType[])
        .filter((docType) => hasUploadedDocs(adesaoDocs[docType]))
        .map((docType) => ({
          value: docType,
          label: ADESAO_DOC_LABELS[docType],
        })),
    [adesaoDocs],
  );

  const selectedAdesaoDocs = useMemo(
    () => adesaoDocs[selectedAdesaoManageDocType] || [],
    [adesaoDocs, selectedAdesaoManageDocType],
  );

  const beneficiaryUploadOptions = useMemo(() => {
    if (!selectedBeneficiary) {
      return [] as Array<{ value: BeneficiaryDocumentType; label: string }>;
    }

    const requirements = beneficiaryRequirementsMap.get(selectedBeneficiary.id) || [];
    const pendingDocTypes = requirements
      .filter((requirement) => !requirement.done)
      .map((requirement) => getBeneficiaryDocTypeFromLabel(requirement.label))
      .filter((docType): docType is BeneficiaryDocumentType => docType != null);

    return Array.from(new Set(pendingDocTypes)).map((docType) => ({
      value: docType,
      label: BENEFICIARY_DOC_LABELS[docType],
    }));
  }, [beneficiaryRequirementsMap, selectedBeneficiary]);

  const beneficiaryManageDocOptions = useMemo(() => {
    if (!selectedBeneficiary) return [] as Array<{ value: BeneficiaryDocumentType; label: string }>;

    return (Object.keys(BENEFICIARY_DOC_LABELS) as BeneficiaryDocumentType[])
      .filter((docType) => hasUploadedDocs(selectedBeneficiary.documentos[docType]))
      .map((docType) => ({
        value: docType,
        label: BENEFICIARY_DOC_LABELS[docType],
      }));
  }, [selectedBeneficiary]);

  const selectedBeneficiaryDocs = useMemo(() => {
    if (!selectedBeneficiary) return [];
    return selectedBeneficiary.documentos[selectedBeneficiaryManageDocType] || [];
  }, [selectedBeneficiary, selectedBeneficiaryManageDocType]);

  const revokeDocumentPreview = useCallback((document: UploadedDocument) => {
    if (!document.previewUrl) return;
    URL.revokeObjectURL(document.previewUrl);
  }, []);

  const revokeDocumentPreviews = useCallback(
    (documents: UploadedDocument[]) => {
      documents.forEach((document) => {
        revokeDocumentPreview(document);
      });
    },
    [revokeDocumentPreview],
  );

  useEffect(() => {
    uploadedDocumentsRef.current = allUploadedDocuments;
  }, [allUploadedDocuments]);

  useEffect(
    () => () => {
      revokeDocumentPreviews(uploadedDocumentsRef.current);
    },
    [revokeDocumentPreviews],
  );

  useEffect(() => {
    if (adesaoPendingUploadOptions.length === 0) return;
    const hasSelected = adesaoPendingUploadOptions.some((option) => option.value === selectedAdesaoDocType);
    if (!hasSelected) {
      setSelectedAdesaoDocType(adesaoPendingUploadOptions[0].value);
    }
  }, [adesaoPendingUploadOptions, selectedAdesaoDocType]);

  useEffect(() => {
    if (adesaoManageDocOptions.length === 0) return;
    const hasSelected = adesaoManageDocOptions.some((option) => option.value === selectedAdesaoManageDocType);
    if (!hasSelected) {
      setSelectedAdesaoManageDocType(adesaoManageDocOptions[0].value);
    }
  }, [adesaoManageDocOptions, selectedAdesaoManageDocType]);

  useEffect(() => {
    if (beneficiaryUploadOptions.length === 0) return;
    const hasSelected = beneficiaryUploadOptions.some((option) => option.value === selectedBeneficiaryDocType);
    if (!hasSelected) {
      setSelectedBeneficiaryDocType(beneficiaryUploadOptions[0].value);
    }
  }, [beneficiaryUploadOptions, selectedBeneficiaryDocType]);

  useEffect(() => {
    if (beneficiaryManageDocOptions.length === 0) return;
    const hasSelected = beneficiaryManageDocOptions.some(
      (option) => option.value === selectedBeneficiaryManageDocType,
    );
    if (!hasSelected) {
      setSelectedBeneficiaryManageDocType(beneficiaryManageDocOptions[0].value);
    }
  }, [beneficiaryManageDocOptions, selectedBeneficiaryManageDocType]);

  const validateFile = (file: File): string | null => {
    const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
    if (!ALLOWED_DOCUMENT_EXTENSIONS_SET.has(extension)) {
      return 'Formato não suportado. Envie PDF, imagem, DOCX ou arquivo textual.';
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Limite de 10MB por documento.';
    }

    return null;
  };

  const updateCompanyPartnerName = useCallback((partnerId: string, value: string) => {
    setCompanyPartners((prev) =>
      prev.map((partner) =>
        partner.id === partnerId
          ? {
              ...partner,
              nome: value,
            }
          : partner,
      ),
    );
  }, []);

  const toggleCompanyDocPanel = useCallback((docType: CompanyDocumentType) => {
    setExpandedCompanyDocPanels((prev) => ({
      ...prev,
      [docType]: !(prev[docType] ?? true),
    }));
  }, []);

  const toggleBeneficiaryDocPanel = useCallback((beneficiaryId: string) => {
    setExpandedBeneficiaryDocPanels((prev) => ({
      ...prev,
      [beneficiaryId]: !(prev[beneficiaryId] ?? false),
    }));
  }, []);

  const addCompanyPartner = useCallback(() => {
    if (category !== 'pessoa_juridica') return;

    const currentPartners = Math.max(companyPartners.length, parsePositiveInt(partnerCount));
    if (currentPartners >= maxPartnersAllowed) {
      toast.error('Limite de sócios atingido.', {
        description: `Com ${totalLivesNumber} vida(s) e ${employeeCountNumber} funcionário(s), o máximo permitido é ${maxPartnersAllowed} sócio(s).`,
      });
      return;
    }

    setPartnerCount(String(currentPartners + 1));
    toast.success('Sócio adicionado para revisão.', {
      description: 'Preencha o nome e envie Identidade, CNH ou documento equivalente.',
    });
  }, [
    category,
    companyPartners.length,
    employeeCountNumber,
    maxPartnersAllowed,
    partnerCount,
    totalLivesNumber,
  ]);

  const removeCompanyPartner = useCallback(
    (partnerId: string) => {
      const partner = companyPartners.find((item) => item.id === partnerId);
      if (!partner) return;

      const linkedDocs = (companyDocs.identidade_cpf_socios || []).filter(
        (document) => document.linkedEntityId === partnerId,
      );

      if (linkedDocs.length > 0) {
        revokeDocumentPreviews(linkedDocs);
      }

      setCompanyDocs((prev) => ({
        ...prev,
        identidade_cpf_socios: (prev.identidade_cpf_socios || []).filter(
          (document) => document.linkedEntityId !== partnerId,
        ),
      }));

      setCompanyPartners((prev) => prev.filter((item) => item.id !== partnerId));
      setPartnerCount(String(Math.max(companyPartners.length - 1, 1)));

      toast.success('Sócio removido da lista de validação.', {
        description:
          linkedDocs.length > 0
            ? `${linkedDocs.length} arquivo(s) vinculado(s) também foram removidos.`
            : 'Você pode ajustar os nomes restantes livremente.',
      });
    },
    [companyDocs.identidade_cpf_socios, companyPartners, revokeDocumentPreviews],
  );

  const applyCompanyPartnerHints = useCallback(
    (extraContractDocs: UploadedDocument[] = []) => {
      if (category !== 'pessoa_juridica') return;

      const contractDocs = [...(companyDocs.contrato_social || []), ...extraContractDocs];
      if (contractDocs.length === 0) return;

      const unifiedContract = getUnifiedExtractionFromDocuments(contractDocs);
      const inferredNames = getExtractedCompanyPartners(unifiedContract);
      const inferredTotal = getExtractedCompanyPartnersTotal(unifiedContract, inferredNames);

      if (inferredTotal <= 0) return;

      setCompanyPartners((prev) =>
        Array.from({ length: Math.max(prev.length, inferredTotal) }, (_, index) => {
          const existing = prev[index];
          const fallback = createCompanyPartner(index);
          return {
            ...fallback,
            ...(existing || {}),
            id: existing?.id || fallback.id,
            // Contrato social é a fonte de verdade para os nomes dos sócios.
            nome: inferredNames[index] || existing?.nome || `Sócio ${index + 1}`,
          };
        }),
      );

      toast.info('Sócios revalidados pelo contrato social', {
        description: `${inferredTotal} sócio(s) confirmado(s) com base no contrato social.`,
      });
    },
    [category, companyDocs.contrato_social],
  );

  const applyExtractedHints = useCallback(
    (target: UploadTarget, extracted: PDFExtraido) => {
      if (target.scope === 'empresa') {
        const cnpjDigits = extracted.cnpj?.replace(/\D/g, '') || '';

        if (cnpjDigits.length > 0) {
          const formattedCnpj = formatCnpjInput(cnpjDigits);
          setCompanyCnpj((prev) => (prev.trim().length > 0 ? prev : formattedCnpj));
        }

        if (extracted.razao_social && extracted.razao_social.trim().length > 0) {
          setCompanyLegalName((prev) => (prev.trim().length > 0 ? prev : extracted.razao_social || ''));
        }

        if (extracted.email && !companyEmailTouched) {
          setCompanyEmail((prev) => (prev.trim().length > 0 ? prev : normalizeEmailInput(extracted.email || '')));
        }

        if (extracted.telefone && !companyPhoneTouched) {
          setCompanyPhone((prev) =>
            normalizePhone(prev).length >= 10 ? prev : formatPhoneInput(extracted.telefone || ''),
          );
        }

        if (extracted.endereco && !companyAddressTouched) {
          setCompanyAddress((prev) => (prev.trim().length > 0 ? prev : extracted.endereco?.trim() || ''));
        }

        const extractedPartnerName = extracted.nome_completo || extracted.nome_beneficiarios[0] || '';
        if (target.docType === 'identidade_cpf_socios' && target.partnerId) {
          const detectedDocType = inferIdentityDocTypeFromExtraction(extracted);
          const hintedBirthDate = extracted.data_nascimento ? formatDateInput(extracted.data_nascimento) : '';
          const hintedIssueDate = extracted.data_expedicao ? formatDateInput(extracted.data_expedicao) : '';
          const hintedCpf = formatCpfInput(extracted.cpf || '');
          const hintedRg = formatRgInput(extracted.rg || '');
          const hintedIfp = extracted.ifp?.trim() || '';
          const hintedIssuer = extracted.orgao_expedidor?.trim() || '';
          const hintedCnh = extracted.numero_habilitacao?.replace(/\D/g, '').slice(0, 20) || '';

          setCompanyPartners((prev) =>
            prev.map((partner) =>
              partner.id === target.partnerId
                ? {
                    ...partner,
                    nome:
                      (companyDocs.contrato_social || []).length > 0
                        ? partner.nome
                        : isPlaceholderPartnerName(partner.nome)
                          ? extractedPartnerName || partner.nome
                          : partner.nome,
                    documento_tipo: detectedDocType || partner.documento_tipo || null,
                    cpf: hintedCpf || partner.cpf || '',
                    rg: hintedRg || partner.rg || '',
                    ifp: hintedIfp || partner.ifp || '',
                    dataNascimento: hintedBirthDate || partner.dataNascimento || '',
                    dataExpedicao: hintedIssueDate || partner.dataExpedicao || '',
                    orgaoExpedidor: hintedIssuer || partner.orgaoExpedidor || '',
                    numeroHabilitacao: hintedCnh || partner.numeroHabilitacao || '',
                  }
                : partner,
            ),
          );
        }

        return;
      }

      if (target.scope !== 'beneficiario') return;

      const normalizedCivilStatus = normalizeCivilStatusFromExtraction(extracted.estado_civil);
      const hintedBirthDate = extracted.data_nascimento ? formatDateInput(extracted.data_nascimento) : '';
      const hintedAgeFromDate = hintedBirthDate ? inferAgeFromBirthDate(hintedBirthDate) : '';

      setBeneficiaries((prev) =>
        prev.map((beneficiary) => {
          if (beneficiary.id !== target.beneficiaryId) return beneficiary;

          const hintedName =
            beneficiary.nome ||
            extracted.nome_completo ||
            extracted.nome_beneficiarios[0] ||
            '';
          const hintedAge =
            beneficiary.idade ||
            hintedAgeFromDate ||
            (extracted.idades[0] != null ? String(extracted.idades[0]) : '');
          const hintedCpf = beneficiary.cpf || formatCpfInput(extracted.cpf || '');
          const hintedRg = beneficiary.rg || formatRgInput(extracted.rg || '');

          return {
            ...beneficiary,
            nome: hintedName,
            idade: hintedAge,
            cpf: hintedCpf,
            rg: hintedRg,
            dataNascimento: beneficiary.dataNascimento || hintedBirthDate,
            estadoCivil: normalizedCivilStatus || beneficiary.estadoCivil,
          };
        }),
      );
    },
    [companyAddressTouched, companyDocs.contrato_social, companyEmailTouched, companyPhoneTouched],
  );

  const getRequirementLabelForTarget = useCallback((target: UploadTarget): string => {
    if (target.scope === 'empresa') return COMPANY_DOC_LABELS[target.docType];
    if (target.scope === 'adesao') return ADESAO_DOC_LABELS[target.docType];
    return BENEFICIARY_DOC_LABELS[target.docType];
  }, []);

  const appendUploadedDocumentToTarget = useCallback((target: UploadTarget, uploaded: UploadedDocument) => {
    if (target.scope === 'empresa') {
      setCompanyDocs((prev) => ({
        ...prev,
        [target.docType]: [...(prev[target.docType] || []), uploaded],
      }));
      return;
    }

    if (target.scope === 'adesao') {
      setAdesaoDocs((prev) => ({
        ...prev,
        [target.docType]: [...(prev[target.docType] || []), uploaded],
      }));
      setSelectedAdesaoManageDocType(target.docType);
      return;
    }

    setBeneficiaries((prev) =>
      prev.map((beneficiary) =>
        beneficiary.id === target.beneficiaryId
          ? {
              ...beneficiary,
              documentos: {
                ...beneficiary.documentos,
                [target.docType]: [...(beneficiary.documentos[target.docType] || []), uploaded],
              },
            }
          : beneficiary,
      ),
    );
    setSelectedBeneficiaryManageDocType(target.docType);
  }, []);

  const resolvePartnerIdForScanFull = useCallback(
    (extracted: PDFExtraido): string | null => {
      if (companyPartners.length === 0) return null;
      const hintedName = extracted.nome_completo || extracted.nome_beneficiarios?.[0] || '';
      if (hintedName) {
        const matched = companyPartners.find((partner) => isLikelySamePerson(hintedName, partner.nome));
        if (matched) return matched.id;
      }

      const pending = companyPartnerDocStatuses.find((status) => !status.done);
      if (pending) return pending.partner.id;
      return companyPartners[0]?.id || null;
    },
    [companyPartnerDocStatuses, companyPartners],
  );

  const resolveBeneficiaryIdForScanFull = useCallback(
    (fileName: string, extracted: PDFExtraido): string | null => {
      if (beneficiaries.length === 0) return null;

      const hintedName = extracted.nome_completo || extracted.nome_beneficiarios?.[0] || '';
      if (hintedName) {
        const matched = beneficiaries.find((beneficiary) => isLikelySamePerson(hintedName, beneficiary.nome));
        if (matched) return matched.id;
      }

      const normalizedFileName = normalizeTextMatch(fileName);
      const matchedByFileName = beneficiaries.find((beneficiary) =>
        beneficiary.nome ? normalizedFileName.includes(normalizeTextMatch(beneficiary.nome)) : false,
      );
      if (matchedByFileName) return matchedByFileName.id;

      if (selectedBeneficiaryId && beneficiaries.some((beneficiary) => beneficiary.id === selectedBeneficiaryId)) {
        return selectedBeneficiaryId;
      }

      return beneficiaries[0]?.id || null;
    },
    [beneficiaries, selectedBeneficiaryId],
  );

  const classifyScanFullTarget = useCallback(
    (file: File, extracted: PDFExtraido): { target: UploadTarget | null; reason: string } => {
      const fileName = normalizeTextMatch(file.name);

      const hasIdentityData = Boolean(
        extracted.cpf ||
          extracted.rg ||
          extracted.ifp ||
          extracted.numero_habilitacao ||
          extracted.data_nascimento ||
          extracted.documento_identificacao_tipo,
      );
      const hasCompanyData = Boolean(
        extracted.cnpj ||
          extracted.razao_social ||
          extracted.inscricao_estadual ||
          (extracted.socios_detectados?.length || 0) > 0,
      );
      const hasCompanyRegistrationData = Boolean(
        extracted.cnpj || extracted.razao_social || extracted.inscricao_estadual || extracted.nome_fantasia,
      );
      const hasAddressData = Boolean(extracted.endereco);
      const hasHealthPlanData = Boolean(
        extracted.operadora ||
          extracted.tipo_plano ||
          extracted.valor_atual != null ||
          (extracted.idades?.length || 0) > 0,
      );

      const isContractKeyword = containsAnyKeyword(fileName, [
        'contrato',
        'social',
        'qsa',
        'socios',
        'socio',
      ]);
      const isCnpjCardKeyword = containsAnyKeyword(fileName, [
        'cartao cnpj',
        'cartao_cnpj',
        'comprovante de inscricao',
        'receita',
        'cnpj',
      ]);
      const isCompanyAddressKeyword = containsAnyKeyword(fileName, [
        'endereco empresa',
        'comprovante endereco empresa',
        'sede',
      ]);
      const isAlteracaoKeyword = containsAnyKeyword(fileName, ['alteracao contratual', 'aditivo']);
      const isEmployeesKeyword = containsAnyKeyword(fileName, ['gfip', 'funcionarios', 'funcionario', 'folha']);
      const isEligibilityKeyword = containsAnyKeyword(fileName, ['elegibilidade', 'vinculo', 'associacao']);
      const isAssociationKeyword = containsAnyKeyword(fileName, ['associacao', 'filiacao']);
      const isCardKeyword = containsAnyKeyword(fileName, ['carteirinha', 'cartao plano', 'cartao do plano']);
      const isPermanencyKeyword = containsAnyKeyword(fileName, ['carta permanencia', 'permanencia']);
      const isMarriageKeyword = containsAnyKeyword(fileName, ['certidao casamento', 'casamento']);
      const isUnionKeyword = containsAnyKeyword(fileName, ['uniao estavel', 'declaracao marital']);
      const isBirthKeyword = containsAnyKeyword(fileName, ['certidao nascimento', 'nascimento']);
      const isSelfieKeyword = containsAnyKeyword(fileName, ['selfie', 'rosto', 'face', 'foto rosto', 'foto face']);
      const isResidenceKeyword = containsAnyKeyword(fileName, [
        'comprovante residencia',
        'residencia',
        'endereco',
        'conta luz',
        'conta agua',
      ]);
      const isIdentityKeyword = containsAnyKeyword(fileName, [
        'rg',
        'identidade',
        'cnh',
        'habilitacao',
        'ifp',
        'cpf',
      ]);

      if (category === 'pessoa_juridica') {
        if (isContractKeyword || ((extracted.socios_detectados?.length || 0) > 0 && hasCompanyData)) {
          return { target: { scope: 'empresa', docType: 'contrato_social' }, reason: 'Contrato social/sócios' };
        }
        if (isAlteracaoKeyword) {
          return { target: { scope: 'empresa', docType: 'alteracao_contratual' }, reason: 'Alteração contratual' };
        }
        if (isEmployeesKeyword) {
          return { target: { scope: 'empresa', docType: 'relacao_funcionarios' }, reason: 'GFIP/funcionários' };
        }
        if (isCnpjCardKeyword || (Boolean(extracted.cnpj && extracted.razao_social) && !isContractKeyword)) {
          return { target: { scope: 'empresa', docType: 'cartao_cnpj' }, reason: 'Cartão CNPJ' };
        }
        if (
          isCompanyAddressKeyword ||
          (hasAddressData &&
            (hasCompanyRegistrationData || (!hasIdentityData && !hasHealthPlanData && !isResidenceKeyword)))
        ) {
          return {
            target: { scope: 'empresa', docType: 'comprovante_endereco_empresa' },
            reason: 'Comprovante de endereço da empresa',
          };
        }
        if (isIdentityKeyword || hasIdentityData) {
          const partnerId = resolvePartnerIdForScanFull(extracted) || undefined;
          return {
            target: { scope: 'empresa', docType: 'identidade_cpf_socios', partnerId },
            reason: 'Identificação de sócio',
          };
        }
      }

      if (category === 'adesao') {
        if (isEligibilityKeyword) {
          return { target: { scope: 'adesao', docType: 'documento_elegibilidade' }, reason: 'Elegibilidade' };
        }
        if (isAssociationKeyword) {
          return { target: { scope: 'adesao', docType: 'formulario_associacao' }, reason: 'Formulário de associação' };
        }
      }

      const beneficiaryId = resolveBeneficiaryIdForScanFull(file.name, extracted);
      if (beneficiaryId) {
        if (isCardKeyword || hasHealthPlanData) {
          return {
            target: { scope: 'beneficiario', beneficiaryId, docType: 'carteirinha_plano_atual' },
            reason: 'Carteirinha do plano',
          };
        }
        if (isPermanencyKeyword) {
          return {
            target: { scope: 'beneficiario', beneficiaryId, docType: 'carta_permanencia' },
            reason: 'Carta de permanência',
          };
        }
        if (isMarriageKeyword) {
          return {
            target: { scope: 'beneficiario', beneficiaryId, docType: 'certidao_casamento' },
            reason: 'Certidão de casamento',
          };
        }
        if (isUnionKeyword) {
          return {
            target: { scope: 'beneficiario', beneficiaryId, docType: 'declaracao_uniao_estavel' },
            reason: 'Declaração de união estável',
          };
        }
        if (isBirthKeyword) {
          return {
            target: { scope: 'beneficiario', beneficiaryId, docType: 'certidao_nascimento' },
            reason: 'Certidão de nascimento',
          };
        }
        if (isSelfieKeyword) {
          return {
            target: { scope: 'beneficiario', beneficiaryId, docType: 'selfie' },
            reason: 'Selfie do beneficiário',
          };
        }
        if (isResidenceKeyword || hasAddressData) {
          if (category === 'pessoa_juridica' && hasCompanyRegistrationData) {
            return {
              target: { scope: 'empresa', docType: 'comprovante_endereco_empresa' },
              reason: 'Endereço com dados cadastrais da empresa',
            };
          }
          return {
            target: { scope: 'beneficiario', beneficiaryId, docType: 'comprovante_residencia' },
            reason: 'Comprovante de residência',
          };
        }
        if (isIdentityKeyword || hasIdentityData) {
          return {
            target: { scope: 'beneficiario', beneficiaryId, docType: 'identidade_cpf' },
            reason: 'Identidade/CPF do beneficiário',
          };
        }
      }

      if (category === 'pessoa_juridica') {
        if (hasCompanyData) {
          return { target: { scope: 'empresa', docType: 'contrato_social' }, reason: 'Sinais societários detectados' };
        }
        if (hasAddressData) {
          return {
            target: { scope: 'empresa', docType: 'comprovante_endereco_empresa' },
            reason: 'Endereço empresarial detectado',
          };
        }
      }

      return { target: null, reason: 'Sem classificação automática confiável' };
    },
    [
      beneficiaries,
      category,
      companyPartnerDocStatuses,
      companyPartners,
      resolveBeneficiaryIdForScanFull,
      resolvePartnerIdForScanFull,
      selectedBeneficiaryId,
    ],
  );

  const processFilesUpload = useCallback(
    async (files: File[], target: UploadTarget) => {
      const validFiles: File[] = [];
      const validationErrors: string[] = [];

      files.forEach((file) => {
        const validationError = validateFile(file);
        if (validationError) {
          validationErrors.push(`${file.name}: ${validationError}`);
          return;
        }
        validFiles.push(file);
      });

      if (validFiles.length === 0) {
        setActiveUploadTarget(null);
        setError(validationErrors[0] || 'Nenhum arquivo válido foi selecionado.');
        return;
      }

      setError('');
      setActiveUploadTarget(target);
      setIsProcessing(true);
      setProcessingProgress(0);

      const requirementLabel = getRequirementLabelForTarget(target);

      const uploadedFiles: string[] = [];
      const uploadedContractDocs: UploadedDocument[] = [];
      const failedFiles: string[] = [];

      for (let index = 0; index < validFiles.length; index += 1) {
        const file = validFiles[index];
        const progress = Math.round((index / validFiles.length) * 100);
        setProcessingProgress(progress);
        setProcessingLabel(`${requirementLabel} (${index + 1}/${validFiles.length})`);

        try {
          const beneficiaryContext =
            target.scope === 'beneficiario'
              ? beneficiaries.find((beneficiary) => beneficiary.id === target.beneficiaryId) || null
              : null;
          const extractionContext: DocumentoExtractionContext = {
            scope: target.scope,
            doc_type: target.docType,
            proposal_category: category || undefined,
            beneficiary_id: beneficiaryContext?.id,
            beneficiary_name: beneficiaryContext?.nome || undefined,
            beneficiary_role: beneficiaryContext?.role || undefined,
            partner_id: target.scope === 'empresa' ? target.partnerId || null : null,
          };

          const extracted = await apiService.extrairDocumentoProxy(file, extractionContext);
          const inferredFileType = inferDocumentMimeType(file.name, file.type);
          const previewBlob = file.slice(0, file.size, inferredFileType);
          const previewUrl = URL.createObjectURL(previewBlob);
          const uploaded: UploadedDocument = {
            id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
            fileName: file.name,
            fileType: inferredFileType,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            extracted,
            requirementLabel,
            previewUrl,
            linkedEntityId:
              target.scope === 'empresa' && target.docType === 'identidade_cpf_socios'
                ? target.partnerId || null
                : null,
          };

          appendUploadedDocumentToTarget(target, uploaded);

          if (target.scope === 'empresa' && target.docType === 'contrato_social') {
            uploadedContractDocs.push(uploaded);
          }

          applyExtractedHints(target, extracted);
          onDadosExtraidos?.(extracted);
          uploadedFiles.push(file.name);
        } catch (uploadError: unknown) {
          const message = uploadError instanceof Error ? uploadError.message : 'Erro ao processar documento';
          failedFiles.push(`${file.name} (${message})`);
        }
      }

      if (uploadedContractDocs.length > 0) {
        applyCompanyPartnerHints(uploadedContractDocs);
      }

      setProcessingProgress(100);

      if (uploadedFiles.length > 0) {
        toast.success('Documentos processados com IA', {
          description: `${uploadedFiles.length} arquivo(s) enviados para ${requirementLabel}.`,
        });
      }

      const allErrors = [...validationErrors, ...failedFiles];
      if (allErrors.length > 0) {
        const description = allErrors.slice(0, 2).join(' · ');
        setError(description);
        toast.error('Alguns arquivos não foram processados', {
          description,
        });
      }

      setPendingUploadTarget(null);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingLabel('');
        setProcessingProgress(0);
        setActiveUploadTarget(null);
      }, 250);
    },
    [
      appendUploadedDocumentToTarget,
      applyCompanyPartnerHints,
      applyExtractedHints,
      beneficiaries,
      category,
      getRequirementLabelForTarget,
      onDadosExtraidos,
    ],
  );

  const processScanFullUpload = useCallback(
    async (files: File[]) => {
      const validFiles: File[] = [];
      const validationErrors: string[] = [];

      files.forEach((file) => {
        const validationError = validateFile(file);
        if (validationError) {
          validationErrors.push(`${file.name}: ${validationError}`);
          return;
        }
        validFiles.push(file);
      });

      if (validFiles.length === 0) {
        setError(validationErrors[0] || 'Nenhum arquivo válido foi selecionado para o ScanFULL.');
        return;
      }

      setError('');
      setScanFullResult(null);
      setPendingUploadTarget(null);
      setActiveUploadTarget(null);
      setIsProcessing(true);
      setProcessingProgress(0);
      setProcessingLabel(`ScanFULL (0/${validFiles.length})`);

      const distributedCounter = new Map<string, number>();
      const uploadedFiles: string[] = [];
      const uploadedContractDocs: UploadedDocument[] = [];
      const unclassifiedFiles: string[] = [];
      const failedFiles: string[] = [];

      for (let index = 0; index < validFiles.length; index += 1) {
        const file = validFiles[index];
        const progress = Math.round((index / validFiles.length) * 100);
        setProcessingProgress(progress);
        setProcessingLabel(`ScanFULL (${index + 1}/${validFiles.length})`);

        try {
          const extractionContext: DocumentoExtractionContext = {
            scope: 'empresa',
            doc_type: 'scanfull',
            proposal_category: category || undefined,
          };

          const extracted = await apiService.extrairDocumentoProxy(file, extractionContext);
          const classification = classifyScanFullTarget(file, extracted);

          if (!classification.target) {
            unclassifiedFiles.push(`${file.name} (${classification.reason})`);
            continue;
          }

          const requirementLabel = getRequirementLabelForTarget(classification.target);
          const inferredFileType = inferDocumentMimeType(file.name, file.type);
          const previewBlob = file.slice(0, file.size, inferredFileType);
          const previewUrl = URL.createObjectURL(previewBlob);
          const uploaded: UploadedDocument = {
            id: `${Date.now()}-scanfull-${index}-${Math.random().toString(16).slice(2)}`,
            fileName: file.name,
            fileType: inferredFileType,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            extracted,
            requirementLabel,
            previewUrl,
            linkedEntityId:
              classification.target.scope === 'empresa' &&
              classification.target.docType === 'identidade_cpf_socios'
                ? classification.target.partnerId || null
                : null,
          };

          appendUploadedDocumentToTarget(classification.target, uploaded);

          if (classification.target.scope === 'empresa' && classification.target.docType === 'contrato_social') {
            uploadedContractDocs.push(uploaded);
          }

          applyExtractedHints(classification.target, extracted);
          onDadosExtraidos?.(extracted);
          uploadedFiles.push(file.name);
          distributedCounter.set(requirementLabel, (distributedCounter.get(requirementLabel) || 0) + 1);
        } catch (uploadError: unknown) {
          const message = uploadError instanceof Error ? uploadError.message : 'Erro ao processar documento';
          failedFiles.push(`${file.name} (${message})`);
        }
      }

      if (uploadedContractDocs.length > 0) {
        applyCompanyPartnerHints(uploadedContractDocs);
      }

      setProcessingProgress(100);

      const distributedSummary = Array.from(distributedCounter.entries()).map(
        ([label, count]) => `${label}: ${count}`,
      );
      setScanFullResult({
        processed: uploadedFiles.length + unclassifiedFiles.length,
        classified: uploadedFiles.length,
        unclassified: unclassifiedFiles.length,
        distributedSummary,
      });

      if (uploadedFiles.length > 0) {
        toast.success('ScanFULL concluído', {
          description: `${uploadedFiles.length} arquivo(s) classificados automaticamente.`,
        });
      }

      if (unclassifiedFiles.length > 0) {
        toast.warning('ScanFULL com arquivos não classificados', {
          description: unclassifiedFiles.slice(0, 2).join(' · '),
        });
      }

      const allErrors = [...validationErrors, ...failedFiles];
      if (allErrors.length > 0) {
        const description = allErrors.slice(0, 2).join(' · ');
        setError(description);
        toast.error('Alguns arquivos não foram processados no ScanFULL', {
          description,
        });
      }

      setTimeout(() => {
        setIsProcessing(false);
        setProcessingLabel('');
        setProcessingProgress(0);
      }, 250);
    },
    [
      appendUploadedDocumentToTarget,
      applyCompanyPartnerHints,
      applyExtractedHints,
      category,
      classifyScanFullTarget,
      getRequirementLabelForTarget,
      onDadosExtraidos,
    ],
  );

  const triggerUpload = (target: UploadTarget) => {
    setPendingUploadTarget(target);
    setActiveUploadTarget(target);
    fileInputRef.current?.click();
  };

  const triggerScanFullUpload = () => {
    setPendingUploadTarget(null);
    setActiveUploadTarget(null);
    scanFullInputRef.current?.click();
  };

  const renderInlineUploadProgress = (target: UploadTarget) => {
    if (!isSameUploadTarget(activeUploadTarget, target) || !isProcessing) {
      return null;
    }

    return (
      <div className="mt-2 space-y-2 rounded-md border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-2">
        <div className="flex items-center justify-between text-[11px] text-white/75">
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin text-[#F0D67C]" />
            Processando: {processingLabel || 'documento'}
          </span>
          <span>{processingProgress}%</span>
        </div>
        <Progress value={processingProgress} className="h-2" />
      </div>
    );
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0 || !pendingUploadTarget) {
      if (files.length === 0) {
        setActiveUploadTarget(null);
      }
      event.target.value = '';
      return;
    }

    await processFilesUpload(files, pendingUploadTarget);
    event.target.value = '';
  };

  const handleScanFullInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      event.target.value = '';
      return;
    }

    await processScanFullUpload(files);
    event.target.value = '';
  };

  const buildBeneficiaryStructure = (): boolean => {
    if (!category) {
      setError('Escolha a modalidade antes de configurar as vidas da proposta.');
      return false;
    }

    const total = parsePositiveInt(totalLives);
    if (total <= 0) {
      setError('Informe um total de vidas válido.');
      return false;
    }

    if (category === 'pessoa_juridica') {
      const socios = parsePositiveInt(partnerCount);
      if (socios <= 0 || socios > total) {
        setError('Quantidade de sócios inválida para o total de vidas informado.');
        return false;
      }

      const funcionarios = hasEmployees ? parsePositiveInt(employeeCount) : 0;
      if (hasEmployees && funcionarios <= 0) {
        setError('Informe a quantidade de funcionários quando a empresa possuir funcionários.');
        return false;
      }

      if (socios + funcionarios > total) {
        setError('A soma de sócios e funcionários não pode ser maior que o total de vidas.');
        return false;
      }

      setBeneficiaries((prev) =>
        Array.from({ length: total }, (_, index) =>
          createBeneficiary(
            index < socios ? 'socio' : index < socios + funcionarios ? 'funcionario' : 'dependente',
            index,
            prev[index],
          ),
        ),
      );
    } else {
      setBeneficiaries((prev) =>
        Array.from({ length: total }, (_, index) =>
          createBeneficiary(index === 0 ? 'titular' : 'dependente', index, prev[index]),
        ),
      );
    }

    setIsStructureReady(true);
    setError('');
    return true;
  };

  useEffect(() => {
    setIsStructureReady(false);
  }, [category, totalLives, partnerCount, hasEmployees, employeeCount]);

  useEffect(() => {
    if (beneficiaries.length > 0 && !selectedBeneficiaryId) {
      setSelectedBeneficiaryId(beneficiaries[0].id);
      return;
    }

    if (selectedBeneficiaryId) {
      const exists = beneficiaries.some((beneficiary) => beneficiary.id === selectedBeneficiaryId);
      if (!exists) {
        setSelectedBeneficiaryId(beneficiaries[0]?.id || '');
      }
    }
  }, [beneficiaries, selectedBeneficiaryId]);

  useEffect(() => {
    if (category !== 'pessoa_juridica') return;
    if (beneficiaries.length === 0) return;
    if (companyPartners.length === 0) return;

    const identityDocs = companyDocs.identidade_cpf_socios || [];

    setBeneficiaries((prev) => {
      let hasChanges = false;
      let socioIndex = 0;

      const next = prev.map((beneficiary) => {
        if (beneficiary.role !== 'socio') return beneficiary;

        const partner = companyPartners[socioIndex];
        socioIndex += 1;
        if (!partner) return beneficiary;

        const summary = getCompanyPartnerIdentitySummary(partner, identityDocs);
        const currentName = beneficiary.nome.trim();
        const nextBeneficiary: BeneficiaryForm = { ...beneficiary };

        if (
          partner.nome?.trim() &&
          (!currentName ||
            isPlaceholderPartnerName(currentName) ||
            normalizeTextMatch(currentName) === normalizeTextMatch(formatRole('socio')))
        ) {
          nextBeneficiary.nome = partner.nome.trim();
          hasChanges = true;
        }

        if (!nextBeneficiary.cpf && summary.cpf) {
          nextBeneficiary.cpf = formatCpfInput(summary.cpf);
          hasChanges = true;
        }

        if (!nextBeneficiary.rg && summary.rg) {
          nextBeneficiary.rg = formatRgInput(summary.rg);
          hasChanges = true;
        }

        if (!nextBeneficiary.dataNascimento && summary.dataNascimento) {
          nextBeneficiary.dataNascimento = summary.dataNascimento;
          hasChanges = true;
        }

        if (!nextBeneficiary.idade && summary.dataNascimento) {
          const inferredAge = inferAgeFromBirthDate(summary.dataNascimento);
          if (inferredAge) {
            nextBeneficiary.idade = inferredAge;
            hasChanges = true;
          }
        }

        return nextBeneficiary;
      });

      return hasChanges ? next : prev;
    });
  }, [
    beneficiaries.length,
    category,
    companyDocs.identidade_cpf_socios,
    companyPartners,
  ]);

  const beneficiaryDisplayNames = useMemo(() => {
    const names = new Map<string, string>();
    let socioIndex = 0;

    beneficiaries.forEach((beneficiary) => {
      const explicitName = beneficiary.nome.trim();
      if (explicitName) {
        names.set(beneficiary.id, explicitName);
        if (beneficiary.role === 'socio') socioIndex += 1;
        return;
      }

      if (category === 'pessoa_juridica' && beneficiary.role === 'socio') {
        const partnerName = companyPartners[socioIndex]?.nome?.trim();
        if (partnerName) {
          names.set(beneficiary.id, partnerName);
        } else {
          names.set(beneficiary.id, formatRole(beneficiary.role));
        }
        socioIndex += 1;
        return;
      }

      names.set(beneficiary.id, formatRole(beneficiary.role));
    });

    return names;
  }, [beneficiaries, category, companyPartners]);

  const updateBeneficiary = <K extends keyof BeneficiaryForm>(
    beneficiaryId: string,
    field: K,
    value: BeneficiaryForm[K],
  ) => {
    setBeneficiaries((prev) =>
      prev.map((beneficiary) => {
        if (beneficiary.id !== beneficiaryId) return beneficiary;

        const next = { ...beneficiary, [field]: value };

        if (field === 'estadoCivil' && value !== 'casado' && value !== 'uniao_estavel') {
          next.comprovacaoConjugal = 'certidao';
          const docs = { ...next.documentos };
          delete docs.certidao_casamento;
          delete docs.declaracao_uniao_estavel;
          next.documentos = docs;
        }

        if (field === 'idade' && !isBeneficiaryMinor(String(value))) {
          const docs = { ...next.documentos };
          delete docs.certidao_nascimento;
          next.documentos = docs;
        }

        return next;
      }),
    );
  };

  const previewUploadedDocument = useCallback((document: UploadedDocument) => {
    if (!document.previewUrl) {
      toast.error('Pré-visualização indisponível para este arquivo.');
      return;
    }
    setPreviewRenderFailed(false);
    setPreviewDialogDocument(document);
  }, []);

  const downloadUploadedDocument = useCallback((document: UploadedDocument | null) => {
    if (!document?.previewUrl) {
      toast.error('Download indisponível para este arquivo.');
      return;
    }

    const link = window.document.createElement('a');
    link.href = document.previewUrl;
    link.download = document.fileName;
    link.rel = 'noopener noreferrer';
    link.target = '_blank';
    link.click();
  }, []);

  const copyExtractedFromDocument = useCallback(async (document: UploadedDocument) => {
    const text = buildExtractionCopyText(document.extracted);
    if (!text) {
      toast.error('Não há dados extraídos para copiar neste arquivo.');
      return;
    }

    try {
      await copyTextToClipboard(text);
      toast.success('Dados copiados da extração', {
        description: `${document.fileName}`,
      });
    } catch {
      toast.error('Não foi possível copiar os dados extraídos.');
    }
  }, []);

  const copyExtractionText = useCallback(async (text: string, successMessage: string) => {
    if (!text.trim()) {
      toast.error('Não há dados extraídos para copiar.');
      return;
    }

    try {
      await copyTextToClipboard(text);
      toast.success(successMessage);
    } catch {
      toast.error('Não foi possível copiar os dados extraídos.');
    }
  }, []);

  const copyPartnerIdentityData = useCallback(
    async (partnerName: string, summary: CompanyPartnerIdentitySummary) => {
      const text = buildCompanyPartnerIdentityCopyText(partnerName, summary);
      if (!text) {
        toast.error('Não há dados extraídos deste sócio para copiar.');
        return;
      }

      try {
        await copyTextToClipboard(text);
        toast.success('Dados do sócio copiados');
      } catch {
        toast.error('Não foi possível copiar os dados do sócio.');
      }
    },
    [],
  );

  const removeCompanyUploadedDocument = useCallback(
    (docType: CompanyDocumentType, documentId: string) => {
      const document = (companyDocs[docType] || []).find((item) => item.id === documentId);
      if (!document) return;

      setCompanyDocs((prev) => {
        const nextDocs = (prev[docType] || []).filter((item) => item.id !== documentId);
        return {
          ...prev,
          [docType]: nextDocs,
        };
      });

      revokeDocumentPreview(document);
      toast.success('Documento removido com sucesso.');
    },
    [companyDocs, revokeDocumentPreview],
  );

  const removeAdesaoUploadedDocument = useCallback(
    (docType: AdesaoDocumentType, documentId: string) => {
      const document = (adesaoDocs[docType] || []).find((item) => item.id === documentId);
      if (!document) return;

      setAdesaoDocs((prev) => {
        const nextDocs = (prev[docType] || []).filter((item) => item.id !== documentId);
        return {
          ...prev,
          [docType]: nextDocs,
        };
      });

      revokeDocumentPreview(document);
      toast.success('Documento removido com sucesso.');
    },
    [adesaoDocs, revokeDocumentPreview],
  );

  const removeBeneficiaryUploadedDocument = useCallback(
    (
      beneficiaryId: string,
      docType: BeneficiaryDocumentType,
      documentId: string,
    ) => {
      const beneficiary = beneficiaries.find((item) => item.id === beneficiaryId);
      const document = beneficiary?.documentos[docType]?.find((item) => item.id === documentId);
      if (!document) return;

      setBeneficiaries((prev) =>
        prev.map((item) => {
          if (item.id !== beneficiaryId) return item;

          return {
            ...item,
            documentos: {
              ...item.documentos,
              [docType]: (item.documentos[docType] || []).filter((doc) => doc.id !== documentId),
            },
          };
        }),
      );

      revokeDocumentPreview(document);
      toast.success('Documento removido com sucesso.');
    },
    [beneficiaries, revokeDocumentPreview],
  );

  const formatMissingDescription = useCallback((messages: string[]): string => {
    const shortList = messages.slice(0, 4).join(' · ');
    const moreCount = Math.max(messages.length - 4, 0);
    return moreCount > 0 ? `${shortList} · +${moreCount} pendência(s)` : shortList;
  }, []);

  useEffect(() => {
    if (!validationAttemptedStep) return;

    const { missingIds, missingMessages } = getMissingByStep(validationAttemptedStep);
    if (missingIds.length === 0) {
      setValidationAttemptedStep(null);
      setError('');
      return;
    }

    if (currentStep?.id === validationAttemptedStep) {
      setError(formatMissingDescription(missingMessages));
    }
  }, [currentStep?.id, formatMissingDescription, getMissingByStep, validationAttemptedStep]);

  const goNextStep = () => {
    if (!currentStep) return;
    const { missingIds, missingMessages } = getMissingByStep(currentStep.id);
    if (missingIds.length > 0) {
      setValidationAttemptedStep(currentStep.id);
      const description = formatMissingDescription(missingMessages);
      setError(description || 'Complete os requisitos desta etapa antes de avançar.');
      toast.error('Complete os requisitos desta etapa antes de avançar.', {
        description,
      });
      return;
    }

    if (currentStep.id === 'estrutura') {
      const structureBuilt = buildBeneficiaryStructure();
      if (!structureBuilt) {
        setValidationAttemptedStep(currentStep.id);
        toast.error('Revise os dados da estrutura antes de avançar.');
        return;
      }
    }

    setValidationAttemptedStep(null);
    setError('');
    setCurrentStepIndex((prev) => Math.min(prev + 1, visibleSteps.length - 1));
  };

  const goPreviousStep = () => {
    setValidationAttemptedStep(null);
    setError('');
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const buildMissingChecklist = () => {
    const missing: string[] = [];

    if (!categoryComplete) {
      missing.push('Selecione a modalidade da proposta.');
    }

    if (!structureComplete) {
      missing.push('Conclua a estrutura da proposta (vidas + contato principal).');
    }

    if (!companyComplete) {
      companyRequirements
        .filter((item) => item.required && !item.done)
        .forEach((item) => {
          missing.push(`Empresa: ${item.label}`);
        });
    }

    if (!adesaoComplete) {
      adesaoRequirements
        .filter((item) => item.required && !item.done)
        .forEach((item) => {
          missing.push(`Adesão: ${item.label}`);
        });
    }

    if (!beneficiariesComplete) {
      beneficiaries.forEach((beneficiary, index) => {
        const requirements = beneficiaryRequirementsMap.get(beneficiary.id) || [];
        requirements
          .filter((item) => item.required && !item.done)
          .forEach((item) => {
            missing.push(`Beneficiário ${index + 1} (${beneficiary.nome || formatRole(beneficiary.role)}): ${item.label}`);
          });
      });
    }

    return missing;
  };

  const resetFlow = () => {
    revokeDocumentPreviews(allUploadedDocuments);
    setCategory('');
    setTotalLives('1');
    setPartnerCount('1');
    setEmployeeCount('0');
    setHasEmployees(false);
    setIsStructureReady(false);
    setPrimaryEmail('');
    setPrimaryPhone('');
    setCompanyEmail('');
    setCompanyPhone('');
    setCompanyAddress('');
    setCompanyCnpj('');
    setCompanyLegalName('');
    setCompanyEmailTouched(false);
    setCompanyPhoneTouched(false);
    setCompanyAddressTouched(false);
    setCompanyPartners([]);
    setBeneficiaries([]);
    setCompanyDocs({});
    setAdesaoDocs({});
    setCompanyDataMode('');
    setScanFullResult(null);
    setSelectedAdesaoDocType('documento_elegibilidade');
    setSelectedAdesaoManageDocType('documento_elegibilidade');
    setSelectedBeneficiaryId('');
    setSelectedBeneficiaryDocType('identidade_cpf');
    setSelectedBeneficiaryManageDocType('identidade_cpf');
    setExpandedCompanyDocPanels({});
    setExpandedBeneficiaryDocPanels({});
    setPreviewDialogDocument(null);
    setCurrentStepIndex(0);
    setValidationAttemptedStep(null);
    setError('');
    setPendingUploadTarget(null);
  };

  const saveProposal = async () => {
    const missingChecklist = buildMissingChecklist();
    if (missingChecklist.length > 0) {
      toast.error('Existem pendências obrigatórias no checklist.', {
        description: `${missingChecklist.length} pendência(s) encontrada(s).`,
      });
      return;
    }

    const normalizedPhone = normalizePhone(primaryPhone);
    if (!normalizedPhone) {
      toast.error('Telefone principal é obrigatório para salvar a proposta.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const leadName = beneficiaries[0]?.nome || `Proposta ${category ? CATEGORY_LABELS[category] : ''}`;
      const ages = beneficiaries
        .map((beneficiary) => Number.parseInt(beneficiary.idade, 10))
        .filter((value) => Number.isFinite(value));

      const tipoContratacao =
        category === 'pessoa_juridica' ? 'PME' : category === 'adesao' ? 'ADESAO' : 'INDIVIDUAL';

      const companyDocumentsPayload = mapDocumentsForPayload(companyDocs);
      const adesaoDocumentsPayload = mapDocumentsForPayload(adesaoDocs);
      const contractSocialSummary = getContractSocialExtractionSummary(companyDocs.contrato_social || []);
      const cnpjCardSummary = getCnpjCardExtractionSummary(companyDocs.cartao_cnpj || []);
      const partnerIdentityDocs = companyDocs.identidade_cpf_socios || [];
      const companyPartnersPayload = companyPartnerDocStatuses.map((status) => {
        const identitySummary = getCompanyPartnerIdentitySummary(status.partner, partnerIdentityDocs);
        return {
          id: status.partner.id,
          nome: status.partner.nome.trim() || null,
          documento_identidade_cpf_anexado: status.done,
          total_arquivos_vinculados: status.filesCount,
          documento_tipo_identificado: identitySummary.documentoTipo,
          cpf: identitySummary.cpf ? identitySummary.cpf.replace(/\D/g, '').slice(0, 11) : null,
          rg: identitySummary.rg ? identitySummary.rg.replace(/\D/g, '') : null,
          ifp: identitySummary.ifp || null,
          numero_habilitacao: identitySummary.numeroHabilitacao
            ? identitySummary.numeroHabilitacao.replace(/\D/g, '')
            : null,
          data_nascimento: identitySummary.dataNascimento || null,
          data_expedicao: identitySummary.dataExpedicao || null,
          orgao_expedidor: identitySummary.orgaoExpedidor || null,
        };
      });

      const beneficiaryPayload = beneficiaries.map((beneficiary) => {
        const documentsPayload = mapDocumentsForPayload(beneficiary.documentos);

        return {
          id: beneficiary.id,
          tipo: beneficiary.role,
          nome: beneficiary.nome,
          idade: Number.parseInt(beneficiary.idade, 10) || null,
          cpf: beneficiary.cpf || null,
          rg: beneficiary.rg || null,
          data_nascimento: beneficiary.dataNascimento || null,
          email: beneficiary.email || null,
          telefone: normalizePhone(beneficiary.telefone) || null,
          estado_civil: beneficiary.estadoCivil,
          comprovacao_conjugal: beneficiary.comprovacaoConjugal,
          documentos: documentsPayload,
        };
      });

      const result = await saveScannedLead({
        nome: leadName,
        whatsapp: normalizedPhone,
        email: primaryEmail || undefined,
        operadora_atual: extractedSummary.operator || undefined,
        valor_atual: extractedSummary.currentValue || undefined,
        idades: ages,
        tipo_contratacao: tipoContratacao,
        dados_pdf: {
          categoria: category,
          stepper: visibleSteps,
          estrutura: {
            total_vidas: totalLivesNumber,
            total_socios: category === 'pessoa_juridica' ? partnerCountNumber : 0,
            total_funcionarios: category === 'pessoa_juridica' ? employeeCountNumber : 0,
            total_dependentes: dependentsCountNumber,
            empresa_com_funcionarios: category === 'pessoa_juridica' ? hasEmployees : false,
            socios_empresa: category === 'pessoa_juridica' ? companyPartnersPayload : [],
                empresa: category === 'pessoa_juridica'
              ? {
                  razao_social: companyLegalName || null,
                  cnpj: companyCnpj.replace(/\D/g, '') || null,
                  endereco: companyAddress || null,
                  inscricao_estadual: contractSocialSummary.inscricaoEstadual || null,
                  data_abertura: contractSocialSummary.dataAbertura || null,
                  status_cnpj: cnpjCardSummary.status || null,
                  data_inicio_atividade: cnpjCardSummary.dataInicio || null,
                  nome_fantasia: cnpjCardSummary.nomeFantasia || null,
                }
              : null,
          },
          contato_principal: {
            email: primaryEmail,
            telefone: primaryPhone,
          },
          contato_empresa:
            category === 'pessoa_juridica'
              ? {
                  email: companyEmail,
                  telefone: companyPhone,
                  endereco: companyAddress || null,
                  razao_social: companyLegalName || null,
                  cnpj: companyCnpj.replace(/\D/g, '') || null,
                  inscricao_estadual: contractSocialSummary.inscricaoEstadual || null,
                  data_abertura: contractSocialSummary.dataAbertura || null,
                  status_cnpj: cnpjCardSummary.status || null,
                  data_inicio_atividade: cnpjCardSummary.dataInicio || null,
                  nome_fantasia: cnpjCardSummary.nomeFantasia || null,
                }
              : null,
          documentos_empresa: companyDocumentsPayload,
          documentos_adesao: adesaoDocumentsPayload,
          beneficiarios: beneficiaryPayload,
          checklist: {
            empresa: companyRequirements,
            socios_empresa: companyPartnersPayload,
            adesao: adesaoRequirements,
            beneficiarios: beneficiaries.map((beneficiary) => ({
              id: beneficiary.id,
              nome: beneficiary.nome,
              requisitos: beneficiaryRequirementsMap.get(beneficiary.id) || [],
            })),
          },
          resumo_extracao: {
            nomes_beneficiarios: extractedSummary.names,
            idades: extractedSummary.ages,
            operadora: extractedSummary.operator,
            tipo_plano: extractedSummary.planType,
            valor_atual: extractedSummary.currentValue,
            confianca_media: extractedSummary.averageConfidence,
            documentos_processados: extractedSummary.totalDocuments,
            caracteres_extraidos: extractedSummary.totalCharacters,
          },
          timestamp: new Date().toISOString(),
        },
        observacoes: `Proposta iniciada por stepper inteligente (${category ? CATEGORY_LABELS[category] : ''}).`,
        corretor_id: resolvedCorretorId || undefined,
        registrar_fila_proposta: registrarFilaProposta ?? Boolean(resolvedCorretorId),
        permitir_lead_existente: permitirLeadExistente ?? Boolean(resolvedCorretorId),
        status_inicial_fila: 'enviada',
      });

      if (!result.success) {
        toast.error('Não foi possível salvar a proposta.', {
          description: result.message || result.error || 'Erro desconhecido.',
        });
        return;
      }

      toast.success('Proposta salva com sucesso!', {
        description:
          result.message ||
          `Lead ${result.lead_id} criado com checklist inteligente.`,
      });

      if (onPropostaSalva) {
        try {
          await onPropostaSalva();
        } catch {
          // Evita falhar o fluxo principal caso apenas o refresh da lista tenha erro.
        }
      }

      resetFlow();
    } catch (saveError: unknown) {
      const message = saveError instanceof Error ? saveError.message : 'Erro ao salvar proposta';
      setError(message);
      toast.error('Erro ao salvar proposta', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card data-tour="admin-scanner" className="border-[#D4AF37]/20 bg-[#0a0a0a]/90 backdrop-blur-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-[#D4AF37]" />
              Scanner Inteligente · Proposta Step-by-Step
            </CardTitle>
            <CardDescription className="mt-1 text-white/60">
              Modalidade, estrutura de vidas, documentos por etapa e checklist segmentado por beneficiário.
            </CardDescription>
          </div>

          <Badge variant="info">Etapa {currentStepIndex + 1} de {visibleSteps.length}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {visibleSteps.map((step, index) => {
            const active = index === currentStepIndex;
            const completed = stepCompletion[step.id];

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  const blocked = visibleSteps
                    .slice(0, index)
                    .some((previousStep) => !stepCompletion[previousStep.id]);

                  if (blocked) {
                    toast.error('Conclua as etapas anteriores antes de avançar.');
                    return;
                  }

                  setValidationAttemptedStep(null);
                  setError('');
                  setCurrentStepIndex(index);
                }}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  active
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#F0D67C]'
                    : completed
                      ? 'border-green-500/30 bg-green-500/10 text-green-300'
                      : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20'
                }`}
              >
                <p className="text-[11px] uppercase tracking-wide">Passo {index + 1}</p>
                <p className="text-sm font-medium">{step.label}</p>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentStep.id === 'modalidade' && (
          <div
            className={`space-y-4 rounded-xl border bg-white/[0.02] p-4 ${
              isMissingField('modalidade-categoria') ? PANEL_ERROR_CLASS : 'border-white/10'
            }`}
          >
            <Label className="text-white/80">Escolha a modalidade da proposta</Label>
            <Select
              value={category}
              onValueChange={(value) => {
                revokeDocumentPreviews(allUploadedDocuments);
                setCategory(value as ProposalCategory);
                setCompanyDocs({});
                setAdesaoDocs({});
                setBeneficiaries([]);
                setCompanyPartners([]);
                setHasEmployees(false);
                setEmployeeCount('0');
                setCompanyEmail('');
                setCompanyPhone('');
                setCompanyAddress('');
                setCompanyCnpj('');
                setCompanyLegalName('');
                setCompanyEmailTouched(false);
                setCompanyPhoneTouched(false);
                setCompanyAddressTouched(false);
                setCompanyDataMode('');
                setScanFullResult(null);
                setSelectedAdesaoDocType('documento_elegibilidade');
                setSelectedAdesaoManageDocType('documento_elegibilidade');
                setSelectedBeneficiaryId('');
                setSelectedBeneficiaryDocType('identidade_cpf');
                setSelectedBeneficiaryManageDocType('identidade_cpf');
                setExpandedCompanyDocPanels({});
                setExpandedBeneficiaryDocPanels({});
                setPreviewDialogDocument(null);
                setValidationAttemptedStep(null);
                setError('');
                setCurrentStepIndex(0);
              }}
            >
              <SelectTrigger
                className={`${DARK_SELECT_TRIGGER} ${isMissingField('modalidade-categoria') ? FIELD_ERROR_CLASS : ''}`}
              >
                <SelectValue placeholder="Selecione Adesão, Pessoa Física ou Pessoa Jurídica" />
              </SelectTrigger>
              <SelectContent className={DARK_SELECT_CONTENT}>
                <SelectItem className={DARK_SELECT_ITEM} value="adesao">Adesão</SelectItem>
                <SelectItem className={DARK_SELECT_ITEM} value="pessoa_fisica">Pessoa Física</SelectItem>
                <SelectItem className={DARK_SELECT_ITEM} value="pessoa_juridica">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {currentStep.id === 'estrutura' && (
          <div
            className={`space-y-4 rounded-xl border bg-white/[0.02] p-4 ${
              shouldHighlightCurrentStep && currentStepMissing.missingIds.length > 0 ? PANEL_ERROR_CLASS : 'border-white/10'
            }`}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/80">Total de vidas da proposta</Label>
                <Input
                  className={`${DARK_INPUT} ${isMissingField('estrutura-total-vidas') ? FIELD_ERROR_CLASS : ''}`}
                  type="number"
                  min={1}
                  value={totalLives}
                  onChange={(event) => setTotalLives(event.target.value)}
                />
              </div>

              {category === 'pessoa_juridica' ? (
                <div className="space-y-2">
                  <Label className="text-white/80">Quantidade de sócios</Label>
                  <Input
                    className={`${DARK_INPUT} ${isMissingField('estrutura-socios') ? FIELD_ERROR_CLASS : ''}`}
                    type="number"
                    min={1}
                    max={totalLivesNumber || 1}
                    value={partnerCount}
                    onChange={(event) => setPartnerCount(event.target.value)}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                  <p>Titulares: 1</p>
                  <p>Dependentes: {dependentsCountNumber}</p>
                </div>
              )}
            </div>

            {category === 'pessoa_juridica' && (
              <div
                className={`space-y-3 rounded-lg border bg-black/20 p-3 ${
                  isMissingField('estrutura-funcionarios') ? PANEL_ERROR_CLASS : 'border-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Switch
                    checked={hasEmployees}
                    onCheckedChange={(checked) => {
                      setHasEmployees(checked);
                      if (!checked) {
                        setEmployeeCount('0');
                        return;
                      }
                      if (parsePositiveInt(employeeCount) <= 0) {
                        setEmployeeCount('1');
                      }
                    }}
                    size="sm"
                  />
                  <span className="text-sm text-white/80">Empresa com funcionários</span>
                </div>

                {hasEmployees && (
                  <div className="space-y-2">
                    <Label className="text-white/80">Quantidade de funcionários</Label>
                    <Input
                      className={`${DARK_INPUT} ${isMissingField('estrutura-funcionarios') ? FIELD_ERROR_CLASS : ''}`}
                      type="number"
                      min={1}
                      max={Math.max(totalLivesNumber - partnerCountNumber, 1)}
                      value={employeeCount}
                      onChange={(event) => setEmployeeCount(event.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {category === 'pessoa_juridica' && (
              <div
                className={`rounded-lg border bg-black/20 p-3 text-sm text-white/75 ${
                  isMissingField('estrutura-distribuicao') ? PANEL_ERROR_CLASS : 'border-white/10'
                }`}
              >
                <p>
                  Distribuição automática: <span className="text-white">Sócios {partnerCountNumber}</span> ·{' '}
                  <span className="text-white">Funcionários {employeeCountNumber}</span> ·{' '}
                  <span className="text-white">Dependentes {dependentsCountNumber}</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/80">E-mail de contato principal</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <Input
                    className={`${DARK_INPUT} pl-9 ${isMissingField('estrutura-contato-email') ? FIELD_ERROR_CLASS : ''}`}
                    value={primaryEmail}
                    onChange={(event) => setPrimaryEmail(normalizeEmailInput(event.target.value))}
                    placeholder="contato@cliente.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Telefone de contato principal</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <Input
                    className={`${DARK_INPUT} pl-9 ${isMissingField('estrutura-contato-telefone') ? FIELD_ERROR_CLASS : ''}`}
                    value={primaryPhone}
                    onChange={(event) => setPrimaryPhone(formatPhoneInput(event.target.value))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <Label className="text-white/80">Responsável no CRM (corretor/usuário)</Label>
              {corretorId ? (
                <div className="space-y-1">
                  <Badge variant="info">Atribuído ao seu usuário</Badge>
                  <p className="text-xs text-white/55">
                    As propostas enviadas neste painel ficam vinculadas ao corretor autenticado.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select
                    value={selectedCorretorId || '__none__'}
                    onValueChange={(value) => setSelectedCorretorId(value === '__none__' ? '' : value)}
                    disabled={loadingCorretorOptions}
                  >
                    <SelectTrigger className={DARK_SELECT_TRIGGER}>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent className={DARK_SELECT_CONTENT}>
                      <SelectItem className={DARK_SELECT_ITEM} value="__none__">
                        Sem responsável
                      </SelectItem>
                      {corretorOptions.map((option) => (
                        <SelectItem className={DARK_SELECT_ITEM} key={option.id} value={option.id}>
                          {option.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-white/55">
                    Você pode deixar sem responsável agora e editar depois no CRM.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-white/65">
                A estrutura dos beneficiários será gerada automaticamente ao clicar em Avançar.
              </p>
              {isStructureReady && (
                <Badge variant="success">
                  Estrutura pronta: {totalLivesNumber} vida(s)
                </Badge>
              )}
            </div>
          </div>
        )}

        {currentStep.id === 'empresa' && (
          <div
            className={`space-y-4 rounded-xl border bg-white/[0.02] p-4 ${
              shouldHighlightCurrentStep && currentStepMissing.missingIds.length > 0 ? PANEL_ERROR_CLASS : 'border-white/10'
            }`}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/80">E-mail da empresa</Label>
                <Input
                  className={`${DARK_INPUT} ${isMissingField('empresa-contato_empresa') ? FIELD_ERROR_CLASS : ''}`}
                  value={companyEmail}
                  onChange={(event) => {
                    setCompanyEmailTouched(true);
                    setCompanyEmail(normalizeEmailInput(event.target.value));
                  }}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Telefone da empresa</Label>
                <Input
                  className={`${DARK_INPUT} ${isMissingField('empresa-contato_empresa') ? FIELD_ERROR_CLASS : ''}`}
                  value={companyPhone}
                  onChange={(event) => {
                    setCompanyPhoneTouched(true);
                    setCompanyPhone(formatPhoneInput(event.target.value));
                  }}
                  placeholder="(11) 3333-4444"
                />
              </div>
            </div>

            <div
              className={`space-y-3 rounded-xl border bg-black/25 p-3 ${
                isMissingField('empresa-modo') ? PANEL_ERROR_CLASS : 'border-white/10'
              }`}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Como deseja preencher os dados da empresa?</p>
                <p className="text-xs text-white/60">
                  Escolha um modo para liberar os campos desta etapa.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    setCompanyDataMode('scanner');
                    setScanFullResult(null);
                  }}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    companyDataMode === 'scanner'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#F0D67C]'
                      : 'border-white/15 bg-black/20 text-white/80 hover:border-white/30'
                  }`}
                >
                  <p className="text-sm font-semibold">Scanner Inteligente</p>
                  <p className="text-xs text-current/80">Anexa documentos e extrai os dados automaticamente.</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCompanyDataMode('scanfull');
                    setScanFullResult(null);
                  }}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    companyDataMode === 'scanfull'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#F0D67C]'
                      : 'border-white/15 bg-black/20 text-white/80 hover:border-white/30'
                  }`}
                >
                  <p className="text-sm font-semibold">ScanFULL (IA em lote)</p>
                  <p className="text-xs text-current/80">Envia tudo de uma vez e distribui automaticamente.</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCompanyDataMode('manual');
                    setScanFullResult(null);
                  }}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    companyDataMode === 'manual'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#F0D67C]'
                      : 'border-white/15 bg-black/20 text-white/80 hover:border-white/30'
                  }`}
                >
                  <p className="text-sm font-semibold">Digitar manualmente</p>
                  <p className="text-xs text-current/80">Preenche CNPJ e razão social manualmente.</p>
                </button>
              </div>

              {!companyDataMode && (
                <p className="text-xs text-white/55">
                  Selecione uma opção para continuar.
                </p>
              )}
              {companyDataMode !== 'manual' && (
                <p className="text-xs text-white/55">
                  O endereço da empresa será preenchido automaticamente pela IA com base nos documentos enviados.
                </p>
              )}
            </div>

            {(companyDataMode === 'scanner' || companyDataMode === 'scanfull') && (
              <>
                {companyDataMode === 'scanfull' && (
                  <div className="space-y-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">1. ScanFULL: envie todos os arquivos</p>
                      <p className="text-xs text-white/65">
                        A IA vai analisar um por um, classificar por tipo de documento e preencher os campos relacionados.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" size="sm" onClick={triggerScanFullUpload} disabled={isProcessing}>
                        <Upload className="mr-2 h-4 w-4" />
                        Enviar lote completo (ScanFULL)
                      </Button>
                    </div>

                    {isProcessing && !activeUploadTarget && (
                      <div className="space-y-2 rounded-md border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-2">
                        <div className="flex items-center justify-between text-[11px] text-white/75">
                          <span className="inline-flex items-center gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin text-[#F0D67C]" />
                            Processando: {processingLabel || 'ScanFULL'}
                          </span>
                          <span>{processingProgress}%</span>
                        </div>
                        <Progress value={processingProgress} className="h-2" />
                      </div>
                    )}

                    {scanFullResult && (
                      <div className="rounded-lg border border-white/10 bg-black/30 p-2.5 text-xs text-white/80">
                        <p>
                          <span className="text-white/55">Arquivos processados:</span> {scanFullResult.processed}
                        </p>
                        <p>
                          <span className="text-white/55">Classificados automaticamente:</span> {scanFullResult.classified}
                        </p>
                        <p>
                          <span className="text-white/55">Não classificados:</span> {scanFullResult.unclassified}
                        </p>
                        {scanFullResult.distributedSummary.length > 0 && (
                          <p className="text-white/65">
                            {scanFullResult.distributedSummary.join(' · ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">
                      {companyDataMode === 'scanfull' ? '2. Revise e ajuste por categoria' : '1. Anexe os documentos da empresa'}
                    </p>
                    <p className="text-xs text-white/65">
                      Envie os arquivos por categoria para preencher CNPJ, razão social e sócios automaticamente.
                    </p>
                    <p className="text-xs text-white/55">
                      Você pode selecionar múltiplos arquivos de uma vez para o mesmo tipo de documento.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {(Object.keys(COMPANY_DOC_LABELS) as CompanyDocumentType[])
                      .filter((docType) => docType !== 'identidade_cpf_socios')
                      .map((docType) => {
                        const requirement = companyRequirements.find((item) => item.id === docType);
                        const isRequired = requirement?.required ?? true;
                        const isDone = requirement?.done ?? hasUploadedDocs(companyDocs[docType]);
                        const docsForType = companyDocs[docType] || [];
                        const filesCount = docsForType.length;
                        const contractSocialSummary =
                          docType === 'contrato_social' ? getContractSocialExtractionSummary(docsForType) : null;
                        const cnpjCardSummary =
                          docType === 'cartao_cnpj' ? getCnpjCardExtractionSummary(docsForType) : null;
                        const unifiedContractExtraction =
                          docType === 'contrato_social' ? getUnifiedExtractionFromDocuments(docsForType) : null;
                        const unifiedContractFields = unifiedContractExtraction
                          ? getExtractionFields(unifiedContractExtraction)
                          : [];
                        const uploadTarget: UploadTarget = { scope: 'empresa', docType };
                        const isExpanded = expandedCompanyDocPanels[docType] ?? true;
                        const isMissingCompanyDoc = isMissingField(`empresa-${docType}`);

                        return (
                          <div
                            key={docType}
                            className={`rounded-lg border bg-black/25 p-3 ${
                              isMissingCompanyDoc ? PANEL_ERROR_CLASS : 'border-white/10'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm text-white/90">{COMPANY_DOC_LABELS[docType]}</p>
                                <p className="text-xs text-white/55">
                                  {filesCount > 0
                                    ? `${filesCount} arquivo(s) anexado(s).`
                                    : 'Nenhum arquivo anexado.'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={getChecklistBadgeVariant(isDone, isRequired)}
                                  className={getChecklistBadgeClass(isDone, isRequired)}
                                >
                                  {isDone ? 'OK' : isRequired ? 'Pendente' : 'Opcional'}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-white/80 hover:bg-white/10 hover:text-white"
                                  onClick={() => toggleCompanyDocPanel(docType)}
                                >
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  />
                                </Button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-2 space-y-2">
                                {requirement?.helper && (
                                  <p className="text-xs text-white/45">{requirement.helper}</p>
                                )}

                                {docType === 'contrato_social' && contractSocialSummary && (
                                  <div className="rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-2.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#F0D67C]">
                                      Dados extraídos do contrato social
                                    </p>
                                    <div className="mt-1.5 space-y-1 text-xs text-white/85">
                                      <p>
                                        <span className="text-white/55">CNPJ:</span>{' '}
                                        {contractSocialSummary.cnpj
                                          ? formatCnpjInput(contractSocialSummary.cnpj)
                                          : 'Não identificado'}
                                      </p>
                                      <p>
                                        <span className="text-white/55">Razão social:</span>{' '}
                                        {contractSocialSummary.razaoSocial || 'Não identificada'}
                                      </p>
                                      {contractSocialSummary.inscricaoEstadual && (
                                        <p>
                                          <span className="text-white/55">Inscrição estadual:</span>{' '}
                                          {contractSocialSummary.inscricaoEstadual}
                                        </p>
                                      )}
                                      <p>
                                        <span className="text-white/55">Data de abertura:</span>{' '}
                                        {contractSocialSummary.dataAbertura || 'Não identificada'}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {docType === 'contrato_social' && unifiedContractFields.length > 0 && (
                                  <div className="rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-2.5">
                                    <div className="mb-1 flex items-center justify-between gap-2">
                                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#F0D67C]">
                                        Resumo geral (todos os arquivos)
                                      </p>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className={DARK_OUTLINE_BUTTON}
                                        onClick={() => {
                                          if (!unifiedContractExtraction) return;
                                          void copyExtractionText(
                                            buildExtractionCopyText(unifiedContractExtraction),
                                            'Resumo geral do contrato social copiado',
                                          );
                                        }}
                                      >
                                        <Copy className="mr-1.5 h-4 w-4" />
                                        Copiar resumo
                                      </Button>
                                    </div>
                                    <div className="space-y-0.5 text-xs text-white/85">
                                      {unifiedContractFields.map((field) => (
                                        <p key={`${docType}-general-${field.label}`}>
                                          <span className="text-white/55">{field.label}:</span> {field.value}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {docType === 'cartao_cnpj' && cnpjCardSummary && (
                                  <div className="rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-2.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#F0D67C]">
                                      Dados extraídos do cartão CNPJ
                                    </p>
                                    <div className="mt-1.5 space-y-1 text-xs text-white/85">
                                      <p>
                                        <span className="text-white/55">Status:</span>{' '}
                                        {cnpjCardSummary.status || 'Não identificado'}
                                      </p>
                                      <p>
                                        <span className="text-white/55">Data de início:</span>{' '}
                                        {cnpjCardSummary.dataInicio || 'Não identificada'}
                                      </p>
                                      <p>
                                        <span className="text-white/55">Nome fantasia:</span>{' '}
                                        {cnpjCardSummary.nomeFantasia || 'Não identificado'}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => triggerUpload(uploadTarget)}
                                    disabled={isProcessing}
                                  >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Anexar documento(s)
                                  </Button>

                                  {docType === 'cartao_cnpj' && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      className={`${DARK_OUTLINE_BUTTON} border-[#D4AF37]/40`}
                                    >
                                      <a
                                        href="https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white hover:text-white"
                                      >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Gerar Cartão CNPJ
                                      </a>
                                    </Button>
                                  )}
                                </div>
                                {renderInlineUploadProgress(uploadTarget)}

                                {docsForType.length > 0 && (
                                  <div className="space-y-2 rounded-lg border border-white/10 bg-black/35 p-2.5">
                                    <p className="text-xs font-medium text-white/80">Arquivos anexados</p>
                                    {docsForType.map((document) => {
                                      const showPerDocumentExtraction = docType !== 'contrato_social';
                                      const extractionFields = showPerDocumentExtraction
                                        ? getExtractionFields(document.extracted)
                                        : [];
                                      return (
                                        <div
                                          key={document.id}
                                          className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                                        >
                                          <div className="min-w-0">
                                            <p className="truncate text-sm text-white/90">{document.fileName}</p>
                                            <p className="text-xs text-white/55">
                                              {formatFileSize(document.fileSize)} ·{' '}
                                              {new Date(document.uploadedAt).toLocaleString('pt-BR')}
                                            </p>
                                          </div>

                                          {showPerDocumentExtraction && (
                                            extractionFields.length > 0 ? (
                                              <div className="rounded-md border border-white/10 bg-black/35 p-2 text-xs text-white/85">
                                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#F0D67C]">
                                                  Dados lidos pela IA
                                                </p>
                                                <div className="space-y-0.5">
                                                  {extractionFields.map((field) => (
                                                    <p key={`${document.id}-${field.label}`}>
                                                      <span className="text-white/55">{field.label}:</span> {field.value}
                                                    </p>
                                                  ))}
                                                </div>
                                              </div>
                                            ) : (
                                              <p className="text-xs text-white/50">
                                                A IA não retornou dados estruturados para este arquivo.
                                              </p>
                                            )
                                          )}

                                          <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className={DARK_OUTLINE_BUTTON}
                                              onClick={() => previewUploadedDocument(document)}
                                            >
                                              <Eye className="mr-1.5 h-4 w-4" />
                                              Abrir
                                            </Button>
                                            {showPerDocumentExtraction && (
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className={DARK_OUTLINE_BUTTON}
                                                onClick={() => {
                                                  void copyExtractedFromDocument(document);
                                                }}
                                                disabled={extractionFields.length === 0}
                                              >
                                                <Copy className="mr-1.5 h-4 w-4" />
                                                Copiar dados
                                              </Button>
                                            )}
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className="border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-red-50"
                                              onClick={() => removeCompanyUploadedDocument(docType, document.id)}
                                            >
                                              <Trash2 className="mr-1.5 h-4 w-4" />
                                              Remover
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  {companyRequirements.every((item) => !item.required || item.done) && (
                    <p className="text-xs text-green-200/80">
                      Todos os documentos obrigatórios da empresa já foram enviados.
                    </p>
                  )}
                </div>

                {companyPartnerDocStatuses.length > 0 && (
                  <div
                    className={`space-y-2 rounded-xl border bg-[#D4AF37]/5 p-3 ${
                      isMissingField('empresa-identidade_cpf_socios') ? PANEL_ERROR_CLASS : 'border-[#D4AF37]/20'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">ID e CPF dos sócios</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={pendingCompanyPartnerDocStatuses.length === 0 ? 'success' : 'warning'}
                          className={
                            pendingCompanyPartnerDocStatuses.length === 0
                              ? CHECKLIST_BADGE_DONE
                              : CHECKLIST_BADGE_PENDING
                          }
                        >
                          {pendingCompanyPartnerDocStatuses.length === 0
                            ? 'Todos concluídos'
                            : `${pendingCompanyPartnerDocStatuses.length} pendente(s)`}
                        </Badge>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={DARK_OUTLINE_BUTTON}
                          onClick={addCompanyPartner}
                          disabled={isProcessing || companyPartners.length >= maxPartnersAllowed}
                        >
                          <Plus className="mr-1.5 h-4 w-4" />
                          Adicionar sócio
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-white/65">
                      Envie Identidade, CNH ou documento equivalente de cada sócio. Se a IA não identificar todos, adicione manualmente.
                    </p>

                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                      {companyPartnerDocStatuses.map((status, index) => {
                        const identitySummary = getCompanyPartnerIdentitySummary(
                          status.partner,
                          companyDocs.identidade_cpf_socios || [],
                        );
                        const hasIdentityData = Boolean(
                          identitySummary.cpf ||
                            identitySummary.rg ||
                            identitySummary.ifp ||
                            identitySummary.numeroHabilitacao ||
                            identitySummary.dataNascimento ||
                            identitySummary.dataExpedicao ||
                            identitySummary.orgaoExpedidor ||
                            identitySummary.documentoTipo,
                        );

                        return (
                          <div
                            key={status.partner.id}
                            className={`rounded-lg border bg-black/25 p-2.5 ${
                              isMissingField('empresa-identidade_cpf_socios') && !status.done
                                ? PANEL_ERROR_CLASS
                                : 'border-white/10'
                            }`}
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <p className="text-xs text-white/55">Sócio {index + 1}</p>
                              <Badge
                                variant={status.done ? 'success' : 'warning'}
                                className={status.done ? CHECKLIST_BADGE_DONE : CHECKLIST_BADGE_PENDING}
                              >
                                {status.done ? 'Concluído' : 'Pendente'}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <Input
                                className={DARK_INPUT}
                                value={status.partner.nome}
                                onChange={(event) => updateCompanyPartnerName(status.partner.id, event.target.value)}
                                placeholder={`Nome do sócio ${index + 1}`}
                              />

                              {hasIdentityData && (
                                <div className="rounded-md border border-white/10 bg-black/35 p-2 text-xs text-white/85">
                                  <p>
                                    <span className="text-white/55">Documento:</span>{' '}
                                    {getIdentityDocTypeLabel(identitySummary.documentoTipo)}
                                  </p>
                                  <p>
                                    <span className="text-white/55">CPF:</span>{' '}
                                    {identitySummary.cpf ? formatCpfInput(identitySummary.cpf) : 'Não identificado'}
                                  </p>
                                  {identitySummary.rg && (
                                    <p>
                                      <span className="text-white/55">RG:</span> {identitySummary.rg}
                                    </p>
                                  )}
                                  {identitySummary.ifp && (
                                    <p>
                                      <span className="text-white/55">IFP:</span> {identitySummary.ifp}
                                    </p>
                                  )}
                                  {identitySummary.numeroHabilitacao && (
                                    <p>
                                      <span className="text-white/55">Nº da habilitação:</span>{' '}
                                      {identitySummary.numeroHabilitacao}
                                    </p>
                                  )}
                                  {identitySummary.dataNascimento && (
                                    <p>
                                      <span className="text-white/55">Data de nascimento:</span>{' '}
                                      {identitySummary.dataNascimento}
                                    </p>
                                  )}
                                  {identitySummary.dataExpedicao && (
                                    <p>
                                      <span className="text-white/55">Data de expedição:</span>{' '}
                                      {identitySummary.dataExpedicao}
                                    </p>
                                  )}
                                  {identitySummary.orgaoExpedidor && (
                                    <p>
                                      <span className="text-white/55">Órgão expedidor:</span>{' '}
                                      {identitySummary.orgaoExpedidor}
                                    </p>
                                  )}
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() =>
                                    triggerUpload({
                                      scope: 'empresa',
                                      docType: 'identidade_cpf_socios',
                                      partnerId: status.partner.id,
                                    })
                                  }
                                  disabled={isProcessing}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  {status.done ? 'Atualizar ID/CPF deste sócio' : 'Anexar ID/CPF deste sócio'}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className={DARK_OUTLINE_BUTTON}
                                  onClick={() => {
                                    void copyPartnerIdentityData(status.partner.nome, identitySummary);
                                  }}
                                  disabled={!hasIdentityData}
                                >
                                  <Copy className="mr-1.5 h-4 w-4" />
                                  Copiar dados do sócio
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-red-50"
                                  onClick={() => removeCompanyPartner(status.partner.id)}
                                  disabled={isProcessing || companyPartners.length <= 1}
                                >
                                  <Trash2 className="mr-1.5 h-4 w-4" />
                                  Remover sócio
                                </Button>
                              </div>
                              {renderInlineUploadProgress({
                                scope: 'empresa',
                                docType: 'identidade_cpf_socios',
                                partnerId: status.partner.id,
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {companyDataMode === 'manual' && (
              <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">Preenchimento manual</p>
                  <p className="text-xs text-white/60">
                    Use esta opção quando preferir informar os dados sem extração por IA.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white/80">Razão social</Label>
                    <Input
                      className={DARK_INPUT}
                      value={companyLegalName}
                      onChange={(event) => setCompanyLegalName(event.target.value)}
                      placeholder="Razão social da empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">CNPJ</Label>
                    <Input
                      className={DARK_INPUT}
                      value={companyCnpj}
                      onChange={(event) => {
                        setCompanyCnpj(formatCnpjInput(event.target.value));
                      }}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Endereço da empresa</Label>
                  <Input
                    className={`${DARK_INPUT} ${isMissingField('empresa-endereco_empresa') ? FIELD_ERROR_CLASS : ''}`}
                    value={companyAddress}
                    onChange={(event) => {
                      setCompanyAddressTouched(true);
                      setCompanyAddress(event.target.value);
                    }}
                    placeholder="Rua, número, bairro, cidade/UF, CEP"
                  />
                  <p className="text-xs text-white/55">
                    Campo obrigatório apenas no preenchimento manual.
                  </p>
                </div>

                <p className="text-xs text-white/55">
                  Para anexar documentos obrigatórios da empresa, troque para o modo Scanner Inteligente.
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep.id === 'beneficiarios' && (
          <div
            className={`space-y-4 rounded-xl border bg-white/[0.02] p-4 ${
              shouldHighlightCurrentStep && currentStepMissing.missingIds.length > 0 ? PANEL_ERROR_CLASS : 'border-white/10'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">Documentação individual dos beneficiários</h3>
              <Badge variant="info">{beneficiaries.length} beneficiário(s)</Badge>
            </div>

            {category === 'adesao' && (
              <div
                className={`space-y-3 rounded-xl border bg-[#D4AF37]/5 p-3 ${
                  shouldHighlightCurrentStep &&
                  currentStepMissing.missingIds.some((item) => item.startsWith('beneficiarios-adesao-'))
                    ? PANEL_ERROR_CLASS
                    : 'border-[#D4AF37]/20'
                }`}
              >
                <p className="text-sm font-semibold text-white">Documentos obrigatórios de Adesão</p>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={
                      adesaoPendingUploadOptions.some((option) => option.value === selectedAdesaoDocType)
                        ? selectedAdesaoDocType
                        : undefined
                    }
                    onValueChange={(value) => setSelectedAdesaoDocType(value as AdesaoDocumentType)}
                    disabled={adesaoPendingUploadOptions.length === 0}
                  >
                    <SelectTrigger className={`${DARK_SELECT_TRIGGER} sm:w-[360px]`}>
                      <SelectValue placeholder="Sem pendências de upload" />
                    </SelectTrigger>
                    <SelectContent className={DARK_SELECT_CONTENT}>
                      {adesaoPendingUploadOptions.map((option) => (
                        <SelectItem className={DARK_SELECT_ITEM} key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    disabled={isProcessing || adesaoPendingUploadOptions.length === 0}
                    onClick={() => {
                      if (!adesaoPendingUploadOptions.some((option) => option.value === selectedAdesaoDocType)) {
                        return;
                      }
                      triggerUpload({ scope: 'adesao', docType: selectedAdesaoDocType });
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar documentos de adesão
                  </Button>
                </div>
                {adesaoPendingUploadOptions.some((option) => option.value === selectedAdesaoDocType) &&
                  renderInlineUploadProgress({
                    scope: 'adesao',
                    docType: selectedAdesaoDocType,
                  })}
                {adesaoPendingUploadOptions.length === 0 && (
                  <p className="text-xs text-green-200/80">
                    Todos os documentos de adesão já foram enviados.
                  </p>
                )}
                <p className="text-xs text-white/55">
                  Você pode anexar vários arquivos em um único envio.
                </p>

                <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      Anexos enviados de Adesão
                    </p>
                    <Badge variant="info">{selectedAdesaoDocs.length} arquivo(s)</Badge>
                  </div>

                  {adesaoManageDocOptions.length > 0 && (
                    <Select
                      value={selectedAdesaoManageDocType}
                      onValueChange={(value) => setSelectedAdesaoManageDocType(value as AdesaoDocumentType)}
                    >
                      <SelectTrigger className={`${DARK_SELECT_TRIGGER} sm:w-[360px]`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={DARK_SELECT_CONTENT}>
                        {adesaoManageDocOptions.map((option) => (
                          <SelectItem className={DARK_SELECT_ITEM} key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedAdesaoDocs.length === 0 ? (
                    <p className="text-xs text-white/55">
                      Nenhum arquivo anexado para gerenciamento.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedAdesaoDocs.map((document) => {
                        const extractionFields = getExtractionFields(document.extracted);
                        return (
                          <div
                            key={document.id}
                            className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm text-white/90">{document.fileName}</p>
                              <p className="text-xs text-white/55">
                                {formatFileSize(document.fileSize)} · {new Date(document.uploadedAt).toLocaleString('pt-BR')}
                              </p>
                            </div>

                            {extractionFields.length > 0 ? (
                              <div className="rounded-md border border-white/10 bg-black/35 p-2 text-xs text-white/85">
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#F0D67C]">
                                  Dados lidos pela IA
                                </p>
                                <div className="space-y-0.5">
                                  {extractionFields.map((field) => (
                                    <p key={`${document.id}-${field.label}`}>
                                      <span className="text-white/55">{field.label}:</span> {field.value}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-white/50">
                                A IA não retornou dados estruturados para este arquivo.
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className={DARK_OUTLINE_BUTTON}
                                onClick={() => previewUploadedDocument(document)}
                              >
                                <Eye className="mr-1.5 h-4 w-4" />
                                Pré-visualizar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className={DARK_OUTLINE_BUTTON}
                                onClick={() => {
                                  void copyExtractedFromDocument(document);
                                }}
                                disabled={extractionFields.length === 0}
                              >
                                <Copy className="mr-1.5 h-4 w-4" />
                                Copiar dados
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-red-50"
                                onClick={() => removeAdesaoUploadedDocument(selectedAdesaoManageDocType, document.id)}
                              >
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {adesaoRequirements.map((requirement) => (
                    <div
                      key={requirement.id}
                      className={`rounded-lg border bg-black/20 p-2 ${
                        isMissingField(`beneficiarios-adesao-${requirement.id}`) ? PANEL_ERROR_CLASS : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-white/90">{requirement.label}</p>
                        <Badge
                          variant={getChecklistBadgeVariant(requirement.done, true)}
                          className={getChecklistBadgeClass(requirement.done, true)}
                        >
                          {requirement.done ? 'OK' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
                <Label className="text-white/80">Upload segmentado</Label>
                <Select value={selectedBeneficiaryId} onValueChange={setSelectedBeneficiaryId}>
                  <SelectTrigger className={DARK_SELECT_TRIGGER}>
                    <SelectValue placeholder="Selecione o beneficiário" />
                  </SelectTrigger>
                  <SelectContent className={DARK_SELECT_CONTENT}>
                    {beneficiaries.map((beneficiary, index) => (
                      <SelectItem className={DARK_SELECT_ITEM} key={beneficiary.id} value={beneficiary.id}>
                        {index + 1}. {beneficiaryDisplayNames.get(beneficiary.id) || formatRole(beneficiary.role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={
                    beneficiaryUploadOptions.some((option) => option.value === selectedBeneficiaryDocType)
                      ? selectedBeneficiaryDocType
                      : undefined
                  }
                  onValueChange={(value) => setSelectedBeneficiaryDocType(value as BeneficiaryDocumentType)}
                  disabled={!selectedBeneficiary || beneficiaryUploadOptions.length === 0}
                >
                  <SelectTrigger className={DARK_SELECT_TRIGGER}>
                    <SelectValue placeholder="Sem pendências para upload" />
                  </SelectTrigger>
                  <SelectContent className={DARK_SELECT_CONTENT}>
                    {beneficiaryUploadOptions.map((option) => (
                      <SelectItem className={DARK_SELECT_ITEM} key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  disabled={!selectedBeneficiary || isProcessing || beneficiaryUploadOptions.length === 0}
                  onClick={() => {
                    if (!selectedBeneficiary) return;
                    if (!beneficiaryUploadOptions.some((option) => option.value === selectedBeneficiaryDocType)) {
                      return;
                    }
                    triggerUpload({
                      scope: 'beneficiario',
                      beneficiaryId: selectedBeneficiary.id,
                      docType: selectedBeneficiaryDocType,
                    });
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar documentos do beneficiário
                </Button>
                {selectedBeneficiary &&
                  beneficiaryUploadOptions.some((option) => option.value === selectedBeneficiaryDocType) &&
                  renderInlineUploadProgress({
                    scope: 'beneficiario',
                    beneficiaryId: selectedBeneficiary.id,
                    docType: selectedBeneficiaryDocType,
                  })}
                {beneficiaryUploadOptions.length === 0 && (
                  <p className="text-xs text-green-200/80">
                    Beneficiário sem pendências de upload.
                  </p>
                )}

                <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      Anexos enviados do beneficiário
                    </p>
                    <Badge variant="info">{selectedBeneficiaryDocs.length} arquivo(s)</Badge>
                  </div>

                  {beneficiaryManageDocOptions.length > 0 && (
                    <Select
                      value={selectedBeneficiaryManageDocType}
                      onValueChange={(value) => setSelectedBeneficiaryManageDocType(value as BeneficiaryDocumentType)}
                    >
                      <SelectTrigger className={DARK_SELECT_TRIGGER}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={DARK_SELECT_CONTENT}>
                        {beneficiaryManageDocOptions.map((option) => (
                          <SelectItem className={DARK_SELECT_ITEM} key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedBeneficiaryDocs.length === 0 ? (
                    <p className="text-xs text-white/55">
                      Nenhum arquivo anexado para gerenciamento deste beneficiário.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedBeneficiaryDocs.map((document) => {
                        const extractionFields = getExtractionFields(document.extracted);
                        return (
                          <div
                            key={document.id}
                            className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm text-white/90">{document.fileName}</p>
                              <p className="text-xs text-white/55">
                                {formatFileSize(document.fileSize)} · {new Date(document.uploadedAt).toLocaleString('pt-BR')}
                              </p>
                            </div>

                            {extractionFields.length > 0 ? (
                              <div className="rounded-md border border-white/10 bg-black/35 p-2 text-xs text-white/85">
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#F0D67C]">
                                  Dados lidos pela IA
                                </p>
                                <div className="space-y-0.5">
                                  {extractionFields.map((field) => (
                                    <p key={`${document.id}-${field.label}`}>
                                      <span className="text-white/55">{field.label}:</span> {field.value}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-white/50">
                                A IA não retornou dados estruturados para este arquivo.
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className={DARK_OUTLINE_BUTTON}
                                onClick={() => previewUploadedDocument(document)}
                              >
                                <Eye className="mr-1.5 h-4 w-4" />
                                Pré-visualizar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className={DARK_OUTLINE_BUTTON}
                                onClick={() => {
                                  void copyExtractedFromDocument(document);
                                }}
                                disabled={extractionFields.length === 0}
                              >
                                <Copy className="mr-1.5 h-4 w-4" />
                                Copiar dados
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-red-50"
                                onClick={() => {
                                  if (!selectedBeneficiary) return;
                                  removeBeneficiaryUploadedDocument(
                                    selectedBeneficiary.id,
                                    selectedBeneficiaryManageDocType,
                                    document.id,
                                  );
                                }}
                              >
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                <p className="font-medium text-white">Como funciona a validação inteligente</p>
                <p className="mt-1">1. Nome, idade e estado civil são obrigatórios por beneficiário.</p>
                <p>2. Casado/união estável exige anexo de comprovação conjugal.</p>
                <p>3. Selfie é opcional e não bloqueia a conclusão do checklist.</p>
                <p>4. Cada upload fica vinculado ao beneficiário selecionado.</p>
                <p>5. Você pode selecionar e enviar vários arquivos de uma vez.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {beneficiaries.map((beneficiary, index) => {
                const requirements = beneficiaryRequirementsMap.get(beneficiary.id) || [];
                const requiredTotal = requirements.filter((item) => item.required).length;
                const requiredDone = requirements.filter((item) => item.required && item.done).length;
                const beneficiaryMissingRequired = requirements.some(
                  (item) => item.required && isMissingField(item.id),
                );
                const beneficiaryDocEntries = (
                  Object.entries(beneficiary.documentos) as Array<[BeneficiaryDocumentType, UploadedDocument[] | undefined]>
                ).filter(([, docs]) => hasUploadedDocs(docs));
                const beneficiaryDocsCount = beneficiaryDocEntries.reduce((total, [, docs]) => total + (docs?.length || 0), 0);
                const beneficiaryDocsExpanded = expandedBeneficiaryDocPanels[beneficiary.id] ?? false;

                return (
                  <div
                    key={beneficiary.id}
                    className={`rounded-xl border bg-black/20 p-4 ${
                      beneficiaryMissingRequired ? PANEL_ERROR_CLASS : 'border-white/10'
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-[#D4AF37]" />
                        <p className="text-sm font-semibold text-white">
                          Beneficiário {index + 1} · {formatRole(beneficiary.role)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={requiredDone === requiredTotal ? 'success' : 'warning'}
                          className={requiredDone === requiredTotal ? CHECKLIST_BADGE_DONE : CHECKLIST_BADGE_PENDING}
                        >
                          {requiredDone}/{requiredTotal}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 px-2 text-xs text-white/80 hover:bg-white/10 hover:text-white"
                          onClick={() => toggleBeneficiaryDocPanel(beneficiary.id)}
                        >
                          {beneficiaryDocsExpanded ? 'Ocultar anexos' : 'Expandir anexos'}
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${beneficiaryDocsExpanded ? 'rotate-180' : ''}`}
                          />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <div className="space-y-1">
                        <Label className="text-white/70">Nome</Label>
                        <Input
                          className={`${DARK_INPUT} ${isMissingField(`${beneficiary.id}-nome`) ? FIELD_ERROR_CLASS : ''}`}
                          value={beneficiary.nome}
                          onChange={(event) => updateBeneficiary(beneficiary.id, 'nome', event.target.value)}
                          placeholder="Nome completo"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-white/70">Idade</Label>
                        <Input
                          className={`${DARK_INPUT} ${isMissingField(`${beneficiary.id}-idade`) ? FIELD_ERROR_CLASS : ''}`}
                          type="number"
                          min={0}
                          max={120}
                          value={beneficiary.idade}
                          onChange={(event) => updateBeneficiary(beneficiary.id, 'idade', event.target.value)}
                          placeholder="Idade"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-white/70">Estado civil</Label>
                        <Select
                          value={beneficiary.estadoCivil}
                          onValueChange={(value) => updateBeneficiary(beneficiary.id, 'estadoCivil', value as CivilStatus)}
                        >
                          <SelectTrigger
                            className={`${DARK_SELECT_TRIGGER} ${isMissingField(`${beneficiary.id}-estado-civil`) ? FIELD_ERROR_CLASS : ''}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={DARK_SELECT_CONTENT}>
                            {CIVIL_STATUS_OPTIONS.map((status) => (
                              <SelectItem className={DARK_SELECT_ITEM} key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {(beneficiary.estadoCivil === 'casado' || beneficiary.estadoCivil === 'uniao_estavel') && (
                        <div className="space-y-1">
                          <Label className="text-white/70">Prova marital</Label>
                          <Select
                            value={beneficiary.comprovacaoConjugal}
                            onValueChange={(value) =>
                              updateBeneficiary(beneficiary.id, 'comprovacaoConjugal', value as MarriageProofMode)
                            }
                          >
                            <SelectTrigger className={DARK_SELECT_TRIGGER}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={DARK_SELECT_CONTENT}>
                              <SelectItem className={DARK_SELECT_ITEM} value="certidao">Certidão</SelectItem>
                              <SelectItem className={DARK_SELECT_ITEM} value="declaracao">Declaração</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-[11px] text-[#F0D67C]/90">
                            Anexe o documento correspondente no upload segmentado deste beneficiário.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
                      <div className="space-y-1">
                        <Label className="text-white/70">CPF</Label>
                        <Input
                          className={DARK_INPUT}
                          value={beneficiary.cpf}
                          onChange={(event) => updateBeneficiary(beneficiary.id, 'cpf', formatCpfInput(event.target.value))}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70">RG</Label>
                        <Input
                          className={DARK_INPUT}
                          value={beneficiary.rg}
                          onChange={(event) => updateBeneficiary(beneficiary.id, 'rg', formatRgInput(event.target.value))}
                          placeholder="RG"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70">Data de nascimento</Label>
                        <Input
                          className={DARK_INPUT}
                          value={beneficiary.dataNascimento}
                          onChange={(event) => {
                            const formattedDate = formatDateInput(event.target.value);
                            updateBeneficiary(beneficiary.id, 'dataNascimento', formattedDate);
                            if (!beneficiary.idade) {
                              const inferredAge = inferAgeFromBirthDate(formattedDate);
                              if (inferredAge) {
                                updateBeneficiary(beneficiary.id, 'idade', inferredAge);
                              }
                            }
                          }}
                          placeholder="DD/MM/AAAA"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70">E-mail</Label>
                        <Input
                          className={DARK_INPUT}
                          value={beneficiary.email}
                          onChange={(event) =>
                            updateBeneficiary(beneficiary.id, 'email', normalizeEmailInput(event.target.value))
                          }
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70">Telefone</Label>
                        <Input
                          className={DARK_INPUT}
                          value={beneficiary.telefone}
                          onChange={(event) =>
                            updateBeneficiary(beneficiary.id, 'telefone', formatPhoneInput(event.target.value))
                          }
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                      {requirements.map((requirement) => (
                        <div
                          key={requirement.id}
                          className={`rounded-lg border bg-black/30 px-3 py-2 ${
                            isMissingField(requirement.id) ? PANEL_ERROR_CLASS : 'border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-white/90">{requirement.label}</p>
                            <Badge
                              variant={getChecklistBadgeVariant(requirement.done, requirement.required)}
                              className={getChecklistBadgeClass(requirement.done, requirement.required)}
                            >
                              {requirement.done ? 'OK' : requirement.required ? 'Pendente' : 'Opcional'}
                            </Badge>
                          </div>
                          {requirement.helper && <p className="mt-1 text-xs text-white/50">{requirement.helper}</p>}
                        </div>
                      ))}
                    </div>

                    {beneficiaryDocsExpanded && (
                      <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">Anexos deste beneficiário</p>
                          <Badge variant="info">{beneficiaryDocsCount} arquivo(s)</Badge>
                        </div>

                        {beneficiaryDocEntries.length === 0 ? (
                          <p className="text-xs text-white/55">
                            Nenhum documento anexado para este beneficiário ainda.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {beneficiaryDocEntries.map(([docType, docs]) => (
                              <div key={`${beneficiary.id}-${docType}`} className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-white/90">{BENEFICIARY_DOC_LABELS[docType]}</p>
                                  <Badge variant="outline" className={CHECKLIST_BADGE_OPTIONAL}>
                                    {(docs || []).length} arquivo(s)
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  {(docs || []).map((document) => {
                                    const extractionFields = getExtractionFields(document.extracted);

                                    return (
                                      <div
                                        key={document.id}
                                        className="flex flex-col gap-2 rounded-md border border-white/10 bg-black/35 px-3 py-2"
                                      >
                                        <div className="min-w-0">
                                          <p className="truncate text-sm text-white/90">{document.fileName}</p>
                                          <p className="text-xs text-white/55">
                                            {formatFileSize(document.fileSize)} · {new Date(document.uploadedAt).toLocaleString('pt-BR')}
                                          </p>
                                        </div>

                                        {extractionFields.length > 0 ? (
                                          <div className="rounded-md border border-white/10 bg-black/35 p-2 text-xs text-white/85">
                                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#F0D67C]">
                                              Dados lidos pela IA
                                            </p>
                                            <div className="space-y-0.5">
                                              {extractionFields.map((field) => (
                                                <p key={`${document.id}-${field.label}`}>
                                                  <span className="text-white/55">{field.label}:</span> {field.value}
                                                </p>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-xs text-white/50">
                                            A IA não retornou dados estruturados para este arquivo.
                                          </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className={DARK_OUTLINE_BUTTON}
                                            onClick={() => previewUploadedDocument(document)}
                                          >
                                            <Eye className="mr-1.5 h-4 w-4" />
                                            Abrir
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className={DARK_OUTLINE_BUTTON}
                                            onClick={() => {
                                              void copyExtractedFromDocument(document);
                                            }}
                                            disabled={extractionFields.length === 0}
                                          >
                                            <Copy className="mr-1.5 h-4 w-4" />
                                            Copiar dados
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-red-50"
                                            onClick={() => removeBeneficiaryUploadedDocument(beneficiary.id, docType, document.id)}
                                          >
                                            <Trash2 className="mr-1.5 h-4 w-4" />
                                            Remover
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentStep.id === 'resumo' && (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/80">
                <p><span className="text-white/50">Modalidade:</span> {category ? CATEGORY_LABELS[category] : '—'}</p>
                <p><span className="text-white/50">Vidas:</span> {totalLivesNumber}</p>
                {category === 'pessoa_juridica' && (
                  <p>
                    <span className="text-white/50">Sócios/Funcionários/Dependentes:</span>{' '}
                    {partnerCountNumber}/{employeeCountNumber}/{dependentsCountNumber}
                  </p>
                )}
                {category === 'pessoa_juridica' && (
                  <p><span className="text-white/50">Endereço da empresa:</span> {companyAddress || '—'}</p>
                )}
                <p><span className="text-white/50">Contato principal:</span> {primaryEmail || '—'} · {primaryPhone || '—'}</p>
                <p><span className="text-white/50">Responsável CRM:</span> {assignedCorretorLabel}</p>
                <p><span className="text-white/50">Documentos processados:</span> {extractedSummary.totalDocuments}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/80">
                <p><span className="text-white/50">Operadora identificada:</span> {extractedSummary.operator || '—'}</p>
                <p><span className="text-white/50">Tipo de plano:</span> {extractedSummary.planType || '—'}</p>
                <p>
                  <span className="text-white/50">Valor atual:</span>{' '}
                  {extractedSummary.currentValue != null
                    ? `R$ ${extractedSummary.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : '—'}
                </p>
                <p>
                  <span className="text-white/50">Confiança média:</span>{' '}
                  {extractedSummary.averageConfidence != null
                    ? `${extractedSummary.averageConfidence.toFixed(1)}%`
                    : '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Pendências atuais</p>
              {buildMissingChecklist().length === 0 ? (
                <Alert className="border-green-500/30 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-100">
                    Checklist completo. Proposta pronta para salvar no CRM.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-100">
                  {buildMissingChecklist().slice(0, 8).map((item) => (
                    <p key={item}>• {item}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void saveProposal()}
                disabled={isSaving || buildMissingChecklist().length > 0 || allUploadedDocuments.length === 0}
                className="bg-[#D4AF37] text-white hover:bg-[#E8C25B]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando proposta...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Salvar proposta no CRM
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resetFlow}
                disabled={isSaving || isProcessing}
                className={DARK_OUTLINE_BUTTON}
              >
                <Upload className="mr-2 h-4 w-4" />
                Reiniciar fluxo
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={FILE_INPUT_ACCEPT}
          onChange={(event) => {
            void handleFileInput(event);
          }}
          className="hidden"
        />

        <input
          ref={scanFullInputRef}
          type="file"
          multiple
          accept={FILE_INPUT_ACCEPT}
          onChange={(event) => {
            void handleScanFullInput(event);
          }}
          className="hidden"
        />

        <Dialog
          open={Boolean(previewDialogDocument)}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewDialogDocument(null);
              setPreviewRenderFailed(false);
            }
          }}
        >
          <DialogContent
            className="max-h-[90vh] w-[96vw] max-w-[1100px] overflow-hidden border-white/15 bg-[#0a0a0a] p-0 text-white"
            showCloseButton
          >
            <DialogHeader className="border-b border-white/10 px-4 py-3">
              <DialogTitle className="truncate text-sm text-white">
                {previewDialogDocument?.fileName || 'Pré-visualização'}
              </DialogTitle>
              {previewDialogDocument && (
                <p className="text-xs text-white/55">
                  {previewDialogDocument.requirementLabel} · {formatFileSize(previewDialogDocument.fileSize)}
                </p>
              )}
            </DialogHeader>

            <div className="flex h-[68vh] items-center justify-center bg-black px-3 py-3">
              {previewDialogDocument &&
              isPreviewableDocument(previewDialogDocument) &&
              !previewRenderFailed ? (
                isImagePreviewDocument(previewDialogDocument) ? (
                  <img
                    src={previewDialogDocument.previewUrl || undefined}
                    alt={previewDialogDocument.fileName}
                    className="h-full w-full rounded-md border border-white/10 bg-black object-contain"
                    onError={() => {
                      setPreviewRenderFailed(true);
                    }}
                  />
                ) : (
                  <iframe
                    title={`preview-${previewDialogDocument.id}`}
                    src={previewDialogDocument.previewUrl || undefined}
                    className="h-full w-full rounded-md border border-white/10 bg-black"
                    onError={() => {
                      setPreviewRenderFailed(true);
                    }}
                  />
                )
              ) : (
                <div className="space-y-2 text-center">
                  <p className="text-sm text-white/80">
                    {previewRenderFailed
                      ? 'Falha ao renderizar este arquivo no navegador.'
                      : 'Pré-visualização não disponível para este formato.'}
                  </p>
                  <p className="text-xs text-white/55">Use o botão abaixo para baixar e abrir localmente.</p>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-white/10 px-4 py-3 sm:justify-between">
              <p className="text-xs text-white/55">
                {previewDialogDocument ? new Date(previewDialogDocument.uploadedAt).toLocaleString('pt-BR') : ''}
              </p>
              <Button
                type="button"
                variant="outline"
                className={DARK_OUTLINE_BUTTON}
                onClick={() => downloadUploadedDocument(previewDialogDocument)}
                disabled={!previewDialogDocument}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar arquivo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={goPreviousStep}
            disabled={currentStepIndex === 0}
            className={DARK_OUTLINE_BUTTON}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Button
            type="button"
            onClick={goNextStep}
            disabled={currentStepIndex >= visibleSteps.length - 1}
          >
            Avançar
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
