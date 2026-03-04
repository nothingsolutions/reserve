'use client'

import { useState, useEffect } from 'react'

type EventData = {
  id: string
  name: string
  date: string
  description?: string
  flyer_url?: string
}

type Step =
  | 'loading'
  | 'form'
  | 'submitting'
  | 'confirmed'
  | 'already_registered'
  | 'error'
  | 'not_found'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function RSVPWidget() {
  const [eventId, setEventId] = useState<string | null>(null)
  const [event, setEvent] = useState<EventData | null>(null)
  const [step, setStep] = useState<Step>('loading')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [consented, setConsented] = useState(false)
  const [fieldError, setFieldError] = useState('')

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('event')
    setEventId(id)
    if (!id) { setStep('not_found'); return }

    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setStep('not_found'); return }
        setEvent(data)
        setStep('form')
      })
      .catch(() => setStep('error'))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldError('')
    if (!consented) { setFieldError('Please check the consent box to continue.'); return }
    setStep('submitting')

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, eventId, consented }),
      })
      const data = await res.json()

      if (!res.ok) {
        setFieldError(data.error ?? 'Something went wrong. Please try again.')
        setStep('form')
      } else if (data.status === 'already_registered') {
        setStep('already_registered')
      } else {
        setStep('confirmed')
      }
    } catch {
      setFieldError('Network error. Please try again.')
      setStep('form')
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (step === 'not_found') {
    return (
      <div className="py-12 text-center">
        <p className="text-white/40 text-sm">Event not found.</p>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="py-12 text-center">
        <p className="text-white/40 text-sm">Something went wrong. Please refresh and try again.</p>
      </div>
    )
  }

  // ── Already registered ─────────────────────────────────────────────────────
  if (step === 'already_registered') {
    return (
      <div className="py-10 px-6 text-center space-y-3">
        <p className="text-lg font-semibold tracking-wide text-white">{event?.name}</p>
        {event && (
          <p className="text-white/40 text-sm">
            {formatDate(event.date)} &middot; {formatTime(event.date)}
          </p>
        )}
        <div className="pt-4 space-y-1">
          <p className="text-white text-base">You&apos;re already registered.</p>
          <p className="text-white/40 text-sm">See you there.</p>
        </div>
      </div>
    )
  }

  // ── Confirmed ──────────────────────────────────────────────────────────────
  if (step === 'confirmed') {
    return (
      <div className="py-10 px-6 text-center space-y-4">
        <p className="text-lg font-semibold tracking-wide text-white">{event?.name}</p>
        {event && (
          <p className="text-white/40 text-sm">
            {formatDate(event.date)} &middot; {formatTime(event.date)}
          </p>
        )}
        <div className="pt-2 space-y-2">
          <p className="text-2xl font-bold text-white">You&apos;re confirmed.</p>
          <p className="text-white/50 text-sm">Check your phone for a confirmation text.</p>
        </div>
        {event?.flyer_url && (
          <div className="pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.flyer_url}
              alt={`${event.name} flyer`}
              className="max-w-full rounded-sm mx-auto"
            />
          </div>
        )}
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="px-6 py-8 space-y-6">
      {event && (
        <div className="text-center space-y-1">
          <p className="text-lg font-semibold tracking-wide text-white">{event.name}</p>
          <p className="text-white/40 text-sm">
            {formatDate(event.date)} &middot; {formatTime(event.date)}
          </p>
          {event.description && (
            <p className="text-white/40 text-sm pt-1 leading-relaxed">{event.description}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="rsvp-name" className="block text-xs uppercase tracking-widest text-white/40 mb-1.5">
            Name
          </label>
          <input
            id="rsvp-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            autoComplete="name"
            className="w-full bg-transparent border border-white/20 rounded-sm px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-white/50 text-sm transition-colors"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="rsvp-phone" className="block text-xs uppercase tracking-widest text-white/40 mb-1.5">
            Phone Number
          </label>
          <input
            id="rsvp-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            required
            autoComplete="tel"
            className="w-full bg-transparent border border-white/20 rounded-sm px-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-white/50 text-sm transition-colors"
          />
        </div>

        {/* Consent */}
        <div className="flex items-start gap-3 pt-1">
          <input
            id="rsvp-consent"
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-white cursor-pointer"
          />
          <label htmlFor="rsvp-consent" className="text-xs text-white/40 leading-relaxed cursor-pointer">
            By submitting, you agree to receive event updates and reminders at this number.
            Message &amp; data rates may apply. Reply STOP to opt out at any time.
          </label>
        </div>

        {fieldError && (
          <p className="text-red-400 text-xs">{fieldError}</p>
        )}

        <button
          type="submit"
          disabled={step === 'submitting'}
          className="w-full py-3 bg-white text-black font-semibold text-sm tracking-widest uppercase rounded-sm hover:bg-white/90 active:bg-white/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-2"
        >
          {step === 'submitting' ? 'Confirming…' : 'RSVP'}
        </button>
      </form>
    </div>
  )
}
