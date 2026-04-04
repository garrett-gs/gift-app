-- Create subscriptions table
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.profiles(id) on delete cascade,
  registry_id uuid not null references public.registries(id) on delete cascade,
  role text not null default 'viewer',
  created_at timestamptz not null default now(),
  unique(subscriber_id, registry_id)
);

-- Indexes
create index subscriptions_subscriber_id_idx on public.subscriptions(subscriber_id);
create index subscriptions_registry_id_idx on public.subscriptions(registry_id);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Policies
create policy "Subscribers can view their own subscriptions"
  on public.subscriptions for select
  to authenticated
  using (subscriber_id = auth.uid());

create policy "Registry owners can view their subscribers"
  on public.subscriptions for select
  to authenticated
  using (
    exists (
      select 1 from public.registries r
      where r.id = subscriptions.registry_id
        and r.owner_id = auth.uid()
    )
  );

create policy "Users can unsubscribe themselves"
  on public.subscriptions for delete
  to authenticated
  using (subscriber_id = auth.uid());

create policy "Registry owners can remove subscribers"
  on public.subscriptions for delete
  to authenticated
  using (
    exists (
      select 1 from public.registries r
      where r.id = subscriptions.registry_id
        and r.owner_id = auth.uid()
    )
  );

-- Allow insertion via the accept_invitation function (security definer)
-- Direct inserts are not allowed through client
