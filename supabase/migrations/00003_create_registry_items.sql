-- Create registry_items table
create table public.registry_items (
  id uuid primary key default gen_random_uuid(),
  registry_id uuid not null references public.registries(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2),
  currency text not null default 'USD',
  url text,
  image_url text,
  priority smallint not null default 3 check (priority between 1 and 5),
  notes text,
  quantity_desired integer not null default 1,
  quantity_purchased integer not null default 0,
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index registry_items_registry_id_idx on public.registry_items(registry_id);
create index registry_items_registry_active_idx on public.registry_items(registry_id, is_archived);

-- Enable RLS
alter table public.registry_items enable row level security;

-- Policies: access mirrors the parent registry
create policy "Registry owners can manage their items"
  on public.registry_items for all
  to authenticated
  using (
    exists (
      select 1 from public.registries r
      where r.id = registry_items.registry_id
        and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.registries r
      where r.id = registry_items.registry_id
        and r.owner_id = auth.uid()
    )
  );

create policy "Subscribers can view registry items"
  on public.registry_items for select
  to authenticated
  using (
    exists (
      select 1 from public.subscriptions s
      where s.registry_id = registry_items.registry_id
        and s.subscriber_id = auth.uid()
    )
  );

create policy "Public registry items are viewable"
  on public.registry_items for select
  to authenticated
  using (
    exists (
      select 1 from public.registries r
      where r.id = registry_items.registry_id
        and r.is_public = true
    )
  );

-- Auto-update updated_at
create trigger registry_items_updated_at
  before update on public.registry_items
  for each row execute function public.update_updated_at();
