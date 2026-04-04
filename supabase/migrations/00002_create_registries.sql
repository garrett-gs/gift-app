-- Create registries table
create table public.registries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  occasion text,
  occasion_date date,
  is_public boolean not null default false,
  cover_image_url text,
  slug text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index registries_owner_id_idx on public.registries(owner_id);
create index registries_slug_idx on public.registries(slug);

-- Enable RLS
alter table public.registries enable row level security;

-- Policies
create policy "Owners can do everything with their registries"
  on public.registries for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Subscribers can view registries"
  on public.registries for select
  to authenticated
  using (
    exists (
      select 1 from public.subscriptions s
      where s.registry_id = registries.id
        and s.subscriber_id = auth.uid()
    )
  );

create policy "Public registries are viewable by anyone"
  on public.registries for select
  to authenticated
  using (is_public = true);

-- Auto-update updated_at
create trigger registries_updated_at
  before update on public.registries
  for each row execute function public.update_updated_at();
