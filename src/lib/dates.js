const MS_PER_DAY = 1000 * 60 * 60 * 24

export function daysSince(iso) {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return Math.floor((Date.now() - t) / MS_PER_DAY)
}

export function formatRelativePl(iso) {
  const days = daysSince(iso)
  if (days == null) return null
  if (days <= 0) return 'dziś'
  if (days === 1) return 'wczoraj'
  if (days < 7) return `${days} dni temu`
  if (days < 30) return `${Math.floor(days / 7)} tyg. temu`
  if (days < 365) return `${Math.floor(days / 30)} mies. temu`
  return `${Math.floor(days / 365)} lat temu`
}
