'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatEventDate, formatEventTime, parsePickerToUtcIso } from '@/lib/eventTimezone'

// ── Types ──────────────────────────────────────────────────────────────────
type Attendee = { id: string; name: string; phone: string; created_at: string }

type Event = {
  id: string
  name: string
  date: string
  description?: string
  flyer_url?: string
  series?: string | null
  rsvp_count: number
  attendees: Attendee[]
  created_at: string
}

type Person = {
  name: string
  phone: string
  events: { id: string; name: string; date: string }[]
  first_seen: string
  unsubscribed: boolean
}

type Tab = 'events' | 'people' | 'send' | 'add-event' | 'settings'

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return formatEventDate(iso)
}

function fmtTime(iso: string) {
  return formatEventTime(iso)
}

function maskPhone(p: string) {
  return p.replace(/(\+?\d+)(\d{4})$/, (_, prefix, last4) => '*'.repeat(prefix.length) + last4)
}

// ── Copy button (reusable) ─────────────────────────────────────────────────
function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handle}
      className="text-xs text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────
function EventCard({ event }: { event: Event }) {
  const [open, setOpen] = useState(false)
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const iframeCode = `<iframe\n  src="${appUrl}/rsvp-widget?event=${event.id}"\n  title="RSVP"\n  width="100%"\n  height="520"\n  style="border:none; background:#000;"\n></iframe>`

  return (
    <div className="border border-white/10 rounded-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left gap-4"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-white font-medium text-sm truncate">{event.name}</p>
            {event.series && (
              <span className="flex-shrink-0 text-[10px] uppercase tracking-widest text-white/30 border border-white/10 rounded-sm px-1.5 py-0.5">
                {event.series}
              </span>
            )}
          </div>
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
        <div className="border-t border-white/10 px-4 py-4 space-y-4 bg-white/[0.02]">
          {/* Attendees */}
          <div className="space-y-2">
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

          {/* Event ID */}
          <div className="pt-1 border-t border-white/10 space-y-1">
            <p className="text-xs uppercase tracking-widest text-white/20">Event ID</p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-white/40 text-xs font-mono break-all">{event.id}</p>
              <CopyButton text={event.id} label="Copy ID" />
            </div>
          </div>

          {/* iframe code */}
          <div className="border-t border-white/10 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-white/20">Squarespace iframe</p>
              <CopyButton text={iframeCode} label="Copy iframe" />
            </div>
            <pre className="text-xs text-white/40 font-mono bg-black/40 border border-white/10 rounded-sm px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
              {iframeCode}
            </pre>
          </div>
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
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-white text-sm font-medium truncate">{person.name}</p>
            {person.unsubscribed && (
              <span className="flex-shrink-0 text-[10px] uppercase tracking-widest text-red-400 border border-red-500/40 rounded-sm px-1.5 py-0.5">
                Unsubscribed
              </span>
            )}
          </div>
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

// ── History Entry (reusable row) ───────────────────────────────────────────
function HistoryEntry({ entry }: {
  entry: {
    id: string
    body: string
    media_urls: string[] | null
    target_label: string
    recipient_count: number
    sent_at: string
  }
}) {
  const [expanded, setExpanded] = useState(false)
  const preview = entry.body.length > 120 ? entry.body.slice(0, 120) + '…' : entry.body
  const date = new Date(entry.sent_at)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="border border-white/10 rounded-sm px-4 py-3 space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white/60 text-xs">
            {dateStr} at {timeStr} &middot; <span className="text-white/40">{entry.target_label}</span>
            {entry.recipient_count > 0 && (
              <span className="text-white/30"> &middot; {entry.recipient_count} sent</span>
            )}
          </p>
        </div>
        {entry.body.length > 120 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
          >
            {expanded ? 'Less' : 'More'}
          </button>
        )}
      </div>
      {entry.body && (
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
          {expanded ? entry.body : preview}
        </p>
      )}
      {entry.media_urls && entry.media_urls.length > 0 && (
        <p className="text-white/30 text-xs">+ image</p>
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
  const [sendMessage, setSendMessage] = useState('Nothing Radio: ')
  const [sendImageUrl, setSendImageUrl] = useState('')
  const [imagePreviewError, setImagePreviewError] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [sendConfirmed, setSendConfirmed] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number; total: number; errors?: string[]; isTest?: boolean } | null>(null)
  const [sendError, setSendError] = useState('')
  const [sendProgress, setSendProgress] = useState<{ sent: number; grandTotal: number; log: string[] } | null>(null)
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [recipientCountLoading, setRecipientCountLoading] = useState(false)

  // Message history
  type BroadcastLog = {
    id: string
    body: string
    media_urls: string[] | null
    target: string
    target_label: string
    recipient_count: number
    sent_at: string
  }
  const [messageHistory, setMessageHistory] = useState<BroadcastLog[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(false)

  // Add event form
  const [evName, setEvName] = useState('')
  const [evDate, setEvDate] = useState('')
  const [evDesc, setEvDesc] = useState('')
  const [evFlyer, setEvFlyer] = useState('')
  const [evSeries, setEvSeries] = useState('')
  const [addingEvent, setAddingEvent] = useState(false)
  const [addEventError, setAddEventError] = useState('')
  const [addEventSuccess, setAddEventSuccess] = useState('')
  const [newEventId, setNewEventId] = useState('')
  const [newEventIframe, setNewEventIframe] = useState('')

  // Settings — SMS template
  const DEFAULT_TEMPLATE = "Nothing Radio: You're confirmed for {eventName} on {eventDate}. See you there! Reply STOP to opt out."
  const [smsTemplate, setSmsTemplate] = useState(DEFAULT_TEMPLATE)
  const [savedTemplate, setSavedTemplate] = useState<string | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateError, setTemplateError] = useState('')
  const [templateSuccess, setTemplateSuccess] = useState('')

  const fetchTemplate = useCallback(async () => {
    setLoadingTemplate(true)
    try {
      const res = await fetch('/api/admin/sms-template')
      if (res.status === 401) { router.push('/admin/login'); return }
      const data = await res.json()
      setSavedTemplate(data.template)
      setSmsTemplate(data.template ?? data.default)
    } finally {
      setLoadingTemplate(false)
    }
  }, [router])

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

  useEffect(() => {
    if (tab === 'settings') fetchTemplate()
  }, [tab, fetchTemplate])

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/admin/messages')
      if (res.status === 401) { router.push('/admin/login'); return }
      const data = await res.json()
      if (Array.isArray(data)) setMessageHistory(data)
    } finally {
      setLoadingHistory(false)
    }
  }, [router])

  useEffect(() => {
    if (tab !== 'send') return
    fetchHistory()
    let cancelled = false
    setRecipientCount(null)
    setRecipientCountLoading(true)
    fetch(`/api/admin/send?target=${encodeURIComponent(sendTarget)}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setRecipientCount(d.count ?? null) })
      .catch(() => { if (!cancelled) setRecipientCount(null) })
      .finally(() => { if (!cancelled) setRecipientCountLoading(false) })
    return () => { cancelled = true }
  }, [tab, sendTarget, fetchHistory])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendError('')
    setSendResult(null)
    setSendProgress(null)

    const trimmedUrl = sendImageUrl.trim()
    const mediaUrls = trimmedUrl.startsWith('https://') ? [trimmedUrl] : []

    if (!sendMessage.trim() && mediaUrls.length === 0) {
      setSendError('A message or image URL is required.')
      return
    }

    setSending(true)

    let offset = 0
    let totalSent = 0
    let grandTotal = 0
    const allErrors: string[] = []
    const log: string[] = []

    try {
      while (true) {
        const res = await fetch('/api/admin/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: sendMessage, target: sendTarget, offset, mediaUrls }),
        })
        const data = await res.json()

        if (!res.ok) {
          setSendError(data.error ?? 'Send failed.')
          break
        }

        grandTotal = data.grandTotal
        totalSent += data.batchSent
        if (data.errors?.length) allErrors.push(...data.errors)

        const newLines = (data.phones ?? []).map((p: string) => `→ ${p}`)
        log.push(...newLines)

        setSendProgress({ sent: totalSent, grandTotal, log: [...log] })

        if (data.nextOffset === null) break
        offset = data.nextOffset
      }

      setSendResult({ sent: totalSent, total: grandTotal, errors: allErrors.slice(0, 5), isTest: false })

      // Log the completed broadcast (fire-and-forget; don't block the UI)
      const trimmedUrl = sendImageUrl.trim()
      fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: sendMessage,
          mediaUrls: trimmedUrl.startsWith('https://') ? [trimmedUrl] : [],
          target: sendTarget,
          recipientCount: totalSent,
        }),
      })
        .then(() => fetchHistory())
        .catch(() => {/* non-critical */})

      setSendMessage('Nothing Radio: ')
      setSendImageUrl('')
      setImagePreviewError(false)
      setSendConfirmed(false)
    } catch {
      setSendError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleSendTest = async () => {
    setSendError('')
    setSendResult(null)

    const trimmedUrl = sendImageUrl.trim()
    const mediaUrls = trimmedUrl.startsWith('https://') ? [trimmedUrl] : []

    if (!sendMessage.trim() && mediaUrls.length === 0) {
      setSendError('A message or image URL is required.')
      return
    }

    setSendingTest(true)
    try {
      const res = await fetch('/api/admin/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: sendMessage, target: sendTarget, offset: 0, mediaUrls, test: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSendError(data.error ?? 'Test send failed.')
      } else {
        setSendResult({ sent: data.sent, total: 1, errors: data.errors, isTest: true })
      }
    } catch {
      setSendError('Network error. Please try again.')
    } finally {
      setSendingTest(false)
    }
  }

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setTemplateError('')
    setTemplateSuccess('')
    if (!smsTemplate.trim()) { setTemplateError('Template cannot be empty.'); return }
    setSavingTemplate(true)
    try {
      const res = await fetch('/api/admin/sms-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: smsTemplate.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTemplateError(data.error ?? 'Failed to save.')
      } else {
        setSavedTemplate(data.template)
        setTemplateSuccess('Saved.')
        setTimeout(() => setTemplateSuccess(''), 3000)
      }
    } catch {
      setTemplateError('Network error. Please try again.')
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleRevertTemplate = async () => {
    setTemplateError('')
    setTemplateSuccess('')
    setSavingTemplate(true)
    try {
      const res = await fetch('/api/admin/sms-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTemplateError(data.error ?? 'Failed to revert.')
      } else {
        setSavedTemplate(null)
        setSmsTemplate(DEFAULT_TEMPLATE)
        setTemplateSuccess('Reverted to default.')
        setTimeout(() => setTemplateSuccess(''), 3000)
      }
    } catch {
      setTemplateError('Network error. Please try again.')
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddEventError('')
    setAddEventSuccess('')
    if (!evName.trim() || !evDate) { setAddEventError('Name and date are required.'); return }
    const utcDate = parsePickerToUtcIso(evDate)
    if (!utcDate) { setAddEventError('Invalid date/time. Please re-enter.'); return }
    setAddingEvent(true)

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: evName, date: utcDate, description: evDesc, flyer_url: evFlyer, series: evSeries || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAddEventError(data.error ?? 'Failed to create event.')
      } else {
        const origin = window.location.origin
        const iframe = `<iframe\n  src="${origin}/rsvp-widget?event=${data.id}"\n  title="RSVP"\n  width="100%"\n  height="520"\n  style="border:none; background:#000;"\n></iframe>`
        setAddEventSuccess(`Event "${data.name}" created.`)
        setNewEventId(data.id)
        setNewEventIframe(iframe)
        setEvName(''); setEvDate(''); setEvDesc(''); setEvFlyer(''); setEvSeries('')
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
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div>
          <img
            src="https://images.squarespace-cdn.com/content/v1/6568f730596cc333d032cb51/15b3ef04-19e7-4102-80f7-b84e5f287e99/Asset+3.png?format=1500w"
            alt="Nothing Radio"
            className="h-6 w-auto object-contain object-left mb-1"
          />
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
                onChange={(e) => { setSendTarget(e.target.value); setSendConfirmed(false) }}
                className="w-full bg-black border border-white/20 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/50 transition-colors"
              >
                <option value="all">Everyone on the list (all RSVPs, minus opt-outs)</option>
                {/* Series targets — auto-derived from events that have a series tag */}
                {[...new Set(events.map((ev) => ev.series).filter(Boolean))].map((s) => (
                  <option key={`series:${s}`} value={`series:${s}`}>
                    All {s} RSVPs
                  </option>
                ))}
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} — {fmtDate(ev.date)} ({ev.rsvp_count} RSVPs)
                  </option>
                ))}
              </select>
              <p className="text-white/30 text-xs mt-1.5">
                {recipientCountLoading
                  ? 'Counting recipients…'
                  : recipientCount !== null
                    ? `${recipientCount} recipient${recipientCount !== 1 ? 's' : ''} (opt-outs excluded)`
                    : ''}
              </p>
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
                className="w-full bg-transparent border border-white/20 rounded-sm px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-white/50 text-sm transition-colors resize-none"
              />
              <p className="text-white/20 text-xs mt-1">{sendMessage.length} characters</p>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-1.5">
                Image URL <span className="text-white/20 normal-case tracking-normal">(optional — MMS)</span>
              </label>
              <input
                type="url"
                value={sendImageUrl}
                onChange={(e) => {
                  setSendImageUrl(e.target.value)
                  setImagePreviewError(false)
                }}
                placeholder="https://…"
                className="w-full bg-transparent border border-white/20 rounded-sm px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-white/50 text-sm transition-colors"
              />
              {sendImageUrl.trim().startsWith('https://') && (
                <div className="mt-2">
                  {imagePreviewError ? (
                    <p className="text-white/30 text-xs">
                      Couldn&apos;t load preview — the link may block embedding, but Twilio may still be able to fetch it.
                    </p>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sendImageUrl.trim()}
                      alt="Image preview"
                      onError={() => setImagePreviewError(true)}
                      className="max-h-48 max-w-full rounded-sm border border-white/10 object-contain bg-white/5"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Message preview */}
            {(sendMessage.trim() || sendImageUrl.trim().startsWith('https://')) && (
              <div className="border border-white/10 rounded-sm px-4 py-3 space-y-2">
                <p className="text-xs uppercase tracking-widest text-white/20">Preview</p>
                {sendImageUrl.trim().startsWith('https://') && !imagePreviewError && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sendImageUrl.trim()}
                    alt=""
                    onError={() => setImagePreviewError(true)}
                    className="max-h-40 max-w-full rounded-sm object-contain"
                  />
                )}
                {sendMessage.trim() && (
                  <p className="text-white/60 text-sm leading-relaxed">{sendMessage.trim()}</p>
                )}
              </div>
            )}

            {sendError && <p className="text-red-400 text-xs">{sendError}</p>}

            {/* Live send progress */}
            {sending && sendProgress && (
              <div className="border border-white/10 rounded-sm px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-white/60 text-xs uppercase tracking-widest">Sending…</p>
                  <p className="text-white text-sm font-semibold tabular-nums">
                    {sendProgress.sent} / {sendProgress.grandTotal}
                  </p>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-1">
                  <div
                    className="bg-white h-1 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((sendProgress.sent / sendProgress.grandTotal) * 100)}%` }}
                  />
                </div>
                {/* Scrollable log of sent numbers */}
                <div className="max-h-32 overflow-y-auto space-y-0.5">
                  {sendProgress.log.map((line, i) => (
                    <p key={i} className="text-white/30 text-xs font-mono">{line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Final result */}
            {!sending && !sendingTest && sendResult && (
              <div className="border border-white/10 rounded-sm px-4 py-3 space-y-2">
                {sendResult.isTest ? (
                  <p className="text-white text-sm">
                    Test sent to your phone.{' '}
                    {sendResult.sent === 0 && <span className="text-red-400">Delivery failed — check errors below.</span>}
                  </p>
                ) : (
                  <p className="text-white text-sm">
                    Sent to <span className="font-semibold">{sendResult.sent}</span> of{' '}
                    <span className="font-semibold">{sendResult.total}</span> recipients.
                  </p>
                )}
                {sendResult.errors && sendResult.errors.length > 0 && (
                  <p className="text-red-400 text-xs">
                    {sendResult.errors.length} error(s): {sendResult.errors[0]}
                  </p>
                )}
                {/* Full log after bulk send completion */}
                {!sendResult.isTest && sendProgress && sendProgress.log.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border-t border-white/10 pt-2 space-y-0.5">
                    <p className="text-white/20 text-xs uppercase tracking-widest mb-1">Sent to</p>
                    {sendProgress.log.map((line, i) => (
                      <p key={i} className="text-white/30 text-xs font-mono">{line}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Confirmation checkbox — required before bulk send */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendConfirmed}
                onChange={(e) => setSendConfirmed(e.target.checked)}
                className="mt-0.5 flex-shrink-0 accent-white"
              />
              <span className="text-xs text-white/40 leading-relaxed">
                I confirm I want to send this message to the selected audience.
              </span>
            </label>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={sending || sendingTest || !sendConfirmed}
                className="flex-1 py-3 bg-white text-black font-semibold text-sm tracking-widest uppercase rounded-sm hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending…' : 'Send Message'}
              </button>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={sending || sendingTest}
                className="px-5 py-3 border border-white/20 text-white/60 font-semibold text-sm tracking-widest uppercase rounded-sm hover:border-white/50 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sendingTest ? 'Sending…' : 'Send Test'}
              </button>
            </div>
            <p className="text-white/20 text-xs -mt-2">Test sends only to your phone.</p>
          </form>
        )}

        {/* ── SEND TAB — Message History ── */}
        {tab === 'send' && (
          <div className="mt-8 space-y-3">
            <button
              onClick={() => setHistoryExpanded((v) => !v)}
              className="flex items-center justify-between w-full text-left"
            >
              <p className="text-xs uppercase tracking-widest text-white/30">Message History</p>
              <span className="text-white/30 text-xs">{historyExpanded ? '▲' : '▼'}</span>
            </button>

            {historyExpanded && (
              loadingHistory ? (
                <p className="text-white/30 text-sm">Loading…</p>
              ) : messageHistory.length === 0 ? (
                <p className="text-white/30 text-sm">No broadcasts yet.</p>
              ) : (
                <div className="space-y-2">
                  {messageHistory.map((entry) => (
                    <HistoryEntry key={entry.id} entry={entry} />
                  ))}
                </div>
              )
            )}
          </div>
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
                Date &amp; Time (Eastern) *
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

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-1.5">
                Series (optional)
              </label>
              <select
                value={evSeries}
                onChange={(e) => setEvSeries(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-sm px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/50 transition-colors"
              >
                <option value="">One-off / no series</option>
                <option value="Nothing Radio">Nothing Radio</option>
                <option value="Get a Room">Get a Room</option>
              </select>
              <p className="text-white/20 text-xs mt-1">Used to group and target by series when sending messages.</p>
            </div>

            {addEventError && <p className="text-red-400 text-xs">{addEventError}</p>}

            {addEventSuccess && (
              <div className="border border-white/10 rounded-sm px-4 py-4 space-y-4">
                <p className="text-white text-sm font-medium">{addEventSuccess}</p>

                {/* Event ID */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-widest text-white/30">Event ID</p>
                    <CopyButton text={newEventId} label="Copy ID" />
                  </div>
                  <p className="text-white/50 text-xs font-mono break-all">{newEventId}</p>
                </div>

                {/* iframe code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-widest text-white/30">Squarespace iframe</p>
                    <CopyButton text={newEventIframe} label="Copy iframe" />
                  </div>
                  <pre className="text-xs text-white/40 font-mono bg-black/40 border border-white/10 rounded-sm px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                    {newEventIframe}
                  </pre>
                </div>
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

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <form onSubmit={handleSaveTemplate} className="space-y-5">
            <p className="text-xs uppercase tracking-widest text-white/30">Confirmation SMS</p>

            <p className="text-white/40 text-xs leading-relaxed">
              Sent to everyone who RSVPs — whether via the web widget or by texting a keyword.
              Use <span className="font-mono text-white/60">{'{eventName}'}</span> and{' '}
              <span className="font-mono text-white/60">{'{eventDate}'}</span> as placeholders.
            </p>

            {loadingTemplate ? (
              <p className="text-white/30 text-sm">Loading…</p>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs uppercase tracking-widest text-white/40">
                      Message template
                    </label>
                    {savedTemplate !== null && (
                      <span className="text-[10px] uppercase tracking-widest text-white/30 border border-white/10 rounded-sm px-1.5 py-0.5">
                        Custom
                      </span>
                    )}
                  </div>
                  <textarea
                    value={smsTemplate}
                    onChange={(e) => { setSmsTemplate(e.target.value); setTemplateSuccess('') }}
                    rows={4}
                    required
                    className="w-full bg-transparent border border-white/20 rounded-sm px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-white/50 text-sm transition-colors resize-none"
                  />
                  <p className="text-white/20 text-xs mt-1">{smsTemplate.length} characters</p>
                </div>

                {/* Live preview */}
                <div className="border border-white/10 rounded-sm px-4 py-3 space-y-1">
                  <p className="text-xs uppercase tracking-widest text-white/20">Preview</p>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {smsTemplate
                      .replace('{eventName}', 'Sample Event')
                      .replace('{eventDate}', 'Saturday, June 7') || (
                      <span className="text-white/20 italic">Enter a template above</span>
                    )}
                  </p>
                </div>

                {templateError && <p className="text-red-400 text-xs">{templateError}</p>}
                {templateSuccess && <p className="text-green-400 text-xs">{templateSuccess}</p>}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={savingTemplate}
                    className="flex-1 py-3 bg-white text-black font-semibold text-sm tracking-widest uppercase rounded-sm hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingTemplate ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRevertTemplate}
                    disabled={savingTemplate || savedTemplate === null}
                    className="flex-1 py-3 border border-white/20 text-white/50 font-semibold text-sm tracking-widest uppercase rounded-sm hover:border-white/50 hover:text-white/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Revert to default
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
