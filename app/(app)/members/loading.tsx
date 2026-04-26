export default function MembersLoading() {
  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
        <div className="size-11 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3">
            <div className="size-14 animate-pulse rounded-full bg-muted" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
