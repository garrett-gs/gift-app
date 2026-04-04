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
