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

-- Add series column to events (safe to run on existing schema)
alter table events add column if not exists series text;

-- app_settings: singleton row (id must be 1) for admin-editable settings.
-- sms_confirm_template: NULL means use the built-in default in code.
create table if not exists app_settings (
  id                   smallint primary key default 1 check (id = 1),
  sms_confirm_template text,
  updated_at           timestamptz not null default now()
);

-- Indexes
create index if not exists rsvps_event_id_idx on rsvps(event_id);
create index if not exists rsvps_phone_idx on rsvps(phone);
create index if not exists events_series_idx on events(series);

-- Row Level Security
alter table events       enable row level security;
alter table rsvps        enable row level security;
alter table opt_outs     enable row level security;
alter table app_settings enable row level security;

-- Events are publicly readable (widget needs to show event details; no PII)
create policy "events_public_read" on events
  for select using (true);

-- rsvps and opt_outs: no direct client access; all writes/reads go through the
-- backend API with the service role key. No policies needed for client access.

-- subscribers: one row per unique phone number ever in the system.
-- Canonical per-person record — separate from rsvps which tracks per-event attendance.
-- welcome_sent_at: NULL means the welcome MMS + contact card has not been sent yet.
-- Safe to add to an existing DB: purely additive, existing code unaffected.
create table if not exists subscribers (
  phone            text primary key,          -- normalized E.164
  name             text not null default '',
  created_at       timestamptz not null default now(),
  welcome_sent_at  timestamptz               -- null = contact card not yet sent
);
alter table subscribers enable row level security;
create index if not exists subscribers_welcome_idx on subscribers(welcome_sent_at);
create index if not exists subscribers_phone_idx   on subscribers(phone);

-- Welcome message settings — two new columns on app_settings.
-- welcome_enabled: false = feature off, first-timers get regular confirm SMS.
-- welcome_message_text: NULL means use the built-in default in code (same pattern as sms_confirm_template).
alter table app_settings
  add column if not exists welcome_enabled      boolean not null default false,
  add column if not exists welcome_message_text text;

-- ─────────────────────────────────────────────────────────────────────────────
-- ONE-TIME BACKFILL: run once in the Supabase SQL editor to seed subscribers
-- from existing rsvps data. Safe to re-run (ON CONFLICT DO NOTHING).
-- Past subscribers land with welcome_sent_at = NULL so the admin can reach them
-- with a manual one-off broadcast from the Send tab when ready.
-- ─────────────────────────────────────────────────────────────────────────────
-- insert into subscribers (phone, name, created_at)
-- select
--   r1.phone,
--   coalesce(
--     (
--       select r2.name from rsvps r2
--       where r2.phone = r1.phone and r2.name != ''
--       order by r2.created_at asc
--       limit 1
--     ),
--     ''
--   ) as name,
--   min(r1.created_at) as created_at
-- from rsvps r1
-- group by r1.phone
-- on conflict (phone) do nothing;
-- ─────────────────────────────────────────────────────────────────────────────

-- broadcast_log: one row per admin broadcast sent from the Send tab.
-- Run in Supabase SQL editor if adding to an existing DB.
create table if not exists broadcast_log (
  id               uuid primary key default gen_random_uuid(),
  body             text not null,
  media_urls       text[],
  target           text not null,   -- 'all', 'series:X', or event UUID
  recipient_count  int  not null default 0,
  sent_at          timestamptz not null default now()
);
alter table broadcast_log enable row level security;
