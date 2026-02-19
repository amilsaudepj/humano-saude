# 🔐 Permissões e Funções (Roles)

Sistema de controle de acesso do Portal Administrativo Humano Saúde.

## 📋 Funções Disponíveis

### 1. 🔴 **Administrador** (`administrador`)

**Acesso Total ao Sistema**

Pode realizar TODAS as operações em TODOS os módulos:
- ✅ Gerenciar corretores (criar, editar, suspender, excluir)
- ✅ Gerenciar solicitações de novos corretores
- ✅ Gerenciar convites
- ✅ Visualizar e editar TODAS as propostas
- ✅ Configurar comissões e tabelas de preços
- ✅ Acessar módulo de Social Flow e Meta Ads
- ✅ Configurar automações e regras
- ✅ Acessar Analytics e relatórios completos
- ✅ Gerenciar usuários e permissões

---

### 2. 🟡 **Assistente** (`assistente`)

**Acesso Somente Leitura (Read-Only)**

Pode VISUALIZAR e BAIXAR, mas NÃO pode EDITAR ou CRIAR:
- ✅ Visualizar propostas de TODOS os corretores
- ✅ Baixar documentos e relatórios
- ✅ Visualizar dados de clientes e adesões
- ❌ NÃO pode editar propostas
- ❌ NÃO pode criar novos registros
- ❌ NÃO pode excluir ou suspender
- ❌ NÃO tem acesso ao módulo de corretores
- ❌ NÃO tem acesso ao módulo de configurações

**Casos de Uso:**
- Operador de backoffice que consulta status de propostas
- Suporte que precisa verificar informações para atender clientes
- Analista que gera relatórios sem poder modificar dados

---

### 3. 🔵 **Gestor de Tráfego** (`gestor_trafego`)

**Acesso Limitado a Marketing e Ads**

Tem acesso APENAS aos módulos delegados pelo administrador:
- ✅ Social Flow (gerenciamento de funil de conversão)
- ✅ Meta Ads (campanhas do Facebook/Instagram)
- ✅ Análise de performance de campanhas
- ⚠️ Pode editar campanhas apenas se delegado pelo admin
- ❌ NÃO tem acesso a propostas
- ❌ NÃO tem acesso ao módulo de corretores
- ❌ NÃO tem acesso a dados financeiros
- ❌ NÃO pode aprovar solicitações

**Casos de Uso:**
- Profissional focado em tráfego pago (Meta Ads)
- Analista de marketing digital
- Especialista em funil de vendas (Social Flow)

---

### 4. 🟣 **Corretor** (`corretor`)

**Acesso Padrão de Vendas**

Mantém as permissões atuais do sistema:
- ✅ Criar cotações e propostas
- ✅ Visualizar e editar APENAS suas próprias propostas
- ✅ Fazer upload de documentos de adesão
- ✅ Acompanhar comissões e produções
- ✅ Gerenciar seus próprios leads
- ❌ NÃO vê propostas de outros corretores
- ❌ NÃO tem acesso ao portal administrativo
- ❌ NÃO pode editar tabelas de preços

**Casos de Uso:**
- Corretor de seguros padrão
- Representante comercial autônomo

---

## 🔄 Mudanças Implementadas

### ❌ Removido
- `supervisor` (role antiga, substituída por `administrador`)
- `admin` (unificado em `administrador`)

### ✅ Adicionado
- `administrador` (acesso total)
- `assistente` (somente leitura)
- `gestor_trafego` (marketing e ads)

### 🔧 Mantido
- `corretor` (vendas padrão)

---

## 🗂️ Hierarquia de Permissões

```
Administrador
    ├── Acesso Total
    └── Pode delegar permissões ao Gestor de Tráfego

Assistente
    ├── Visualiza tudo
    └── Não edita nada

Gestor de Tráfego
    ├── Social Flow (se delegado)
    ├── Meta Ads (se delegado)
    └── Sem acesso a propostas

Corretor
    └── Apenas suas próprias propostas
```

---

## 🚀 Próximos Passos (Implementação Backend)

### 1. Middleware de Autenticação

Criar função para validar permissões em cada rota:

```typescript
// middleware/auth.ts
export function requireRole(allowedRoles: string[]) {
  return async (req, res, next) => {
    const { role } = req.user;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
}
```

### 2. Row Level Security (RLS) no Supabase

Atualizar políticas para cada tabela:

```sql
-- Exemplo: Assistente só visualiza, não edita
CREATE POLICY "Assistente pode ver propostas"
ON propostas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM corretores
    WHERE corretores.id = auth.uid()
    AND corretores.role = 'assistente'
  )
);

CREATE POLICY "Assistente NÃO pode editar"
ON propostas FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM corretores
    WHERE corretores.id = auth.uid()
    AND corretores.role != 'assistente'
  )
);
```

### 3. Frontend: Controle de UI

Componente para ocultar botões baseado em role:

```typescript
// components/PermissionGuard.tsx
export function PermissionGuard({ 
  allowedRoles, 
  children 
}: { 
  allowedRoles: string[], 
  children: React.ReactNode 
}) {
  const { user } = useAuth();
  if (!allowedRoles.includes(user.role)) return null;
  return <>{children}</>;
}

// Uso:
<PermissionGuard allowedRoles={['administrador']}>
  <button>Excluir Corretor</button>
</PermissionGuard>
```

---

## 📝 Observações Importantes

1. **Soft Delete:** Ao "excluir" um corretor, apenas `ativo = false` (não apaga do banco)
2. **Histórico:** Preserva vínculos com propostas, comissões e produções
3. **Delegação:** Gestor de Tráfego precisa de configuração adicional para ter permissões específicas
4. **Auditoria:** Recomenda-se criar tabela de logs de acesso para compliance

---

## 🔗 Arquivos Relacionados

- `/frontend/app/actions/corretores.ts` - Server Actions com validações
- `/frontend/app/portal-interno-hks-2026/corretores/painel/page.tsx` - Interface CRUD
- `/database/migrations/` - Schemas do Supabase (RLS)
