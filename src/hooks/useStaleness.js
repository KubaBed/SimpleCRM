const ACTIVE_STAGES = new Set(['nowy', 'kontakt', 'konsultacja', 'oferta'])
const STALE_THRESHOLD_DAYS = 7
const MS_PER_DAY = 1000 * 60 * 60 * 24

export function getDaysInStage(lead) {
  if (!lead?.updated_at) return 0
  const updated = new Date(lead.updated_at)
  if (Number.isNaN(updated.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - updated.getTime()) / MS_PER_DAY))
}

export function isStale(lead) {
  if (!lead || !ACTIVE_STAGES.has(lead.stage)) return false
  return getDaysInStage(lead) >= STALE_THRESHOLD_DAYS
}

export { STALE_THRESHOLD_DAYS }
