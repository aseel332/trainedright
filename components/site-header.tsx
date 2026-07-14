import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { HeaderActions } from "@/components/header-actions";

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
            Find coaches
          </Link>
          <Link
            href="/trainers?verified=true"
            className="rounded-full px-4 py-2 text-sm font-bold text-soft transition hover:text-white"
          >
            Verified
          </Link>
          <Link
            href="/trainer"
            className="rounded-full px-4 py-2 text-sm font-bold text-soft transition hover:text-white"
          >
            For trainers
          </Link>
        </nav>
        <HeaderActions />
      </div>
    </header>
  );
}
