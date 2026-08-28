export type StatusTone = "success" | "warning" | "danger" | "neutral"

const SUCCESS = new Set([
  "COMPLETE",
  "COMPLETED",
  "APPROVED",
  "SATISFIED",
  "FUNDED",
  "ACCEPTED",
  "ACTIVE",
  "READY",
  "PASS",
])

const WARNING = new Set([
  "PENDING",
  "UNDER_REVIEW",
  "IN_REVIEW",
  "SUBMITTED",
  "BORROWER_ACTION_REQUIRED",
  "OPEN",
  "IN_PROGRESS",
])

const DANGER = new Set([
  "REJECTED",
  "DECLINED",
  "FAILED",
  "FAIL",
  "EXPIRED",
  "CANCELLED",
  "CANCELED",
  "DISABLED",
])

/** Maps a status/state code (any casing) to a semantic display tone. */
export function statusTone(status: string): StatusTone {
  const normalized = status.trim().toUpperCase().replaceAll("-", "_")
  if (SUCCESS.has(normalized)) return "success"
  if (WARNING.has(normalized)) return "warning"
  if (DANGER.has(normalized)) return "danger"
  return "neutral"
}
