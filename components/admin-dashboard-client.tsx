"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  ChevronDown,
  Globe,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import {
  adminSignOut,
  deleteTrainer,
  republishTrainer,
  setTrainerApproval,
  type AdminApprovalStatus,
} from "@/app/admin/actions";

export type AdminTrainerRow = {
  userId: string;
  /** Slug of their row in the public `trainers` table, if published. */
  publishedSlug: string | null;
  isLive: boolean;
  email: string;
  displayName: string;
  approvalStatus: string;
  onboardingComplete: boolean;
  submittedAt: string | null;
  createdAt: string | null;
  headline: string;
  bio: string;
  city: string;
  area: string;
  whatsapp: string;
  yearsExperience: string;
  specialties: string[];
  searchCategories: string[];
  avatarUrl: string;
  planCount: number;
  credentialCount: number;
  galleryCount: number;
};

type StatusFilter = "all" | "review" | "approved" | "rejected" | "draft";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "review", label: "In review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "draft", label: "Draft" },
];

const STATUS_PILL: Record<string, string> = {
  approved: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
  review: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  rejected: "border-brand/40 bg-brand/15 text-brand-light",
  draft: "border-white/15 bg-white/[0.06] text-soft",
};

const STATUS_LABEL: Record<string, string> = {
  approved: "Approved",
  review: "In review",
  rejected: "Rejected",
  draft: "Draft",
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initialsOf(trainer: AdminTrainerRow) {
  const source = trainer.displayName || trainer.email || "?";
  return source
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function TrainerCard({
  trainer,
  onError,
}: {
  trainer: AdminTrainerRow;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function runApproval(status: AdminApprovalStatus) {
    setPendingAction(status);
    startTransition(async () => {
      const result = await setTrainerApproval(trainer.userId, status);
      if (!result.ok) {
        onError(result.error ?? "The update failed. Try again.");
      } else {
        router.refresh();
      }
      setPendingAction(null);
    });
  }

  function runRepublish() {
    setPendingAction("republish");
    startTransition(async () => {
      const result = await republishTrainer(trainer.userId);
      if (!result.ok) {
        onError(result.error ?? "Publishing failed. Try again.");
      } else {
        router.refresh();
      }
      setPendingAction(null);
    });
  }

  function runDelete() {
    setPendingAction("delete");
    startTransition(async () => {
      const result = await deleteTrainer(trainer.userId);
      if (!result.ok) {
        onError(result.error ?? "The delete failed. Try again.");
        setPendingAction(null);
        setConfirmingDelete(false);
      } else {
        router.refresh();
      }
    });
  }

  const busy = pendingAction !== null;
  const status = trainer.approvalStatus;
  const pillClass = STATUS_PILL[status] ?? STATUS_PILL.draft;

  return (
    <article className="rounded-[18px] border border-white/10 bg-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-4">
        {trainer.avatarUrl ? (
          <Image
            src={trainer.avatarUrl}
            alt=""
            width={52}
            height={52}
            unoptimized={!trainer.avatarUrl.startsWith("https://")}
            className="h-13 w-13 shrink-0 rounded-[14px] object-cover"
          />
        ) : (
          <span className="grid h-13 w-13 shrink-0 place-items-center rounded-[14px] bg-brand/15 text-sm font-extrabold text-brand-light">
            {initialsOf(trainer)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-[16px] font-extrabold text-white">
              {trainer.displayName || "Unnamed trainer"}
            </h2>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] ${pillClass}`}
            >
              {STATUS_LABEL[status] ?? status}
            </span>
            {!trainer.onboardingComplete ? (
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted">
                Onboarding
              </span>
            ) : null}
            {trainer.isLive ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-sky-300">
                <Globe aria-hidden="true" size={11} />
                On site
              </span>
            ) : trainer.approvalStatus === "approved" ? (
              <span className="inline-flex items-center rounded-full border border-brand/40 bg-brand/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-brand-light">
                Not published
              </span>
            ) : null}
          </div>

          <p className="mt-1 truncate text-[13px] font-semibold text-muted">
            {trainer.email || "No email found"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-semibold text-soft">
            {trainer.city ? (
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden="true" size={13} className="text-muted" />
                {trainer.city}
                {trainer.area ? ` · ${trainer.area}` : ""}
              </span>
            ) : null}
            <span>Joined {formatDate(trainer.createdAt)}</span>
            {trainer.submittedAt ? (
              <span>Submitted {formatDate(trainer.submittedAt)}</span>
            ) : null}
          </div>

          {trainer.searchCategories.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {trainer.searchCategories.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-bold capitalize text-soft"
                >
                  {category}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex h-9 items-center gap-1 rounded-[10px] border border-white/10 px-3 text-[12px] font-extrabold text-soft transition hover:border-brand/50 hover:text-white"
        >
          Details
          <ChevronDown
            aria-hidden="true"
            size={14}
            className={`transition ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-3 rounded-[14px] border border-white/10 bg-panel-strong p-4 text-[13px] font-semibold leading-6 text-soft">
          {trainer.headline ? (
            <p className="text-white">{trainer.headline}</p>
          ) : null}
          {trainer.bio ? <p>{trainer.bio}</p> : <p>No bio yet.</p>}

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle aria-hidden="true" size={13} className="text-muted" />
              {trainer.whatsapp || "No WhatsApp"}
            </span>
            <span>
              {trainer.yearsExperience
                ? `${trainer.yearsExperience} yrs experience`
                : "Experience not set"}
            </span>
            <span>{trainer.planCount} plans</span>
            <span>{trainer.credentialCount} credentials</span>
            <span>{trainer.galleryCount} gallery photos</span>
          </div>

          {trainer.specialties.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {trainer.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] font-bold text-soft"
                >
                  {specialty}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
        {status !== "approved" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => runApproval("approved")}
            className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-emerald-600 px-4 text-[13px] font-extrabold text-white transition enabled:hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAction === "approved" ? (
              <Loader2 aria-hidden="true" size={15} className="animate-spin" />
            ) : (
              <BadgeCheck aria-hidden="true" size={15} />
            )}
            Approve
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => runApproval("review")}
            className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-white/15 px-4 text-[13px] font-extrabold text-soft transition enabled:hover:border-amber-400/60 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAction === "review" ? (
              <Loader2 aria-hidden="true" size={15} className="animate-spin" />
            ) : null}
            Move back to review
          </button>
        )}

        {status === "approved" ? (
          <button
            type="button"
            disabled={busy}
            onClick={runRepublish}
            title="Copy this trainer's profile onto the public site again"
            className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-white/15 px-4 text-[13px] font-extrabold text-soft transition enabled:hover:border-sky-400/60 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAction === "republish" ? (
              <Loader2 aria-hidden="true" size={15} className="animate-spin" />
            ) : (
              <RefreshCw aria-hidden="true" size={15} />
            )}
            {trainer.isLive ? "Re-publish" : "Publish now"}
          </button>
        ) : null}

        {trainer.isLive && trainer.publishedSlug ? (
          <a
            href={`/trainers/${trainer.publishedSlug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-white/15 px-4 text-[13px] font-extrabold text-soft transition hover:border-brand/50 hover:text-white"
          >
            <Globe aria-hidden="true" size={15} />
            View live
          </a>
        ) : null}

        {status !== "rejected" && status !== "approved" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => runApproval("rejected")}
            className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-white/15 px-4 text-[13px] font-extrabold text-soft transition enabled:hover:border-brand/60 enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAction === "rejected" ? (
              <Loader2 aria-hidden="true" size={15} className="animate-spin" />
            ) : null}
            Reject
          </button>
        ) : null}

        <span className="flex-1" />

        {confirmingDelete ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-[12px] font-bold text-soft">
              Delete this trainer and all their data?
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={runDelete}
              className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-brand px-4 text-[13px] font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pendingAction === "delete" ? (
                <Loader2 aria-hidden="true" size={15} className="animate-spin" />
              ) : (
                <Trash2 aria-hidden="true" size={15} />
              )}
              Yes, delete
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingDelete(false)}
              className="h-10 rounded-[12px] border border-white/15 px-4 text-[13px] font-extrabold text-soft transition enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmingDelete(true)}
            className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-brand/30 px-4 text-[13px] font-extrabold text-brand-light transition enabled:hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 aria-hidden="true" size={15} />
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

export function AdminDashboardClient({
  trainers,
  loadError,
}: {
  trainers: AdminTrainerRow[];
  loadError: string | null;
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = {
      all: trainers.length,
      review: 0,
      approved: 0,
      rejected: 0,
      draft: 0,
    };

    for (const trainer of trainers) {
      const status = trainer.approvalStatus as StatusFilter;
      if (status in result && status !== "all") {
        result[status] += 1;
      }
    }

    return result;
  }, [trainers]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return trainers.filter((trainer) => {
      if (statusFilter !== "all" && trainer.approvalStatus !== statusFilter) {
        return false;
      }

      if (!needle) {
        return true;
      }

      return [trainer.displayName, trainer.email, trainer.city]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [trainers, statusFilter, query]);

  return (
    <main className="min-h-screen bg-background pb-16 text-white">
      <header className="border-b border-white/10 bg-panel/60">
        <div className="mx-auto flex w-full max-w-[1080px] items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-brand/15 text-brand-light">
              <ShieldCheck aria-hidden="true" size={20} />
            </span>
            <div>
              <p className="font-display text-[16px] font-black leading-none">
                TRAINED<span className="text-brand">RIGHT</span>
              </p>
              <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">
                Admin console
              </p>
            </div>
          </div>

          <form action={adminSignOut}>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-white/15 px-4 text-[13px] font-extrabold text-soft transition hover:border-brand/60 hover:text-white"
            >
              <Lock aria-hidden="true" size={14} />
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1080px] px-5">
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[30px] font-black leading-none">
              Trainer accounts
            </h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-muted">
              <Users aria-hidden="true" size={15} />
              {trainers.length} total · {counts.review} waiting for review
            </p>
          </div>

          <label className="relative block w-full max-w-[320px]">
            <Search
              aria-hidden="true"
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded-[12px] border border-white/10 bg-panel pl-10 pr-4 text-[14px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
              placeholder="Search name, email, city"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={`h-9 rounded-full px-4 text-[12px] font-extrabold transition ${
                statusFilter === filter.id
                  ? "bg-brand text-white"
                  : "border border-white/10 text-muted hover:text-white"
              }`}
            >
              {filter.label} · {counts[filter.id]}
            </button>
          ))}
        </div>

        {loadError ? (
          <p className="mt-6 rounded-[12px] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-[13px] font-semibold leading-5 text-amber-200">
            {loadError}
          </p>
        ) : null}

        {actionError ? (
          <p className="mt-6 rounded-[12px] border border-brand/25 bg-brand/10 px-4 py-3 text-[13px] font-semibold leading-5 text-soft">
            {actionError}
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          {visible.map((trainer) => (
            <TrainerCard
              key={trainer.userId}
              trainer={trainer}
              onError={setActionError}
            />
          ))}

          {visible.length === 0 && !loadError ? (
            <p className="rounded-[18px] border border-dashed border-white/15 px-6 py-14 text-center text-sm font-semibold text-muted">
              {trainers.length === 0
                ? "No trainer accounts yet."
                : "No trainers match this filter."}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
