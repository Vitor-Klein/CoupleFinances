# Configuração do Supabase — passos manuais obrigatórios

O app novo **não funciona** sem estes passos. Faça na ordem.

## 1. Rodar a migração SQL

1. Abra o [Dashboard do Supabase](https://supabase.com/dashboard) → seu projeto → **SQL Editor**.
2. Cole o conteúdo de `migrations/001_couples_rls_security.sql` e clique em **Run**.
3. Deve terminar sem erros ("Success. No rows returned").

O que ela faz:
- Cria a tabela `couples` (casal com **duas contas** + código de convite).
- Migra os dados existentes: cria um casal para cada usuário atual e converte `person` de `me/partner` para `person1/person2` — **nenhum dado é perdido**.
- Habilita **RLS** em todas as tabelas (sem isso, qualquer usuário autenticado leria/apagaria dados de todo mundo).
- Adiciona constraints de validação no banco (valor > 0, limites de tamanho, etc.).
- Cria as tabelas `budgets` (orçamentos), `goals` (metas) e `custom_categories`.
- Cria as RPCs `create_couple`, `join_couple`, `regenerate_invite_code` e `delete_my_account`.
- Adiciona as tabelas à publicação Realtime (sincronização instantânea entre os dois celulares).

> Observação: as constraints de `transactions` são criadas como `NOT VALID` — valem para dados novos sem travar a migração caso exista alguma linha antiga fora do padrão.

### 1b. Rodar a migração 002 (correção obrigatória)

Rode também `migrations/002_fix_transactions_checks.sql` no SQL Editor. A tabela `transactions` original tinha checks inline (ex.: `person in ('me','partner')`) com os mesmos nomes que a 001 usa — por isso a 001 não os substituiu e **todo insert de transação falhava**. A 002 remove os checks antigos e recria os corretos.

## 2. Habilitar Realtime (verificação)

Em **Database → Replication → supabase_realtime**, confirme que `transactions`, `couple_profiles`, `budgets`, `goals` e `custom_categories` estão na publicação (a migração já tenta adicionar).

## 3. Endurecer a autenticação

Em **Authentication → Providers → Email**:
- **Minimum password length**: 8
- **Leaked password protection**: ativado (bloqueia senhas que já vazaram — HaveIBeenPwned)

Em **Authentication → URL Configuration**:
- **Site URL**: a URL de produção do app
- **Redirect URLs**: adicione `https://SEU-DOMINIO/reset-password` e `http://localhost:5173/reset-password` (para o fluxo de "esqueci minha senha" funcionar)

Em **Authentication → Rate Limits**: confira que os limites padrão estão ativos.

## 4. Fluxo do casal no app

- A primeira pessoa cria a conta e escolhe **"Criar nosso espaço"** → recebe um código de convite (visível no Perfil).
- A segunda pessoa cria a própria conta e escolhe **"Tenho um código de convite"**.
- A partir daí os dois veem e editam os mesmos dados, em tempo real.
- Contas que já existiam viram automaticamente a "pessoa 1" de um casal — basta o(a) parceiro(a) entrar com o código.
