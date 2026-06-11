-- ============================================================
-- CoupleFinances — Migração 001
-- Casal com duas contas + RLS + constraints + novas tabelas
--
-- Execute este arquivo INTEIRO no SQL Editor do Supabase
-- (Dashboard → SQL Editor → New query → colar → Run).
-- É idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Função utilitária: código de convite
-- ------------------------------------------------------------
create or replace function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select upper(substr(md5(gen_random_uuid()::text), 1, 8));
$$;

-- ------------------------------------------------------------
-- 1. Tabela de casais (duas contas por casal)
--    person1_user_id = quem criou o espaço
--    person2_user_id = quem entrou pelo código de convite
-- ------------------------------------------------------------
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  person1_user_id uuid references auth.users(id) on delete set null,
  person2_user_id uuid references auth.users(id) on delete set null,
  invite_code text unique not null default public.generate_invite_code(),
  created_at timestamptz not null default now(),
  constraint couples_distinct_members
    check (person1_user_id is null or person1_user_id is distinct from person2_user_id)
);

-- Um usuário só pode ocupar um "slot" de casal
create unique index if not exists couples_person1_uidx
  on public.couples (person1_user_id) where person1_user_id is not null;
create unique index if not exists couples_person2_uidx
  on public.couples (person2_user_id) where person2_user_id is not null;

-- ------------------------------------------------------------
-- 2. Helper para RLS: o usuário logado é membro do casal?
--    SECURITY DEFINER para evitar recursão de policy.
-- ------------------------------------------------------------
create or replace function public.is_couple_member(c_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.couples
    where id = c_id
      and auth.uid() is not null
      and (person1_user_id = auth.uid() or person2_user_id = auth.uid())
  );
$$;

-- ------------------------------------------------------------
-- 3. Backfill: cria um casal para cada usuário existente
--    e adapta transactions / couple_profiles para couple_id
-- ------------------------------------------------------------
insert into public.couples (person1_user_id)
select u.id from auth.users u
where not exists (
  select 1 from public.couples c
  where c.person1_user_id = u.id or c.person2_user_id = u.id
);

-- transactions.couple_id
alter table public.transactions add column if not exists couple_id uuid references public.couples(id) on delete cascade;

update public.transactions t
set couple_id = c.id
from public.couples c
where t.couple_id is null and c.person1_user_id = t.user_id;

-- person: 'me'/'partner' → 'person1'/'person2'
update public.transactions set person = 'person1' where person = 'me';
update public.transactions set person = 'person2' where person = 'partner';

-- couple_profiles.couple_id
alter table public.couple_profiles add column if not exists couple_id uuid references public.couples(id) on delete cascade;

update public.couple_profiles p
set couple_id = c.id
from public.couples c
where p.couple_id is null and c.person1_user_id = p.user_id;

create unique index if not exists couple_profiles_couple_uidx
  on public.couple_profiles (couple_id);

-- user_id deixa de ser a chave de acesso (vira apenas "criado por")
alter table public.couple_profiles alter column user_id drop not null;

-- ------------------------------------------------------------
-- 4. Constraints de integridade (validação no banco)
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'transactions_amount_check') then
    alter table public.transactions
      add constraint transactions_amount_check
      check (amount > 0 and amount <= 100000000) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'transactions_type_check') then
    alter table public.transactions
      add constraint transactions_type_check
      check (type in ('income', 'expense')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'transactions_person_check') then
    alter table public.transactions
      add constraint transactions_person_check
      check (person in ('person1', 'person2')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'transactions_description_check') then
    alter table public.transactions
      add constraint transactions_description_check
      check (char_length(description) between 1 and 120) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'transactions_notes_check') then
    alter table public.transactions
      add constraint transactions_notes_check
      check (notes is null or char_length(notes) <= 500) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'transactions_category_check') then
    alter table public.transactions
      add constraint transactions_category_check
      check (char_length(category) between 1 and 40) not valid;
  end if;
end $$;

create index if not exists transactions_couple_date_idx
  on public.transactions (couple_id, date);

-- ------------------------------------------------------------
-- 5. Novas tabelas: orçamentos, metas e categorias customizadas
-- ------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  category text not null check (char_length(category) between 1 and 40),
  amount numeric not null check (amount > 0 and amount <= 100000000),
  created_at timestamptz not null default now(),
  unique (couple_id, category)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  emoji text not null default '🎯' check (char_length(emoji) <= 8),
  target_amount numeric not null check (target_amount > 0 and target_amount <= 1000000000),
  saved_amount numeric not null default 0 check (saved_amount >= 0),
  target_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_categories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  key text not null check (key ~ '^custom-[a-z0-9-]{1,30}$'),
  label text not null check (char_length(label) between 1 and 30),
  emoji text not null default '🏷️' check (char_length(emoji) <= 8),
  color text not null default '#94a3b8' check (color ~ '^#[0-9a-fA-F]{6}$'),
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now(),
  unique (couple_id, key)
);

