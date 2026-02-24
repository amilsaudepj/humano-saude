# Migrations necessárias para afiliados e indicações

Para o programa de afiliados, cadastro completo e login do afiliado funcionarem, execute as migrations na ordem:

1. **20260224_corretor_afiliados.sql**  
   Cria a tabela `corretor_afiliados` e adiciona `afiliado_id` em `leads_indicacao`.

2. **20260227_afiliados_cadastro_login.sql**  
   Estende `corretor_afiliados` com:
   - `cpf`, `doc_anexo_url`, dados bancários (`banco_nome`, `banco_agencia`, `banco_conta`, `banco_tipo`, `pix`)
   - `termo_aceito`, `termo_assinado_em`, `cadastro_completo`
   - `indicado_por_afiliado_id`, `indicado_por_corretor_id`
   - `password_hash` (login do afiliado)  
   E adiciona em `solicitacoes_corretor`:
   - `indicado_por_corretor_id` (quem indicou o novo corretor)

**Como rodar (Supabase / psql):**

```bash
# Na pasta database/migrations, na ordem:
psql $DATABASE_URL -f 20260224_corretor_afiliados.sql
psql $DATABASE_URL -f 20260227_afiliados_cadastro_login.sql
```

Ou pelo Supabase Dashboard: SQL Editor e colar o conteúdo de cada arquivo na ordem acima.

---

**Corretor para afiliados/leads sem vínculo**

Leads e afiliados cadastrados “sem vínculo” (landing seja afiliado, indicação sem vínculo) são atribuídos ao corretor **Helcio Duarte Mattos** (e-mail: `helciodmtt@gmail.com`). O sistema localiza esse corretor por e-mail ou pelo slug `helcio-mattos`. Garanta que exista um registro em `corretores` com esse e-mail (ou slug) para que a atribuição funcione.
