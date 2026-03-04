'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────
type Attendee = { id: string; name: string; phone: string; created_at: string }

type Event = {
  id: string
  name: string
  date: string
  description?: string
  flyer_url?: string
  rsvp_count: number
  attendees: Attendee[]
  created_at: string
}

type Person = {
  name: string
  phone: string
  events: { id: string; name: string; date: string }[]
  first_seen: string
}

type Tab = 'events' | 'people' | 'send' | 'add-event'

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function maskPhone(p: string) {
  return p.replace(/(\+?\d+)(\d{4})$/, (_, prefix, last4) => '*'.repeat(prefix.length) + last4)
}

// ── Sub-components ─────────────────────────────────────────────────────────
function EventCard({ event }: { event: Event }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/10 rounded-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left gap-4"
      >
        <div className="min-w-0">
          <p className="text-white font-medium text-sm truncate">{event.name}</p>
          <p className="text-white/40 text-xs mt-0.5">
            {fmtDate(event.date)} &middot; {fmtTime(event.date)}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-white/60 text-sm font-semibold tabular-nums">
            {event.rsvp_count} RSVP{event.rsvp_count !== 1 ? 's' : ''}
          </span>
          <span className="text-white/30 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-3 space-y-2 bg-white/[0.02]">
          {event.attendees.length === 0 ? (
            <p className="text-white/30 text-xs">No RSVPs yet.</p>
          ) : (
            event.attendees.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3">
                <p className="text-white/80 text-sm">{a.name}</p>
                <p className="text-white/30 text-xs font-mono">{maskPhone(a.phone)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function PersonCard({ person }: { person: Person }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/10 rounded-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left gap-4"
      >
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{person.name}</p>
          <p className="text-white/30 text-xs font-mono mt-0.5">{maskPhone(person.phone)}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-white/60 text-xs">
            {person.events.length} event{person.events.length !== 1 ? 's' : ''}
          </span>
          <span className="text-white/30 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-white/10 px-4 py-3 space-y-1.5 bg-white/[0.02]">
          {person.events.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between gap-2">
              <p className="text-white/70 text-sm">{ev.name}</p>
              <p className="text-white/30 text-xs">{fmtDate(ev.date)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Admin Page ────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('events')
  const [events, setEvents] = useState<Event[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [loadingPeople, setLoadingPeople] = useState(false)

  // Send form
  const [sendTarget, setSendTarget] = useState('all')
  const [sendMessage, setSendMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number; total: number; errors?: string[] } | null>(null)
  const [sendError, setSendError] = useState('')

  // Add event form
  const [evName, setEvName] = useState('')
  const [evDate, setEvDate] = useState('')
  const [evDesc, setEvDesc] = useState('')
  const [evFlyer, setEvFlyer] = useState('')
  const [addingEvent, setAddingEvent] = useState(false)
  const [addEventError, setAddEventError] = useState('')
  const [addEventSuccess, setAddEventSuccess] = useState('')

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true)
    try {
      const res = await fetch('/api/admin/events')
      if (res.status === 401) { router.push('/admin/login'); return }
      const data = await res.json()
      if (Array.isArray(data)) setEvents(data)
    } finally {
      setLoadingEvents(false)
    }
  }, [router])

  const fetchPeople = useCallback(async () => {
    setLoadingPeople(true)
    try {
      const res = await fetch('/api/admin/people')
      if (res.status === 401) { router.push('/admin/login'); return }
      const data = await res.json()
      if (Array.isArray(data)) setPeople(data)
    } finally {
      setLoadingPeople(false)
    }
  }, [router])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  useEffect(() => {
    if (tab === 'people' && people.length === 0) fetchPeople()
  }, [tab, people.length, fetchPeople])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendError('')
    setSendResult(null)
    if (!sendMessage.trim()) { setSendError('Message cannot be empty.'); return }
    setSending(true)

    try {
      const res = await fetch('/api/admin/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: sendMessage, target: sendTarget }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSendError(data.error ?? 'Send failed.')
      } else {
        setSendResult(data)
        setSendMessage('')
      }
    } catch {
      setSendError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddEventError('')
    setAddEventSuccess('')
    if (!evName.trim() || !evDate) { setAddEventError('Name and date are required.'); return }
    setAddingEvent(true)

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: evName, date: evDate, description: evDesc, flyer_url: evFlyer }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddEventError(data.error ?? 'Failed to create event.')
      } else {
        setAddEventSuccess(`Event "${data.name}" created. Copy its ID: ${data.id}`)
        setEvName(''); setEvDate(''); setEvDesc(''); setEvFlyer('')
        fetchEvents()
      }
    } catch {
      setAddEventError('Network error. Please try again.')
    } finally {
      setAddingEvent(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'events', label: 'Events' },
    { id: 'people', label: 'People' },
    { id: 'send', label: 'Send' },
    { id: 'add-event', label: '+ Event' },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/30">Nothing Radio</p>
          <h1 className="text-base font-semibold text-white">RSVP Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/how-to"
            className="text-xs text-white/30 hover:text-white/70 transition-colors uppercase tracking-widest"
          >
            How To
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-white/30 hover:text-white/70 transition-colors uppercase tracking-widest"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 px-5 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-3 px-3 text-xs uppercase tracking-widest transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'text-white border-white'
                : 'text-white/30 border-transparent hover:text-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto space-y-4">

        {/* ── EVENTS TAB ── */}
        {tab === 'events' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-white/30">
                {events.length} event{events.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={fetchEvents}
                disabled={loadingEvents}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                {loadingEvents ? 'Loading…' : 'Refresh'}
              </button>
            </div>
            {events.length === 0 && !loadingEvents && (
              <p className="text-white/30 text-sm py-4 text-center">
                No events yet. Add one using the &ldquo;+ Event&rdquo; tab.
              </p>
            )}
            {events.map((ev) => <EventCard key={ev.id} event={ev} />)}
          </div>
        )}

        {/* ── PEOPLE TAB ── */}
        {tab === 'people' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-white/30">
                {people.length} unique attendee{people.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={fetchPeople}
                disabled={loadingPeople}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                {loadingPeople ? 'Loading…' : 'Refresh'}
              </button>
            </div>
            {people.length === 0 && !loadingPeople && (
              <p className="text-white/30 text-sm py-4 text-center">No RSVPs yet.</p>
            )}
            {people.map((p) => <PersonCard key={p.phone} person={p} />)}
          </div>
        )}

        {/* ── SEND TAB ── */}
        {tab === 'send' && (
          <form onSubmit={handleSend} className="space-y-5">
            <p className="text-xs uppercase tracking-widest text-white/30">Send a message</p>

            {/* Target */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-1.5">
                Recipients
              </label>
              <select
                value={sendTarget}
                onChange={(e) => setSendTarget(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/50 transition-colors"
              >
                <option value="all">Everyone on the list (all RSVPs, minus opt-outs)</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} — {fmtDate(ev.date)} ({ev.rsvp_count} RSVPs)
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-1.5">
                Message
              </label>
              <textarea
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                rows={5}
                placeholder="Type your message…"
                required
                className="w-full bg-transparent border border-white/20 rounded-sm px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-white/50 text-sm transition-colors resize-none"
              />
              <p className="text-white/20 text-xs mt-1">{sendMessage.length} characters</p>
            </div>

            {sendError && <p className="text-red-400 text-xs">{sendError}</p>}

            {sendResult && (
              <div className="border border-white/10 rounded-sm px-4 py-3 space-y-1">
                <p className="text-white text-sm">
                  Sent to <span className="font-semibold">{sendResult.sent}</span> of{' '}
                  <span className="font-semibold">{sendResult.total}</span> recipients.
                </p>
                {sendResult.errors && sendResult.errors.length > 0 && (
                  <p className="text-red-400 text-xs">
                    {sendResult.errors.length} error(s): {sendResult.errors[0]}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 bg-white text-black font-semibold text-sm tracking-widest uppercase rounded-sm hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending…' : 'Send Message'}
            </button>
          </form>
        )}

        {/* ── ADD EVENT TAB ── */}
        {tab === 'add-event' && (
          <form onSubmit={handleAddEvent} className="space-y-4">
            <p className="text-xs uppercase tracking-widest text-white/30">Create a new event</p>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-1.5">
                Event Name *
              </label>
              <input
                type="text"
                value={evName}
                onChange={(e) => setEvName(e.target.value)}
                placeholder="e.g. Nothing Radio — April"
                required
                className="w-full bg-transparent border border-white/20 rounded-sm px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-white/50 text-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-1.5">
                Date &amp; Time *
              </label>
              <input
                type="datetime-local"
                value={evDate}
                onChange={(e) => setEvDate(e.target.value)}
                required
                className="w-full bg-transparent border border-white/20 rounded-sm px-3 py-2.5 text-white focus:outline-none focus:border-white/50 text-sm transition-colors [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-1.5">
                Description (optional)
              </label>
              <textarea
                value={evDesc}
                onChange={(e) => setEvDesc(e.target.value)}
                placeholder="Short description shown in the widget"
                rows={2}
                className="w-full bg-transparent border border-white/20 rounded-sm px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-white/50 text-sm transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-1.5">
                Flyer Image URL (optional)
              </label>
              <input
                type="url"
                value={evFlyer}
                onChange={(e) => setEvFlyer(e.target.value)}
                placeholder="https://…"
                className="w-full bg-transparent border border-white/20 rounded-sm px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-white/50 text-sm transition-colors"
              />
            </div>

            {addEventError && <p className="text-red-400 text-xs">{addEventError}</p>}

            {addEventSuccess && (
              <div className="border border-white/10 rounded-sm px-4 py-3">
                <p className="text-white/80 text-xs leading-relaxed">{addEventSuccess}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={addingEvent}
              className="w-full py-3 bg-white text-black font-semibold text-sm tracking-widest uppercase rounded-sm hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {addingEvent ? 'Creating…' : 'Create Event'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
