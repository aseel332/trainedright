import { SiteHeader } from "@/components/site-header";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-white">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[310px_minmax(0,1fr)] lg:px-8">
        <div className="hidden h-[420px] animate-pulse rounded-[18px] bg-panel lg:block" />
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-[18px] bg-panel" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[210px] animate-pulse rounded-[18px] bg-panel"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
