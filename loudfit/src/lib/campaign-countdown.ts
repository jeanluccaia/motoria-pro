export const CAMPAIGN_START = '2026-07-15T00:00:00-03:00'
export const CAMPAIGN_END = '2026-07-31T23:59:59-03:00'

export const CAMPAIGN_START_MS = Date.parse(CAMPAIGN_START)
export const CAMPAIGN_END_MS = Date.parse(CAMPAIGN_END)

export interface CountdownState {
  totalMs: number
  remainingMs: number
  elapsedMs: number
  progress: number
  days: number
  hours: number
  minutes: number
  status: 'not_started' | 'active' | 'last_day' | 'last_hour' | 'ended'
}

export function computeCountdown(nowMs: number): CountdownState {
  const totalMs = CAMPAIGN_END_MS - CAMPAIGN_START_MS
  const remainingMs = Math.max(0, CAMPAIGN_END_MS - nowMs)
  const elapsedMs = Math.min(Math.max(0, nowMs - CAMPAIGN_START_MS), totalMs)
  const progress = totalMs > 0 ? elapsedMs / totalMs : 0

  const days = Math.floor(remainingMs / 86_400_000)
  const hours = Math.floor((remainingMs % 86_400_000) / 3_600_000)
  const minutes = Math.floor((remainingMs % 3_600_000) / 60_000)

  let status: CountdownState['status']
  if (nowMs < CAMPAIGN_START_MS) status = 'not_started'
  else if (remainingMs <= 0) status = 'ended'
  else if (remainingMs < 3_600_000) status = 'last_hour'
  else if (remainingMs < 86_400_000) status = 'last_day'
  else status = 'active'

  return { totalMs, remainingMs, elapsedMs, progress, days, hours, minutes, status }
}
