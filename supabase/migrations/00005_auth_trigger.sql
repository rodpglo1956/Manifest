-- Profile creation trigger on auth.users INSERT
-- Auto-creates a profiles row when a new user signs up
-- Handles both direct signup and invitation flow:
--   Direct signup: creates profile with full_name and default role
--   Invitation: creates profile with org_id and assigned role,
--               also inserts into org_members

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _org_id uuid;
  _role text;
begin
  -- Extract metadata (set during invitation flow via auth.admin.inviteUserByEmail)
  _org_id := (new.raw_user_meta_data ->> 'org_id')::uuid;
  _role := coalesce(new.raw_user_meta_data ->> 'role', 'viewer');

  -- Create profile record
  insert into public.profiles (id, full_name, role, org_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    _role,
    _org_id
  );

  -- If invited to an org, also create org_members record
  if _org_id is not null then
    insert into public.org_members (org_id, user_id, role)
    values (_org_id, new.id, _role);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
