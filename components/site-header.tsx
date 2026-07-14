import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <BrandLogo compact />
        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/trainers"
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white transition hover:border-brand/50 hover:text-brand-light"
          >
            Browse coaches
          </Link>
          <Link
            href="/trainers?verified=true"
            className="rounded-full px-4 py-2 text-sm font-bold text-soft transition hover:text-white"
          >
            Verified
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/trainers"
            aria-label="Search coaches"
            className="grid h-11 w-11 place-items-center rounded-[14px] border border-white/10 bg-panel text-white transition hover:border-brand/50 hover:text-brand-light"
          >
            <Search aria-hidden="true" size={20} />
          </Link>
          <Link
            href="/trainers"
            aria-label="Open navigation"
            className="grid h-11 w-11 place-items-center rounded-[14px] border border-white/10 bg-panel text-white transition hover:border-brand/50 hover:text-brand-light md:hidden"
          >
            <Menu aria-hidden="true" size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
