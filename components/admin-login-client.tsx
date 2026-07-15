"use client";

import { useActionState } from "react";
import { Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { adminSignIn, type AdminActionResult } from "@/app/admin/actions";

export function AdminLoginClient({ configured }: { configured: boolean }) {
  const [state, formAction, pending] = useActionState<
    AdminActionResult | null,
    FormData
  >(adminSignIn, null);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 py-10 text-white">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-brand/15 text-brand-light">
            <ShieldCheck aria-hidden="true" size={22} />
          </span>
          <div>
            <p className="font-display text-[18px] font-black leading-none">
              TRAINED<span className="text-brand">RIGHT</span>
            </p>
            <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted">
              Admin console
            </p>
          </div>
        </div>

        <h1 className="mt-8 font-display text-[34px] font-black leading-none">
          Restricted area.
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-muted">
          Sign in with the admin credentials to review, approve, or remove
          trainer accounts.
        </p>

        {!configured ? (
          <p className="mt-6 rounded-[12px] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-[12px] font-semibold leading-5 text-amber-200">
            ADMIN_EMAIL and ADMIN_PASSWORD are not set in .env.local, so no one
            can sign in yet.
          </p>
        ) : null}

        <form action={formAction} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
              Email
            </span>
            <span className="relative mt-2 block">
              <Mail
                aria-hidden="true"
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="email"
                name="email"
                required
                className="h-[52px] w-full rounded-[14px] border border-white/10 bg-panel pl-11 pr-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                placeholder="admin@example.com"
                autoComplete="username"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
              Password
            </span>
            <span className="relative mt-2 block">
              <Lock
                aria-hidden="true"
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="password"
                name="password"
                required
                className="h-[52px] w-full rounded-[14px] border border-white/10 bg-panel pl-11 pr-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                placeholder="Password"
                autoComplete="current-password"
              />
            </span>
          </label>

          {state?.error ? (
            <p className="rounded-[12px] border border-brand/25 bg-brand/10 px-4 py-3 text-[12px] font-semibold leading-5 text-soft">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand px-4 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
          >
            {pending ? (
              <Loader2 aria-hidden="true" size={18} className="animate-spin" />
            ) : null}
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
