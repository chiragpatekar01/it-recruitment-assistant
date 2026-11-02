-- IT Recruitment Assistant: initial schema
-- Multi-tenant: every business row belongs to an organization, and Row Level
-- Security limits each signed-in user to the organizations they are a member of.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('owner', 'admin', 'recruiter', 'viewer');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Billing state is written only by the server (service role) from verified
-- Razorpay events, so members can read it but never change it.
create table public.org_billing (
  org_id uuid primary key references public.organizations (id) on delete cascade,
  plan text not null default 'trial' check (plan in ('trial', 'starter', 'growth', 'enterprise')),
  status text not null default 'trialing',
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  razorpay_subscription_id text unique,
  pending_plan text check (pending_plan in ('starter', 'growth')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table public.memberships (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'recruiter',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index memberships_user_idx on public.memberships (user_id);
-- Lets the API embed member profiles (memberships → profiles).
alter table public.memberships add constraint memberships_profile_fk foreign key (user_id) references public.profiles (id) on delete cascade;

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  role public.member_role not null default 'recruiter' check (role <> 'owner'),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz
);
create index invitations_org_idx on public.invitations (org_id);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  code text,
  title text not null default 'Untitled role',
  status text not null default 'open' check (status in ('open', 'hold', 'closed')),
  jd_text text,
  sourced_count integer not null default 0 check (sourced_count >= 0),
  -- Structured requirements, Boolean strings, questions and technical questions.
  details jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jobs_org_idx on public.jobs (org_id, created_at desc);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  name text not null,
  stage text not null default 'screened' check (stage in (
    'sourced', 'screened', 'shortlisted', 'interview_scheduled', 'interview_done',
    'selected', 'offered', 'joined', 'on_hold', 'rejected')),
  furthest integer not null default 1 check (furthest between 0 and 7),
  source text not null default 'other' check (source in ('linkedin', 'naukri', 'referral', 'website', 'portal', 'other')),
  decision text,
  notes text,
  -- Extracted screening profile and skill evidence. The full resume is never stored.
  profile jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index candidates_job_idx on public.candidates (job_id);
create index candidates_org_idx on public.candidates (org_id);

create table public.usage_counters (
  org_id uuid not null references public.organizations (id) on delete cascade,
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  jd_analyses integer not null default 0,
  resume_screens integer not null default 0,
  question_sets integer not null default 0,
  primary key (org_id, period)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  created_at timestamptz not null default now()
);
create index audit_org_idx on public.audit_log (org_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so policies can call them without recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_member(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where org_id = p_org and user_id = auth.uid());
$$;

create or replace function public.has_role(p_org uuid, p_roles public.member_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where org_id = p_org and user_id = auth.uid() and role = any (p_roles));
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- New sign-up → profile row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- A candidate always belongs to the same organization as its job, whatever the client sends.
create or replace function public.enforce_candidate_org()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select org_id into new.org_id from jobs where id = new.job_id;
  if new.org_id is null then
    raise exception 'Job not found';
  end if;
  return new;
end;
$$;
create trigger candidates_org before insert or update of job_id, org_id on public.candidates
  for each row execute function public.enforce_candidate_org();

-- Owners stay in control: only owners change owner rows, and an organization
-- always keeps at least one owner.
create or replace function public.guard_memberships()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owners integer;
begin
  -- Cascading deletes (workspace or user account removed) skip these checks.
  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if (tg_op = 'DELETE' and old.role = 'owner') or (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner') then
    select count(*) into owners from memberships where org_id = old.org_id and role = 'owner';
    if owners <= 1 then
      raise exception 'An organization needs at least one owner';
    end if;
  end if;
  if auth.uid() is not null and not public.has_role(old.org_id, array['owner']::public.member_role[]) then
    if old.role = 'owner' or (tg_op = 'UPDATE' and new.role = 'owner') then
      raise exception 'Only owners can change owner access';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger memberships_guard before update or delete on public.memberships
  for each row execute function public.guard_memberships();

create trigger organizations_updated before update on public.organizations for each row execute function public.set_updated_at();
create trigger jobs_updated before update on public.jobs for each row execute function public.set_updated_at();
create trigger candidates_updated before update on public.candidates for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RPCs called by the app
-- ---------------------------------------------------------------------------
create or replace function public.create_organization(org_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_id uuid;
  owned integer;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  select count(*) into owned from memberships where user_id = auth.uid() and role = 'owner';
  if owned >= 5 then
    raise exception 'You can own at most 5 workspaces';
  end if;
  insert into organizations (name, created_by) values (trim(org_name), auth.uid()) returning id into new_id;
  insert into org_billing (org_id) values (new_id);
  insert into memberships (org_id, user_id, role) values (new_id, auth.uid(), 'owner');
  insert into audit_log (org_id, user_id, action, entity, entity_id) values (new_id, auth.uid(), 'workspace.created', 'organization', new_id);
  return new_id;
end;
$$;

create or replace function public.accept_invitation(invite_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  inv invitations%rowtype;
  user_email text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  select * into inv from invitations where token = invite_token;
  if not found or inv.accepted_at is not null or inv.expires_at < now() then
    raise exception 'This invitation is invalid or has expired';
  end if;
  select email into user_email from auth.users where id = auth.uid();
  if lower(user_email) <> lower(inv.email) then
    raise exception 'This invitation was sent to a different email address';
  end if;
  insert into memberships (org_id, user_id, role) values (inv.org_id, auth.uid(), inv.role)
  on conflict (org_id, user_id) do nothing;
  update invitations set accepted_at = now() where id = inv.id;
  insert into audit_log (org_id, user_id, action, entity, entity_id) values (inv.org_id, auth.uid(), 'member.joined', 'invitation', inv.id);
  return inv.org_id;
end;
$$;

-- Usage metering is server-only.
create or replace function public.increment_usage(p_org uuid, p_period text, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into usage_counters (org_id, period) values (p_org, p_period) on conflict do nothing;
  if p_kind = 'jd' then
    update usage_counters set jd_analyses = jd_analyses + 1 where org_id = p_org and period = p_period;
  elsif p_kind = 'resume' then
    update usage_counters set resume_screens = resume_screens + 1 where org_id = p_org and period = p_period;
  elsif p_kind = 'questions' then
    update usage_counters set question_sets = question_sets + 1 where org_id = p_org and period = p_period;
  else
    raise exception 'Unknown usage kind %', p_kind;
  end if;
end;
$$;
revoke execute on function public.increment_usage(uuid, text, text) from public, anon, authenticated;

-- Invitation preview for the accept page (shows workspace name and role only).
create or replace function public.invitation_preview(invite_token text)
returns table (org_name text, role public.member_role, email text, expired boolean, accepted boolean)
language sql stable security definer set search_path = public as $$
  select o.name, i.role, i.email, i.expires_at < now(), i.accepted_at is not null
  from invitations i join organizations o on o.id = i.org_id
  where i.token = invite_token;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_billing enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.jobs enable row level security;
alter table public.candidates enable row level security;
alter table public.usage_counters enable row level security;
alter table public.audit_log enable row level security;

-- profiles: yourself, and people who share a workspace with you
create policy "profiles read" on public.profiles for select using (
  id = auth.uid() or exists (
    select 1 from memberships mine join memberships theirs on theirs.org_id = mine.org_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.id));
create policy "profiles update self" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- organizations
create policy "org read" on public.organizations for select using (public.is_member(id));
create policy "org update" on public.organizations for update
  using (public.has_role(id, array['owner', 'admin']::public.member_role[]))
  with check (public.has_role(id, array['owner', 'admin']::public.member_role[]));
create policy "org delete" on public.organizations for delete using (public.has_role(id, array['owner']::public.member_role[]));

-- billing and usage: read-only for members
create policy "billing read" on public.org_billing for select using (public.is_member(org_id));
create policy "usage read" on public.usage_counters for select using (public.is_member(org_id));

-- memberships
create policy "members read" on public.memberships for select using (public.is_member(org_id));
create policy "members update" on public.memberships for update
  using (public.has_role(org_id, array['owner', 'admin']::public.member_role[]))
  with check (public.has_role(org_id, array['owner', 'admin']::public.member_role[]));
create policy "members remove" on public.memberships for delete using (
  user_id = auth.uid() or public.has_role(org_id, array['owner', 'admin']::public.member_role[]));

-- invitations
create policy "invites read" on public.invitations for select using (public.has_role(org_id, array['owner', 'admin']::public.member_role[]));
create policy "invites create" on public.invitations for insert with check (
  public.has_role(org_id, array['owner', 'admin']::public.member_role[]) and invited_by = auth.uid());
create policy "invites delete" on public.invitations for delete using (public.has_role(org_id, array['owner', 'admin']::public.member_role[]));

-- jobs: everyone in the workspace reads; viewers cannot write
create policy "jobs read" on public.jobs for select using (public.is_member(org_id));
create policy "jobs create" on public.jobs for insert with check (public.has_role(org_id, array['owner', 'admin', 'recruiter']::public.member_role[]));
create policy "jobs update" on public.jobs for update
  using (public.has_role(org_id, array['owner', 'admin', 'recruiter']::public.member_role[]))
  with check (public.has_role(org_id, array['owner', 'admin', 'recruiter']::public.member_role[]));
create policy "jobs delete" on public.jobs for delete using (public.has_role(org_id, array['owner', 'admin']::public.member_role[]));

-- candidates: same rules as jobs
create policy "candidates read" on public.candidates for select using (public.is_member(org_id));
create policy "candidates create" on public.candidates for insert with check (public.has_role(org_id, array['owner', 'admin', 'recruiter']::public.member_role[]));
create policy "candidates update" on public.candidates for update
  using (public.has_role(org_id, array['owner', 'admin', 'recruiter']::public.member_role[]))
  with check (public.has_role(org_id, array['owner', 'admin', 'recruiter']::public.member_role[]));
create policy "candidates delete" on public.candidates for delete using (public.has_role(org_id, array['owner', 'admin', 'recruiter']::public.member_role[]));

-- audit log: admins read; members append their own entries
create policy "audit read" on public.audit_log for select using (public.has_role(org_id, array['owner', 'admin']::public.member_role[]));
create policy "audit write" on public.audit_log for insert with check (public.is_member(org_id) and user_id = auth.uid());
