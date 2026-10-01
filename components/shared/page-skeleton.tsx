/**
 * Generic placeholder shown while a server-rendered page loads.
 * Used per route (admin, search) rather than as a root app/loading.tsx: a root loading boundary streams
 * every page, so notFound() could no longer change the status and missing pages returned 200 ("soft 404").
 */
export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="h-9 w-72 animate-pulse rounded bg-muted" />
      <div className="h-5 w-full max-w-xl animate-pulse rounded bg-muted" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl bg-muted" />
        <div className="h-80 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
