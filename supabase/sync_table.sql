-- ═══════════════════════════════════════════════════════════════════
-- QuickCraft CRM — Tabella Sincronizzazione Cloud
-- Un singolo blob JSON per utente (semplice e robusto).
-- Esegui questo file nell'SQL Editor di Supabase.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.user_data (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.user_data enable row level security;

create policy "own data" on public.user_data
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
