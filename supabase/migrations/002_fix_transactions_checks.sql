-- ============================================================
-- CoupleFinances — Migração 002
-- Corrige check constraints antigos da tabela transactions.
--
-- Problema: a tabela original (v1) foi criada com checks inline
-- (ex.: person in ('me','partner')). O Postgres auto-nomeia esses
-- checks com os MESMOS nomes que a migração 001 usa, então a 001
-- pulou a recriação ("if not exists") e os checks velhos ficaram —
-- rejeitando todo insert novo com person = 'person1'/'person2'.
--
-- Esta migração remove TODOS os checks de transactions e recria o
-- conjunto correto. Idempotente: pode rodar mais de uma vez.
-- ============================================================

-- 1. Diagnóstico (aparece em "Results" ao rodar): checks atuais
select conname, pg_get_constraintdef(oid) as definicao
from pg_constraint
where conrelid = 'public.transactions'::regclass and contype = 'c';

-- 2. Remove todos os check constraints da tabela
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.transactions'::regclass and contype = 'c'
  loop
    execute format('alter table public.transactions drop constraint %I', c.conname);
  end loop;
end $$;

-- 3. Garante que não sobrou dado no formato antigo
update public.transactions set person = 'person1' where person = 'me';
update public.transactions set person = 'person2' where person = 'partner';

-- 4. Recria o conjunto correto (NOT VALID: vale para dados novos
--    sem travar caso exista alguma linha antiga fora do padrão)
alter table public.transactions
  add constraint transactions_amount_check
  check (amount > 0 and amount <= 100000000) not valid;

alter table public.transactions
  add constraint transactions_type_check
  check (type in ('income', 'expense')) not valid;

alter table public.transactions
  add constraint transactions_person_check
  check (person in ('person1', 'person2')) not valid;

alter table public.transactions
  add constraint transactions_description_check
  check (char_length(description) between 1 and 120) not valid;

alter table public.transactions
  add constraint transactions_notes_check
  check (notes is null or char_length(notes) <= 500) not valid;

alter table public.transactions
  add constraint transactions_category_check
  check (char_length(category) between 1 and 40) not valid;
