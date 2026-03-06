'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Country data ─────────────────────────────────────────────────────────────
type Country = { flag: string; name: string; dial: string; code: string; placeholder: string }

const COUNTRIES: Country[] = [
  { flag:'🇺🇸', name:'United States',   dial:'+1',   code:'US', placeholder:'(555) 000-0000' },
  { flag:'🇬🇧', name:'United Kingdom',  dial:'+44',  code:'GB', placeholder:'07700 000000' },
  { flag:'🇨🇦', name:'Canada',          dial:'+1',   code:'CA', placeholder:'(555) 000-0000' },
  { flag:'🇦🇺', name:'Australia',       dial:'+61',  code:'AU', placeholder:'04 0000 0000' },
  { flag:'🇩🇪', name:'Germany',         dial:'+49',  code:'DE', placeholder:'0151 00000000' },
  { flag:'🇫🇷', name:'France',          dial:'+33',  code:'FR', placeholder:'06 00 00 00 00' },
  { flag:'🇯🇵', name:'Japan',           dial:'+81',  code:'JP', placeholder:'090-0000-0000' },
  { flag:'🇰🇷', name:'South Korea',     dial:'+82',  code:'KR', placeholder:'010-0000-0000' },
  { flag:'🇧🇷', name:'Brazil',          dial:'+55',  code:'BR', placeholder:'(11) 90000-0000' },
  { flag:'🇲🇽', name:'Mexico',          dial:'+52',  code:'MX', placeholder:'55 0000 0000' },
  { flag:'🇮🇳', name:'India',           dial:'+91',  code:'IN', placeholder:'00000 00000' },
  { flag:'🇨🇳', name:'China',           dial:'+86',  code:'CN', placeholder:'130 0000 0000' },
  { flag:'🇿🇦', name:'South Africa',    dial:'+27',  code:'ZA', placeholder:'060 000 0000' },
  { flag:'🇳🇬', name:'Nigeria',         dial:'+234', code:'NG', placeholder:'0801 000 0000' },
  { flag:'🇮🇹', name:'Italy',           dial:'+39',  code:'IT', placeholder:'320 000 0000' },
  { flag:'🇪🇸', name:'Spain',           dial:'+34',  code:'ES', placeholder:'600 000 000' },
  { flag:'🇳🇱', name:'Netherlands',     dial:'+31',  code:'NL', placeholder:'06 00000000' },
  { flag:'🇸🇪', name:'Sweden',          dial:'+46',  code:'SE', placeholder:'070 000 00 00' },
  { flag:'🇳🇴', name:'Norway',          dial:'+47',  code:'NO', placeholder:'400 00 000' },
  { flag:'🇩🇰', name:'Denmark',         dial:'+45',  code:'DK', placeholder:'20 00 00 00' },
  { flag:'🇨🇭', name:'Switzerland',     dial:'+41',  code:'CH', placeholder:'076 000 00 00' },
  { flag:'🇵🇹', name:'Portugal',        dial:'+351', code:'PT', placeholder:'910 000 000' },
  { flag:'🇵🇱', name:'Poland',          dial:'+48',  code:'PL', placeholder:'500 000 000' },
  { flag:'🇦🇷', name:'Argentina',       dial:'+54',  code:'AR', placeholder:'11 0000-0000' },
  { flag:'🇨🇱', name:'Chile',           dial:'+56',  code:'CL', placeholder:'9 0000 0000' },
  { flag:'🇸🇬', name:'Singapore',       dial:'+65',  code:'SG', placeholder:'8000 0000' },
  { flag:'🇳🇿', name:'New Zealand',     dial:'+64',  code:'NZ', placeholder:'021 000 0000' },
  { flag:'🇮🇪', name:'Ireland',         dial:'+353', code:'IE', placeholder:'085 000 0000' },
  { flag:'🇵🇭', name:'Philippines',     dial:'+63',  code:'PH', placeholder:'0917 000 0000' },
  { flag:'🇮🇩', name:'Indonesia',       dial:'+62',  code:'ID', placeholder:'0812-0000-0000' },
  { flag:'🇲🇾', name:'Malaysia',        dial:'+60',  code:'MY', placeholder:'012-000 0000' },
  { flag:'🇹🇭', name:'Thailand',        dial:'+66',  code:'TH', placeholder:'081 000 0000' },
  { flag:'🇻🇳', name:'Vietnam',         dial:'+84',  code:'VN', placeholder:'090 000 0000' },
  { flag:'🇦🇪', name:'UAE',             dial:'+971', code:'AE', placeholder:'050 000 0000' },
  { flag:'🇸🇦', name:'Saudi Arabia',    dial:'+966', code:'SA', placeholder:'050 000 0000' },
  { flag:'🇪🇬', name:'Egypt',           dial:'+20',  code:'EG', placeholder:'0100 000 0000' },
  { flag:'🇰🇪', name:'Kenya',           dial:'+254', code:'KE', placeholder:'0712 000000' },
  { flag:'🇬🇭', name:'Ghana',           dial:'+233', code:'GH', placeholder:'024 000 0000' },
  { flag:'🇵🇰', name:'Pakistan',        dial:'+92',  code:'PK', placeholder:'0300 0000000' },
  { flag:'🇹🇷', name:'Turkey',          dial:'+90',  code:'TR', placeholder:'0532 000 0000' },
  { flag:'🇺🇦', name:'Ukraine',         dial:'+380', code:'UA', placeholder:'050 000 0000' },
  { flag:'🇷🇺', name:'Russia',          dial:'+7',   code:'RU', placeholder:'8 (900) 000-0000' },
  { flag:'🇮🇱', name:'Israel',          dial:'+972', code:'IL', placeholder:'050-000-0000' },
  { flag:'🇬🇷', name:'Greece',          dial:'+30',  code:'GR', placeholder:'690 000 0000' },
  { flag:'🇷🇴', name:'Romania',         dial:'+40',  code:'RO', placeholder:'0720 000 000' },
  { flag:'🇭🇺', name:'Hungary',         dial:'+36',  code:'HU', placeholder:'06 20 000 0000' },
  { flag:'🇨🇿', name:'Czech Republic',  dial:'+420', code:'CZ', placeholder:'720 000 000' },
  { flag:'🇧🇪', name:'Belgium',         dial:'+32',  code:'BE', placeholder:'0470 00 00 00' },
  { flag:'🇦🇹', name:'Austria',         dial:'+43',  code:'AT', placeholder:'0650 000 0000' },
  { flag:'🇫🇮', name:'Finland',         dial:'+358', code:'FI', placeholder:'040 000 0000' },
  { flag:'🇭🇰', name:'Hong Kong',       dial:'+852', code:'HK', placeholder:'5000 0000' },
  { flag:'🇹🇼', name:'Taiwan',          dial:'+886', code:'TW', placeholder:'0912 000 000' },
  { flag:'🇨🇴', name:'Colombia',        dial:'+57',  code:'CO', placeholder:'300 000 0000' },
  { flag:'🇵🇪', name:'Peru',            dial:'+51',  code:'PE', placeholder:'912 000 000' },
]

