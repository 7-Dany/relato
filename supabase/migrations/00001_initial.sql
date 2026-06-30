-- Relato schema: diagrams + share links + profiles
-- Drop existing tables first (cascades policies, indexes, etc)
drop table if exists public.diagram_shares cascade;
drop table if exists public.diagrams cascade;

-- Users are managed by Supabase Auth. We store a lightweight profile.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Diagrams stored on the server (migrated from localStorage)
create table public.diagrams (
  id text primary key,                  -- matches existing DiagramId (branded string)
  title text not null default '',
  description text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diagrams enable row level security;

-- Share links (view-only or edit-capable)
create table public.diagram_shares (
  id uuid primary key default gen_random_uuid(),
  diagram_id text not null references public.diagrams(id) on delete cascade,
  token text not null unique,            -- the URL-safe share token
  permission text not null check (permission in ('view', 'edit')),
  created_by uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz                -- null = never expires
);

create index idx_diagram_shares_token on public.diagram_shares(token);
create index idx_diagram_shares_diagram_id on public.diagram_shares(diagram_id);

alter table public.diagram_shares enable row level security;

-- RLS: users can CRUD their own diagrams
create policy "Users can view their own diagrams"
  on public.diagrams for select
  using (created_by = auth.uid());

create policy "Users can insert their own diagrams"
  on public.diagrams for insert
  with check (created_by = auth.uid());

create policy "Users can update their own diagrams"
  on public.diagrams for update
  using (created_by = auth.uid());

-- RLS: share links
create policy "Anyone can view shares"
  on public.diagram_shares for select
  using (true);

create policy "Users can insert shares for their diagrams"
  on public.diagram_shares for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.diagrams
      where id = diagram_id and created_by = auth.uid()
    )
  );

create policy "Users can delete their own shares"
  on public.diagram_shares for delete
  using (created_by = auth.uid());

-- Function to auto-create profile on signup
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
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email)
  );
  return new;
end;
$$;

-- Trigger to create profile after signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users who already exist
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

create policy "Users can delete their own diagrams"
  on public.diagrams for delete
  using (created_by = auth.uid());

create policy "Anyone can view shared diagrams"
    on public.diagrams for select
    using (
      exists (
        select 1 from public.diagram_shares
        where diagram_id = diagrams.id
        and (expires_at is null or expires_at > now())
      )
);
