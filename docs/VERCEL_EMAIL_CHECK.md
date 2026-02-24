# Verificar envio de emails na Vercel

Se os emails de lead (comercial e cliente) pararam de chegar, siga estes passos.

## 0. Vercel via CLI (opcional)

Para listar variáveis de ambiente e logs direto no terminal:

1. **Novo token:** em [vercel.com/account/tokens](https://vercel.com/account/tokens) crie um token.
2. **Use o token:**
   ```bash
   cd frontend
   VERCEL_TOKEN=seu_token_aqui npx vercel env ls
   ```
   Isso lista as variáveis (nomes apenas). Para puxar as de produção para um arquivo local (sem commitar):
   ```bash
   VERCEL_TOKEN=seu_token_aqui npx vercel env pull .env.vercel --environment=production
   ```
   Depois confira se `RESEND_API_KEY` existe em `.env.vercel`.
3. **Logs em tempo real:** no dashboard Vercel → seu projeto → **Logs** (ou **Deployments** → último deploy → **Functions**). Ao enviar um lead, procure por:
   - `Email comercial não enviado` / `reason: ...` → motivo (ex.: API key não configurada).
   - `Email ao cliente não enviado` / `reason: ...`
   - `Email comercial enviado` / `Email ao cliente enviado` → envio ok.

## 1. Teste rápido na produção

Abra no navegador (troque pelo seu domínio):

- **Health (todos os serviços):**  
  `https://SEU-PROJETO.vercel.app/api/health`  
  Veja o campo `services.resend`: deve ser `healthy`. Se for `unconfigured`, a variável `RESEND_API_KEY` não está definida nesse ambiente.

- **Só email (diagnóstico):**  
  `https://SEU-PROJETO.vercel.app/api/email-check`  
  A resposta diz se a Resend está configurada e se a key está válida.

## 2. O que conferir na Vercel

1. **Variáveis de ambiente**
   - Acesse: **Vercel** → seu projeto → **Settings** → **Environment Variables**.
   - Confirme que existe:
     - `RESEND_API_KEY` (key da API Resend).
   - Confirme o **ambiente**: marque **Production** (e **Preview** se usar deploys de preview).
   - Se você alterar qualquer variável, é necessário **Redeploy** para aplicar.

2. **Redeploy após mudar env**
   - **Deployments** → ⋮ no último deployment → **Redeploy** (ou faça um novo deploy por git push).

3. **Resend (dashboard Resend.com)**
   - Domínio do “From” verificado (ex.: `noreply@humanosaude.com.br`).
   - Key da API ativa (não revogada, limite não estourado).

## 3. Destinatários do email “novo lead” (comercial)

Por padrão o email vai para `comercial@humanosaude.com.br` (e CC em código). Para mudar sem alterar código:

- `RESEND_ADMIN_EMAILS`: lista de emails separados por vírgula (para:).
- `RESEND_CC_EMAILS`: lista de emails em cópia (opcional).

Exemplo na Vercel:

- `RESEND_ADMIN_EMAILS` = `comercial@humanosaude.com.br,outro@empresa.com`
- `RESEND_CC_EMAILS` = `contato@empresa.com`

## 4. Testar envio após corrigir

1. Ajuste as variáveis na Vercel e faça **Redeploy**.
2. Abra de novo `https://SEU-PROJETO.vercel.app/api/email-check` e confira se `ok: true`.
3. Envie um lead de teste pelo formulário do site e verifique:
   - Email na caixa da equipe (comercial).
   - Email de confirmação na caixa do cliente (se o lead tiver email válido e não for “parcial”).

Se `email-check` estiver ok e ainda não receber, veja em **Vercel → Deployments → Functions** os logs da rota `POST /api/leads` para erros de envio.
