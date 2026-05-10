import { DateTime } from 'luxon'

export const EVENT_TIME_ZONE = 'America/New_York'

/**
 * Convert a datetime-local picker value ("YYYY-MM-DDTHH:mm") into a UTC ISO
 * string, treating the input as America/New_York wall time.
 * Returns null if the value is missing or unparseable.
 */
export function parsePickerToUtcIso(pickerValue: string): string | null {
  if (!pickerValue) return null
  const dt = DateTime.fromISO(pickerValue, { zone: EVENT_TIME_ZONE })
  if (!dt.isValid) return null
  return dt.toUTC().toISO()
}

/**
 * Format a UTC ISO timestamptz string as a date in Eastern, e.g. "Fri, May 8, 2026".
 */
export function formatEventDate(iso: string): string {
  return DateTime.fromISO(iso, { zone: 'utc' })
    .setZone(EVENT_TIME_ZONE)
    .toLocaleString(
      { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
      { locale: 'en-US' }
    )
}

/**
 * Format a UTC ISO timestamptz string as a time in Eastern, e.g. "10:00 PM".
 */
export function formatEventTime(iso: string): string {
  return DateTime.fromISO(iso, { zone: 'utc' })
    .setZone(EVENT_TIME_ZONE)
    .toLocaleString({ hour: 'numeric', minute: '2-digit' }, { locale: 'en-US' })
}

/**
 * Format a UTC ISO timestamptz string as "Month D, YYYY" (no weekday) for
 * the RSVP widget eyebrow, e.g. "May 8, 2026".
 */
export function formatEventDateWidget(iso: string): string {
  return DateTime.fromISO(iso, { zone: 'utc' })
    .setZone(EVENT_TIME_ZONE)
    .toLocaleString(
      { month: 'long', day: 'numeric', year: 'numeric' },
      { locale: 'en-US' }
    )
}

/**
 * Format a UTC ISO timestamptz string as a long date for SMS copy,
 * e.g. "Friday, May 8, 2026".
 */
export function formatEventDateLong(iso: string): string {
  return DateTime.fromISO(iso, { zone: 'utc' })
    .setZone(EVENT_TIME_ZONE)
    .toLocaleString(
      { weekday: 'long', month: 'long', day: 'numeric' },
      { locale: 'en-US' }
    )
}
