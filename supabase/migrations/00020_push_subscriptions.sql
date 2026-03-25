-- Push subscriptions and notification preferences
-- Phase 6: Web Push API support for multi-device notifications

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  endpoint text not null,
  keys_p256dh text not null,
  keys_auth text not null,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

alter table push_subscriptions enable row level security;

-- Users can manage their own subscriptions
create policy "push_subscriptions_own_access" on push_subscriptions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index idx_push_subscriptions_user on push_subscriptions(user_id);
create index idx_push_subscriptions_org on push_subscriptions(org_id);

-- Add notification preferences to profiles
alter table profiles add column if not exists
  notification_preferences jsonb default '{
    "new_dispatch": true,
    "load_status_change": true,
    "critical_alert": true,
    "invoice_paid": true,
    "driver_response": true
  }'::jsonb;
