# Twilio phone number availability

Notes on searching for and choosing a Twilio number for RSVP SMS (US, SMS-enabled).

## How we search (Twilio CLI)

Activate profile first:

```bash
twilio profiles:use cph
```

Search available local numbers (one area code per request):

```bash
twilio api:core:available-phone-numbers:local:list --country-code US --sms-enabled --area-code AREA --page-size 15
```

Search toll-free (no area code):

```bash
twilio api:core:available-phone-numbers:toll-free:list --country-code US --sms-enabled --page-size 15
```

Buy a number (once you pick one):

```bash
twilio api:core:incoming-phone-numbers:create --phone-number "+1XXXXXXXXXX"
```

Then set `TWILIO_PHONE_NUMBER` in Vercel to that E.164 value.

---

## Search results (what we’ve run)

| Area code | Region        | Result                          |
|-----------|---------------|---------------------------------|
| 212       | NYC (Manhattan) | No results                     |
| 646       | NYC (Manhattan) | No results                     |
| 718       | NYC (outer boroughs) | No results               |
| 347       | NYC (overlay) | **1 number:** `+13475148232`     |
| 714       | Orange County, CA | No results                   |

**Takeaway:** NYC numbers (212, 646, 718) are scarce; 347 had at least one SMS-capable local number available.

---

## What’s available (summary)

- **Local, NYC-ish:** 347 had inventory; 212/646/718 did not. Other nearby area codes to try: 917, 929, 516, 631, 201, 732, 908, 973.
- **Toll-free (800/888/877/866/855/844/833):** Often easier to find; ~\$2/mo; may need A2P registration for high volume (RSVP use is usually fine).
- **Other local US:** Dropping `--area-code` returns any US local numbers; more options, less control over region.

---

## Vanity / pattern search (Nothing Radio)

Use the **Contains** parameter (`--contains`) to find numbers that match a pattern. Twilio supports digits (0–9), letters (a–z, A–Z) matched by keypad spelling, and wildcards: `%` (any sequence), `*` (one character), `+` (pattern at start), `$` (pattern at end). Use quotes around patterns that include `%` so the shell doesn’t expand them.

| Pattern   | Intent |
|----------|--------|
| `%00%`   | Contains 00 (repeating zeros) |
| `%000%`  | Contains 000 |
| `%99%`   | Contains 99 (repeating nines) |
| `%999%`  | Contains 999 |
| `NOTHING`| Numbers that spell NOTHING on the keypad (6-6-8-4-4-6-4) |
| `RADIO`  | Numbers that spell RADIO on the keypad (7-2-3-4-6) |

**Repeating digits (zeros or nines):**

```bash
# Local, any US (optionally add --area-code 347 for NYC)
twilio api:core:available-phone-numbers:local:list --country-code US --sms-enabled --contains "%00%" --page-size 15
twilio api:core:available-phone-numbers:local:list --country-code US --sms-enabled --contains "%000%" --page-size 15
twilio api:core:available-phone-numbers:local:list --country-code US --sms-enabled --contains "%99%" --page-size 15
twilio api:core:available-phone-numbers:local:list --country-code US --sms-enabled --contains "%999%" --page-size 15

# Toll-free (no area code)
twilio api:core:available-phone-numbers:toll-free:list --country-code US --sms-enabled --contains "%00%" --page-size 15
twilio api:core:available-phone-numbers:toll-free:list --country-code US --sms-enabled --contains "%99%" --page-size 15
```

**Word patterns (NOTHING / RADIO):**

```bash
# Local
twilio api:core:available-phone-numbers:local:list --country-code US --sms-enabled --contains NOTHING --page-size 15
twilio api:core:available-phone-numbers:local:list --country-code US --sms-enabled --contains RADIO --page-size 15

# With NYC area code
twilio api:core:available-phone-numbers:local:list --country-code US --sms-enabled --area-code 347 --contains NOTHING --page-size 15
twilio api:core:available-phone-numbers:local:list --country-code US --sms-enabled --area-code 347 --contains RADIO --page-size 15

# Toll-free
twilio api:core:available-phone-numbers:toll-free:list --country-code US --sms-enabled --contains NOTHING --page-size 15
twilio api:core:available-phone-numbers:toll-free:list --country-code US --sms-enabled --contains RADIO --page-size 15
```

