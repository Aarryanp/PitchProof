-- Schema for version 1. Applied to the Supabase project "homingo" (Mumbai) on 21 Nov 2026.
-- Policies use (select auth.uid()) so Postgres checks the user once per query, not once per row.
-- Server code (API routes) uses the service role key, which bypasses row-level security.
-- The company page (/p/[slug]) reads its pitch on the server, so no public read policy is needed.
-- Create a Storage bucket named "portfolio" in the Supabase dashboard for project images.

-- Students: one row per signed-in student
create table public.students (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  bio text,
  photo_url text,
  year_or_grad text,
  goal text check (goal in ('internship', 'freelance', 'job')),
  skill_types text[] not null default '{}',
  city text,
  voice_samples text[] not null default '{}',
  daily_limit integer not null default 15,
  created_at timestamptz not null default now()
);

-- Past work shown on company pages
create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  title text not null,
  skill_tag text,
  image_url text,
  link text,
  one_line text,
  created_at timestamptz not null default now()
);

-- One row per agent run
create table public.searches (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  skill_type text not null,
  sector text,
  city text,
  count integer not null default 20 check (count between 1 and 20),
  created_at timestamptz not null default now()
);

-- Businesses found; claimed_by enforces one student per company
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text unique,
  sector text,
  city text,
  size text,
  crustdata_id text,
  claimed_by uuid references public.students (id) on delete set null,
  created_at timestamptz not null default now()
);

-- The right person at each company
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text,
  role text,
  email text,
  source text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Website checks and the quality gate result
create table public.audits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  search_id uuid references public.searches (id) on delete set null,
  skill_type text not null,
  findings jsonb not null default '[]'::jsonb,
  passed_gate boolean not null default false,
  skip_reason text,
  created_at timestamptz not null default now()
);

-- Pitches: fix, company page and email
create table public.pitches (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  pitch_type text not null default 'audit' check (pitch_type in ('audit', 'generic')),
  fix_url text,
  page_slug text unique,
  email_subject text,
  email_body text,
  personal_line text,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'sent', 'opened', 'replied', 'declined', 'skipped')),
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Company page visits
create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references public.pitches (id) on delete cascade,
  viewed_at timestamptz not null default now()
);

-- Emails sent and replies received
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  pitch_id uuid not null references public.pitches (id) on delete cascade,
  kind text not null check (kind in ('first', 'followup_1', 'followup_2', 'reply')),
  gmail_id text,
  at timestamptz not null default now(),
  reply_label text check (reply_label in ('positive', 'neutral', 'negative'))
);

-- Skills the student is missing, from the quality gate
create table public.skill_gaps (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  missing_skill text not null,
  company_count integer not null default 0,
  resources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Row-level security: each student sees only their own data
alter table public.students enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.searches enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.audits enable row level security;
alter table public.pitches enable row level security;
alter table public.page_views enable row level security;
alter table public.messages enable row level security;
alter table public.skill_gaps enable row level security;

create policy "students_own_row" on public.students
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "portfolio_own_rows" on public.portfolio_items
  for all using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));

create policy "searches_own_rows" on public.searches
  for all using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));

create policy "companies_claimed_by_me" on public.companies
  for select using (claimed_by = (select auth.uid()));

create policy "contacts_of_my_companies" on public.contacts
  for select using (
    exists (select 1 from public.companies c where c.id = company_id and c.claimed_by = (select auth.uid()))
  );

create policy "audits_own_rows" on public.audits
  for select using (student_id = (select auth.uid()));

create policy "pitches_own_rows" on public.pitches
  for select using (student_id = (select auth.uid()));

create policy "pitches_update_own" on public.pitches
  for update using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));

create policy "page_views_of_my_pitches" on public.page_views
  for select using (
    exists (select 1 from public.pitches p where p.id = pitch_id and p.student_id = (select auth.uid()))
  );

create policy "messages_of_my_pitches" on public.messages
  for select using (
    exists (select 1 from public.pitches p where p.id = pitch_id and p.student_id = (select auth.uid()))
  );

create policy "skill_gaps_own_rows" on public.skill_gaps
  for select using (student_id = (select auth.uid()));

-- Helpful indexes
create index on public.audits (student_id);
create index on public.pitches (student_id, status);
create index on public.page_views (pitch_id);
create index on public.messages (pitch_id);
-- Indexes on links between tables (suggested by the Supabase performance check)
create index on public.audits (company_id);
create index on public.audits (search_id);
create index on public.companies (claimed_by);
create index on public.contacts (company_id);
create index on public.pitches (audit_id);
create index on public.pitches (company_id);
create index on public.pitches (contact_id);
create index on public.portfolio_items (student_id);
create index on public.searches (student_id);
create index on public.skill_gaps (student_id);

-- Saved replies from paid tools (Olostep, Crustdata, PageSpeed, Google Places),
-- so nothing is fetched twice. Added 22 Nov 2026 (migration add_fetch_cache).
-- No policies: only server code with the secret key can read or write it.
create table public.fetch_cache (
  key text primary key,
  source text not null,
  ok boolean not null default true,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.fetch_cache enable row level security;
