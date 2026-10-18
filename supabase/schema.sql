-- ═══════════════════════════════════════════════════════════════════
-- QuickCraft CRM — Schema Database Supabase (PostgreSQL)
-- Esegui questo file nell'SQL Editor di Supabase (o via CLI):
--   supabase db push   oppure   incolla nel SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- 1. Estensioni -----------------------------------------------------
create extension if not exists "pgcrypto";

-- 2. Profili utenti (artigiani) -------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  business_name text,
  owner_name text,
  vat_number text,            -- P.IVA (11 cifre, senza "IT")
  tax_id text,                -- Codice Fiscale
  address text,
  cap text,
  city text,
  province text,
  nation text default 'IT',
  pec text,
  iban text,
  tax_regime text default 'ordinario',   -- 'ordinario' | 'forfettario'
  withholding_tax numeric default 0,
  payment_link text,
  payment_link_label text,
  logo text,                  -- base64 o URL Storage
  default_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Clienti --------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  company text,
  phone text,
  email text,
  address text,
  cap text,
  city text,
  province text,
  nation text default 'IT',
  tax_id text,
  customer_type text default 'privato',  -- 'privato' | 'azienda' | 'pa'
  recipient_code text,                    -- codice destinatario (7 char)
  pec text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists clients_profile_idx on public.clients(profile_id);

-- 4. Preventivi / Fatture -------------------------------------------
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  number text,
  date date,
  due_date date,
  status text default 'Bozza',           -- Bozza/Inviato/Approvato/Saldato/Rifiutato
  items jsonb default '[]',
  discount numeric default 0,
  deposit_percent numeric default 0,
  deposit_amount numeric default 0,
  signature_data text,
  photos jsonb default '[]',
  notes text,
  invoice_number text,                   -- es. "1/2026"
  invoiced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists quotes_profile_idx on public.quotes(profile_id);

-- 5. Listino voci ----------------------------------------------------
create table if not exists public.pricebook (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  category text,
  description text not null,
  price numeric default 0,
  vat numeric default 22,
  created_at timestamptz default now()
);
create index if not exists pricebook_profile_idx on public.pricebook(profile_id);

-- 6. Agenda appuntamenti ---------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  title text,
  date date,
  time time,
  location text,
  status text default 'Programmato',
  notes text,
  created_at timestamptz default now()
);
create index if not exists appointments_profile_idx on public.appointments(profile_id);

-- 7. Piano / abbonamento ---------------------------------------------
create table if not exists public.subscriptions (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  tier text default 'free',              -- 'free' | 'pro'
  trial_ends_at timestamptz,
  pro_until timestamptz,
  referral_code text,
  referral_used boolean default false,
  checkout_customer_id text,             -- id cliente Paddle/Lemon
  updated_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════════
-- 8. Row Level Security (RLS) — multi-tenant
--    Ogni utente vede SOLO i propri dati.
-- ═══════════════════════════════════════════════════════════════════
alter table public.profiles      enable row level security;
alter table public.clients       enable row level security;
alter table public.quotes        enable row level security;
alter table public.pricebook     enable row level security;
alter table public.appointments  enable row level security;
alter table public.subscriptions enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own clients" on public.clients
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "own quotes" on public.quotes
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "own pricebook" on public.pricebook
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "own appointments" on public.appointments
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "own subscription" on public.subscriptions
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- 9. Trigger: creazione automatica profilo + abbonamento al signup
-- ═══════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.subscriptions (profile_id, referral_code)
  values (new.id, 'QUICK-' || upper(substr(md5(random()::text), 1, 6)))
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════
-- 10. Sincronizzazione dati utente (singolo blob JSON per utente)
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.user_data (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.user_data enable row level security;

create policy "own data" on public.user_data
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
