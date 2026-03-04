# RSVP System

Phone-number RSVP widget + admin for Nothing Radio events.
Hosted on Vercel. DB on Supabase. SMS via Twilio.

---

## How it works

- **Widget** (iframe on Squarespace): user enters name + phone, consents, submits → gets a confirmation text.
- **Admin** (`/admin`): password-protected; create events, view RSVP counts, expand attendee lists, see per-person event history, send one-off messages to all RSVPs or a specific event's list.
- **STOP handling**: incoming STOP replies from Twilio mark the number as opted out.

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`.
3. From **Settings > API**, copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Twilio

1. Create an account at [twilio.com](https://twilio.com).
2. Buy a phone number capable of sending/receiving SMS.
3. From the console, copy:
   - **Account SID** → `TWILIO_ACCOUNT_SID`
   - **Auth Token** → `TWILIO_AUTH_TOKEN`
   - Your phone number (E.164) → `TWILIO_PHONE_NUMBER`
4. After deploying (step 4), set the **Inbound SMS webhook** on your number to:
   `https://YOUR_APP_URL/api/twilio/webhook` (HTTP POST)

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```
cp .env.example .env.local
```

Generate a secure `ADMIN_SECRET`:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in [vercel.com](https://vercel.com).
3. Add all env vars from `.env.local` to the Vercel project (Settings > Environment Variables).
4. Deploy. Note your app URL (e.g. `https://your-app.vercel.app`).
5. Update `APP_URL` in Vercel env vars to match your deployed URL.
6. Set the Twilio inbound webhook (step 2.4 above).

### 5. Add the iframe to Squarespace

On the Squarespace page for an event, add a **Code** block and paste:

```html
<iframe
  src="https://YOUR_APP_URL/rsvp-widget?event=EVENT_ID"
  title="RSVP"
  width="100%"
  height="520"
  style="border:none; background:#000;"
></iframe>
```

- Replace `YOUR_APP_URL` with your Vercel URL.
- Replace `EVENT_ID` with the UUID from the "Create Event" screen in `/admin` (shown after creation).

---

## Admin usage

Go to `https://YOUR_APP_URL/admin` and sign in with your `ADMIN_PASSWORD`.

| Tab | What it does |
|-----|-------------|
| **Events** | List of events, RSVP count per event, expand to see attendee names |
| **People** | All unique RSVPs with their full event history |
| **Send** | Send a one-off SMS — choose "Everyone" or a specific event |
| **+ Event** | Create a new event (name, date/time, optional description + flyer URL) |

---

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your credentials
npm run dev
```

The app runs at `http://localhost:3000`.
- Widget: `http://localhost:3000/rsvp-widget?event=YOUR_EVENT_ID`
- Admin: `http://localhost:3000/admin`

> Note: Twilio webhook validation is skipped in development (`NODE_ENV !== 'production'`).

---

## Security notes

- All Twilio and Supabase secrets live in env vars only (never in client-side code).
- Admin routes are protected by a signed session cookie (`ADMIN_SECRET`).
- CORS is restricted to `APP_URL` and `SQUARESPACE_DOMAIN` in production.
- RSVP submit and admin send routes have IP-based rate limiting.
- Twilio inbound webhook validates request signatures in production.
- Phone numbers and names are never returned to the public widget — only to the authenticated admin.
