import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <BrandLogo compact />
        <Link
          href="/trainer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-dark"
        >
          I am a Trainer
          <ArrowRight aria-hidden="true" size={15} />
        </Link>
      </div>
    </header>
  );
}