// ── Types ────────────────────────────────────────────────────────────────────
type EventData = { id: string; name: string; date: string; description?: string; flyer_url?: string }
type Step = 'loading' | 'not_found' | 'phone-entry' | 'name-entry' | 'done' | 'already_registered' | 'error'

interface RSVPWidgetProps {
  eyebrow?: string
  mainTitle?: string
  subtitle?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatPhone(raw: string, dial: string): string {
  const v = raw.replace(/\D/g, '')
  if (dial === '+1') {
    const d = v.slice(0, 10)
    if (d.length >= 7) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
    if (d.length >= 4) return `(${d.slice(0,3)}) ${d.slice(3)}`
    if (d.length >= 1) return `(${d}`
    return ''
  }
  return v.slice(0, 12)
}

function isPhoneComplete(value: string, dial: string): boolean {
  const digits = value.replace(/\D/g, '')
  return dial === '+1' ? digits.length === 10 : digits.length >= 6
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RSVPWidget({ eyebrow: eyebrowProp, mainTitle: mainTitleProp, subtitle: subtitleProp }: RSVPWidgetProps) {
  const [eventId, setEventId] = useState<string | null>(null)
  const [event, setEvent] = useState<EventData | null>(null)
  const [step, setStep] = useState<Step>('loading')
  const [hideDate, setHideDate] = useState(false)

  // Phone step
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0])
  const [phoneValue, setPhoneValue] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [phoneError, setPhoneError] = useState(false)
  const [phoneApiError, setPhoneApiError] = useState('')
  const [consented, setConsented] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Name step — store the clean phone sent to API so PATCH can reuse it
  const [nameValue, setNameValue] = useState('')
  const [cleanPhone, setCleanPhone] = useState('')
  const [nameSaving, setNameSaving] = useState(false)

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  // Derived
  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dial.includes(searchQuery) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('event')
    setHideDate(params.get('hideDate') === '1')
    setEventId(id)
    if (!id) { setStep('not_found'); return }

