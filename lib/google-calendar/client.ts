/**
 * lib/google-calendar/client.ts
 * Google Calendar REST API helpers — reuses the access token stored in gmail_tokens
 * (same Google OAuth credentials cover both Gmail and Calendar scopes).
 */

import { getValidAccessToken } from '@/lib/gmail/client'

interface CalendarEventBody {
  summary: string
  description?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  colorId?: string
}

/**
 * Creates a new Calendar event or updates an existing one.
 * Returns the Google Calendar event ID, or null on failure.
 * If existingEventId is provided and the event was deleted in Calendar (404), it creates a new one.
 */
export async function createOrUpdateCalendarEvent(
  event: CalendarEventBody,
  userId: string,
  existingEventId?: string | null
): Promise<string | null> {
  let accessToken: string
  try {
    accessToken = await getValidAccessToken(userId)
  } catch {
    return null
  }

  const url = existingEventId
    ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEventId}`
    : 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

  const method = existingEventId ? 'PUT' : 'POST'

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })

  if (res.status === 404 && existingEventId) {
    // Event was deleted in Google Calendar — create fresh
    return createOrUpdateCalendarEvent(event, userId, null)
  }

  if (!res.ok) {
    const body = await res.text()
    console.error('[calendar] createOrUpdateCalendarEvent failed:', res.status, body)
    return null
  }

  const data = await res.json()
  return data.id as string
}

/**
 * Deletes a Google Calendar event. Silently ignores 404 (already deleted).
 */
export async function deleteCalendarEvent(eventId: string, userId: string): Promise<void> {
  let accessToken: string
  try {
    accessToken = await getValidAccessToken(userId)
  } catch {
    return
  }

  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )
}
