-- Funding data for the bike project.
-- Only the trusted server-side payment function may insert rows.
-- Never expose the Supabase service-role key in the website.

create table if not exists public.verified_contributions (
  id bigint generated always as identity primary key,
  provider_capture_id text not null unique,
  amount_cents integer not null check (amount_cents > 0 and amount_cents <= 174800),
  currency text not null default 'EUR' check (currency = 'EUR'),
  created_at timestamptz not null default now()
);

alter table public.verified_contributions enable row level security;

-- No direct table access for visitors or ordinary client sessions.
revoke all on table public.verified_contributions from anon, authenticated;

-- Public visitors can read only the aggregated total, never individual records.
create or replace function public.get_funding_total_cents()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(amount_cents), 0)::bigint
  from public.verified_contributions;
$$;

revoke all on function public.get_funding_total_cents() from public;
grant execute on function public.get_funding_total_cents() to anon, authenticated;
