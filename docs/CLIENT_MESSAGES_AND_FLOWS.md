# Client-Side Messages and Flows

All user-facing copy: SMS texts, widget screens, and API error messages. Use this to review wording and consistency.

---

## 1. SMS (Twilio) -- Outbound Only

The app **sends** SMS/MMS in three cases. It does **not** send any automated reply when someone texts STOP; Twilio handles opt-out compliance.

### 1.1 Welcome MMS (first-time subscribers only)

**When:** A phone number RSVPs for the very first time AND the welcome message is **enabled** in Settings.

**Source:** `src/app/api/rsvp/route.ts` (web RSVP), `src/app/api/twilio/webhook/route.ts` (SMS keyword RSVP)

**Type:** MMS -- includes a `.vcf` contact card attachment. The URL comes from the `VCARD_URL` env var (recommended when the file is on Squarespace, e.g. `https://nothingradio.com/s/nothing-radio.vcf`), or falls back to `APP_URL` + `/nothing-radio.vcf` from this app's `public/` folder.

**Message (editable in Settings -> Welcome Message):**
```
Welcome to Nothing Radio. You're confirmed for {eventName} on {eventDate}. Save this number to stay in the loop. Reply STOP to opt out.
```

**Toggle:** Admin can enable/disable this in Settings. When **off**, first-timers receive the regular confirmation SMS (section 1.2) instead. The toggle defaults to **off** -- you must explicitly enable it.

**Tracking:** `subscribers.welcome_sent_at` is set after a successful send. Subsequent RSVPs by the same phone never trigger this message again.

**One-off backfill for existing subscribers:** Use the Send tab -> "Everyone on the list" with the media URL field set to your public vCard URL (same as `VCARD_URL`, or `https://YOUR_APP_URL/nothing-radio.vcf` if you host it only on the app).

---

### 1.2 Confirmation after RSVP

**When:** User submits the RSVP form and is successfully saved (first time for that event + phone). Sent to **all** subscribers except first-timers who received the welcome MMS instead.

**Source:** `src/app/api/rsvp/route.ts`

**Message (template, editable in Settings -> Confirmation SMS):**
```
Nothing Radio: You're confirmed for {eventName} on {eventDate}. See you there! Reply STOP to opt out.
```

**Example:**
`Nothing Radio: You're confirmed for Get a Room 24 on Saturday, March 15. See you there! Reply STOP to opt out.`

*(`eventDate` is formatted as weekday + month + day, e.g. "Saturday, March 15".)*

---

### 1.3 One-off message (admin)

**When:** Admin uses the **Send** tab and chooses "Everyone on the list" or a specific event, then sends.

**Source:** `src/app/api/admin/send/route.ts`

**Message:** Exactly what the admin types in the message field. No prefix or suffix is added by the app. Recipients are all (unique) RSVPs in the chosen scope, minus anyone in the `opt_outs` table.

**Flow:** Admin enters message -> API sends that string to each phone via Twilio. Supports an optional media URL for MMS (e.g. attaching the contact card or a flyer image).

---

## 2. Widget (RSVP iframe) -- On-Screen Copy

**Source:** `src/app/rsvp-widget/RSVPWidget.tsx`

### 2.1 Loading

- No text; spinner only.

### 2.2 Event not found

- **Line:** "Event not found."

### 2.3 Error (network / fetch failure)

- **Line:** "Something went wrong. Please refresh and try again."

### 2.4 Already registered

Shown when the same phone RSVPs again for the same event.

- **Heading:** Event name (from API).
- **Subheading (if date not hidden):** `{formatDate(event.date)} · {formatTime(event.date)}`
- **Body:** "You're already registered."
- **Footer:** "See you there."

### 2.5 Confirmed (success after new RSVP)

- **Heading:** Event name.
- **Subheading (if date not hidden):** Same date/time as above.
- **Body:** "You're confirmed."
- **Subtext:** "Check your phone for a confirmation text."
- **Optional:** Flyer image if `event.flyer_url` is set.

### 2.6 Form (main RSVP screen)

- **Heading:** Event name.
- **Subheading (if date not hidden):** Event date and time.
- **Optional:** Event description below.
- **Labels:** "Name", "Phone Number".
- **Placeholders:** "Your name", "(555) 123-4567".
- **Consent (full text):**
  "By submitting, you agree to receive updates and reminders via SMS. Msg & data rates may apply. Reply STOP to opt out at any time. Terms & Privacy."
  *(Terms -> https://nothingradio.com/tos, Privacy -> https://nothingradio.com/privacy-policy.)*
- **Submit button:** "RSVP" (or "Confirming..." while submitting).
- **Inline errors:** Shown from API (see section 3).

---

## 3. API Error Messages (shown in widget)

These are returned by the API and displayed in the widget as the red `fieldError` under the form.

**Source:** `src/app/api/rsvp/route.ts` (and widget displays whatever `data.error` is).

| Condition | Message |
|-----------|--------|
| Rate limit (429) | "Too many requests. Please try again later." |
| Invalid JSON body | "Invalid request body" |
| Missing name/phone/event/consent | "All fields are required." |
| Invalid phone number | "Invalid phone number." |
| Event not found | "Event not found." |
| DB insert failure (500) | "Could not save your RSVP. Please try again." |
| Network/other (catch) | "Network error. Please try again." |
| Any other `data.error` | Shown as-is. |

*(Already-registered is not an error; the widget shows the "You're already registered" screen and no SMS is sent.)*

---

## 4. Flows (summary)

| Flow | What the user sees (widget) | What the user gets (SMS/MMS) |
|------|----------------------------|--------------------------|
| First-ever RSVP + welcome on | "You're confirmed." + "Check your phone for a confirmation text." | Welcome MMS with contact card attachment |
| First-ever RSVP + welcome off | "You're confirmed." + "Check your phone for a confirmation text." | Regular confirmation SMS |
| Returning subscriber RSVPs | "You're confirmed." + "Check your phone for a confirmation text." | Regular confirmation SMS |
| Same phone RSVPs again (same event) | "You're already registered." / "See you there." | No SMS. |
| Admin one-off send | N/A (admin only) | Exactly the message the admin typed (to all or event-specific list, minus opt-outs). |
| User replies STOP | N/A | No automated reply; number is added to opt_outs and excluded from future sends. |

---

## 5. Data model (subscribers vs. rsvps)

Two tables -- different jobs:

- **`subscribers`** -- one row per unique phone, ever. Tracks: name, when they first joined (`created_at`), whether the welcome card was sent (`welcome_sent_at`). Powers the People tab.
- **`rsvps`** -- one row per phone per event. Source of truth for "who RSVPed to what." Powers event-specific broadcasts and the event list under each person in the People tab. Never modified by the welcome feature.

Event-specific broadcasts always query `rsvps WHERE event_id = X`. The `subscribers` table is never consulted for broadcast targeting.

---

## 6. Default wording

- **SMS (confirmation):** The only automatic non-welcome SMS is the confirmation in section 1.2. There is no separate "Thanks for RSVPing" message; that line is the confirmation itself.
- **MMS (welcome):** The welcome MMS in section 1.1 replaces the confirmation SMS for first-timers -- it is one message, not two. The default text includes both the welcome and the confirmation.
- **Widget:** The default success state is the "You're confirmed." screen plus the subtext "Check your phone for a confirmation text." There is no other default copy unless you add it.

If you want to change any message wording, say what you'd like and we can update this doc and the code together.
