"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Clock3,
  ExternalLink,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  PencilLine,
  Search,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import {
  trainerInitials,
  useTrainerSession,
  type TrainerApproval,
  type TrainerSession,
} from "@/lib/client/use-trainer-session";

const SIGN_IN_HREF = "/trainer/auth?mode=signin&next=/trainer/dashboard";
const SIGN_UP_HREF = "/trainer/auth?mode=signup&next=/trainer/onboarding";

const NAV_LINKS = [
  { href: "/fitness-trainers", label: "Find coaches", icon: Search },
  { href: "/trainer", label: "For coaches", icon: BadgeCheck },
];

/** What each approval state means to the trainer, in their own words. */
const APPROVAL_COPY: Record<
  TrainerApproval,
  { label: string; detail: string; tone: string; icon: typeof BadgeCheck }
> = {
  approved: {
    label: "Live",
    detail: "Your profile is on the site.",
    tone: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
    icon: BadgeCheck,
  },
  review: {
    label: "In review",
    detail: "We're checking your profile.",
    tone: "border-amber-400/40 bg-amber-500/15 text-amber-200",
    icon: Clock3,
  },
  rejected: {
    label: "Needs changes",
    detail: "Open your dashboard for details.",
    tone: "border-brand/40 bg-brand/15 text-brand-light",
    icon: PencilLine,
  },
  draft: {
    label: "Draft",
    detail: "Finish your profile to go live.",
    tone: "border-white/15 bg-white/[0.06] text-soft",
    icon: PencilLine,
  },
};

/** POSTs to the sign-out route — never a link, so it can't be triggered
    cross-site. Works without JS. */
function SignOutButton({ className }: { className: string }) {
  return (
    <form action="/auth/signout" method="post" className="contents">
      <button type="submit" className={className}>
        <LogOut aria-hidden="true" size={15} />
        Sign out
      </button>
    </form>
  );
}

