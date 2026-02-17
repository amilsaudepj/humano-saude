"""
Serviço de IA para extração inteligente de dados de documentos
Utiliza OpenAI GPT-4 para análise de documentos de planos de saúde
"""
import base64
import io
import json
import os
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, Optional

from dotenv import load_dotenv
from openai import OpenAI
from pypdf import PdfReader

# Carregar variáveis de ambiente
load_dotenv()


class AIService:
    """Serviço de IA para processamento de documentos"""

    IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff'}
    TEXT_EXTENSIONS = {'.txt', '.csv', '.json', '.xml', '.html', '.htm', '.md'}
    DOCX_EXTENSIONS = {'.docx'}

    def __init__(self):
        """Inicializa o cliente OpenAI"""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY não encontrada nas variáveis de ambiente")

        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"

    def extrair_texto_pdf(self, file_bytes: bytes) -> str:
        """
        Extrai texto de um arquivo PDF

        Args:
            file_bytes: Bytes do arquivo PDF

        Returns:
            str: Texto extraído do PDF
        """
        try:
            pdf_file = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_file)

            texto_completo = []
            for page in reader.pages:
                texto = page.extract_text()
                if texto:
                    texto_completo.append(texto)

            return "\n\n".join(texto_completo)

        except Exception as e:
            raise ValueError(f"Erro ao extrair texto do PDF: {str(e)}")

    def extrair_texto_docx(self, file_bytes: bytes) -> str:
        """
        Extrai texto de um arquivo DOCX

        Args:
            file_bytes: Bytes do arquivo DOCX

        Returns:
            str: Texto extraído do DOCX
        """
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as archive:
                xml_data = archive.read('word/document.xml')

            root = ET.fromstring(xml_data)
            namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

            paragraphs = []
            for paragraph in root.findall('.//w:p', namespace):
                runs = [
                    node.text for node in paragraph.findall('.//w:t', namespace) if node.text
                ]
                if runs:
                    paragraphs.append(''.join(runs))

            return '\n'.join(paragraphs)

        except Exception as e:
            raise ValueError(f"Erro ao extrair texto do DOCX: {str(e)}")

    def extrair_texto_documento_textual(self, file_bytes: bytes) -> str:
        """
        Extrai texto de documentos textuais simples

        Args:
            file_bytes: Bytes do arquivo textual

        Returns:
            str: Texto extraído do documento
        """
        for encoding in ('utf-8', 'latin-1'):
            try:
                return file_bytes.decode(encoding)
            except UnicodeDecodeError:
                continue

        raise ValueError("Não foi possível decodificar o arquivo textual")

    def analisar_documento_saude(self, texto_documento: str) -> Dict:
        """
        Analisa documento de plano de saúde usando OpenAI

        Args:
            texto_documento: Texto extraído do documento

        Returns:
            Dict: Dados estruturados extraídos
        """
        prompt = f"""
Você é um especialista em análise de documentos de planos de saúde.

Analise o documento abaixo e extraia as seguintes informações:
- **idades**: lista de idades dos beneficiários (números inteiros)
- **operadora**: nome da operadora de saúde (ex: AMIL, BRADESCO, SULAMERICA, UNIMED, etc)
- **valor_atual**: valor atual do plano (número decimal, sem símbolo de moeda)
- **tipo_plano**: tipo de plano se mencionado (ADESAO, PME, EMPRESARIAL ou null)
- **nome_beneficiarios**: lista com nomes dos beneficiários se disponíveis
- **nome_completo**: nome completo principal no documento
- **cpf**: CPF detectado (somente números quando possível)
- **rg**: RG detectado quando disponível
- **ifp**: número IFP quando o documento for IFP
- **documento_identificacao_tipo**: tipo do documento identificado (rg, cnh, ifp, outro ou null)
- **data_nascimento**: data de nascimento quando houver
- **data_expedicao**: data de expedição quando houver
- **orgao_expedidor**: órgão emissor quando houver (ex.: SSP-RJ, DETRAN)
- **numero_habilitacao**: número da habilitação quando for CNH
- **cnpj**: CNPJ da empresa (somente números quando possível)
- **razao_social**: razão social da empresa quando disponível
- **inscricao_estadual**: inscrição estadual da empresa quando disponível
- **data_abertura**: data de abertura da empresa quando disponível
- **status_cnpj**: status cadastral da empresa quando disponível
- **data_inicio_atividade**: data de início de atividade quando disponível
- **nome_fantasia**: nome fantasia quando disponível
- **socios_detectados**: lista com nomes dos sócios quando o documento for societário (contrato social/alteração contratual)
- **total_socios**: número de sócios identificados quando possível
- **observacoes**: qualquer informação relevante adicional

**IMPORTANTE:**
- Se não encontrar alguma informação, use null
- Para idades, extraia APENAS números
- Para operadora, use o nome em MAIÚSCULAS
- Para valor, use apenas números (ex: 1500.50)

Retorne APENAS um objeto JSON válido, sem texto adicional.

DOCUMENTO:
{texto_documento}

JSON:
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um assistente especializado em extrair dados estruturados de documentos de planos de saúde. Sempre retorne JSON válido."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )

            resposta_texto = response.choices[0].message.content
            dados_extraidos = json.loads(resposta_texto)

            return self._validar_dados_extraidos(dados_extraidos)

        except json.JSONDecodeError as e:
            raise ValueError(f"Erro ao parsear resposta da IA: {str(e)}")
        except Exception as e:
            raise ValueError(f"Erro ao analisar documento com IA: {str(e)}")

    def analisar_imagem_documento(self, file_bytes: bytes, content_type: Optional[str]) -> Dict:
        """
        Analisa imagem de documento usando capacidade visual do modelo

        Args:
            file_bytes: Bytes da imagem
            content_type: MIME type da imagem

        Returns:
            Dict: Dados estruturados extraídos
        """
        try:
            mime_type = content_type if content_type and content_type.startswith('image/') else 'image/jpeg'
            encoded = base64.b64encode(file_bytes).decode('utf-8')

            prompt = (
                "Analise esta imagem de um documento de plano de saúde e extraia um JSON com os campos: "
                "idades (lista de inteiros), operadora (string em maiúsculas), valor_atual (float), "
                "tipo_plano (ADESAO, PME, EMPRESARIAL ou null), nome_beneficiarios (lista de strings), "
                "nome_completo (string ou null), cpf (string numérica ou null), rg (string ou null), "
                "ifp (string ou null), documento_identificacao_tipo (rg|cnh|ifp|outro|null), "
                "data_nascimento (DD/MM/AAAA ou null), data_expedicao (DD/MM/AAAA ou null), "
                "orgao_expedidor (string ou null), numero_habilitacao (string numérica ou null), "
                "cnpj (string numérica ou null), razao_social (string ou null), "
                "inscricao_estadual (string ou null), data_abertura (DD/MM/AAAA ou null), "
                "status_cnpj (string ou null), data_inicio_atividade (DD/MM/AAAA ou null), "
                "nome_fantasia (string ou null), "
                "socios_detectados (lista de strings), total_socios (inteiro ou null), "
                "observacoes (string ou null). "
                "Se não encontrar um campo, retorne null ou lista vazia. "
                "Retorne APENAS JSON válido."
            )

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um assistente especializado em extrair dados de documentos de planos de saúde a partir de imagens. Sempre retorne JSON válido."
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime_type};base64,{encoded}"}
                            },
                        ],
                    },
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
            )

            resposta_texto = response.choices[0].message.content
            dados_extraidos = json.loads(resposta_texto)

            return self._validar_dados_extraidos(dados_extraidos)

        except json.JSONDecodeError as e:
            raise ValueError(f"Erro ao parsear resposta visual da IA: {str(e)}")
        except Exception as e:
            raise ValueError(f"Erro ao analisar imagem com IA: {str(e)}")

    def _validar_dados_extraidos(self, dados: Dict) -> Dict:
        """
        Valida e normaliza dados extraídos

        Args:
            dados: Dados brutos extraídos

        Returns:
            Dict: Dados validados e normalizados
        """
        resultado = {
            "idades": [],
            "operadora": None,
            "valor_atual": None,
            "tipo_plano": None,
            "nome_beneficiarios": [],
            "nome_completo": None,
            "cpf": None,
            "rg": None,
            "ifp": None,
            "documento_identificacao_tipo": None,
            "data_nascimento": None,
            "data_expedicao": None,
            "orgao_expedidor": None,
            "numero_habilitacao": None,
            "cnpj": None,
            "razao_social": None,
            "inscricao_estadual": None,
            "data_abertura": None,
            "status_cnpj": None,
            "data_inicio_atividade": None,
            "nome_fantasia": None,
            "socios_detectados": [],
            "total_socios": None,
            "observacoes": None,
            "confianca": "alta"
        }

        def normalizar_idade(valor: object) -> Optional[int]:
            if isinstance(valor, bool) or valor is None:
                return None

            idade_normalizada: Optional[int] = None

            if isinstance(valor, int):
                idade_normalizada = valor
            elif isinstance(valor, float):
                if valor.is_integer():
                    idade_normalizada = int(valor)
            elif isinstance(valor, str):
                texto = valor.strip()
                if not texto:
                    return None

                if texto.isdigit():
                    idade_normalizada = int(texto)
                else:
                    numero = None
                    try:
                        numero = float(texto.replace(",", "."))
                    except ValueError:
                        match = re.search(r"\b(\d{1,3})\b", texto)
                        if match:
                            numero = float(match.group(1))

                    if numero is not None and float(numero).is_integer():
                        idade_normalizada = int(numero)

            if idade_normalizada is None:
                return None

            if 0 <= idade_normalizada <= 120:
                return idade_normalizada

            return None

        if "idades" in dados and isinstance(dados["idades"], list):
            idades_normalizadas = [
                normalizar_idade(idade) for idade in dados["idades"]
            ]
            resultado["idades"] = [idade for idade in idades_normalizadas if idade is not None]

        if "operadora" in dados and dados["operadora"]:
            resultado["operadora"] = str(dados["operadora"]).upper().strip()

        if "valor_atual" in dados and dados["valor_atual"]:
            try:
                valor = float(str(dados["valor_atual"]).replace(",", "."))
                resultado["valor_atual"] = round(valor, 2)
            except (ValueError, TypeError):
                resultado["valor_atual"] = None

        if "tipo_plano" in dados and dados["tipo_plano"]:
            tipo = str(dados["tipo_plano"]).upper()
            if tipo in ["ADESAO", "PME", "EMPRESARIAL"]:
                resultado["tipo_plano"] = tipo

        if "nome_beneficiarios" in dados and isinstance(dados["nome_beneficiarios"], list):
            resultado["nome_beneficiarios"] = [
                str(nome).strip() for nome in dados["nome_beneficiarios"] if nome
            ]

        if "nome_completo" in dados and dados["nome_completo"]:
            resultado["nome_completo"] = str(dados["nome_completo"]).strip() or None

        if "cpf" in dados and dados["cpf"]:
            resultado["cpf"] = ''.join(ch for ch in str(dados["cpf"]) if ch.isdigit())[:11] or None

        rg_raw = (
            dados.get("rg")
            or dados.get("registro_geral")
            or dados.get("numero_rg")
            or dados.get("numero_registro_geral")
        )
        if rg_raw:
            resultado["rg"] = ''.join(ch for ch in str(rg_raw) if ch.isdigit()) or None

        if "ifp" in dados and dados["ifp"]:
            resultado["ifp"] = str(dados["ifp"]).strip() or None

        if "documento_identificacao_tipo" in dados and dados["documento_identificacao_tipo"]:
            tipo_doc = str(dados["documento_identificacao_tipo"]).strip().lower()
            if tipo_doc in ["rg", "cnh", "ifp", "outro"]:
                resultado["documento_identificacao_tipo"] = tipo_doc

        if "data_nascimento" in dados and dados["data_nascimento"]:
            resultado["data_nascimento"] = str(dados["data_nascimento"]).strip() or None

        if "data_expedicao" in dados and dados["data_expedicao"]:
            resultado["data_expedicao"] = str(dados["data_expedicao"]).strip() or None

        if "orgao_expedidor" in dados and dados["orgao_expedidor"]:
            resultado["orgao_expedidor"] = str(dados["orgao_expedidor"]).strip() or None

        if "numero_habilitacao" in dados and dados["numero_habilitacao"]:
            resultado["numero_habilitacao"] = ''.join(
                ch for ch in str(dados["numero_habilitacao"]) if ch.isdigit()
            ) or None

        if "cnpj" in dados and dados["cnpj"]:
            resultado["cnpj"] = ''.join(ch for ch in str(dados["cnpj"]) if ch.isdigit())[:14] or None

        if "razao_social" in dados and dados["razao_social"]:
            resultado["razao_social"] = str(dados["razao_social"]).strip() or None

        if "inscricao_estadual" in dados and dados["inscricao_estadual"]:
            resultado["inscricao_estadual"] = str(dados["inscricao_estadual"]).strip() or None

        if "data_abertura" in dados and dados["data_abertura"]:
            resultado["data_abertura"] = str(dados["data_abertura"]).strip() or None

        if "status_cnpj" in dados and dados["status_cnpj"]:
            resultado["status_cnpj"] = str(dados["status_cnpj"]).strip() or None

        if "data_inicio_atividade" in dados and dados["data_inicio_atividade"]:
            resultado["data_inicio_atividade"] = str(dados["data_inicio_atividade"]).strip() or None

        if "nome_fantasia" in dados and dados["nome_fantasia"]:
            resultado["nome_fantasia"] = str(dados["nome_fantasia"]).strip() or None

        if not resultado["documento_identificacao_tipo"]:
            if resultado["numero_habilitacao"]:
                resultado["documento_identificacao_tipo"] = "cnh"
            elif resultado["ifp"]:
                resultado["documento_identificacao_tipo"] = "ifp"
            elif resultado["rg"]:
                resultado["documento_identificacao_tipo"] = "rg"

        if "socios_detectados" in dados and isinstance(dados["socios_detectados"], list):
            resultado["socios_detectados"] = [
                str(nome).strip() for nome in dados["socios_detectados"] if nome
            ]

        if "total_socios" in dados and dados["total_socios"] is not None:
            try:
                total_socios = int(str(dados["total_socios"]).strip())
                if total_socios > 0:
                    resultado["total_socios"] = total_socios
            except (ValueError, TypeError):
                resultado["total_socios"] = None

        if resultado["total_socios"] is None and len(resultado["socios_detectados"]) > 0:
            resultado["total_socios"] = len(resultado["socios_detectados"])

        if "observacoes" in dados and dados["observacoes"]:
            resultado["observacoes"] = str(dados["observacoes"])

        return resultado

    async def processar_documento_completo(
        self,
        file_bytes: bytes,
        filename: Optional[str],
        content_type: Optional[str] = None,
    ) -> Dict:
        """
        Pipeline completo para documentos (PDF, imagem, texto e DOCX)

        Args:
            file_bytes: Bytes do arquivo
            filename: Nome do arquivo
            content_type: MIME type opcional

        Returns:
            Dict: Dados estruturados extraídos
        """
        ext = Path(filename or '').suffix.lower()

        # PDF
        if ext == '.pdf' or file_bytes.startswith(b'%PDF'):
            texto = self.extrair_texto_pdf(file_bytes)
            if not texto or len(texto.strip()) < 30:
                raise ValueError("Documento PDF vazio ou com pouco conteúdo para análise")

            dados = self.analisar_documento_saude(texto)
            dados["texto_extraido_preview"] = texto[:500] + "..." if len(texto) > 500 else texto
            dados["total_caracteres"] = len(texto)
            return dados

        # DOCX
        if ext in self.DOCX_EXTENSIONS:
            texto = self.extrair_texto_docx(file_bytes)
            if not texto or len(texto.strip()) < 30:
                raise ValueError("Documento DOCX vazio ou com pouco conteúdo para análise")

            dados = self.analisar_documento_saude(texto)
            dados["texto_extraido_preview"] = texto[:500] + "..." if len(texto) > 500 else texto
            dados["total_caracteres"] = len(texto)
            return dados

        # Texto simples
        if ext in self.TEXT_EXTENSIONS:
            texto = self.extrair_texto_documento_textual(file_bytes)
            if not texto or len(texto.strip()) < 30:
                raise ValueError("Documento textual vazio ou com pouco conteúdo para análise")

            dados = self.analisar_documento_saude(texto)
            dados["texto_extraido_preview"] = texto[:500] + "..." if len(texto) > 500 else texto
            dados["total_caracteres"] = len(texto)
            return dados

        # Imagens
        is_image = ext in self.IMAGE_EXTENSIONS or (
            content_type is not None and content_type.startswith('image/')
        )
        if is_image:
            dados = self.analisar_imagem_documento(file_bytes, content_type)
            dados["texto_extraido_preview"] = "Análise visual do documento em imagem"
            dados["total_caracteres"] = 0
            return dados

        raise ValueError(
            "Formato não suportado. Use PDF, imagem (PNG/JPG/JPEG/WEBP/BMP/TIFF), DOCX ou texto (TXT/CSV/JSON/XML/HTML/MD)."
        )

    async def processar_pdf_completo(self, file_bytes: bytes) -> Dict:
        """
        Compatibilidade com pipeline legado de PDF
        """
        return await self.processar_documento_completo(
            file_bytes=file_bytes,
            filename='documento.pdf',
            content_type='application/pdf',
        )


# Instância singleton do serviço
ai_service = AIService()
