# Fluxo dos dados de leads → Dashboard Admin

Todos os formulários que capturam lead enviam para a **mesma API** e são gravados na **mesma tabela**, e aparecem no **mesmo dashboard admin**.

## Onde os dados são salvos

| Destino | Detalhe |
|--------|---------|
| **API** | `POST /api/leads` |
| **Tabela** | `insurance_leads` (Supabase) |
| **Dashboard** | Portal interno → **Leads** (`/portal-interno-hks-2026/leads`) |

## De onde vêm os leads (origem)

| Origem (`origem`) | Onde o usuário preenche | Rótulo no admin |
|-------------------|-------------------------|------------------|
| `calculadora` | Landing – seção **Simule seu plano** (CalculatorWizard) | Simule seu plano (Landing) |
| `email_form` | Página **Completar cotação** (`/completar-cotacao`) | Completar cotação |
| `calculadora_economia` | Página /economizar (calculadora de economia) | Calculadora Economia |
| `scanner_pdf` | Scanner inteligente (upload de fatura) | Scanner Inteligente |
| `manual` | Cadastro manual no admin (modal Novo Lead) | Manual |
| `site` / `landing` / `hero_form` | Formulários do topo/hero da landing | Site / Landing / Formulário hero |

## Campos enviados e exibidos no admin

- **Pessoais:** nome, e-mail, telefone/WhatsApp  
- **Empresa (quando aplicável):** CNPJ, **empresa** (nome/razão social)  
- **Plano:** acomodação, idades dos beneficiários, top 3 planos, etc.  
- **Metadados:** origem, status, UTM, IP, histórico  

No dashboard:

- **Listagem:** busca por nome, e-mail, WhatsApp, **empresa** ou CNPJ; coluna **Empresa**; filtro por **Origem** (inclui “Simule seu plano” e “Completar cotação”).
- **Detalhe (drawer):** ao abrir um lead, são exibidos CNPJ e Empresa na seção “Dados Pessoais” e a origem com o rótulo correto no cabeçalho.

## Resumo por página

1. **Landing – Simule seu plano**  
   Formulário em steps (CNPJ, acomodação, beneficiários, contato, etc.).  
   Envia `origem: 'calculadora'` e `empresa` (preenchido pela consulta de CNPJ ou digitado).  
   → `POST /api/leads` → `insurance_leads` → listagem e detalhe no admin.

2. **Completar cotação**  
   Formulário único (e-mail, CNPJ, empresa, vidas, etc.).  
   Envia `origem: 'email_form'` e `empresa`.  
   → `POST /api/leads` → `insurance_leads` → mesmo dashboard.

3. **Outros (economizar, scanner, manual, hero, etc.)**  
   Também usam `POST /api/leads` e gravam em `insurance_leads`; no admin aparecem com o rótulo de origem correspondente.

Assim, **todos os dados**, inclusive da nova página **Completar cotação** e da calculadora **Simule seu plano**, entram no **dashboard admin de leads** e podem ser filtrados por origem, empresa e CNPJ.
