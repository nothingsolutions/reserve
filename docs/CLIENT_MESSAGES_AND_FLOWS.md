# Client-Side Messages and Flows

All user-facing copy: SMS texts, widget screens, and API error messages. Use this to review wording and consistency.

---

## 1. SMS (Twilio) — Outbound Only

The app **sends** SMS in two cases. It does **not** send any automated reply when someone texts STOP; Twilio handles opt-out compliance.

### 1.1 Confirmation after RSVP

**When:** User submits the RSVP form and is successfully saved (first time for that event + phone).

**Source:** `src/app/api/rsvp/route.ts`

**Message (template):**
```
You're confirmed for {event.name} on {eventDate}. See you there! Reply STOP to opt out.
```

**Example:**  
`You're confirmed for Get a Room 24 on Saturday, March 15. See you there! Reply STOP to opt out.`

*(`eventDate` is formatted as weekday + month + day, e.g. "Saturday, March 15".)*

---

### 1.2 One-off message (admin)

**When:** Admin uses the **Send** tab and chooses "Everyone on the list" or a specific event, then sends.

**Source:** `src/app/api/admin/send/route.ts`

**Message:** Exactly what the admin types in the message field. No prefix or suffix is added by the app. Recipients are all (unique) RSVPs in the chosen scope, minus anyone in the `opt_outs` table.

**Flow:** Admin enters message → API sends that string to each phone via Twilio. No "Thanks for RSVPing" or other default text unless the admin includes it.

---

## 2. Widget (RSVP iframe) — On-Screen Copy

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
  *(Terms → https://nothingradio.com/tos, Privacy → https://nothingradio.com/privacy-policy.)*
- **Submit button:** "RSVP" (or "Confirming…" while submitting).
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

| Flow | What the user sees (widget) | What the user gets (SMS) |
|------|----------------------------|--------------------------|
| New RSVP success | "You're confirmed." + "Check your phone for a confirmation text." (+ optional flyer) | One confirmation: "You're confirmed for {event} on {date}. See you there! Reply STOP to opt out." |
| Same phone RSVPs again | "You're already registered." / "See you there." | No SMS. |
| Admin one-off send | N/A (admin only) | Exactly the message the admin typed (to all or event-specific list, minus opt-outs). |
| User replies STOP | N/A | No automated reply; number is added to opt_outs and excluded from future sends. |

---

## 5. Default / “Thanks for RSVPing” wording

- **SMS:** The only automatic SMS is the confirmation in §1.1. There is no separate "Thanks for RSVPing" message; that line is the confirmation itself ("You're confirmed for … See you there!").
- **Widget:** The default success state is the "You're confirmed." screen plus the subtext "Check your phone for a confirmation text." There is no other default "confirmed" or "thanks" copy unless you add it.

If you want to change the confirmation SMS or the "You're confirmed" / "See you there" wording, say what you’d like and we can update this doc and the code together.
