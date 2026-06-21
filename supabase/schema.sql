-- ============================================================
-- Schéma "Candidatures Tracker"
-- À exécuter dans Supabase : SQL Editor > New query > Run
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Table principale : candidatures ----------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  poste text not null,
  entreprise text not null,
  lien text not null,
  type_emploi text not null default 'CDI',
  statut text not null default 'en_attente',
  numero_reference text,
  date_candidature date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint type_emploi_valide check (type_emploi in ('CDI','CDD','Stage','Alternance','Freelance','Intérim')),
  constraint statut_valide check (statut in ('en_attente','entretien','relance','refuse','accepte'))
);

create index if not exists applications_user_id_idx on public.applications(user_id);
create index if not exists applications_statut_idx on public.applications(statut);
create index if not exists applications_type_emploi_idx on public.applications(type_emploi);

-- ---------- Historique des changements de statut ----------
create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  ancien_statut text,
  nouveau_statut text not null,
  source text not null default 'manuel',
  email_extrait text,
  created_at timestamptz not null default now(),
  constraint source_valide check (source in ('manuel','email_auto'))
);

create index if not exists status_history_application_id_idx on public.status_history(application_id);

-- ---------- Connexion Gmail (un compte Google par utilisateur) ----------
create table if not exists public.email_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  google_email text not null,
  refresh_token text not null,
  last_sync_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- updated_at automatique ----------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
alter table public.applications enable row level security;
alter table public.status_history enable row level security;
alter table public.email_connections enable row level security;

drop policy if exists "applications_owner" on public.applications;
create policy "applications_owner" on public.applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "status_history_owner" on public.status_history;
create policy "status_history_owner" on public.status_history
  for all using (
    exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
  );

drop policy if exists "email_connections_owner" on public.email_connections;
create policy "email_connections_owner" on public.email_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Note : les routes /api/gmail/sync et /api/cron/sync-emails utilisent la
-- clé service_role côté serveur uniquement (jamais exposée au client), ce
-- qui leur permet de contourner la RLS pour mettre à jour les statuts
-- automatiquement depuis les emails.
