# Como corrigir: "Could not find the table 'public.email_logs'"

Esse erro aparece no **EMAIL TRACKING** (Operações > E-mail) quando as tabelas de log de emails ainda não existem no seu projeto Supabase.

## Passos (uma vez só)

1. Abra o **Supabase Dashboard** do projeto que a aplicação usa.
2. No menu lateral, vá em **SQL Editor**.
3. Clique em **New query**.
4. Copie **todo** o conteúdo do arquivo:
   - `database/migrations/20260224_email_logs_public_schema.sql`
5. Cole no editor e clique em **Run** (ou Ctrl/Cmd+Enter).
6. Confirme que a execução terminou sem erro (mensagem verde).
7. Atualize a página **Operações > E-mail** no portal (F5). O banner de erro deve sumir; a lista pode continuar vazia até que algum email seja enviado pelo sistema (com tracking).

## Observação

Os números e o histórico só passam a aparecer quando emails forem enviados **pelo próprio sistema** (Resend via `sendTransactionalEmail`, CRM, reenvio pelo admin). Emails enviados só pelo painel do Resend ou por outros sistemas não entram na tabela `email_logs`.
