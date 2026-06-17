-- Habilita UUID
create extension if not exists "uuid-ossp";

-- ─── Perfis de usuário ────────────────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  has_access boolean default false,
  kiwify_order_id text,
  access_granted_at timestamptz,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Usuário vê só seu perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuário atualiza só seu perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- Cria perfil automaticamente ao registrar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Cache de jogos ───────────────────────────────────────────────────────────
create table public.fixtures_cache (
  fixture_id integer primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.fixtures_cache enable row level security;

create policy "Qualquer um lê jogos"
  on public.fixtures_cache for select
  using (true);

-- ─── Cache de análises ────────────────────────────────────────────────────────
create table public.analysis_cache (
  fixture_id integer primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table public.analysis_cache enable row level security;

create policy "Acesso autenticado às análises"
  on public.analysis_cache for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and has_access = true
    )
  );

-- ─── Log de webhooks Kiwify ───────────────────────────────────────────────────
create table public.kiwify_events (
  id uuid default uuid_generate_v4() primary key,
  event_type text,
  order_id text,
  customer_email text,
  payload jsonb,
  created_at timestamptz default now()
);

-- ─── Subscriptions de push notifications ─────────────────────────────────────
create table public.push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete set null,
  endpoint text unique not null,
  subscription jsonb not null,
  updated_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

-- Apenas o service role (backend) acessa essa tabela
create policy "Service role only"
  on public.push_subscriptions
  using (false)
  with check (false);
