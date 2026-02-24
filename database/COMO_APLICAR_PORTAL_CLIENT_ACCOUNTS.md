# Como corrigir: "Could not find the table 'public.portal_client_accounts'"

Esse erro aparece em **Clientes do Portal (Economizar)** quando a tabela de contas do portal ainda não existe no seu projeto Supabase.

## Passos (uma vez só)

1. Abra o **Supabase Dashboard** do projeto que a aplicação usa.
2. No menu lateral, vá em **SQL Editor**.
3. Clique em **New query**.
4. Copie **todo** o conteúdo do arquivo:
   - `database/migrations/20260217_create_portal_client_accounts.sql`
5. Cole no editor e clique em **Run** (ou Ctrl/Cmd+Enter).
6. Se aparecer erro de **foreign key** (ex.: tabela `insurance_leads` ou `corretores` não existe), use a migration alternativa que não exige essas tabelas: rode o conteúdo de `database/migrations/20260226_portal_client_accounts_standalone.sql` no SQL Editor.
7. Confirme que a execução terminou sem erro (mensagem verde).
8. (Opcional) Recarregue o cache do schema: **Settings** → **API** → **Reload schema cache** (ou aguarde alguns segundos).
9. Atualize a página **Clientes do Portal (Economizar)** no portal (F5). O erro deve sumir; a lista pode ficar vazia até existirem cadastros pela página /economizar.

## Observação

A tabela `portal_client_accounts` guarda os usuários criados pela página **/economizar**. Os dados só aparecem quando alguém se cadastra por lá (e o sistema grava nessa tabela).
