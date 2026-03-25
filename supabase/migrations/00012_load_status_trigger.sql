-- Load status change trigger
-- Automatically logs status transitions to load_status_history
-- Fires on UPDATE OF status on loads table

create or replace function public.log_load_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only log when status actually changes
  if old.status is distinct from new.status then
    insert into public.load_status_history (load_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;

  return new;
end;
$$;

create trigger trg_log_load_status_change
  after update of status on public.loads
  for each row execute function public.log_load_status_change();
