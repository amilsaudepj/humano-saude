"""
DTOs para extração de dados de PDF
"""
from pydantic import BaseModel
from typing import List, Optional


class PDFExtraidoDTO(BaseModel):
    """DTO para dados extraídos de PDF"""
    idades: List[int]
    operadora: Optional[str] = None
    valor_atual: Optional[float] = None
    tipo_plano: Optional[str] = None
    nome_beneficiarios: List[str] = []
    nome_completo: Optional[str] = None
    cpf: Optional[str] = None
    rg: Optional[str] = None
    ifp: Optional[str] = None
    documento_identificacao_tipo: Optional[str] = None
    data_nascimento: Optional[str] = None
    data_expedicao: Optional[str] = None
    orgao_expedidor: Optional[str] = None
    numero_habilitacao: Optional[str] = None
    cnpj: Optional[str] = None
    razao_social: Optional[str] = None
    inscricao_estadual: Optional[str] = None
    data_abertura: Optional[str] = None
    status_cnpj: Optional[str] = None
    data_inicio_atividade: Optional[str] = None
    nome_fantasia: Optional[str] = None
    socios_detectados: List[str] = []
    total_socios: Optional[int] = None
    observacoes: Optional[str] = None
    confianca: str = "alta"
    texto_extraido_preview: Optional[str] = None
    total_caracteres: int = 0
    
    class Config:
        json_schema_extra = {
            "example": {
                "idades": [30, 5, 35],
                "operadora": "AMIL",
                "valor_atual": 1250.50,
                "tipo_plano": "ADESAO",
                "nome_beneficiarios": ["João Silva", "Maria Silva", "Pedro Silva"],
                "nome_completo": "João da Silva",
                "cpf": "12345678909",
                "rg": "123456789",
                "ifp": None,
                "documento_identificacao_tipo": "rg",
                "data_nascimento": "10/03/1989",
                "data_expedicao": "15/04/2019",
                "orgao_expedidor": "SSP-RJ",
                "numero_habilitacao": None,
                "cnpj": "50216907000160",
                "razao_social": "Empresa Exemplo LTDA",
                "inscricao_estadual": "123456789.00-00",
                "data_abertura": "18/07/2014",
                "status_cnpj": "ATIVA",
                "data_inicio_atividade": "18/07/2014",
                "nome_fantasia": "Empresa Exemplo",
                "socios_detectados": ["João Silva", "Maria Silva"],
                "total_socios": 2,
                "observacoes": "Plano com cobertura nacional",
                "confianca": "alta",
                "texto_extraido_preview": "PROPOSTA DE ADESÃO...",
                "total_caracteres": 2500
            }
        }