**CLI template:**

- Local: `twilio api:core:available-phone-numbers:local:list --country-code US --sms-enabled --contains "PATTERN" [--area-code 347] --page-size 15`
- Toll-free: `twilio api:core:available-phone-numbers:toll-free:list --country-code US --sms-enabled --contains "PATTERN" --page-size 15`

**Vanity / pattern search results (add as you run them):**

| Pattern   | Result |
|-----------|--------|
| `%000%`   | **15 numbers:** +17282200032 (FL), +17755000964 (NV), +17756000201 (NV), +17623490006 (GA), +15344000133 (WI), +18506000335 (FL), +14068000434 (MT), +17625000859 (GA), +17625000856 (GA), +16625000089 (MS), +15078000399 (MN), +19106000824 (NC), +15203800025 (AZ), +12764000052 (VA), +19375000041 (OH) |
| `%0000%`  | **15 numbers:** +17129000058 (IA), +12765000045 (VA), +12764000097 (VA), +19288000095 (AZ), +14136000096 (MA), +18644000037 (SC), +12768000017 (VA), +19898000051 (MI), +17575200004 (VA), +18083000067 (HI), +12765000062 (VA), +12296000083 (GA), +16284000032 (CA), +12296000052 (GA), +12766000043 (VA) |
| `%9999%`  | **15 numbers:** +15705399994 (PA), +17159999129 (WI), +18399993169 (SC), +15076099992 (MN), +12299992970 (GA), +18399992356 (SC), +12299994122 (GA), +19069999708 (US), +12299997201 (GA), +17159999520 (WI), +12299994956 (GA), +12299994155 (GA), +12299992591 (GA), +18399992298 (SC), +18789999208 (PA) |
| `RADIO` (347)     | No results |
| `NOTHING` (929)   | No results |
| `RADIO` (929)     | **7 numbers:** 
+1 929 7234654, 
+1 929 5772346,  end with radio
+1 929 7234610, 
+1 929 7234641, 
+1 929 7234642, 
+1 929 7234695, 
+1 929 7234601 |



| `RADIO` (any US)  | **15 numbers:** +12723463830 (US), +19287234646 (AZ), +12723469088 (US), +12723469791 (US), +19378872346 (OH), +12723468872 (US), +12723463232 (US), +12723468801 (US), +12723469310 (US), +13465723464 (US), +12723469325 (US), +12723468384 (US), +16627234670 (MS), +19787234637 (MA), +12723468699 (US) |
| `NOTHING` (toll-free) | No results |
| `RADIO` (toll-free)   | **3 numbers:** +18663723464, +18663723466, +18663723460 |
| `NOTHING` (347) | No results |
| `NOTHING` (any US) | **10 numbers:** +18566844642 (US), +18566844644 (US), +16266844647 (CA), +15866844648 (MI), +18566844649 (US), +18566844647 (US), +18566844648 (US), 

+1 910 6684464 (NC), 

+1 910-NOTHING

+18566844646 (US), +18566844640 (US) |

**Cool numbers (console / manual):**

| Number         | Location  | Notes        |
|----------------|-----------|--------------|
| +18083000067   | Hilo, HI  | Local, $1.15 |
| +18083000059   | Hilo, HI  | Local, $1.15 |

808 area code = music vibe (leaning toward these).

---

## Reference

- Twilio number search in console: [twilio.com/console/phone-numbers/search](https://www.twilio.com/console/phone-numbers/search)
- This app expects `TWILIO_PHONE_NUMBER` (E.164) in env for sending SMS and for the Twilio webhook (opt-out).
