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

## All available numbers from terminal (toll-free)

Every number that returned as available from the toll-free searches in this session. **Inventory changes** — if you want one, run the buy command soon.

### RADIO (spells RADIO) 72346
- +18663723464 
- +18557234639

### NOTHING / THING / OTHING (strong for Nothing Radio)
- +18668416476 — 866-THING-76
- +18556844640 — 855-OTHING-0
- +18556844648 — 855-OTHING-8
- +18556844645 — 855-OTHING-5

### %000% (triple zero)
- +18556000482, +18445200012, +18335000706, +18445740007, +18336600075
- +18449000839, +18336000397, +18449000633, +18337500092, +18886000950
- +18556300050, +18662000381, +18447940009, +18449000639, +18556000460

### 800 pattern
- +18663698002, +18337008005, +18444880026, +18663848009, +18336800945
- +18777800620, +18446800597, +18445080034, +18444280099, +18446180075
- +18336580062, +18339722800, +18444800139, +18664280059, +18556878007

### MUSIC
- +18446874280

### SOUND
- +18443768630, +18337686394, +18557686314, +18337686393, +18887686316

### WAVE
- +18885928386, +18777592838, +18889283630, +18449283338, +18339283182
- +18444592833, +18774192830, +18333592831, +18334492832, +18559283306
- +18664139283, +18669283545, +18334492833, +18559283917, +18556799283

### ZERO
- +18669937656, +18559376964, +18444937640, +18449293761, +18556259376
- +18773579376, +18333593767, +18773693765, +18663693763, +18779193762
- +18444937618, +18774619376, +18669937686, +18665937658, +18559376373

### TUNES
- +18888637792, +18888637609, +18888637604, +18888637160

### %777%
- +18777485840, +18777807714, +18773577709, +18777592151, +18777486628
- +18777592221, +18777094971, +18778591777, +18777591795, +18777480694
- +18777510781, +18777486994, +18777577055, +18777170472, +18559167776

### %888%
- +18888497085, +18888057082, +18888966597, +18888511781, +18888054729
- +18888872107, +18888689301, +18888746617, +18888980755, +18888077598
- +18554888821, +18888675231, +18888908440, +18888907956, +18888748554

---

## Reference

- Twilio number search in console: [twilio.com/console/phone-numbers/search](https://www.twilio.com/console/phone-numbers/search)
- This app expects `TWILIO_PHONE_NUMBER` (E.164) in env for sending SMS and for the Twilio webhook (opt-out).
