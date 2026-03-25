-- Invoice management schema
-- Phase 4: Invoicing & Dashboard per PRD-01 Section 6.2
-- Includes: invoices table, invoice_number_sequences, auto-number trigger, pg_cron overdue scanner, storage bucket

-- Invoices table
create table invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  load_id uuid references loads(id) on delete set null,
  invoice_number text not null,
  bill_to_company text not null,
  bill_to_email text,
  bill_to_address text,
  amount numeric(10,2) not null,
  fuel_surcharge numeric(10,2) not null default 0,
  accessorials numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'draft',
  issued_date date,
  due_date date,
  paid_date date,
  paid_amount numeric(10,2),
  payment_method text,
  notes text,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table invoices enable row level security;

create policy "org_invoices" on invoices
  for all using (org_id = (select auth.org_id()));

-- Indexes for common queries
create index idx_invoices_org_id on invoices(org_id);
create index idx_invoices_status on invoices(status);
create index idx_invoices_load_id on invoices(load_id);

-- Invoice number sequences (per org, per month)
create table invoice_number_sequences (
  org_id uuid not null references organizations(id) on delete cascade,
  year_month text not null,
  last_number integer not null default 0,
  primary key (org_id, year_month)
);

alter table invoice_number_sequences enable row level security;

create policy "invoice_number_sequences_org_access" on invoice_number_sequences
  for all using (org_id = (select auth.org_id()));

grant select on invoice_number_sequences to authenticated;

-- Invoice number auto-generation trigger
-- Format: INV-YYYYMM-NNNN (e.g., INV-202601-0001)
create or replace function public.generate_invoice_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _year_month text;
  _next_number integer;
begin
  -- Get current year-month
  _year_month := to_char(now(), 'YYYYMM');

  -- Atomic increment: insert or update sequence
  insert into public.invoice_number_sequences (org_id, year_month, last_number)
  values (new.org_id, _year_month, 1)
  on conflict (org_id, year_month)
  do update set last_number = public.invoice_number_sequences.last_number + 1
  returning last_number into _next_number;

  -- Set invoice_number if not already provided
  if new.invoice_number is null or new.invoice_number = '' then
    new.invoice_number := 'INV-' || _year_month || '-' || lpad(_next_number::text, 4, '0');
  end if;

  return new;
end;
$$;

create trigger trg_generate_invoice_number
  before insert on public.invoices
  for each row execute function public.generate_invoice_number();

-- pg_cron: scan for overdue invoices daily at 8am UTC
-- Transitions 'sent' invoices past due_date to 'overdue'
create extension if not exists pg_cron;

select cron.schedule(
  'overdue-invoice-scanner',
  '0 8 * * *',
  $$UPDATE public.invoices SET status = 'overdue', updated_at = now() WHERE status = 'sent' AND due_date < CURRENT_DATE;$$
);

-- Storage bucket for invoice PDF documents
insert into storage.buckets (id, name, public)
values ('invoice-documents', 'invoice-documents', false)
on conflict (id) do nothing;

-- Storage RLS: org_id folder scoping (matches load-documents pattern)
create policy "invoice_documents_org_access" on storage.objects
  for all using (
    bucket_id = 'invoice-documents'
    and (select auth.org_id())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'invoice-documents'
    and (select auth.org_id())::text = (storage.foldername(name))[1]
  );
