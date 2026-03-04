-- ============================================================
-- RSVP System — Supabase schema
-- Run this in the Supabase SQL editor to initialize the DB.
-- ============================================================

-- events
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  date        timestamptz not null,
  description text,
  flyer_url   text,
  created_at  timestamptz not null default now()
);

-- rsvps: one row per person per event
create table if not exists rsvps (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events(id) on delete cascade,
  phone        text not null,
  name         text not null,
  consented_at timestamptz not null,
  created_at   timestamptz not null default now(),
  unique(event_id, phone)
);

-- opt_outs: global opt-out list (reply STOP)
create table if not exists opt_outs (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null unique,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists rsvps_event_id_idx on rsvps(event_id);
create index if not exists rsvps_phone_idx on rsvps(phone);

-- Row Level Security
alter table events    enable row level security;
alter table rsvps     enable row level security;
alter table opt_outs  enable row level security;

-- Events are publicly readable (widget needs to show event details; no PII)
create policy "events_public_read" on events
  for select using (true);

-- rsvps and opt_outs: no direct client access; all writes/reads go through the
-- backend API with the service role key. No policies needed for client access.
