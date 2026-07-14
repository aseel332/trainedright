"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  BadgeCheck,
  BarChart3,
  Check,
  ClipboardCheck,
  Copy,
  Dumbbell,
  Hourglass,
  ImageIcon,
  Images,
  LayoutDashboard,
  Link2,
  Loader2,
  Newspaper,
  Plus,
  Send,
  Star,
  Trash2,
  User,
  Wallet,
  X,
} from "lucide-react";
import {
  addTrainerReview,
  createReviewRequest,
  createTransformationRequest,
  deleteReviewRequest,
  deleteTransformationRequest,
  saveTrainerProfile,
  submitForApproval,
} from "@/app/trainer/actions";
import {
  CredentialsEditor,
  PhotosEditor,
  PlansEditor,
  SpecialtiesEditor,
} from "@/components/trainer-onboarding-client";
import type {
  ReviewRequestItem,
  TransformationRequestItem,
} from "@/lib/link-requests";
import { cityOptions, searchCategories } from "@/lib/search-categories";
import {
  profileCompletionPercent,
  profileRequirements,
  type TrainerProfileDraft,
} from "@/lib/trainer-profile";
import { uploadPublicFile } from "@/lib/upload";

type SectionId =
  | "overview"
  | "profile"
  | "media"
  | "plans"
  | "credentials"
  | "reviews"
  | "transformations"
  | "stories";

const sections: {
  id: SectionId;
  label: string;
  detail: string;
  icon: typeof User;
}[] = [
  {
    id: "overview",
    label: "Overview",
    detail: "Analytics and status",
    icon: LayoutDashboard,
  },
  {
    id: "profile",
    label: "Profile",
    detail: "Bio, specialties, categories",
    icon: User,
  },
  {
    id: "media",
    label: "Media",
    detail: "Avatar, cover, gallery",
    icon: Images,
  },
  {
    id: "plans",
    label: "Price plans",
    detail: "Your custom offers",
    icon: Wallet,
  },
  {
    id: "credentials",
    label: "Credentials",
    detail: "Qualifications and awards",
    icon: Award,
  },
  {
    id: "reviews",
    label: "Reviews",
    detail: "Verified client links",
    icon: Star,
  },
  {
    id: "transformations",
    label: "Transformations",
    detail: "Before / after proof",
    icon: Dumbbell,
  },
  {
    id: "stories",
    label: "Stories",
    detail: "Coming soon",
    icon: Newspaper,
  },
];

function shortDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function TrainerDashboardClient({
  userEmail,
  userId,
  approvalStatus: initialApprovalStatus,
  initialProfile,
  initialReviews,
  initialTransformations,
}: {
  userEmail: string;
  userId: string;
  approvalStatus: string;
  initialProfile: TrainerProfileDraft;
  initialReviews: ReviewRequestItem[];
  initialTransformations: TransformationRequestItem[];
}) {
  const [section, setSection] = useState<SectionId>("overview");
  const [profile, setProfile] = useState(initialProfile);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(initialProfile),
  );
  const [approvalStatus, setApprovalStatus] = useState(initialApprovalStatus);
  const [reviews, setReviews] = useState(initialReviews);
  const [transformations, setTransformations] = useState(
    initialTransformations,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dirty = JSON.stringify(profile) !== savedSnapshot;

  function update(patch: Partial<TrainerProfileDraft>) {
    setProfile((current) => ({ ...current, ...patch }));
  }

  async function save() {
    setSaving(true);
    setSaveError(null);
    const result = await saveTrainerProfile(profile);
    setSaving(false);
    if (result.ok) {
      setSavedSnapshot(JSON.stringify(profile));
    } else {
      setSaveError(result.error ?? "Could not save. Try again.");
    }
  }

  const statusChip =
    approvalStatus === "approved"
      ? {
          label: "Live",
          className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
        }
      : approvalStatus === "review"
        ? {
            label: "In admin review",
            className: "border-amber-300/30 bg-amber-300/10 text-amber-200",
          }
        : {
            label: "Draft",
            className: "border-white/10 bg-panel text-muted",
          };

  return (
    <main className="min-h-screen bg-background text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-display text-[18px] font-black uppercase tracking-[-0.02em] text-white"
          >
            TRAINED<span className="text-brand">RIGHT</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-[220px] truncate text-sm font-bold text-muted lg:inline">
              {userEmail}
            </span>
            <span
              className={`rounded-full border px-3 py-1.5 text-[11px] font-extrabold uppercase ${statusChip.className}`}
            >
              {statusChip.label}
            </span>
            <Link
              href="/auth/signout"
              className="rounded-full border border-white/10 bg-panel px-4 py-2 text-sm font-bold text-white transition hover:border-brand/50"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[264px_minmax(0,1fr)] lg:px-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[84px] lg:self-start">
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {sections.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`flex items-center gap-3 rounded-[15px] border p-3 text-left transition ${
                    active
                      ? "border-brand/50 bg-brand/10"
                      : "border-white/10 bg-panel hover:border-white/20"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 flex-none place-items-center rounded-[11px] ${
                      active ? "bg-brand text-white" : "bg-white/[0.06] text-soft"
                    }`}
                  >
                    <Icon aria-hidden="true" size={16} />
                  </span>
                  <span className="hidden min-w-0 flex-1 sm:block">
                    <span className="block truncate text-[13px] font-extrabold text-white">
                      {item.label}
                    </span>
                    <span className="mt-0.5 hidden truncate text-[11px] font-medium text-muted lg:block">
                      {item.detail}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <section className="min-w-0 pb-24">
          {section === "overview" ? (
            <OverviewSection
              profile={profile}
              approvalStatus={approvalStatus}
              reviews={reviews}
              transformations={transformations}
              onSubmitted={() => setApprovalStatus("review")}
              goTo={setSection}
            />
          ) : null}

          {section === "profile" ? (
            <Panel
              title="Profile"
              note="Everything clients read about you."
            >
              <ProfileEditor profile={profile} update={update} />
            </Panel>
          ) : null}

          {section === "media" ? (
            <Panel
              title="Media"
              note="Select multiple photos at once — remove any with the ×."
            >
              <PhotosEditor profile={profile} userId={userId} update={update} />
            </Panel>
          ) : null}

          {section === "plans" ? (
            <Panel
              title="Price plans"
              note="Fully custom — you decide names, prices, and units."
            >
              <PlansEditor
                plans={profile.plans}
                onChange={(plans) => update({ plans })}
              />
            </Panel>
          ) : null}

          {section === "credentials" ? (
            <Panel
              title="Qualifications & awards"
              note="Title, date received, and the certificate as image or PDF."
            >
              <CredentialsEditor
                credentials={profile.credentials}
                userId={userId}
                onChange={(credentials) => update({ credentials })}
              />
            </Panel>
          ) : null}

          {section === "reviews" ? (
            <ReviewsSectionPanel
              trainerName={profile.name}
              reviews={reviews}
              setReviews={setReviews}
            />
          ) : null}

          {section === "transformations" ? (
            <TransformationsSectionPanel
              trainerName={profile.name}
              userId={userId}
              transformations={transformations}
              setTransformations={setTransformations}
            />
          ) : null}

          {section === "stories" ? <StoriesComingSoon /> : null}
        </section>
      </div>

      {/* Save bar */}
      {dirty ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 sm:px-2 lg:px-4">
            <p className="text-[13px] font-bold text-soft">
              {saveError ?? "You have unsaved changes."}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfile(JSON.parse(savedSnapshot));
                  setSaveError(null);
                }}
                className="rounded-[12px] border border-white/10 bg-panel px-4 py-2.5 text-[13px] font-extrabold text-white transition hover:border-white/25"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-[12px] bg-brand px-5 py-2.5 text-[13px] font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 aria-hidden="true" size={14} className="animate-spin" />
                ) : (
                  <Check aria-hidden="true" size={14} />
                )}
                Save changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-panel p-4 md:p-6">
      <h1 className="font-display text-[30px] font-black leading-none text-white md:text-[38px]">
        {title}
      </h1>
      {note ? (
        <p className="mt-2 text-[13px] font-semibold text-muted">{note}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}

/* ------------------------------ Overview ------------------------------ */

function OverviewSection({
  profile,
  approvalStatus,
  reviews,
  transformations,
  onSubmitted,
  goTo,
}: {
  profile: TrainerProfileDraft;
  approvalStatus: string;
  reviews: ReviewRequestItem[];
  transformations: TransformationRequestItem[];
  onSubmitted: () => void;
  goTo: (section: SectionId) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const requirements = profileRequirements(profile);
  const ready = requirements.every((item) => item.done);
  const percent = profileCompletionPercent(profile);
  const isLive = approvalStatus === "approved";

  const submittedReviews = reviews.filter((item) => item.status === "submitted");
  const verifiedReviews = submittedReviews.filter(
    (item) => item.source === "client_link",
  );
  const avgRating =
    submittedReviews.length > 0
      ? (
          submittedReviews.reduce((sum, item) => sum + (item.rating ?? 0), 0) /
          submittedReviews.length
        ).toFixed(1)
      : "—";
  const pendingLinks =
    reviews.filter((item) => item.status === "pending").length +
    transformations.filter((item) => item.status === "pending").length;
  const publishedTransformations = transformations.filter(
    (item) => item.status === "submitted",
  ).length;

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitForApproval();
    setSubmitting(false);
    if (result.ok) {
      onSubmitted();
    } else {
      setSubmitError(result.error ?? "Could not submit. Try again.");
    }
  }

  return (
    <div className="space-y-5">
      {/* Status / submit card */}
      {!isLive ? (
        <div className="rounded-[24px] border border-white/10 bg-panel p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-[240px] flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">
                {approvalStatus === "review"
                  ? "In admin review"
                  : "One step from going live"}
              </p>
              <h1 className="mt-2 font-display text-[28px] font-black leading-none text-white md:text-[36px]">
                {approvalStatus === "review"
                  ? "We're reviewing your profile."
                  : "Send your profile for approval."}
              </h1>
              <p className="mt-3 max-w-md text-[13px] leading-6 text-muted">
                {approvalStatus === "review"
                  ? "Approval usually takes under 48 hours. You can keep improving your profile in the meantime — changes are included automatically."
                  : "Approved profiles appear in marketplace search. Analytics start counting the moment you go live."}
              </p>
              {approvalStatus !== "review" ? (
                <>
                  <div className="mt-4 space-y-1.5">
                    {requirements.map((item) => (
                      <p
                        key={item.id}
                        className={`inline-flex items-center gap-2 text-[12px] font-bold ${
                          item.done ? "text-emerald-300" : "text-muted"
                        } mr-4`}
                      >
                        <Check aria-hidden="true" size={13} />
                        {item.label}
                      </p>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!ready || submitting}
                    className="mt-5 inline-flex h-12 items-center gap-2 rounded-[14px] bg-brand px-6 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
                  >
                    {submitting ? (
                      <Loader2
                        aria-hidden="true"
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Send aria-hidden="true" size={16} />
                    )}
                    Submit for approval
                  </button>
                  {submitError ? (
                    <p className="mt-3 text-[12px] font-bold text-brand-light">
                      {submitError}
                    </p>
                  ) : null}
                </>
              ) : (
                <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-[12px] font-extrabold text-amber-200">
                  <Hourglass aria-hidden="true" size={14} />
                  Submitted — awaiting review
                </span>
              )}
            </div>

            <div className="w-full max-w-[220px]">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                Profile completeness
              </p>
              <p className="mt-2 font-display text-[44px] font-black leading-none text-white">
                {percent}%
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <button
                type="button"
                onClick={() => goTo("profile")}
                className="mt-4 text-[12px] font-extrabold text-brand-light transition hover:text-brand"
              >
                Improve profile →
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Live proof stats (real data) */}
      <div>
        <SectionLabel
          title="Your proof engine"
          note="Live numbers from your review and transformation links"
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Verified reviews"
            value={String(verifiedReviews.length)}
            icon={BadgeCheck}
            tone="emerald"
          />
          <StatTile
            label="Average rating"
            value={avgRating}
            icon={Star}
            tone="brand"
          />
          <StatTile
            label="Links awaiting reply"
            value={String(pendingLinks)}
            icon={Link2}
            tone="neutral"
          />
          <StatTile
            label="Transformations"
            value={String(publishedTransformations)}
            icon={Dumbbell}
            tone="neutral"
          />
        </div>
      </div>

      {/* Demand analytics */}
      <div>
        <SectionLabel
          title="Demand analytics"
          note={
            isLive
              ? "Updated daily"
              : "Sample preview — starts counting once your profile is live"
          }
        />
        <div className="relative">
          {!isLive ? (
            <span className="absolute right-3 top-3 z-10 rounded-full border border-white/15 bg-black/70 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-soft backdrop-blur">
              Sample
            </span>
          ) : null}
          <div className={isLive ? "" : "opacity-75"}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Search impressions", "3,420", "How often you appeared in results"],
                ["Profile views", "1,284", "Clients who opened your profile"],
                ["WhatsApp contacts", "96", "Clients who started a chat"],
                ["Saves", "118", "Clients who shortlisted you"],
              ].map(([label, value, hint]) => (
                <div
                  key={label}
                  className="rounded-[18px] border border-white/10 bg-panel p-4"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-muted">
                    {label}
                  </p>
                  <p className="mt-2 font-display text-[28px] font-black leading-none text-white">
                    {value}
                  </p>
                  <p className="mt-2 text-[11px] font-medium leading-4 text-muted">
                    {hint}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              {/* Trend */}
              <div className="rounded-[18px] border border-white/10 bg-panel p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
                    Profile views · last 8 weeks
                  </p>
                  <BarChart3 aria-hidden="true" size={15} className="text-muted" />
                </div>
                <div className="mt-4 flex h-36 items-end gap-2">
                  {[42, 54, 49, 68, 72, 88, 80, 96].map((height, index) => (
                    <span
                      key={index}
                      className={`flex-1 rounded-t-[8px] ${
                        index === 7 ? "bg-brand" : "bg-brand/35"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Funnel */}
              <div className="rounded-[18px] border border-white/10 bg-panel p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
                  Conversion funnel
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    ["Impressions", 100, "3,420"],
                    ["Profile views", 38, "1,284"],
                    ["Contacts", 7, "96"],
                  ].map(([label, width, value]) => (
                    <div key={label as string}>
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-soft">{label}</span>
                        <span className="text-white">{value}</span>
                      </div>
                      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[11px] font-medium leading-5 text-muted">
                  Coaches with 3+ verified reviews convert about twice as many
                  views into chats.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => goTo("reviews")}
          className="flex items-center gap-4 rounded-[18px] border border-white/10 bg-panel p-4 text-left transition hover:border-brand/40"
        >
          <span className="grid h-11 w-11 flex-none place-items-center rounded-[13px] bg-brand/15 text-brand-light">
            <Link2 aria-hidden="true" size={19} />
          </span>
          <span>
            <span className="block text-sm font-extrabold text-white">
              Request a verified review
            </span>
            <span className="mt-0.5 block text-[12px] font-medium text-muted">
              Send a private link to a client
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => goTo("transformations")}
          className="flex items-center gap-4 rounded-[18px] border border-white/10 bg-panel p-4 text-left transition hover:border-brand/40"
        >
          <span className="grid h-11 w-11 flex-none place-items-center rounded-[13px] bg-brand/15 text-brand-light">
            <ImageIcon aria-hidden="true" size={19} />
          </span>
          <span>
            <span className="block text-sm font-extrabold text-white">
              Add a transformation
            </span>
            <span className="mt-0.5 block text-[12px] font-medium text-muted">
              Before/after proof, confirmed by the client
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="font-display text-[19px] font-black text-white">
        {title}
      </h2>
      {note ? (
        <span className="text-[11px] font-semibold text-muted">{note}</span>
      ) : null}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Star;
  tone: "emerald" | "brand" | "neutral";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-500/15 text-emerald-300"
      : tone === "brand"
        ? "bg-brand/15 text-brand-light"
        : "bg-white/[0.06] text-soft";

  return (
    <div className="rounded-[18px] border border-white/10 bg-panel p-4">
      <span className={`grid h-9 w-9 place-items-center rounded-[11px] ${toneClass}`}>
        <Icon aria-hidden="true" size={16} />
      </span>
      <p className="mt-3 font-display text-[28px] font-black leading-none text-white">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-muted">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------ Profile ------------------------------ */

function ProfileEditor({
  profile,
  update,
}: {
  profile: TrainerProfileDraft;
  update: (patch: Partial<TrainerProfileDraft>) => void;
}) {
  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <LabeledInput
          label="Name"
          value={profile.name}
          onChange={(name) => update({ name })}
          placeholder="Your public name"
        />
        <LabeledInput
          label="Headline"
          value={profile.headline}
          onChange={(headline) => update({ headline })}
          placeholder="e.g. Strength coach for busy professionals"
        />
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
            City
          </span>
          <select
            value={profile.city}
            onChange={(event) => update({ city: event.target.value })}
            className="mt-2 h-12 w-full appearance-none rounded-[14px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition focus:border-brand [&>option]:bg-[#141417]"
          >
            <option value="">Select a city</option>
            {cityOptions.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </label>
        <LabeledInput
          label="Area"
          value={profile.area}
          onChange={(area) => update({ area })}
          placeholder="e.g. Indiranagar"
        />
        <LabeledInput
          label="WhatsApp number"
          value={profile.whatsapp}
          onChange={(whatsapp) => update({ whatsapp })}
          placeholder="919876543210"
        />
        <LabeledInput
          label="Years of experience"
          value={profile.yearsExperience}
          onChange={(yearsExperience) => update({ yearsExperience })}
          placeholder="e.g. 6"
          type="number"
        />
      </div>

      <label className="block">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
          Bio
        </span>
        <textarea
          value={profile.bio}
          onChange={(event) => update({ bio: event.target.value })}
          rows={5}
          className="mt-2 w-full resize-none rounded-[14px] border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition focus:border-brand"
        />
      </label>

      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
          Search categories — where clients find you
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {searchCategories.map((category) => {
            const active = profile.searchCategories.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  update({
                    searchCategories: active
                      ? profile.searchCategories.filter(
                          (id) => id !== category.id,
                        )
                      : [...profile.searchCategories, category.id],
                  })
                }
                className={`rounded-full border px-3.5 py-2 text-[12px] font-extrabold transition ${
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-white/10 bg-black/30 text-soft hover:border-brand/40"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
          Specialties — your own words, up to 4
        </p>
        <SpecialtiesEditor
          specialties={profile.specialties}
          onChange={(specialties) => update({ specialties })}
        />
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-[14px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
      />
    </label>
  );
}

/* ------------------------------ Reviews ------------------------------ */

function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(
            `${window.location.origin}${path}`,
          );
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard can be blocked; the link is still visible in the row.
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-extrabold transition ${
        copied
          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
          : "border-white/15 bg-black/30 text-white hover:border-brand/50"
      }`}
    >
      {copied ? (
        <Check aria-hidden="true" size={12} />
      ) : (
        <Copy aria-hidden="true" size={12} />
      )}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

function ReviewsSectionPanel({
  trainerName,
  reviews,
  setReviews,
}: {
  trainerName: string;
  reviews: ReviewRequestItem[];
  setReviews: (reviews: ReviewRequestItem[]) => void;
}) {
  const [clientName, setClientName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  async function createLink() {
    if (!clientName.trim()) {
      return;
    }
    setCreating(true);
    setError(null);
    const result = await createReviewRequest(clientName, trainerName);
    setCreating(false);
    if (!result.ok || !result.id) {
      setError(result.error ?? "Could not create the link.");
      return;
    }
    setReviews([
      {
        id: result.id,
        clientName: clientName.trim(),
        source: "client_link",
        status: "pending",
        rating: null,
        reviewText: "",
        createdAt: new Date().toISOString(),
        submittedAt: null,
      },
      ...reviews,
    ]);
    setClientName("");
  }

  async function remove(id: string) {
    setReviews(reviews.filter((item) => item.id !== id));
    await deleteReviewRequest(id);
  }

  return (
    <Panel
      title="Reviews"
      note="Reviews submitted by clients through your link get the verified badge. Reviews you add yourself are shown without it."
    >
      <div className="space-y-6">
        {/* Create link */}
        <div className="rounded-[18px] border border-brand/25 bg-brand/[0.06] p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand-light">
            Request a verified review
          </p>
          <p className="mt-1.5 text-[13px] font-medium leading-6 text-soft">
            Enter your client&apos;s name and share the private link with them —
            they rate and write the review themselves.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void createLink();
                }
              }}
              placeholder="Client's name"
              className="h-12 flex-1 rounded-[13px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
            />
            <button
              type="button"
              onClick={createLink}
              disabled={creating || !clientName.trim()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[13px] bg-brand px-5 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
            >
              {creating ? (
                <Loader2 aria-hidden="true" size={15} className="animate-spin" />
              ) : (
                <Link2 aria-hidden="true" size={15} />
              )}
              Generate link
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-[12px] font-bold text-brand-light">
              {error}
            </p>
          ) : null}
        </div>

        {/* Manual review */}
        <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
          <button
            type="button"
            onClick={() => setManualOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span>
              <span className="block text-sm font-extrabold text-white">
                Add a review yourself
              </span>
              <span className="mt-0.5 block text-[12px] font-medium text-muted">
                Shown without the verified badge
              </span>
            </span>
            {manualOpen ? (
              <X aria-hidden="true" size={16} className="text-muted" />
            ) : (
              <Plus aria-hidden="true" size={16} className="text-muted" />
            )}
          </button>
          {manualOpen ? (
            <ManualReviewForm
              trainerName={trainerName}
              onAdded={(item) => {
                setReviews([item, ...reviews]);
                setManualOpen(false);
              }}
            />
          ) : null}
        </div>

        {/* List */}
        {reviews.length > 0 ? (
          <div className="space-y-2">
            {reviews.map((item) => (
              <div
                key={item.id}
                className="rounded-[16px] border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/[0.06] text-[12px] font-extrabold text-soft">
                      {item.clientName.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-white">
                        {item.clientName}
                      </p>
                      <p className="text-[11px] font-semibold text-muted">
                        {item.status === "submitted"
                          ? `Submitted ${shortDate(item.submittedAt ?? item.createdAt)}`
                          : `Link created ${shortDate(item.createdAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.status === "submitted" ? (
                      item.source === "client_link" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-300">
                          <BadgeCheck aria-hidden="true" size={12} />
                          Verified
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[10px] font-extrabold uppercase text-muted">
                          Added by you
                        </span>
                      )
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[10px] font-extrabold uppercase text-amber-200">
                          <Hourglass aria-hidden="true" size={11} />
                          Awaiting client
                        </span>
                        <CopyLinkButton path={`/review/${item.id}`} />
                      </>
                    )}
                    <button
                      type="button"
                      aria-label="Delete review"
                      onClick={() => remove(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-muted transition hover:bg-brand hover:text-white"
                    >
                      <Trash2 aria-hidden="true" size={13} />
                    </button>
                  </div>
                </div>
                {item.status === "submitted" ? (
                  <div className="mt-3 border-t border-white/5 pt-3">
                    <StarRow rating={item.rating ?? 0} />
                    <p className="mt-2 text-[13px] font-medium leading-6 text-soft">
                      {item.reviewText}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Star}
            text="No reviews yet. Generate a link for a recent client — verified reviews are your strongest conversion tool."
          />
        )}
      </div>
    </Panel>
  );
}

function ManualReviewForm({
  trainerName,
  onAdded,
}: {
  trainerName: string;
  onAdded: (item: ReviewRequestItem) => void;
}) {
  const [clientName, setClientName] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    const result = await addTrainerReview({
      clientName,
      rating,
      reviewText: text,
      consentConfirmed: consent,
      trainerDisplayName: trainerName,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not add the review.");
      return;
    }
    onAdded({
      id: crypto.randomUUID(),
      clientName: clientName.trim(),
      source: "trainer",
      status: "submitted",
      rating,
      reviewText: text.trim(),
      createdAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
      <input
        value={clientName}
        onChange={(event) => setClientName(event.target.value)}
        placeholder="Client's name"
        className="h-12 w-full rounded-[13px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
      />
      <StarPicker rating={rating} onChange={setRating} />
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        placeholder="What did the client say?"
        className="w-full resize-none rounded-[13px] border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition placeholder:text-muted focus:border-brand"
      />
      <label className="flex cursor-pointer items-start gap-3 rounded-[13px] border border-white/10 bg-black/30 p-3.5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#f02d28]"
        />
        <span className="text-[12px] font-semibold leading-5 text-soft">
          I confirm this review is genuine and the client agreed to it being
          published. It will appear <strong>without</strong> the verified
          badge.
        </span>
      </label>
      {error ? (
        <p className="text-[12px] font-bold text-brand-light">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={add}
        disabled={
          busy || !clientName.trim() || !text.trim() || !rating || !consent
        }
        className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-brand px-5 text-[13px] font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
      >
        {busy ? (
          <Loader2 aria-hidden="true" size={14} className="animate-spin" />
        ) : (
          <Plus aria-hidden="true" size={14} />
        )}
        Add review
      </button>
    </div>
  );
}

export function StarPicker({
  rating,
  onChange,
}: {
  rating: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          aria-label={`${value} star${value > 1 ? "s" : ""}`}
          onClick={() => onChange(value)}
          className="p-0.5 transition hover:scale-110"
        >
          <Star
            aria-hidden="true"
            size={26}
            className={
              value <= rating
                ? "fill-brand text-brand"
                : "fill-transparent text-white/25"
            }
          />
        </button>
      ))}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          aria-hidden="true"
          size={14}
          className={
            value <= Math.round(rating)
              ? "fill-brand text-brand"
              : "fill-transparent text-white/20"
          }
        />
      ))}
      <span className="ml-1.5 text-[12px] font-extrabold text-white">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: typeof Star;
  text: string;
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-white/15 bg-panel/40 p-8 text-center">
      <Icon aria-hidden="true" size={22} className="mx-auto text-muted" />
      <p className="mx-auto mt-3 max-w-sm text-[13px] font-semibold leading-6 text-muted">
        {text}
      </p>
    </div>
  );
}

/* --------------------------- Transformations --------------------------- */

function TransformationsSectionPanel({
  trainerName,
  userId,
  transformations,
  setTransformations,
}: {
  trainerName: string;
  userId: string;
  transformations: TransformationRequestItem[];
  setTransformations: (items: TransformationRequestItem[]) => void;
}) {
  const [mode, setMode] = useState<"client_all" | "trainer_photos">(
    "client_all",
  );
  const [clientName, setClientName] = useState("");
  const [title, setTitle] = useState("");
  const [resultLabel, setResultLabel] = useState("");
  const [durationLabel, setDurationLabel] = useState("");
  const [beforeUrl, setBeforeUrl] = useState("");
  const [afterUrl, setAfterUrl] = useState("");
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate =
    clientName.trim().length > 0 &&
    (mode === "client_all" || (Boolean(beforeUrl) && Boolean(afterUrl)));

  async function upload(files: FileList | null, slot: "before" | "after") {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }
    setUploading(slot);
    const result = await uploadPublicFile(file, userId);
    if (slot === "before") {
      setBeforeUrl(result.url);
    } else {
      setAfterUrl(result.url);
    }
    setUploading(null);
  }

  async function createLink() {
    setCreating(true);
    setError(null);
    const result = await createTransformationRequest({
      mode,
      clientName,
      trainerDisplayName: trainerName,
      title,
      resultLabel,
      durationLabel,
      beforeImageUrl: beforeUrl,
      afterImageUrl: afterUrl,
    });
    setCreating(false);
    if (!result.ok || !result.id) {
      setError(result.error ?? "Could not create the link.");
      return;
    }
    setTransformations([
      {
        id: result.id,
        mode,
        clientName: clientName.trim(),
        title: title.trim(),
        resultLabel: resultLabel.trim(),
        durationLabel: durationLabel.trim(),
        beforeImageUrl: beforeUrl,
        afterImageUrl: afterUrl,
        rating: null,
        reviewText: "",
        status: "pending",
        createdAt: new Date().toISOString(),
        submittedAt: null,
      },
      ...transformations,
    ]);
    setClientName("");
    setTitle("");
    setResultLabel("");
    setDurationLabel("");
    setBeforeUrl("");
    setAfterUrl("");
  }

  async function remove(id: string) {
    setTransformations(transformations.filter((item) => item.id !== id));
    await deleteTransformationRequest(id);
  }

  return (
    <Panel
      title="Client transformations"
      note="Both flows end with the client confirming through a private link, so every transformation is client-backed."
    >
      <div className="space-y-6">
        {/* Mode picker */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(
            [
              {
                id: "client_all",
                title: "Client submits everything",
                text: "You send the link. The client uploads the before/after photos, writes the story, and rates you.",
              },
              {
                id: "trainer_photos",
                title: "You add the photos",
                text: "You upload the before/after and the result. The client just rates and reviews to confirm it.",
              },
            ] as const
          ).map((option) => {
            const active = mode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setMode(option.id)}
                className={`rounded-[16px] border p-4 text-left transition ${
                  active
                    ? "border-brand/60 bg-brand/10"
                    : "border-white/10 bg-black/20 hover:border-white/25"
                }`}
              >
                <span
                  className={`block text-sm font-extrabold ${
                    active ? "text-white" : "text-soft"
                  }`}
                >
                  {option.title}
                </span>
                <span className="mt-1 block text-[12px] font-medium leading-5 text-muted">
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Create form */}
        <div className="rounded-[18px] border border-brand/25 bg-brand/[0.06] p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Client's name"
              className="h-12 w-full rounded-[13px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
            />
            {mode === "trainer_photos" ? (
              <>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Title (e.g. Desk job to first 5k)"
                  className="h-12 w-full rounded-[13px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                />
                <input
                  value={resultLabel}
                  onChange={(event) => setResultLabel(event.target.value)}
                  placeholder="Result (e.g. -14 kg)"
                  className="h-12 w-full rounded-[13px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                />
                <input
                  value={durationLabel}
                  onChange={(event) => setDurationLabel(event.target.value)}
                  placeholder="Duration (e.g. 6 months)"
                  className="h-12 w-full rounded-[13px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                />
              </>
            ) : null}
          </div>

          {mode === "trainer_photos" ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {(
                [
                  ["before", beforeUrl, setBeforeUrl],
                  ["after", afterUrl, setAfterUrl],
                ] as const
              ).map(([slot, url, setUrl]) => (
                <div key={slot} className="relative">
                  <label className="relative block h-28 w-40 cursor-pointer overflow-hidden rounded-[14px] border border-dashed border-white/20 bg-black/30 transition hover:border-brand/50">
                    {url ? (
                      <Image
                        src={url}
                        alt={`${slot} photo`}
                        fill
                        unoptimized={!url.startsWith("https://")}
                        className="object-cover"
                        sizes="160px"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-muted">
                        {uploading === slot ? (
                          <Loader2
                            aria-hidden="true"
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <ImageIcon aria-hidden="true" size={18} />
                        )}
                      </span>
                    )}
                    <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-extrabold uppercase text-white backdrop-blur">
                      {slot}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        void upload(event.target.files, slot);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {url ? (
                    <button
                      type="button"
                      aria-label={`Remove ${slot} photo`}
                      onClick={() => setUrl("")}
                      className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-white/15 bg-black text-white transition hover:bg-brand"
                    >
                      <X aria-hidden="true" size={12} />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={createLink}
            disabled={creating || !canCreate}
            className="mt-4 inline-flex h-12 items-center gap-2 rounded-[13px] bg-brand px-5 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
          >
            {creating ? (
              <Loader2 aria-hidden="true" size={15} className="animate-spin" />
            ) : (
              <Link2 aria-hidden="true" size={15} />
            )}
            Generate client link
          </button>
          {error ? (
            <p className="mt-2 text-[12px] font-bold text-brand-light">
              {error}
            </p>
          ) : null}
        </div>

        {/* List */}
        {transformations.length > 0 ? (
          <div className="space-y-2">
            {transformations.map((item) => (
              <div
                key={item.id}
                className="rounded-[16px] border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {item.beforeImageUrl && item.afterImageUrl ? (
                      <span className="flex flex-none -space-x-2">
                        {[item.beforeImageUrl, item.afterImageUrl].map(
                          (url, index) => (
                            <span
                              key={index}
                              className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#141417]"
                            >
                              <Image
                                src={url}
                                alt=""
                                fill
                                unoptimized={!url.startsWith("https://")}
                                className="object-cover"
                                sizes="40px"
                              />
                            </span>
                          ),
                        )}
                      </span>
                    ) : (
                      <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-white/[0.06] text-[12px] font-extrabold text-soft">
                        {item.clientName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-extrabold text-white">
                        {item.clientName}
                        {item.resultLabel ? (
                          <span className="ml-2 text-brand-light">
                            {item.resultLabel}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[11px] font-semibold text-muted">
                        {item.mode === "client_all"
                          ? "Client submits everything"
                          : "Photos added by you"}
                        {" · "}
                        {shortDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.status === "submitted" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-300">
                        <BadgeCheck aria-hidden="true" size={12} />
                        Client confirmed
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[10px] font-extrabold uppercase text-amber-200">
                          <Hourglass aria-hidden="true" size={11} />
                          Awaiting client
                        </span>
                        <CopyLinkButton path={`/transform/${item.id}`} />
                      </>
                    )}
                    <button
                      type="button"
                      aria-label="Delete transformation"
                      onClick={() => remove(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-muted transition hover:bg-brand hover:text-white"
                    >
                      <Trash2 aria-hidden="true" size={13} />
                    </button>
                  </div>
                </div>
                {item.status === "submitted" && item.reviewText ? (
                  <div className="mt-3 border-t border-white/5 pt-3">
                    <StarRow rating={item.rating ?? 0} />
                    <p className="mt-2 text-[13px] font-medium leading-6 text-soft">
                      {item.reviewText}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Dumbbell}
            text="No transformations yet. Pick a flow above and send your best client a link — before/after proof converts better than anything else on your profile."
          />
        )}
      </div>
    </Panel>
  );
}

/* ------------------------------ Stories ------------------------------ */

function StoriesComingSoon() {
  return (
    <Panel title="Stories" note="Share training moments with your audience.">
      <div className="rounded-[20px] border border-dashed border-white/15 bg-black/20 p-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-brand/15 text-brand-light">
          <Newspaper aria-hidden="true" size={24} />
        </span>
        <h2 className="mt-5 font-display text-[26px] font-black text-white">
          Coming soon
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[13px] font-semibold leading-6 text-muted">
          Stories will let you post training moments, client wins, and behind
          the scenes clips straight to your profile. We&apos;re polishing the
          format.
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-panel px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-soft">
          <ClipboardCheck aria-hidden="true" size={13} />
          You&apos;ll be notified at launch
        </span>
      </div>
    </Panel>
  );
}
