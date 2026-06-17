export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="skeleton w-10 h-10 rounded-full shrink-0" />
          <div className="skeleton h-3.5 w-24 rounded" />
        </div>
        <div className="skeleton h-7 w-16 rounded-lg shrink-0" />
        <div className="flex items-center gap-2.5 flex-1 flex-row-reverse">
          <div className="skeleton w-10 h-10 rounded-full shrink-0" />
          <div className="skeleton h-3.5 w-24 rounded" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-0.5">
        <div className="skeleton h-2.5 w-32 rounded" />
        <div className="skeleton h-2.5 w-16 rounded" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