    fetch(`/api/events/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStep('not_found'); return }
        setEvent(data)
        setStep('phone-entry')
      })
      .catch(() => setStep('error'))
  }, [])

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  // ── Focus search when dropdown opens ─────────────────────────────────────
  useEffect(() => {
    if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [dropdownOpen])

  // ── Focus name input when entering name step ──────────────────────────────
  useEffect(() => {
    if (step === 'name-entry') setTimeout(() => nameRef.current?.focus(), 350)
  }, [step])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePhoneInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneValue(formatPhone(e.target.value, selectedCountry.dial))
  }, [selectedCountry.dial])

  const selectCountry = useCallback((code: string) => {
    const c = COUNTRIES.find(x => x.code === code)
    if (!c) return
    setSelectedCountry(c)
    setPhoneValue('')
    setDropdownOpen(false)
    setSearchQuery('')
    setHighlightIndex(-1)
    setTimeout(() => phoneRef.current?.focus(), 50)
  }, [])

  const handleSearchKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex(i => Math.min(i + 1, filteredCountries.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIndex >= 0 && filteredCountries[highlightIndex]) {
        selectCountry(filteredCountries[highlightIndex].code)
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false)
    }
  }, [filteredCountries, highlightIndex, selectCountry])

  // API fires here — at RSVP button click
  const handleRSVP = useCallback(async () => {
    if (submitting) return
    setPhoneApiError('')

    if (!isPhoneComplete(phoneValue, selectedCountry.dial)) {
      setPhoneError(true)
      setTimeout(() => setPhoneError(false), 1200)
      return
    }

    setSubmitting(true)

    // Send clean dial+digits — no formatting characters
    const digitsOnly = phoneValue.replace(/\D/g, '')
    const fullPhone = `${selectedCountry.dial}${digitsOnly}`
    setCleanPhone(fullPhone)

    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', phone: fullPhone, eventId, consented: true }),
      })
      const data = await res.json()

      if (data.status === 'already_registered') {
        setStep('already_registered')
      } else if (!res.ok) {
        setPhoneApiError(data.error ?? 'Something went wrong. Please try again.')
      } else if (data.returning === true) {
        // Returning attendee — we already have their name, skip the name step
        setStep('done')
      } else {
        // New person — ask for name (optional)
        setStep('name-entry')
      }
    } catch {
      setPhoneApiError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [submitting, phoneValue, selectedCountry, eventId])

  // Name is optional — PATCH only if they typed something
  const handleSubmitName = useCallback(async () => {
    if (nameSaving) return
    const trimmed = nameValue.trim()

    if (!trimmed) {
      // No name typed — skip to done without a PATCH
      setStep('done')
      return
    }

    setNameSaving(true)
    try {
      await fetch('/api/rsvp/name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, eventId, name: trimmed }),
      })
    } catch {
      // Non-fatal — RSVP is already saved
    } finally {
      setNameSaving(false)
    }
    setStep('done')
  }, [nameSaving, nameValue, cleanPhone, eventId])

  const handleSkipName = useCallback(() => setStep('done'), [])

  // ── Computed title fields ────────────────────────────────────────────────
  const eyebrowText = eyebrowProp ?? (event ? new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '')
  const mainTitleText = mainTitleProp ?? event?.name ?? ''
  const subtitleText = subtitleProp ?? event?.description ?? ''

  // ── Loading ───────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 320 }}>
        <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Not found / generic error ─────────────────────────────────────────────
  if (step === 'not_found' || step === 'error') {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 320 }}>
        <p style={{ color: '#555', fontSize: 14 }}>
          {step === 'not_found' ? 'Event not found.' : 'Something went wrong. Please refresh.'}
        </p>
      </div>
    )
  }

  // ── Already registered ────────────────────────────────────────────────────
  if (step === 'already_registered') {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p style={{ fontFamily: "'Helvetica Neue', 'Arial Narrow', sans-serif", fontStretch: 'condensed', fontWeight: 700, fontSize: 32, color: '#fff', marginBottom: 6 }}>Already in.</p>
        <p style={{ fontSize: 14, color: '#666' }}>You&apos;re already registered{event ? ` for ${event.name}` : ''}.</p>
      </div>
    )
  }

  // ── Shared title block ────────────────────────────────────────────────────
  const TitleBlock = () => (
    <div style={{ marginBottom: 28 }}>
      {!hideDate && eyebrowText && (
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
          {eyebrowText}
        </div>
      )}
      {mainTitleText && (
        <div style={{ fontFamily: "'Helvetica Neue', 'Arial Narrow', sans-serif", fontStretch: 'condensed', fontWeight: 700, fontSize: 40, lineHeight: 1, color: '#fff', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          {mainTitleText}
        </div>
      )}
      {subtitleText && (
        <div style={{ marginTop: 10, fontSize: 14, color: '#666' }}>{subtitleText}</div>
      )}
    </div>
  )

  // ── Done ──────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div style={{ animation: 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
        <TitleBlock />
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p style={{ fontFamily: "'Helvetica Neue', 'Arial Narrow', sans-serif", fontStretch: 'condensed', fontWeight: 700, fontSize: 32, color: '#fff', marginBottom: 6 }}>You&apos;re in.</p>
          <p style={{ fontSize: 14, color: '#666' }}>
            {nameValue.trim() ? `We'll hit you when it's time, ${nameValue.trim()}.` : "We'll hit you when it's time."}
          </p>
        </div>
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }`}</style>
      </div>
    )
  }

  // ── Name entry ────────────────────────────────────────────────────────────
  if (step === 'name-entry') {
    return (
      <div style={{ animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
        <TitleBlock />
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p style={{ fontFamily: "'Helvetica Neue', 'Arial Narrow', sans-serif", fontStretch: 'condensed', fontWeight: 700, fontSize: 32, color: '#fff', marginBottom: 6 }}>You&apos;re in.</p>
          <p style={{ fontSize: 14, color: '#666' }}>What should we call you?</p>
        </div>

        <div
          style={{
            display: 'flex', alignItems: 'center',
            background: '#181818',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 100,
            padding: '5px 5px 5px 18px',
            transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
            animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) 0.1s both',
          }}
          onFocus={e => { (e.currentTarget as HTMLDivElement).style.background = '#212121'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(255,255,255,0.06)' }}
          onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { (e.currentTarget as HTMLDivElement).style.background = '#181818'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' } }}
        >
          <input
            ref={nameRef}
            type="text"
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmitName() }}
            placeholder="Your name"
            autoComplete="given-name"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 400, minWidth: 0, padding: '8px 4px', caretColor: '#fff' }}
          />
          <button
            onClick={handleSubmitName}
            disabled={nameSaving}
            style={{
              flexShrink: 0, background: nameSaving ? 'rgba(255,255,255,0.5)' : '#fff', color: '#000',
              border: 'none', borderRadius: 100, padding: '12px 22px',
              fontFamily: "'Helvetica Neue', 'Arial Narrow', sans-serif", fontStretch: 'condensed', fontSize: 13, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: nameSaving ? 'not-allowed' : 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => { if (!nameSaving) { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(255,255,255,0.2)' } }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '' }}
          >
            {nameSaving ? '…' : 'Done'}
          </button>
        </div>

        {/* Skip link */}
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <button
            onClick={handleSkipName}
            style={{ background: 'none', border: 'none', color: '#444', fontSize: 12, cursor: 'pointer', padding: '4px 8px', fontFamily: "'DM Sans', sans-serif", textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            Skip
          </button>
        </div>

        <style>{`
          @keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
      </div>
    )
  }

  // ── Phone entry ───────────────────────────────────────────────────────────
  return (
    <div style={{ animation: 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
      <TitleBlock />

      {/* Input row */}
      <div
        ref={dropdownRef}
        style={{
          display: 'flex', alignItems: 'center',
          background: phoneError ? '#1a0d0d' : '#181818',
          border: `1px solid ${phoneError ? 'rgba(255,71,71,0.6)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: phoneError ? '0 0 0 3px rgba(255,71,71,0.15)' : 'none',
          borderRadius: 100,
          padding: '5px 5px 5px 6px',
          transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
          position: 'relative',
          animation: 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both',
        }}
      >
        {/* Country trigger */}
        <button
          type="button"
          onClick={() => { setDropdownOpen(v => !v); if (!dropdownOpen) setSearchQuery('') }}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 8px',
            borderRadius: 100,
            cursor: 'pointer', userSelect: 'none',
            background: 'transparent', border: 'none',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 17, lineHeight: 1 }}>{selectedCountry.flag}</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{selectedCountry.dial}</span>
          <svg
            width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="#666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
          >
            <path d="M1 1l4 4 4-4"/>
          </svg>
        </button>

        {/* Country dropdown */}
        {dropdownOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, overflow: 'hidden',
            zIndex: 100,
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            animation: 'dropIn 0.18s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setHighlightIndex(-1) }}
                onKeyDown={handleSearchKey}
                placeholder="Search country..."
                autoComplete="off"
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                  padding: '8px 12px', color: '#fff',
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: 'none',
                }}
              />
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', padding: '6px 0' }}>
              {filteredCountries.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: '#555', fontSize: 13 }}>No countries found</div>
              ) : (
                filteredCountries.map((c, i) => (
                  <div
                    key={c.code}
                    onMouseDown={() => selectCountry(c.code)}
                    onMouseEnter={() => setHighlightIndex(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 16px', cursor: 'pointer', fontSize: 14,
                      background: c.code === selectedCountry.code
                        ? 'rgba(255,255,255,0.08)'
                        : i === highlightIndex
                          ? 'rgba(255,255,255,0.06)'
                          : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{c.flag}</span>
                    <span style={{ flex: 1, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                    <span style={{ color: '#666', fontSize: 12, flexShrink: 0 }}>{c.dial}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 6px' }} />

        {/* Phone input */}
        <input
          ref={phoneRef}
          type="tel"
          value={phoneValue}
          onChange={handlePhoneInput}
          onKeyDown={e => { if (e.key === 'Enter') handleRSVP() }}
          placeholder={selectedCountry.placeholder}
          autoComplete="tel"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: '#fff', fontFamily: "'DM Sans', sans-serif",
            fontSize: 15, fontWeight: 400, letterSpacing: '0.02em',
            minWidth: 0, padding: '6px 4px', caretColor: '#fff',
          }}
        />

        {/* RSVP button */}
        <button
          type="button"
          onClick={handleRSVP}
          disabled={submitting || !consented}
          style={{
            flexShrink: 0, background: (submitting || !consented) ? 'rgba(255,255,255,0.35)' : '#fff', color: '#000',
            border: 'none', borderRadius: 100, padding: '12px 22px',
            fontFamily: "'Helvetica Neue', 'Arial Narrow', sans-serif", fontStretch: 'condensed', fontSize: 13, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: (submitting || !consented) ? 'not-allowed' : 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
          onMouseEnter={e => { if (!submitting && consented) { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(255,255,255,0.2)' } }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '' }}
          onMouseDown={e => { if (!submitting && consented) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)' }}
          onMouseUp={e => { if (!submitting && consented) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)' }}
        >
          {submitting && (
            <span style={{ width: 12, height: 12, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          )}
          {submitting ? 'Saving…' : 'RSVP'}
        </button>
      </div>

      {/* API error below input row */}
      {phoneApiError && (
        <p style={{ marginTop: 10, fontSize: 12, color: '#ff6b6b', paddingLeft: 4 }}>{phoneApiError}</p>
      )}

      {/* Consent checkbox */}
      <label
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 14, cursor: 'pointer',
          animation: 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.25s both',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <span
          onClick={() => setConsented(v => !v)}
          style={{
            flexShrink: 0, marginTop: 2, width: 14, height: 14, borderRadius: 3,
            border: `1.5px solid ${consented ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'}`,
            background: consented ? '#fff' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          {consented && (
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <polyline points="1,3 3,5 7,1" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
        <span
          onClick={() => setConsented(v => !v)}
          style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}
        >
          By submitting, you agree to receive updates and reminders via SMS. Msg &amp; data rates may apply. Reply STOP to opt out at any time.{' '}
          <a href="https://nothingradio.com/tos" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#666', textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms</a>
          {' '}&amp;{' '}
          <a href="https://nothingradio.com/privacy-policy" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#666', textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy</a>.
        </span>
      </label>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dropIn { from { opacity:0; transform:translateY(-6px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
