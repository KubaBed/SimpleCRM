const PALETTE = [
  'bg-rose-200 text-rose-800',
  'bg-orange-200 text-orange-800',
  'bg-amber-200 text-amber-800',
  'bg-lime-200 text-lime-800',
  'bg-emerald-200 text-emerald-800',
  'bg-teal-200 text-teal-800',
  'bg-sky-200 text-sky-800',
  'bg-indigo-200 text-indigo-800',
  'bg-violet-200 text-violet-800',
  'bg-fuchsia-200 text-fuchsia-800',
]

export function getInitials(first, last) {
  const f = (first || '').trim()
  const l = (last || '').trim()
  if (f && l) return (f[0] + l[0]).toUpperCase()
  if (f) return f.slice(0, 2).toUpperCase()
  if (l) return l.slice(0, 2).toUpperCase()
  return '?'
}

function hash(input) {
  const s = String(input || '?')
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function getAvatarColor(seed) {
  return PALETTE[hash(seed) % PALETTE.length]
}