function ApprovalPill({ approval }: { approval: TrainerApproval }) {
  const copy = APPROVAL_COPY[approval];
  const Icon = copy.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${copy.tone}`}
    >
      <Icon aria-hidden="true" size={12} />
      {copy.label}
    </span>
  );
}

/** The signed-in chip and its popover. Desktop only; mobile uses the sheet. */
function AccountMenu({
  session,
}: {
  session: Extract<TrainerSession, { status: "signed-in" }>;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();
  const copy = APPROVAL_COPY[session.approval];

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] py-1.5 pl-1.5 pr-3 text-left transition hover:border-white/25 hover:bg-white/[0.08]"
      >
        <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-brand text-[12px] font-black text-white">
          {trainerInitials(session.name)}
        </span>
        <span className="hidden min-w-0 flex-col leading-tight lg:flex">
          <span className="max-w-[130px] truncate text-[13px] font-extrabold text-white">
            {session.name}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
            {copy.label}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          size={15}
          className={`flex-none text-muted transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[288px] overflow-hidden rounded-[18px] border border-white/12 bg-[#121215] shadow-2xl shadow-black/60"
        >
          <div className="border-b border-white/8 p-4">
            <p className="truncate font-display text-[16px] font-black text-white">
              {session.name}
            </p>
            {session.email ? (
              <p className="mt-0.5 truncate text-[12px] font-semibold text-muted">
                {session.email}
              </p>
            ) : null}
            <div className="mt-3 flex items-center gap-2">
              <ApprovalPill approval={session.approval} />
              <span className="text-[11px] font-semibold text-muted">
                {copy.detail}
              </span>
            </div>
          </div>

          <div className="p-2">
            <Link
              href="/trainer/dashboard"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-[13px] font-extrabold text-white transition hover:bg-white/[0.07]"
            >
              <LayoutDashboard aria-hidden="true" size={16} className="text-brand-light" />
              Trainer dashboard
            </Link>

            {session.publicSlug ? (
              <Link
                href={`/trainers/${session.publicSlug}`}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-[13px] font-extrabold text-white transition hover:bg-white/[0.07]"
              >
                <ExternalLink aria-hidden="true" size={16} className="text-brand-light" />
                View public profile
              </Link>
            ) : null}

            <SignOutButton className="flex min-h-11 w-full items-center gap-3 rounded-[12px] px-3 text-[13px] font-extrabold text-soft transition hover:bg-white/[0.07] hover:text-white" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  const session = useTrainerSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  // The sheet covers the viewport on small screens; stop the page behind it
  // from scrolling underneath.
  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const signedIn = session.status === "signed-in";

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8">
        <BrandLogo compact />

        <nav
          aria-label="Main"
          className="ml-6 hidden items-center gap-1 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-[13.5px] font-bold text-soft transition hover:bg-white/[0.06] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* One fixed-height slot for every auth state, so resolving the
              session never shifts the header. */}
          <div className="hidden min-h-11 items-center gap-2 md:flex">
            {session.status === "loading" ? (
              <span
                aria-hidden="true"
                className="h-11 w-[188px] animate-pulse rounded-full bg-white/[0.06]"
              />
            ) : signedIn ? (
              <>
                <Link
                  href="/trainer/dashboard"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-[13.5px] font-extrabold text-white transition hover:bg-brand-dark"
                >
                  <LayoutDashboard aria-hidden="true" size={16} />
                  Dashboard
                </Link>
                <AccountMenu session={session} />
              </>
            ) : (
              <>
                <Link
                  href={SIGN_IN_HREF}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[13.5px] font-bold text-soft transition hover:text-white"
                >
                  <LogIn aria-hidden="true" size={16} />
                  Log in
                </Link>
                <Link
                  href={SIGN_UP_HREF}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-[13.5px] font-extrabold text-white transition hover:bg-brand-dark"
                >
                  Join as a coach
                  <ArrowRight aria-hidden="true" size={15} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile: the avatar sits in the bar itself, so a signed-in trainer
              can tell at a glance without opening anything. */}
          {signedIn ? (
            <Link
              href="/trainer/dashboard"
              aria-label={`${session.name} — trainer dashboard`}
              className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand text-[12px] font-black text-white md:hidden"
            >
              {trainerInitials(session.name)}
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="grid h-10 w-10 flex-none place-items-center rounded-[12px] border border-white/12 text-white transition hover:border-white/30 md:hidden"
          >
            {menuOpen ? (
              <X aria-hidden="true" size={19} />
            ) : (
              <Menu aria-hidden="true" size={19} />
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id={menuId}
          className="border-t border-white/8 bg-background md:hidden"
        >
          {/* Any click inside the sheet dismisses it — every control in here
              either navigates away or submits, so it should never be left
              hanging open over the page it just moved to. */}
          <div
            onClick={() => setMenuOpen(false)}
            className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6"
          >
            {signedIn ? (
              <div className="mb-3 flex items-center gap-3 rounded-[16px] border border-white/10 bg-panel px-4 py-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-brand text-[13px] font-black text-white">
                  {trainerInitials(session.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-extrabold text-white">
                    {session.name}
                  </p>
                  <p className="mt-1">
                    <ApprovalPill approval={session.approval} />
                  </p>
                </div>
              </div>
            ) : null}

            <nav aria-label="Mobile" className="flex flex-col">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex min-h-12 items-center gap-3 rounded-[12px] px-3 text-[15px] font-extrabold text-white transition hover:bg-white/[0.06]"
                  >
                    <Icon aria-hidden="true" size={17} className="text-brand-light" />
                    {link.label}
                  </Link>
                );
              })}

              {signedIn ? (
                <>
                  <Link
                    href="/trainer/dashboard"
                    className="flex min-h-12 items-center gap-3 rounded-[12px] px-3 text-[15px] font-extrabold text-white transition hover:bg-white/[0.06]"
                  >
                    <LayoutDashboard
                      aria-hidden="true"
                      size={17}
                      className="text-brand-light"
                    />
                    Trainer dashboard
                  </Link>
                  {session.publicSlug ? (
                    <Link
                      href={`/trainers/${session.publicSlug}`}
                      className="flex min-h-12 items-center gap-3 rounded-[12px] px-3 text-[15px] font-extrabold text-white transition hover:bg-white/[0.06]"
                    >
                      <ExternalLink
                        aria-hidden="true"
                        size={17}
                        className="text-brand-light"
                      />
                      View public profile
                    </Link>
                  ) : null}
                  <SignOutButton className="flex min-h-12 w-full items-center gap-3 rounded-[12px] px-3 text-[15px] font-extrabold text-soft transition hover:bg-white/[0.06] hover:text-white" />
                </>
              ) : (
                <div className="mt-3 flex flex-col gap-2.5">
                  <Link
                    href={SIGN_UP_HREF}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-brand px-5 text-[15px] font-extrabold text-white"
                  >
                    Join as a coach
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                  <Link
                    href={SIGN_IN_HREF}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-white/15 px-5 text-[15px] font-extrabold text-white"
                  >
                    <LogIn aria-hidden="true" size={16} />
                    Log in
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
