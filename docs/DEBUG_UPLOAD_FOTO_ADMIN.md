# 🐛 Debug: Upload de Foto Admin

## Problema Relatado
Erro ao fazer upload de foto no perfil do admin em `/portal-interno-hks-2026/perfil`.

## Solução Aplicada
Replicamos a lógica **idêntica** do painel do corretor que funciona corretamente.

---

## 📋 Checklist de Verificação

### 1. Bucket de Storage
- [ ] Verificar se o bucket `documentos` existe no Supabase
- [ ] Confirmar que o bucket está configurado como **público**
- [ ] Verificar políticas RLS do bucket

**Como verificar:**
```sql
-- Executar no Supabase SQL Editor
SELECT * FROM storage.buckets WHERE id = 'documentos';
```

**Deve retornar:**
```
id: documentos
name: documentos
public: true
```

### 2. Políticas RLS do Bucket
Execute no Supabase SQL Editor:

```sql
-- Ver políticas do bucket
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

**Políticas necessárias:**
1. Leitura pública (SELECT para anonymous e authenticated)
2. Upload para autenticados (INSERT para authenticated)
3. Atualização para service role (UPDATE)
4. Exclusão para service role (DELETE)

### 3. Service Role Key
Verifique se está configurada no `.env.local`:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Tabela integration_settings
Verifique se a tabela existe:

```sql
SELECT * FROM integration_settings WHERE integration_name = 'admin_profile';
```

Se não existir, crie:

```sql
CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT UNIQUE NOT NULL,
  encrypted_credentials JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔍 Como Identificar o Erro Exato

### Abrir DevTools Console
1. Abra o navegador em: http://localhost:3000/portal-interno-hks-2026/perfil
2. Pressione **F12** (DevTools)
3. Vá na aba **Console**
4. Tente fazer upload de uma foto
5. Observe as mensagens de erro

### Verificar Network Tab
1. DevTools → Aba **Network**
2. Tente fazer upload
3. Procure a requisição `POST /api/admin/foto`
4. Clique nela e veja:
   - **Status Code:** Deve ser 200
   - **Response:** O que está retornando

### Verificar Logs do Terminal
No terminal onde está rodando `npm run dev`, procure por:

```
[admin foto upload] ...
[admin foto update] ...
```

---

## 🧪 Teste Manual

### Testar Upload Direto via cURL

```bash
curl -X POST http://localhost:3000/api/admin/foto \
  -F "foto=@/path/to/imagem.jpg" \
  -H "Content-Type: multipart/form-data"
```

**Resposta esperada:**
```json
{
  "success": true,
  "foto_url": "https://xxx.supabase.co/storage/v1/object/public/documentos/admin/foto_1234567890.jpg"
}
```

### Testar Acesso ao Bucket

Tente acessar diretamente uma imagem já existente:
```
https://[seu-projeto].supabase.co/storage/v1/object/public/documentos/corretores/[id]/foto_xxx.jpg
```

Se não carregar, o bucket não está público.

---

## 🔧 Soluções Comuns

### Erro: "Bucket not found"
**Solução:** Criar o bucket no Supabase Dashboard
1. Storage → New bucket
2. Nome: `documentos`
3. ✅ Public bucket
4. Create

### Erro: "Row Level Security policy"
**Solução:** Executar SQL das políticas RLS:

```sql
-- Permitir leitura pública
CREATE POLICY "Leitura pública de documentos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documentos');

-- Permitir upload service role
CREATE POLICY "Upload via service role"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'documentos');

-- Permitir atualização service role
CREATE POLICY "Update via service role"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'documentos');
```

### Erro: "File size too large"
**Solução:** O arquivo tem mais de 5MB. Reduzir tamanho ou aumentar limite no código.

### Erro: "integration_settings does not exist"
**Solução:** Criar a tabela (SQL acima) no Supabase.

---

## 📊 Comparação: Corretor vs Admin

| Item | Corretor | Admin |
|------|----------|-------|
| **API Route** | `/api/corretor/foto` | `/api/admin/foto` |
| **Bucket** | `documentos` | `documentos` ✅ |
| **Path** | `corretores/{id}/foto_xxx.jpg` | `admin/foto_xxx.jpg` |
| **Salva em** | `corretores.foto_url` | `integration_settings.config.foto_url` |
| **Autenticação** | JWT Token (corretor_id) | Service Role Key |

---

## 🎯 Próximos Passos

1. **Abra o DevTools** e tente fazer upload
2. **Copie o erro exato** da console ou network tab
3. **Me envie** a mensagem de erro completa
4. Verificarei qual dos pontos acima está faltando

---

## 💡 Teste Rápido

Execute este comando no Supabase SQL Editor:

```sql
-- Teste completo de configuração
SELECT 
  'Bucket existe?' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documentos') 
    THEN '✅ SIM' 
    ELSE '❌ NÃO - CRIAR BUCKET' 
  END as status
UNION ALL
SELECT 
  'Bucket é público?',
  CASE WHEN (SELECT public FROM storage.buckets WHERE id = 'documentos') 
    THEN '✅ SIM' 
    ELSE '❌ NÃO - TORNAR PÚBLICO' 
  END
UNION ALL
SELECT 
  'Tabela integration_settings existe?',
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'integration_settings') 
    THEN '✅ SIM' 
    ELSE '❌ NÃO - CRIAR TABELA' 
  END
UNION ALL
SELECT 
  'Service Role Key configurada?',
  CASE WHEN current_setting('request.jwt.claim.role', true) = 'service_role'
    THEN '✅ SIM'
    ELSE '⚠️ NÃO DETECTADA (pode estar ok no backend)'
  END;
```

Copie o resultado e me envie! 🚀
