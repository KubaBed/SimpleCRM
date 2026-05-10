import { STAGE_ORDER, STAGES } from '../data/pipeline'

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mb-2">
      <div className="flex items-start gap-2.5">
        <Skeleton className="w-9 h-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

function ColumnSkeleton({ stageKey, cards = 2 }) {
  const stage = STAGES.find((s) => s.key === stageKey)
  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-sm font-semibold text-gray-300">{stage?.label || ''}</span>
        <Skeleton className="h-4 w-6 rounded-full" />
      </div>
      <div className="bg-gray-100 rounded-lg p-2 min-h-[200px]">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>

      <div className="mb-4">
        <Skeleton className="h-9 w-full max-w-md" />
      </div>

      <div className="flex gap-4 overflow-x-hidden pb-4">
        {STAGE_ORDER.map((stageKey, i) => (
          <ColumnSkeleton key={stageKey} stageKey={stageKey} cards={i < 4 ? 2 : 1} />
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}