-- ------------------------------------------------------------
-- 6. RLS — remove policies antigas e cria as definitivas
-- ------------------------------------------------------------
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('transactions', 'couple_profiles', 'couples', 'budgets', 'goals', 'custom_categories')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

alter table public.couples enable row level security;
alter table public.transactions enable row level security;
alter table public.couple_profiles enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.custom_categories enable row level security;

-- couples: membro vê o próprio casal; criação/entrada só via RPC
create policy couples_select on public.couples
  for select using (auth.uid() = person1_user_id or auth.uid() = person2_user_id);

-- transactions
create policy transactions_select on public.transactions
  for select using (public.is_couple_member(couple_id));
create policy transactions_insert on public.transactions
  for insert with check (public.is_couple_member(couple_id) and user_id = auth.uid());
create policy transactions_update on public.transactions
  for update using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
create policy transactions_delete on public.transactions
  for delete using (public.is_couple_member(couple_id));

-- couple_profiles
create policy couple_profiles_select on public.couple_profiles
  for select using (public.is_couple_member(couple_id));
create policy couple_profiles_insert on public.couple_profiles
  for insert with check (public.is_couple_member(couple_id));
create policy couple_profiles_update on public.couple_profiles
  for update using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
create policy couple_profiles_delete on public.couple_profiles
  for delete using (public.is_couple_member(couple_id));

-- budgets
create policy budgets_all on public.budgets
  for all using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- goals
create policy goals_all on public.goals
  for all using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- custom_categories
create policy custom_categories_all on public.custom_categories
  for all using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

-- ------------------------------------------------------------
-- 7. RPCs (SECURITY DEFINER)
-- ------------------------------------------------------------

-- Cria o espaço do casal (quem cria vira "pessoa 1")
create or replace function public.create_couple()
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare result public.couples;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if exists (
    select 1 from couples
    where person1_user_id = auth.uid() or person2_user_id = auth.uid()
  ) then
    raise exception 'Você já faz parte de um casal';
  end if;
  insert into couples (person1_user_id) values (auth.uid()) returning * into result;
  return result;
end $$;

-- Entra em um casal existente pelo código de convite
create or replace function public.join_couple(code text)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare result public.couples;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if exists (
    select 1 from couples
    where person1_user_id = auth.uid() or person2_user_id = auth.uid()
  ) then
    raise exception 'Você já faz parte de um casal';
  end if;

  update couples
  set person2_user_id = auth.uid()
  where invite_code = upper(trim(code))
    and person2_user_id is null
    and person1_user_id is not null
    and person1_user_id <> auth.uid()
  returning * into result;

  if result.id is null then
    -- tenta o slot 1 (casal cujo criador saiu)
    update couples
    set person1_user_id = auth.uid()
    where invite_code = upper(trim(code))
      and person1_user_id is null
      and person2_user_id is not null
      and person2_user_id <> auth.uid()
    returning * into result;
  end if;

  if result.id is null then
    raise exception 'Código de convite inválido ou já utilizado';
  end if;
  return result;
end $$;

-- Gera um novo código de convite (invalida o anterior)
create or replace function public.regenerate_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare new_code text;
begin
  update couples
  set invite_code = generate_invite_code()
  where person1_user_id = auth.uid() or person2_user_id = auth.uid()
  returning invite_code into new_code;
  if new_code is null then
    raise exception 'Você não faz parte de um casal';
  end if;
  return new_code;
end $$;

-- Exclui a própria conta.
-- Se houver parceiro(a), o casal e os dados continuam com ele(a);
-- se a pessoa estiver sozinha, o casal e todos os dados são apagados.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;

  -- libera o slot no casal (dados ficam com o parceiro, se existir)
  update couples set person1_user_id = null where person1_user_id = auth.uid();
  update couples set person2_user_id = null where person2_user_id = auth.uid();

  -- casal vazio → apaga tudo (cascade em transactions/profiles/budgets/goals/categorias)
  delete from couples where person1_user_id is null and person2_user_id is null;

  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.create_couple() from anon;
revoke execute on function public.join_couple(text) from anon;
revoke execute on function public.regenerate_invite_code() from anon;
revoke execute on function public.delete_my_account() from anon;

-- ------------------------------------------------------------
-- 8. Realtime: mudanças sincronizam entre os dois aparelhos
-- ------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.transactions;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.couple_profiles;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.budgets;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.goals;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.custom_categories;
  exception when duplicate_object then null;
  end;
end $$;
