export const PRESET_ROOM_ADVANCE_DELAY_MS = 3000
export const PRESET_ROOM_RETRY_DELAYS_MS = [
  10000,
  15000,
  30000,
  45000,
  60000,
] as const
export const PRESET_ROOM_RETRY_MAX_DELAY_MS = 60000

export function isRetryablePresetRoomError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase()
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
      ? ((error as { status: number }).status as number)
      : null

  if (
    status !== null &&
    [408, 409, 425, 429, 500, 502, 503, 504].includes(status)
  ) {
    return true
  }

  return /429|limit|rate|quota|timeout|temporar|unavailable|overloaded|fetch failed|network|try again|empty content/i.test(
    message
  )
}

export function getPresetRoomRetryDelayMs(
  errorAttempt: number,
  error: unknown
) {
  if (!isRetryablePresetRoomError(error)) {
    return null
  }

  return (
    PRESET_ROOM_RETRY_DELAYS_MS[errorAttempt] ?? PRESET_ROOM_RETRY_MAX_DELAY_MS
  )
}
