-- ============================================================================
-- GIFT App - Combined Initial Database Setup
-- Generated from migrations 00001 through 00007
-- ============================================================================


-- ============================================================================
-- Migration 00001: Create Profiles
-- ============================================================================

-- Create profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();


-- ============================================================================
-- Migration 00002: Create Registries
-- ============================================================================

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


-- ============================================================================
-- Migration 00003: Create Registry Items
-- ============================================================================

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


-- ============================================================================
-- Migration 00004: Create Purchases
-- ============================================================================

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


-- ============================================================================
-- Migration 00005: Create Subscriptions
-- ============================================================================

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


-- ============================================================================
-- Migration 00006: Create Invitations
-- ============================================================================

-- Create invitations table
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  registry_id uuid not null references public.registries(id) on delete cascade,
  invited_by uuid not null references public.profiles(id),
  invite_token text unique not null,
  invited_email text,
  role text not null default 'viewer',
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

-- Indexes
create index invitations_token_idx on public.invitations(invite_token);
create index invitations_registry_id_idx on public.invitations(registry_id);

-- Enable RLS
alter table public.invitations enable row level security;

-- Policies
create policy "Registry owners can manage invitations"
  on public.invitations for all
  to authenticated
  using (
    exists (
      select 1 from public.registries r
      where r.id = invitations.registry_id
        and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.registries r
      where r.id = invitations.registry_id
        and r.owner_id = auth.uid()
    )
  );

-- Anyone can read an invitation by token (needed for acceptance)
create policy "Invitations are readable by token"
  on public.invitations for select
  to authenticated
  using (true);

-- Function to accept an invitation
create or replace function public.accept_invitation(p_token text)
returns json
language plpgsql
security definer set search_path = ''
as $$
declare
  v_invitation record;
  v_subscription_id uuid;
begin
  -- Find the invitation
  select * into v_invitation
  from public.invitations
  where invite_token = p_token
    and accepted_at is null
    and expires_at > now();

  if not found then
    return json_build_object('success', false, 'error', 'Invalid or expired invitation');
  end if;

  -- Prevent self-subscription
  if exists (
    select 1 from public.registries r
    where r.id = v_invitation.registry_id
      and r.owner_id = auth.uid()
  ) then
    return json_build_object('success', false, 'error', 'Cannot subscribe to your own registry');
  end if;

  -- Create the subscription (ignore if already exists)
  insert into public.subscriptions (subscriber_id, registry_id, role)
  values (auth.uid(), v_invitation.registry_id, v_invitation.role)
  on conflict (subscriber_id, registry_id) do nothing
  returning id into v_subscription_id;

  -- Mark invitation as accepted
  update public.invitations
  set accepted_at = now()
  where id = v_invitation.id;

  return json_build_object(
    'success', true,
    'registry_id', v_invitation.registry_id
  );
end;
$$;


-- ============================================================================
-- Migration 00007: Create Notifications
-- ============================================================================

-- Create notifications table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes
create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_user_unread_idx on public.notifications(user_id, is_read);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can update their own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
