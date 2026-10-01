/** Placeholder while a client-only workspace (reads data saved on this device) loads. */
export function WorkspaceSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="hidden h-[36rem] animate-pulse rounded-xl bg-muted xl:block" />
      </div>
    </div>
  );
}
