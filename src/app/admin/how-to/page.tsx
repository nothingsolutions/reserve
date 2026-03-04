'use client'

import { useState } from 'react'
import Link from 'next/link'

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-xs text-white/40 font-mono">
        {number}
      </div>
      <div className="space-y-2 pt-0.5 min-w-0">
        <p className="text-white text-sm font-medium">{title}</p>
        <div className="text-white/50 text-sm leading-relaxed space-y-2">{children}</div>
      </div>
    </div>
  )
}

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group mt-2">
      <pre className="bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-xs text-white/70 font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 text-xs text-white/30 hover:text-white/70 transition-colors px-2 py-1 bg-black/50 rounded"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <p className="text-xs uppercase tracking-widest text-white/30 border-b border-white/10 pb-3">
        {title}
      </p>
      <div className="space-y-6">{children}</div>
    </div>
  )
}

export default function HowToPage() {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://YOUR_VERCEL_URL'

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/30">Nothing Radio</p>
          <h1 className="text-base font-semibold text-white">How To</h1>
        </div>
        <Link
          href="/admin"
          className="text-xs text-white/30 hover:text-white/70 transition-colors uppercase tracking-widest"
        >
          ← Admin
        </Link>
      </div>

      <div className="px-5 py-8 max-w-2xl mx-auto space-y-12">

        {/* ── SECTION 1: New event ── */}
        <Section title="Creating a new event">
          <Step number={1} title="Go to the + Event tab">
            <p>In the admin, click the <strong className="text-white/80">+ Event</strong> tab at the top.</p>
          </Step>

          <Step number={2} title="Fill in the event details">
            <ul className="space-y-1 list-disc list-inside">
              <li><strong className="text-white/70">Event Name</strong> — e.g. "Nothing Radio — April"</li>
              <li><strong className="text-white/70">Date &amp; Time</strong> — pick the date and start time</li>
              <li><strong className="text-white/70">Description</strong> — optional; shows in the RSVP widget below the event name</li>
              <li><strong className="text-white/70">Flyer Image URL</strong> — optional; paste a direct link to your flyer image (e.g. from Google Drive, Dropbox, or your Squarespace media library). It shows after someone RSVPs.</li>
            </ul>
          </Step>

          <Step number={3} title="Click Create Event — copy the Event ID">
            <p>
              After creating, you&apos;ll see a message like:<br />
              <em className="text-white/40">&ldquo;Event created. Copy its ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx&rdquo;</em>
            </p>
            <p>
              <strong className="text-white/70">Copy that UUID.</strong> You need it for the iframe on your Squarespace page.
            </p>
          </Step>

          <Step number={4} title="Confirm it appears in the Events tab">
            <p>Click the <strong className="text-white/80">Events</strong> tab — your new event should show with 0 RSVPs. You&apos;re done.</p>
          </Step>
        </Section>

        {/* ── SECTION 2: Squarespace iframe ── */}
        <Section title="Adding the RSVP widget to Squarespace">
          <Step number={1} title="Open the Squarespace page for that event">
            <p>Log in to Squarespace and navigate to the page where you want the RSVP box to appear.</p>
          </Step>

          <Step number={2} title="Add a Code block">
            <p>
              Click the <strong className="text-white/80">+</strong> to add a block → choose <strong className="text-white/80">Code</strong>.
              If you&apos;re on a newer Squarespace version, look for <strong className="text-white/80">Embed</strong> or <strong className="text-white/80">Code Injection</strong>.
            </p>
          </Step>

          <Step number={3} title="Paste this iframe code — replace EVENT_ID">
            <p>Copy the snippet below, then replace <code className="text-white/70 bg-white/10 px-1 rounded">YOUR_EVENT_ID</code> with the UUID you copied when you created the event.</p>
            <Code>{`<iframe\n  src="${appUrl}/rsvp-widget?event=YOUR_EVENT_ID"\n  title="RSVP"\n  width="100%"\n  height="520"\n  style="border:none; background:#000;"\n></iframe>`}</Code>
          </Step>

          <Step number={4} title="Save and preview">
            <p>Save the block and preview the page. You should see the black RSVP form with your event name, date, and the name/phone fields.</p>
            <p>If the widget shows &ldquo;Event not found&rdquo;, double-check that the Event ID in the iframe URL matches exactly what was shown after creation.</p>
          </Step>

          <Step number={5} title="Test it">
            <p>Enter a name and phone number, check the consent box, and click RSVP. Then go to the <strong className="text-white/80">Events</strong> tab in admin — you should see 1 RSVP. Expand the event to see the name.</p>
            <p className="text-white/30 text-xs">Note: SMS confirmation won&apos;t send until your Twilio phone number is added and Vercel is redeployed.</p>
          </Step>
        </Section>

        {/* ── SECTION 3: Sending a message ── */}
        <Section title="Sending a message to attendees">
          <Step number={1} title="Go to the Send tab">
            <p>In the admin, click <strong className="text-white/80">Send</strong>.</p>
          </Step>

          <Step number={2} title="Choose your recipients">
            <ul className="space-y-1 list-disc list-inside">
              <li><strong className="text-white/70">Everyone on the list</strong> — sends to all RSVPs across all events (good for new event announcements)</li>
              <li><strong className="text-white/70">A specific event</strong> — sends only to people who RSVP&apos;d to that event (good for reminders)</li>
            </ul>
            <p>Anyone who replied STOP is automatically excluded.</p>
          </Step>

          <Step number={3} title="Type your message and send">
            <p>Write your message and click <strong className="text-white/80">Send Message</strong>. You&apos;ll see a confirmation showing how many messages were sent.</p>
          </Step>
        </Section>

        {/* ── Quick link ── */}
        <div className="border border-white/10 rounded-sm px-4 py-4 space-y-1">
          <p className="text-xs uppercase tracking-widest text-white/30">Widget preview link</p>
          <p className="text-white/50 text-sm">Test any event&apos;s widget directly in your browser:</p>
          <Code>{`${appUrl}/rsvp-widget?event=YOUR_EVENT_ID`}</Code>
        </div>

      </div>
    </div>
  )
}
