"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, Menu, Search, X } from "lucide-react";

export function HeaderActions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex items-center gap-2">
      <Link
        href="/trainers"
        aria-label="Search coaches"
        className="grid h-11 w-11 place-items-center rounded-[14px] border border-white/10 bg-panel text-white transition hover:border-brand/50 hover:text-brand-light"
      >
        <Search aria-hidden="true" size={20} />
      </Link>
      <button
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="grid h-11 w-11 place-items-center rounded-[14px] border border-white/10 bg-panel text-white transition hover:border-brand/50 hover:text-brand-light md:hidden"
      >
        {open ? (
          <X aria-hidden="true" size={20} />
        ) : (
          <Menu aria-hidden="true" size={20} />
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-[260px] overflow-hidden rounded-[18px] border border-white/10 bg-panel shadow-2xl shadow-black/40 md:hidden">
          <Link
            href="/trainers"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 border-b border-white/10 px-4 py-3 text-sm font-bold text-white"
          >
            <Search aria-hidden="true" size={17} />
            Browse coaches
          </Link>
          <Link
            href="/trainer/auth?mode=signin&next=/trainer/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-brand-light"
          >
            <LogIn aria-hidden="true" size={17} />
            Trainer access
          </Link>
        </div>
      ) : null}
    </div>
  );
}
