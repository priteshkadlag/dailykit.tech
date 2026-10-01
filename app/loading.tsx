export default function Loading() {
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
