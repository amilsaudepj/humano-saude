# 👥 Página de Usuários do Sistema

Painel administrativo para visualizar todos os usuários autenticados na plataforma Humano Saúde.

## 📍 Localização

**Sidebar:** Configurações → Usuários do Sistema

**URL:** `/portal-interno-hks-2026/usuarios`

**Badge:** 🔴 ADMIN (acesso restrito)

---

## ⚙️ Configuração Necessária

Para que a página exiba **TODOS os usuários** do Supabase Auth, você precisa configurar a **Service Role Key**.

### 1. Obter a Service Role Key

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings → API**
4. Copie a chave **`service_role` (secret)**

⚠️ **ATENÇÃO:** Esta chave tem **acesso total** ao banco. Nunca exponha no frontend!

### 2. Adicionar ao .env.local

No arquivo `/frontend/.env.local`, adicione:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Reiniciar o Servidor

```bash
cd frontend
npm run dev
```

---

## 🔄 Modo Fallback

Se a `SUPABASE_SERVICE_ROLE_KEY` **não estiver configurada**, a página exibe:

- ⚠️ **Alerta amarelo** informando a falta da configuração
- 📋 **Apenas corretores** cadastrados na tabela `corretores`
- 🔢 **Estatísticas limitadas** (sem total de usuários auth)

**Por quê?**  
A função `auth.admin.listUsers()` do Supabase requer a Service Role Key. Sem ela, não é possível acessar a lista completa de usuários autenticados.

---

## 📊 Funcionalidades

### Cards de Estatísticas
- **Total:** Todos os usuários cadastrados
- **Confirmados:** E-mails verificados
- **Não Confirmados:** E-mails pendentes
- **Com Corretor:** Usuários vinculados à tabela `corretores`
- **Sem Corretor:** Usuários sem vínculo
- **Últimos 7 Dias:** Cadastros recentes

### Filtros
- 🔍 **Busca:** Por e-mail ou nome
- ✅ **Status:** Confirmado / Não Confirmado
- 👤 **Corretor:** Com / Sem vínculo

### Modal de Detalhes
Ao clicar em "Ver", exibe:
- E-mail e telefone
- Status de confirmação (badge verde/amarelo)
- Dados do corretor vinculado (se houver)
- Role e status do corretor
- WhatsApp do corretor
- Data de criação e último acesso
- Método de autenticação (provider)
- ID do usuário (UUID)

---

## 🛠️ Estrutura Técnica

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `lib/sidebar-config.ts` | Movido de "Operações" para "Configurações" |
| `app/actions/usuarios.ts` | Adicionado fallback para carregar apenas corretores |
| `app/portal-interno-hks-2026/usuarios/page.tsx` | Adicionado alerta de configuração |

### Server Actions

**`getUsuarios()`**
- Busca `auth.users` via `supabase.auth.admin.listUsers()`
- Faz join com tabela `corretores` por e-mail
- Fallback: Se falhar, retorna apenas corretores

**`getUsuariosStats()`**
- Conta total, confirmados, não confirmados
- Conta usuários com/sem corretor vinculado
- Conta novos usuários nos últimos 7 dias

**`getUsuarioById(userId)`**
- Busca detalhes de um usuário específico
- Inclui dados do corretor (se houver)

---

## 🔐 Segurança

### Row Level Security (RLS)

Esta página usa **Server Actions**, executadas no **backend do Next.js**, onde a Service Role Key está segura.

❌ **Nunca** exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend (variáveis `NEXT_PUBLIC_*`)

✅ **Sempre** use Server Actions para operações admin

### Permissões Recomendadas

Apenas usuários com role `administrador` devem acessar esta página. Implemente controle de acesso:

```typescript
// middleware.ts ou no próprio componente
if (user.role !== 'administrador') {
  redirect('/portal-interno-hks-2026');
}
```

---

## 🐛 Troubleshooting

### "0 usuários encontrados"

**Possíveis causas:**

1. **Service Role Key não configurada**
   - Solução: Configure `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`

2. **Service Role Key incorreta**
   - Solução: Verifique se copiou a chave correta do Supabase Dashboard

3. **Nenhum usuário cadastrado**
   - Solução: Crie usuários de teste via Dashboard → Authentication → Users

4. **Tabela `corretores` vazia** (modo fallback)
   - Solução: Cadastre corretores pelo painel de solicitações

### Erro "Missing SUPABASE_SERVICE_ROLE_KEY"

Você verá um toast vermelho e um alerta amarelo na página.

**Solução:**
```bash
# 1. Edite .env.local
SUPABASE_SERVICE_ROLE_KEY=sua-chave-aqui

# 2. Reinicie o servidor
npm run dev
```

### Lista exibe apenas corretores

Isso significa que o modo **fallback** está ativo. A página busca apenas a tabela `corretores` em vez de `auth.users`.

**Para ver todos os usuários:** Configure a Service Role Key.

---

## 📈 Próximas Melhorias

- [ ] Adicionar filtro por role (admin, assistente, gestor_trafego, corretor)
- [ ] Permitir edição de roles direto na página
- [ ] Adicionar botão "Reenviar e-mail de confirmação"
- [ ] Adicionar botão "Suspender usuário"
- [ ] Exportar lista em CSV/Excel
- [ ] Adicionar gráfico de crescimento de usuários
- [ ] Integrar com sistema de permissões (RBAC)

---

## 📝 Observações

- A página **não altera dados**, apenas visualiza
- Para criar usuários, use o Supabase Dashboard ou API de signup
- Para editar corretores, use o [Painel de Corretores](/portal-interno-hks-2026/corretores/painel)
- Estatísticas são calculadas em tempo real (sem cache)

---

## 🔗 Links Relacionados

- [Documentação de Permissões](./PERMISSOES_ROLES.md)
- [Painel de Corretores](../frontend/app/portal-interno-hks-2026/corretores/painel/page.tsx)
- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-listusers)
