// Shimmer placeholders shown while a screen loads, shaped like what is coming.
export function Loading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-20 rounded-[22px]" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-[22px] bg-card p-4 shadow-card">
          <div className="skeleton size-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-2/3" />
            <div className="skeleton h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingDetail() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-28 rounded-[22px]" />
      <div className="skeleton h-40 rounded-[22px]" />
      <div className="skeleton h-56 rounded-[22px]" />
    </div>
  );
}
