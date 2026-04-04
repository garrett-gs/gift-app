-- Create purchases table
-- THIS IS THE MOST CRITICAL TABLE FOR SURPRISE PRESERVATION
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.registry_items(id) on delete cascade,
  purchaser_id uuid not null references public.profiles(id) on delete cascade,
  quantity integer not null default 1,
  is_purchased boolean not null default true,
  notes text,
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(item_id, purchaser_id)
);

-- Indexes
create index purchases_item_id_idx on public.purchases(item_id);
create index purchases_purchaser_id_idx on public.purchases(purchaser_id);

-- Enable RLS
alter table public.purchases enable row level security;

-- CRITICAL POLICY: Registry owners CANNOT see purchases on their own registries.
-- This is the primary enforcement layer for surprise preservation.
create policy "Purchasers and subscribers (NOT owners) can view purchases"
  on public.purchases for select
  to authenticated
  using (
    -- The purchaser can always see their own purchases
    purchaser_id = auth.uid()
    or
    -- Subscribers can see purchases, BUT the registry owner is excluded
    exists (
      select 1 from public.registry_items ri
      join public.registries r on r.id = ri.registry_id
      join public.subscriptions s on s.registry_id = r.id
      where ri.id = purchases.item_id
        and s.subscriber_id = auth.uid()
        and r.owner_id != auth.uid()  -- OWNER EXCLUSION
    )
  );

create policy "Authenticated subscribers can mark purchases"
  on public.purchases for insert
  to authenticated
  with check (
    purchaser_id = auth.uid()
    and exists (
      select 1 from public.registry_items ri
      join public.registries r on r.id = ri.registry_id
      join public.subscriptions s on s.registry_id = r.id
      where ri.id = purchases.item_id
        and s.subscriber_id = auth.uid()
        and r.owner_id != auth.uid()  -- Can't buy from your own registry
    )
  );

create policy "Purchasers can update their own purchases"
  on public.purchases for update
  to authenticated
  using (purchaser_id = auth.uid())
  with check (purchaser_id = auth.uid());

create policy "Purchasers can delete their own purchases"
  on public.purchases for delete
  to authenticated
  using (purchaser_id = auth.uid());

-- Trigger to update quantity_purchased on registry_items
create or replace function public.update_item_quantity_purchased()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if (tg_op = 'INSERT') then
    update public.registry_items
    set quantity_purchased = quantity_purchased + new.quantity
    where id = new.item_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.registry_items
    set quantity_purchased = greatest(0, quantity_purchased - old.quantity)
    where id = old.item_id;
    return old;
  elsif (tg_op = 'UPDATE') then
    update public.registry_items
    set quantity_purchased = greatest(0, quantity_purchased - old.quantity + new.quantity)
    where id = new.item_id;
    return new;
  end if;
end;
$$;

create trigger purchases_quantity_sync
  after insert or update or delete on public.purchases
  for each row execute function public.update_item_quantity_purchased();
