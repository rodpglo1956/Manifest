-- Load number auto-generation trigger
-- Format: ORG-PREFIX-SEQUENCE (e.g., ACM-000001)
-- Uses INSERT ... ON CONFLICT for atomic sequence increment

-- Sequence tracking table
create table load_number_sequences (
  org_id uuid primary key references organizations(id) on delete cascade,
  last_number integer not null default 0
);

alter table load_number_sequences enable row level security;

-- RLS: org_id isolation
create policy "load_number_sequences_org_access" on load_number_sequences
  for all using (org_id = (select auth.org_id()));

-- Trigger function to auto-generate load numbers
create or replace function public.generate_load_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _org_name text;
  _prefix text;
  _next_number integer;
begin
  -- Get org name for prefix
  select name into _org_name
  from public.organizations
  where id = new.org_id;

  -- Create prefix from first 3 chars of org name (uppercase)
  _prefix := upper(left(regexp_replace(_org_name, '[^a-zA-Z0-9]', '', 'g'), 3));

  -- Atomic increment: insert or update sequence
  insert into public.load_number_sequences (org_id, last_number)
  values (new.org_id, 1)
  on conflict (org_id)
  do update set last_number = public.load_number_sequences.last_number + 1
  returning last_number into _next_number;

  -- Set load_number if not already provided
  if new.load_number is null or new.load_number = '' then
    new.load_number := _prefix || '-' || lpad(_next_number::text, 6, '0');
  end if;

  return new;
end;
$$;

create trigger trg_generate_load_number
  before insert on public.loads
  for each row execute function public.generate_load_number();
