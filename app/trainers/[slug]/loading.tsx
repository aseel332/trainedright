export default function Loading() {
  return (
    <main className="min-h-screen bg-background pb-28 text-white">
      <div className="h-[520px] animate-pulse bg-panel lg:h-[620px]" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-[14px] bg-panel"
              />
            ))}
          </div>
          <div className="h-24 animate-pulse rounded-[18px] bg-panel" />
          <div className="h-[360px] animate-pulse rounded-[18px] bg-panel" />
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-[15px] bg-panel"
              />
            ))}
          </div>
        </div>
        <div className="hidden h-56 animate-pulse rounded-[18px] bg-panel lg:block" />
      </div>
    </main>
  );
}
