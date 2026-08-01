"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CloudUpload,
  Eye,
  FileText,
  ImagePlus,
  Loader2,
  Mars,
  MapPin,
  MessageCircle,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  Users,
  Venus,
  VenusAndMars,
  X,
} from "lucide-react";
import { saveTrainerProfile, submitForApproval } from "@/app/trainer/actions";
import { TrainerProfilePreview } from "@/components/trainer-profile-preview";
import { TrainerDetailPreview } from "@/components/trainer-detail-preview";
import { SOCIAL_ICON } from "@/components/social-icons";
import { SOCIAL_PLATFORMS } from "@/lib/socials";
import { isValidVideoLink, parseVideoLink } from "@/lib/media-links";
import {
  hasPaidSubscriptionPlans,
  subscriptionPlans,
  type SubscriptionPlan,
} from "@/lib/subscription-plans";
import {
  SPORT_CATEGORY_ID,
  cityOptions,
  searchCategories,
  specialtySuggestions,
  sportSuggestions,
} from "@/lib/search-categories";
import {
  MAX_SPECIALTIES,
  parseProfileDraft,
  profileRequirements,
  trainerGenderOptions,
  type ProfileCredential,
  type ProfileRequirement,
  type TrainerGenderOptionId,
  type TrainerProfileDraft,
} from "@/lib/trainer-profile";
import { planCadence, planDefaultName } from "@/lib/pricing";
import { uploadPublicFile } from "@/lib/client/upload";
import { ImageCropModal } from "@/components/image-crop-modal";

type StepId =
  | "welcome"
  | "gender"
  | "location"
  | "categories"
  | "storefront"
  | "photos"
  | "plans"
  | "credentials"
  | "contact"
  | "review";

type StepDef = {
  id: StepId;
  kicker: string;
  title: string;
  tip: string;
  optional?: boolean;
};

const steps: StepDef[] = [
  {
    id: "welcome",
    kicker: "Let's get you found",
    title: "What should clients call you?",
    tip: "Use the name clients already know you by — the name they'd look for.",
  },
  {
    id: "gender",
    kicker: "Coach details",
    title: "Select your gender.",
    tip: "Clients can filter coaches by gender when that matters for their comfort and goals.",
  },
  {
    id: "categories",
    kicker: "How clients search",
    title: "What kind of coach are you?",
    tip: "These are the categories clients browse — gym trainer, sports coach, dietitian, and more. Pick every one that genuinely fits and you'll show up in each of those searches.",
  },
  {
    id: "location",
    kicker: "Where you coach",
    title: "Which city do you train in?",
    tip: "Clients search by city first. Your state is filled in automatically from the city you pick.",
  },
  {
    id: "storefront",
    kicker: "Your storefront",
    title: "Photos, specialties, and your pitch.",
    tip: "This is what sells you. Watch the live preview update as you add your photo, specialties, and description — that's exactly how clients will see you.",
  },
  {
    id: "contact",
    kicker: "Closing the loop",
    title: "How can clients reach you?",
    tip: "Clients message you on WhatsApp directly — no middleman. Add your socials too so they can see your work; they show as links on your profile.",
  },
  {
    id: "photos",
    kicker: "Show, don't tell",
    title: "Add a gallery of your work.",
    tip: "3–6 shots of real sessions, your space, or results do the selling. These appear in the Photos & videos section of your profile.",
    optional: true,
  },
  {
    id: "plans",
    kicker: "Your offer",
    title: "Set your pricing.",
    tip: "Offer a free first session, set your per-session fee, and add custom packages (days a week × total days for one price). Your per-session fee is how clients compare you.",
    optional: true,
  },
  {
    id: "credentials",
    kicker: "Your proof",
    title: "Add qualifications and awards.",
    tip: "Upload the certificate or award itself (image or PDF) with the date. Real documents build trust with clients.",
    optional: true,
  },
  {
    id: "review",
    kicker: "Go live",
    title: "This is your profile. Pick a plan to submit.",
    tip: "Here's exactly how clients will see you. Choose a plan below to send your profile for approval — once approved, it goes live.",
  },
];

function draftKey(userId: string) {
  return `tr_onboarding_draft_v1:${userId}`;
}

export function TrainerOnboardingClient({
  initialProfile,
  userId,
}: {
  initialProfile: TrainerProfileDraft;
  userId: string;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<TrainerProfileDraft>(initialProfile);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadedDraft = useRef(false);

  const step = steps[stepIndex];
  const requirements = useMemo(() => profileRequirements(profile), [profile]);

  // Restore any local draft once, then mirror every change back to it.
  useEffect(() => {
    if (loadedDraft.current) {
      return;
    }
    loadedDraft.current = true;

    const timeoutId = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(draftKey(userId));
        if (stored) {
          const parsed = parseProfileDraft(JSON.parse(stored));
          setProfile((current) => ({
            ...parsed,
            name: current.name || parsed.name,
          }));
        }
      } catch {
        // Ignore unreadable drafts.
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [userId]);

  useEffect(() => {
    if (!loadedDraft.current) {
      return;
    }
    try {
      localStorage.setItem(draftKey(userId), JSON.stringify(profile));
    } catch {
      // Storage may be unavailable; server save still works.
    }
  }, [profile, userId]);

  const update = useCallback(
    (patch: Partial<TrainerProfileDraft>) => {
      setProfile((current) => ({ ...current, ...patch }));
    },
    [],
  );

  // Bulletproofing: every step up to and including contact must be complete
  // before the trainer can move on — no skipping the essentials.
  function stepIsBlocked() {
    if (step.id === "welcome") {
      return profile.name.trim().length < 2;
    }
    if (step.id === "gender") {
      return !profile.gender;
    }
    if (step.id === "categories") {
      if (profile.searchCategories.length === 0) {
        return true;
      }
      // A Sports Coach must name at least one sport before moving on.
      return (
        profile.searchCategories.includes(SPORT_CATEGORY_ID) &&
        profile.sports.length === 0
      );
    }
    if (step.id === "location") {
      return profile.city.trim().length === 0;
    }
    if (step.id === "storefront") {
      return (
        profile.specialties.length === 0 || profile.bio.trim().length < 80
      );
    }
    if (step.id === "contact") {
      return profile.whatsapp.replace(/\D/g, "").length < 10;
    }
    return false;
  }

  async function saveDraft() {
    setSaving(true);
    setError(null);
    const result = await saveTrainerProfile(profile);
    setSaving(false);
    setNotice(result.ok ? "Draft saved" : null);
    if (!result.ok && result.error) {
      setError(result.error);
    }
    if (result.ok) {
      window.setTimeout(() => setNotice(null), 2500);
    }
  }

  async function finish() {
    if (!profile.subscriptionPlan) {
      setError("Choose a plan to submit your profile.");
      return;
    }

    setFinishing(true);
    setError(null);

    // Complete onboarding (saves the profile) then submit it for approval —
    // both must succeed before we send them to the dashboard.
    const saved = await saveTrainerProfile(profile, {
      completeOnboarding: true,
    });
    if (!saved.ok) {
      setFinishing(false);
      setError(saved.error ?? "Something went wrong. Please try again.");
      return;
    }

    const submitted = await submitForApproval();
    if (!submitted.ok) {
      setFinishing(false);
      setError(
        submitted.error ?? "Could not submit for approval. Please try again.",
      );
      return;
    }

    try {
      localStorage.removeItem(draftKey(userId));
    } catch {
      // Non-fatal.
    }

    router.replace("/trainer/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/trainer"
            className="font-display text-[18px] font-black leading-none"
          >
            TRAINED<span className="text-brand">RIGHT</span>
          </Link>
          <div className="flex items-center gap-3">
            {notice ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-emerald-300">
                <Check aria-hidden="true" size={14} />
                {notice}
              </span>
            ) : null}
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-panel px-4 py-2 text-[12px] font-extrabold text-soft transition hover:text-white disabled:opacity-60"
            >
              {saving ? (
                <Loader2 aria-hidden="true" size={13} className="animate-spin" />
              ) : (
                <CloudUpload aria-hidden="true" size={13} />
              )}
              Save draft
            </button>
          </div>
        </div>
        <div className="h-1 w-full bg-white/5">
          <div
            className="h-full bg-brand transition-all duration-500"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </header>

      <section
        className={`mx-auto flex w-full flex-1 flex-col px-4 py-10 sm:px-6 ${
          step.id === "storefront"
            ? "max-w-6xl"
            : step.id === "review"
              ? "max-w-5xl"
              : "max-w-3xl"
        }`}
      >
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-light">
          {stepIndex + 1} / {steps.length} · {step.kicker}
        </p>
        <h1 className="mt-3 font-display text-[34px] font-black leading-[0.98] sm:text-[44px]">
          {step.title}
        </h1>

        {/* Guidance bubble */}
        <div className="mt-5 flex max-w-xl items-start gap-3 rounded-[18px] rounded-tl-[4px] border border-brand/20 bg-brand/[0.07] p-4">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-brand/20 text-brand-light">
            <Sparkles aria-hidden="true" size={15} />
          </span>
          <p className="text-[13px] font-medium leading-6 text-soft">
            {step.tip}
          </p>
        </div>

        <div className="mt-8 flex-1">
          {step.id === "welcome" ? (
            <div className="max-w-xl space-y-5">
              <Field label="Your name" required>
                <IconInput
                  icon={UserRound}
                  value={profile.name}
                  onChange={(name) => update({ name })}
                  placeholder="e.g. your full name"
                />
              </Field>
            </div>
          ) : null}

          {step.id === "gender" ? (
            <div className="max-w-xl space-y-5">
              <Field label="Gender" required>
                <GenderSelector
                  value={profile.gender}
                  onChange={(gender) => update({ gender })}
                />
              </Field>
            </div>
          ) : null}

          {step.id === "location" ? (
            <div className="max-w-xl space-y-5">
              <Field label="City">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {cityOptions.map((city) => {
                    const active = profile.city === city.name;
                    return (
                      <button
                        key={city.name}
                        type="button"
                        onClick={() =>
                          update(
                            active
                              ? { city: "", state: "" }
                              : { city: city.name, state: city.state },
                          )
                        }
                        className={`flex items-center gap-2 rounded-[13px] border px-3 py-3 text-left text-[13px] font-extrabold transition ${
                          active
                            ? "border-brand bg-brand/10 text-white"
                            : "border-white/10 bg-panel text-soft hover:border-white/25"
                        }`}
                      >
                        <MapPin
                          aria-hidden="true"
                          size={14}
                          className={active ? "text-brand-light" : "text-muted"}
                        />
                        {city.name}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="State">
                <div className="flex h-[52px] items-center gap-2 rounded-[14px] border border-white/10 bg-panel px-4 text-[15px] font-semibold">
                  <MapPin
                    aria-hidden="true"
                    size={17}
                    className={profile.state ? "text-brand-light" : "text-muted"}
                  />
                  {profile.state ? (
                    <span className="text-white">{profile.state}</span>
                  ) : (
                    <span className="text-muted">Pick a city to set the state</span>
                  )}
                </div>
              </Field>
            </div>
          ) : null}

          {step.id === "categories" ? (
            <div className="grid max-w-xl gap-2">
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
                        // Drop the sports list when Sports Coach is switched off
                        // so we never publish orphaned sports.
                        ...(active && category.id === SPORT_CATEGORY_ID
                          ? { sports: [] }
                          : {}),
                      })
                    }
                    className={`flex items-center gap-4 rounded-[16px] border p-4 text-left transition ${
                      active
                        ? "border-brand/60 bg-brand/10"
                        : "border-white/10 bg-panel hover:border-white/25"
                    }`}
                  >
                    <span
                      className="h-10 w-1.5 flex-none rounded-full"
                      style={{ backgroundColor: category.tint }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold text-white">
                        {category.label}
                      </span>
                      <span className="mt-0.5 block text-[12px] font-semibold text-muted">
                        {category.description}
                      </span>
                    </span>
                    <span
                      className={`grid h-6 w-6 flex-none place-items-center rounded-full border ${
                        active
                          ? "border-brand bg-brand"
                          : "border-white/20 bg-transparent"
                      }`}
                    >
                      {active ? (
                        <Check aria-hidden="true" size={14} className="text-white" />
                      ) : null}
                    </span>
                  </button>
                );
              })}
              <p className="mt-1 text-[12px] font-semibold text-muted">
                Select every category you coach — clients filter by these.
              </p>

              {profile.searchCategories.includes(SPORT_CATEGORY_ID) ? (
                <div className="mt-4 rounded-[16px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                    Which sports do you coach?
                    <span className="ml-1 text-brand-light">*</span>
                  </p>
                  <p className="mb-3 mt-1 text-[12px] font-medium leading-5 text-muted">
                    Type each sport you coach — clients search and filter by these.
                  </p>
                  <SportsEditor
                    sports={profile.sports}
                    onChange={(sports) => update({ sports })}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {step.id === "storefront" ? (
            <StorefrontEditor
              profile={profile}
              userId={userId}
              update={update}
            />
          ) : null}

          {step.id === "photos" ? (
            <PhotosEditor
              profile={profile}
              userId={userId}
              update={update}
              showSingles={false}
            />
          ) : null}

          {step.id === "plans" ? (
            <PricingEditor profile={profile} update={update} />
          ) : null}

          {step.id === "credentials" ? (
            <CredentialsEditor
              credentials={profile.credentials}
              userId={userId}
              onChange={(credentials) => update({ credentials })}
            />
          ) : null}

          {step.id === "contact" ? (
            <div className="max-w-xl space-y-6">
              <Field label="WhatsApp number" required>
                <IconInput
                  icon={MessageCircle}
                  value={profile.whatsapp}
                  onChange={(whatsapp) => update({ whatsapp })}
                  placeholder="919876543210"
                  type="tel"
                />
              </Field>

              <div>
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  Social profiles
                  <span className="ml-2 font-bold normal-case tracking-normal text-white/30">
                    optional
                  </span>
                </p>
                <p className="mb-3 text-[12px] font-medium leading-5 text-muted">
                  Paste a link or type your @handle — these become buttons on
                  your profile so clients can see your work.
                </p>
                <div className="space-y-3">
                  {SOCIAL_PLATFORMS.map((platform) => {
                    const Icon = SOCIAL_ICON[platform.id];
                    return (
                      <span key={platform.id} className="relative block">
                        <Icon
                          size={17}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        />
                        <input
                          value={profile[platform.id]}
                          onChange={(event) =>
                            update({
                              [platform.id]: event.target.value,
                            } as Partial<TrainerProfileDraft>)
                          }
                          placeholder={`${platform.label} — ${platform.placeholder}`}
                          className="h-[52px] w-full rounded-[14px] border border-white/10 bg-panel pl-11 pr-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                        />
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {step.id === "review" ? (
            <GoLiveStep
              profile={profile}
              requirements={requirements}
              finishing={finishing}
              onSelectPlan={(id) => update({ subscriptionPlan: id })}
              onSubmit={finish}
            />
          ) : null}
        </div>

        {error ? (
          <p className="mt-6 rounded-[12px] border border-brand/30 bg-brand/10 px-4 py-3 text-[13px] font-semibold text-soft">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={() => setStepIndex((index) => index - 1)}
              className="inline-flex h-13 items-center gap-2 rounded-[14px] border border-white/10 bg-panel px-5 py-3.5 text-sm font-extrabold text-white transition hover:border-white/25"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Back
            </button>
          ) : null}
          <div className="flex-1" />
          {step.optional && stepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStepIndex((index) => index + 1)}
              className="text-sm font-extrabold text-muted transition hover:text-white"
            >
              Skip for now
            </button>
          ) : null}
          {step.id === "review" ? null : step.id === "contact" ? (
            <>
              <button
                type="button"
                disabled={stepIsBlocked()}
                onClick={() => setStepIndex((index) => index + 1)}
                className="inline-flex h-13 items-center rounded-[14px] border border-white/10 bg-panel px-5 py-3.5 text-sm font-extrabold text-white transition enabled:hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Keep building
              </button>
              <button
                type="button"
                disabled={stepIsBlocked()}
                onClick={() => setStepIndex(steps.length - 1)}
                className="inline-flex h-13 items-center gap-2 rounded-[14px] bg-brand px-6 py-3.5 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
              >
                Submit for approval
                <ArrowRight aria-hidden="true" size={16} />
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={stepIsBlocked()}
              onClick={() => setStepIndex((index) => index + 1)}
              className="inline-flex h-13 items-center gap-2 rounded-[14px] bg-brand px-6 py-3.5 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
            >
              Continue
              <ArrowRight aria-hidden="true" size={16} />
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
        {label}
        {required ? <span className="ml-1 text-brand-light">*</span> : null}
        {hint ? (
          <span className="ml-2 font-bold normal-case tracking-normal text-white/30">
            {hint}
          </span>
        ) : null}
      </p>
      {children}
    </div>
  );
}

function IconInput({
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  icon: typeof UserRound;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <span className="relative block">
      <Icon
        aria-hidden="true"
        size={17}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-[52px] w-full rounded-[14px] border border-white/10 bg-panel pl-11 pr-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
      />
    </span>
  );
}

const genderIcons: Record<TrainerGenderOptionId, typeof UserRound> = {
  female: Venus,
  male: Mars,
  non_binary: VenusAndMars,
  prefer_not_to_say: UserRound,
};

export function GenderSelector({
  value,
  onChange,
}: {
  value: TrainerProfileDraft["gender"];
  onChange: (value: TrainerGenderOptionId) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {trainerGenderOptions.map((option) => {
        const active = value === option.id;
        const Icon = genderIcons[option.id];
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`flex min-h-[56px] items-center gap-3 rounded-[14px] border p-3 text-left transition ${
              active
                ? "border-brand/60 bg-brand/10"
                : "border-white/10 bg-panel hover:border-white/25"
            }`}
          >
            <span
              className={`grid h-9 w-9 flex-none place-items-center rounded-[10px] ${
                active ? "bg-brand text-white" : "bg-white/5 text-brand-light"
              }`}
            >
              <Icon aria-hidden="true" size={17} />
            </span>
            <span className="min-w-0 flex-1 text-[13px] font-extrabold text-white">
              {option.label}
            </span>
            <span
              className={`grid h-5 w-5 flex-none place-items-center rounded-full border ${
                active ? "border-brand bg-brand" : "border-white/20"
              }`}
            >
              {active ? (
                <Check aria-hidden="true" size={12} className="text-white" />
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function StorefrontEditor({
  profile,
  userId,
  update,
}: {
  profile: TrainerProfileDraft;
  userId: string;
  update: (patch: Partial<TrainerProfileDraft>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingCrop, setPendingCrop] = useState<{
    file: File;
    key: "avatarUrl" | "coverUrl";
  } | null>(null);

  function uploadSingle(files: FileList | null, key: "avatarUrl" | "coverUrl") {
    const [file] = imageAssetsFrom(files);
    if (!file) {
      return;
    }
    setPendingCrop({ file, key });
  }

  async function finishSingleUpload(file: File, key: "avatarUrl" | "coverUrl") {
    setUploading(true);
    const result = await uploadPublicFile(file, userId);
    // Only store a URL that actually persisted; a failed upload returns a
    // tab-local blob: preview that must not be saved.
    if (result.persisted) {
      update({ [key]: result.url } as Partial<TrainerProfileDraft>);
    }
    setUploading(false);
  }

  const bioLength = profile.bio.trim().length;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
      <div className="min-w-0 space-y-7">
        <div>
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
            Photos
          </p>
          <div className="flex flex-wrap items-start gap-5">
            <UploadTile
              label="Profile photo"
              shape="circle"
              url={profile.avatarUrl}
              onFiles={(files) => uploadSingle(files, "avatarUrl")}
              onClear={() => update({ avatarUrl: "" })}
            />
            <UploadTile
              label="Cover image"
              shape="wide"
              url={profile.coverUrl}
              onFiles={(files) => uploadSingle(files, "coverUrl")}
              onClear={() => update({ coverUrl: "" })}
            />
          </div>
          {uploading ? (
            <p className="mt-3 inline-flex items-center gap-2 text-[12px] font-bold text-soft">
              <Loader2 aria-hidden="true" size={14} className="animate-spin" />
              Uploading…
            </p>
          ) : null}
        </div>

        <div>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
            Specialties
            <span className="ml-1 text-brand-light">*</span>
          </p>
          <p className="mb-3 text-[12px] font-medium leading-5 text-muted">
            Up to four, in your own words — these show as tags on your card.
          </p>
          <SpecialtiesEditor
            specialties={profile.specialties}
            onChange={(specialties) => update({ specialties })}
          />
        </div>

        <div>
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
            Description
          </p>
          <textarea
            value={profile.bio}
            onChange={(event) => update({ bio: event.target.value })}
            rows={6}
            placeholder="e.g. I coach desk-bound professionals who want to get strong without living in the gym. Sessions are 60 minutes, tracked, and built around your schedule…"
            className="w-full resize-none rounded-[16px] border border-white/10 bg-panel px-4 py-4 text-[15px] font-medium leading-7 text-white outline-none transition placeholder:text-muted focus:border-brand"
          />
          <p
            className={`mt-2 text-[12px] font-bold ${
              bioLength >= 80 ? "text-emerald-300" : "text-muted"
            }`}
          >
            {bioLength} / 80 characters minimum
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
              Years of experience
              <span className="ml-2 font-bold normal-case tracking-normal text-white/30">
                optional
              </span>
            </p>
            <IconInput
              icon={Award}
              value={profile.yearsExperience}
              onChange={(yearsExperience) => update({ yearsExperience })}
              placeholder="e.g. 6"
              type="number"
            />
          </div>
          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
              Number of clients
              <span className="ml-2 font-bold normal-case tracking-normal text-white/30">
                optional
              </span>
            </p>
            <IconInput
              icon={Users}
              value={profile.clientsCount}
              onChange={(clientsCount) => update({ clientsCount })}
              placeholder="e.g. 40"
              type="number"
            />
          </div>
        </div>

        <div>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
            On your listing card, show
          </p>
          <p className="mb-3 text-[12px] font-medium leading-5 text-muted">
            Pick what fills the quote line of your search-results card. You can
            change this any time.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <BlurbOption
              active={profile.listingBlurb === "description"}
              icon={FileText}
              title="My description"
              note="Use your own words right now."
              onClick={() => update({ listingBlurb: "description" })}
            />
            <BlurbOption
              active={profile.listingBlurb === "review"}
              icon={Star}
              title="A client review"
              note="Feature a top review once you collect one."
              onClick={() => update({ listingBlurb: "review" })}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-brand/40 bg-brand/10 text-sm font-extrabold text-brand-light transition hover:bg-brand/15 lg:hidden"
        >
          <Eye aria-hidden="true" size={17} />
          Preview my profile
        </button>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-8 rounded-[20px] border border-white/10 bg-panel/60 p-4">
          <TrainerProfilePreview profile={profile} />
        </div>
      </aside>

      {previewOpen ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setPreviewOpen(false)}
            className="absolute inset-0 bg-black/70"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[26px] border-t border-white/10 bg-[#0d0d0f] p-5">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[20px] font-black text-white">
                Preview
              </h2>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-[12px] border border-white/10 bg-panel text-white"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
            <TrainerProfilePreview profile={profile} />
          </div>
        </div>
      ) : null}

      {pendingCrop ? (
        <ImageCropModal
          file={pendingCrop.file}
          aspect={pendingCrop.key === "avatarUrl" ? 1 : 16 / 9}
          shape={pendingCrop.key === "avatarUrl" ? "circle" : "rect"}
          title={
            pendingCrop.key === "avatarUrl"
              ? "Frame your profile photo"
              : "Frame your cover image"
          }
          onCancel={() => setPendingCrop(null)}
          onConfirm={(cropped) => {
            const { key } = pendingCrop;
            setPendingCrop(null);
            void finishSingleUpload(cropped, key);
          }}
        />
      ) : null}
    </div>
  );
}

function BlurbOption({
  active,
  icon: Icon,
  title,
  note,
  onClick,
}: {
  active: boolean;
  icon: typeof FileText;
  title: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-[14px] border p-3.5 text-left transition ${
        active
          ? "border-brand/60 bg-brand/10"
          : "border-white/10 bg-panel hover:border-white/25"
      }`}
    >
      <span
        className={`grid h-9 w-9 flex-none place-items-center rounded-[10px] ${
          active ? "bg-brand text-white" : "bg-white/5 text-brand-light"
        }`}
      >
        <Icon aria-hidden="true" size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-extrabold text-white">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] font-semibold text-muted">
          {note}
        </span>
      </span>
      <span
        className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full border ${
          active ? "border-brand bg-brand" : "border-white/20"
        }`}
      >
        {active ? (
          <Check aria-hidden="true" size={12} className="text-white" />
        ) : null}
      </span>
    </button>
  );
}

function GoLiveStep({
  profile,
  requirements,
  finishing,
  onSelectPlan,
  onSubmit,
}: {
  profile: TrainerProfileDraft;
  requirements: ProfileRequirement[];
  finishing: boolean;
  onSelectPlan: (id: string) => void;
  onSubmit: () => void;
}) {
  const incomplete = requirements.filter((item) => !item.done);
  const ready = incomplete.length === 0 && Boolean(profile.subscriptionPlan);

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">
          Your live profile preview
        </p>
        <TrainerDetailPreview profile={profile} />
      </div>

      {incomplete.length > 0 ? (
        <div className="rounded-[16px] border border-amber-400/30 bg-amber-500/10 p-4">
          <p className="text-[13px] font-extrabold text-amber-200">
            Finish these before you can submit:
          </p>
          <ul className="mt-2 space-y-1">
            {incomplete.map((item) => (
              <li
                key={item.id}
                className="text-[13px] font-semibold text-amber-100/90"
              >
                • {item.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h2 className="font-display text-[24px] font-black text-white">
          Choose your plan to go live
        </h2>
        <p className="mt-1 text-[13px] font-semibold text-muted">
          Select a plan to send your profile for approval. Once approved, it
          goes live for clients.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {subscriptionPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={profile.subscriptionPlan === plan.id}
              onSelect={() => onSelectPlan(plan.id)}
            />
          ))}
          {!hasPaidSubscriptionPlans ? <ContactPlanCard /> : null}
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <button
          type="button"
          disabled={!ready || finishing}
          onClick={onSubmit}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[15px] bg-brand px-6 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted sm:w-auto sm:min-w-[300px]"
        >
          {finishing ? (
            <Loader2 aria-hidden="true" size={18} className="animate-spin" />
          ) : (
            <ShieldCheck aria-hidden="true" size={18} />
          )}
          Submit for approval &amp; go live
        </button>
        <p className="mt-3 text-[12px] font-semibold text-muted">
          {incomplete.length > 0
            ? "Complete the required fields above to submit."
            : !profile.subscriptionPlan
              ? "Select a plan above to submit."
              : "You'll land on your dashboard after submitting."}
        </p>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col rounded-[18px] border p-5 text-left transition ${
        selected
          ? "border-brand bg-brand/10"
          : "border-white/10 bg-panel hover:border-white/25"
      }`}
    >
      {plan.recommended ? (
        <span className="absolute right-4 top-4 rounded-full bg-brand px-2.5 py-1 text-[9px] font-extrabold uppercase text-white">
          Recommended
        </span>
      ) : null}
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[24px] font-black text-white">
          {plan.price}
        </span>
        <span className="text-[12px] font-semibold text-muted">
          {plan.cadence}
        </span>
      </div>
      <p className="mt-1 text-[15px] font-extrabold text-white">{plan.name}</p>
      <p className="mt-1 text-[12px] font-medium leading-5 text-muted">
        {plan.description}
      </p>
      <ul className="mt-4 space-y-2">
        {plan.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-[12.5px] font-semibold text-soft"
          >
            <Check
              aria-hidden="true"
              size={15}
              className="mt-0.5 flex-none text-brand-light"
            />
            {feature}
          </li>
        ))}
      </ul>
      <span
        className={`mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-[12px] text-[13px] font-extrabold transition ${
          selected
            ? "bg-brand text-white"
            : "border border-white/15 text-white"
        }`}
      >
        {selected ? (
          <>
            <Check aria-hidden="true" size={15} />
            Selected
          </>
        ) : (
          "Select this plan"
        )}
      </span>
    </button>
  );
}

function ContactPlanCard() {
  return (
    <div className="flex flex-col rounded-[18px] border border-dashed border-white/15 bg-panel/50 p-5">
      <p className="font-display text-[18px] font-black text-white">
        Paid plans
      </p>
      <p className="mt-1 text-[12px] font-medium leading-5 text-muted">
        Custom and paid membership tiers are coming soon. For anything beyond
        the free trial, reach out and we&apos;ll sort it for you.
      </p>
      <div className="mt-auto flex items-center gap-2 pt-4 text-[13px] font-extrabold text-brand-light">
        <MessageCircle aria-hidden="true" size={15} />
        Contact for details
      </div>
    </div>
  );
}

export function SpecialtiesEditor({
  specialties,
  onChange,
}: {
  specialties: string[];
  onChange: (specialties: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const remaining = MAX_SPECIALTIES - specialties.length;

  function add(raw: string) {
    const value = raw.trim();
    if (!value || remaining <= 0) {
      return;
    }
    const exists = specialties.some(
      (item) => item.toLowerCase() === value.toLowerCase(),
    );
    if (!exists) {
      onChange([...specialties, value]);
    }
    setInput("");
  }

  const availableSuggestions = specialtySuggestions.filter(
    (suggestion) =>
      !specialties.some(
        (item) => item.toLowerCase() === suggestion.toLowerCase(),
      ),
  );

  return (
    <div className="max-w-xl">
      <div className="flex flex-wrap gap-2">
        {specialties.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 rounded-full border border-brand/50 bg-brand/10 py-2 pl-4 pr-2 text-[13px] font-extrabold text-white"
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() =>
                onChange(specialties.filter((value) => value !== item))
              }
              className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-soft transition hover:bg-brand hover:text-white"
            >
              <X aria-hidden="true" size={13} />
            </button>
          </span>
        ))}
        {specialties.length === 0 ? (
          <span className="text-[13px] font-semibold text-muted">
            Nothing added yet — write your own below.
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(input);
            }
          }}
          disabled={remaining <= 0}
          placeholder={
            remaining > 0
              ? `Type a specialty (${remaining} left)`
              : "Maximum of 4 added"
          }
          className="h-[52px] w-full rounded-[14px] border border-white/10 bg-panel px-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => add(input)}
          disabled={!input.trim() || remaining <= 0}
          className="grid h-[52px] w-[52px] flex-none place-items-center rounded-[14px] bg-brand text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
          aria-label="Add specialty"
        >
          <Plus aria-hidden="true" size={20} />
        </button>
      </div>

      {remaining > 0 && availableSuggestions.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
            Ideas
          </p>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.slice(0, 10).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => add(suggestion)}
                className="rounded-full border border-white/10 bg-panel px-3 py-1.5 text-[12px] font-bold text-soft transition hover:border-brand/40 hover:text-white"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const MAX_SPORTS = 8;

/**
 * Free-text sports picker for Sports Coaches — mirrors SpecialtiesEditor but is
 * uncapped-suggestion (trainers can type any sport). The set of sports across
 * all trainers becomes the marketplace's searchable sports list.
 */
export function SportsEditor({
  sports,
  onChange,
}: {
  sports: string[];
  onChange: (sports: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const remaining = MAX_SPORTS - sports.length;

  function add(raw: string) {
    const value = raw.trim();
    if (!value || remaining <= 0) {
      return;
    }
    const exists = sports.some(
      (item) => item.toLowerCase() === value.toLowerCase(),
    );
    if (!exists) {
      onChange([...sports, value]);
    }
    setInput("");
  }

  const availableSuggestions = sportSuggestions.filter(
    (suggestion) =>
      !sports.some((item) => item.toLowerCase() === suggestion.toLowerCase()),
  );

  return (
    <div className="max-w-xl">
      <div className="flex flex-wrap gap-2">
        {sports.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 rounded-full border border-brand/50 bg-brand/10 py-2 pl-4 pr-2 text-[13px] font-extrabold text-white"
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => onChange(sports.filter((value) => value !== item))}
              className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-soft transition hover:bg-brand hover:text-white"
            >
              <X aria-hidden="true" size={13} />
            </button>
          </span>
        ))}
        {sports.length === 0 ? (
          <span className="text-[13px] font-semibold text-muted">
            Nothing added yet — write your sports below.
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(input);
            }
          }}
          disabled={remaining <= 0}
          placeholder={
            remaining > 0
              ? `Type a sport (${remaining} left)`
              : `Maximum of ${MAX_SPORTS} added`
          }
          className="h-[52px] w-full rounded-[14px] border border-white/10 bg-panel px-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => add(input)}
          disabled={!input.trim() || remaining <= 0}
          className="grid h-[52px] w-[52px] flex-none place-items-center rounded-[14px] bg-brand text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
          aria-label="Add sport"
        >
          <Plus aria-hidden="true" size={20} />
        </button>
      </div>

      {remaining > 0 && availableSuggestions.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
            Ideas
          </p>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.slice(0, 10).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => add(suggestion)}
                className="rounded-full border border-white/10 bg-panel px-3 py-1.5 text-[12px] font-bold text-soft transition hover:border-brand/40 hover:text-white"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function imageAssetsFrom(files: FileList | null) {
  if (!files) {
    return [];
  }
  return Array.from(files).filter((file) => file.type.startsWith("image/"));
}

export function PhotosEditor({
  profile,
  userId,
  update,
  showSingles = true,
}: {
  profile: TrainerProfileDraft;
  userId: string;
  update: (patch: Partial<TrainerProfileDraft>) => void;
  /** When false, only the gallery is shown (profile/cover live elsewhere). */
  showSingles?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [videoInput, setVideoInput] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [pendingCrop, setPendingCrop] = useState<{
    file: File;
    key: "avatarUrl" | "coverUrl";
  } | null>(null);
  const [galleryQueue, setGalleryQueue] = useState<File[]>([]);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const galleryReady = useRef<File[]>([]);

  function addVideo() {
    const url = videoInput.trim();
    if (!url) {
      return;
    }
    if (!isValidVideoLink(url)) {
      setVideoError("Paste a Google Drive, YouTube, or direct video link.");
      return;
    }
    if (!profile.videos.some((video) => video.url === url)) {
      update({
        videos: [...profile.videos, { id: crypto.randomUUID(), url }],
      });
    }
    setVideoInput("");
    setVideoError(null);
  }

  function removeVideo(id: string) {
    update({ videos: profile.videos.filter((video) => video.id !== id) });
  }

  function uploadSingle(files: FileList | null, key: "avatarUrl" | "coverUrl") {
    const [file] = imageAssetsFrom(files);
    if (!file) {
      return;
    }
    setPendingCrop({ file, key });
  }

  async function finishSingleUpload(file: File, key: "avatarUrl" | "coverUrl") {
    setUploading(true);
    const result = await uploadPublicFile(file, userId);
    // Only store a URL that actually persisted; a failed upload returns a
    // tab-local blob: preview that must not be saved.
    if (result.persisted) {
      update({ [key]: result.url } as Partial<TrainerProfileDraft>);
    }
    setUploading(false);
  }

  function uploadGallery(files: FileList | null) {
    const assets = imageAssetsFrom(files);
    if (assets.length === 0) {
      return;
    }
    galleryReady.current = [];
    setGalleryTotal(assets.length);
    setGalleryQueue(assets);
  }

  async function finishGalleryQueue() {
    const files = galleryReady.current;
    galleryReady.current = [];
    setGalleryTotal(0);
    if (files.length === 0) {
      return;
    }
    setUploading(true);
    const uploaded = (
      await Promise.all(
        files.map(async (file) => {
          const result = await uploadPublicFile(file, userId);
          return { result, name: file.name };
        }),
      )
    )
      // Drop any failed upload (tab-local blob: preview) so only persisted
      // images enter the gallery.
      .filter(({ result }) => result.persisted)
      .map(({ result, name }) => ({
        id: crypto.randomUUID(),
        url: result.url,
        name,
      }));
    update({ gallery: [...profile.gallery, ...uploaded] });
    setUploading(false);
  }

  function advanceGalleryQueue() {
    setGalleryQueue((prev) => {
      const next = prev.slice(1);
      if (next.length === 0) {
        void finishGalleryQueue();
      }
      return next;
    });
  }

  function handleGalleryCropConfirm(cropped: File) {
    galleryReady.current = [...galleryReady.current, cropped];
    advanceGalleryQueue();
  }

  function handleGalleryCropCancel() {
    advanceGalleryQueue();
  }

  return (
    <div className="max-w-xl space-y-6">
      {showSingles ? (
        <div className="flex flex-wrap items-center gap-5">
          <UploadTile
            label="Profile photo"
            shape="circle"
            url={profile.avatarUrl}
            onFiles={(files) => uploadSingle(files, "avatarUrl")}
            onClear={() => update({ avatarUrl: "" })}
          />
          <UploadTile
            label="Cover image"
            shape="wide"
            url={profile.coverUrl}
            onFiles={(files) => uploadSingle(files, "coverUrl")}
            onClear={() => update({ coverUrl: "" })}
          />
        </div>
      ) : null}

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
            Gallery — select multiple at once
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-panel px-3.5 py-2 text-[12px] font-extrabold text-white transition hover:border-brand/50">
            <ImagePlus aria-hidden="true" size={14} />
            Add photos
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => {
                void uploadGallery(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        </div>

        {profile.gallery.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {profile.gallery.map((item) => (
              <div
                key={item.id}
                className="group relative h-32 overflow-hidden rounded-[14px] border border-white/10 bg-black"
              >
                <Image
                  src={item.url}
                  alt={item.name}
                  fill
                  unoptimized={!item.url.startsWith("https://")}
                  className="object-cover"
                  sizes="200px"
                />
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() =>
                    update({
                      gallery: profile.gallery.filter(
                        (asset) => asset.id !== item.id,
                      ),
                    })
                  }
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-brand"
                >
                  <X aria-hidden="true" size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[16px] border border-dashed border-white/15 bg-panel/50 p-8 text-center">
            <ImagePlus
              aria-hidden="true"
              size={22}
              className="mx-auto text-muted"
            />
            <p className="mt-3 text-[13px] font-semibold text-muted">
              No photos yet. You can select several files in one go.
            </p>
          </div>
        )}
      </div>

      <div>
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
          Video links
        </p>
        <p className="mb-3 text-[12px] font-medium leading-5 text-muted">
          Paste a Google Drive or YouTube link — it plays in the media section
          of your profile. Add as many as you like.
        </p>
        <div className="flex gap-2">
          <input
            value={videoInput}
            onChange={(event) => {
              setVideoInput(event.target.value);
              setVideoError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addVideo();
              }
            }}
            placeholder="https://drive.google.com/file/d/…"
            className="h-[52px] w-full rounded-[14px] border border-white/10 bg-panel px-4 text-[14px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
          />
          <button
            type="button"
            onClick={addVideo}
            disabled={!videoInput.trim()}
            aria-label="Add video link"
            className="grid h-[52px] w-[52px] flex-none place-items-center rounded-[14px] bg-brand text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
          >
            <Plus aria-hidden="true" size={20} />
          </button>
        </div>
        {videoError ? (
          <p className="mt-2 text-[12px] font-semibold text-brand-light">
            {videoError}
          </p>
        ) : null}

        {profile.videos.length > 0 ? (
          <div className="mt-3 space-y-2">
            {profile.videos.map((video) => {
              const parsed = parseVideoLink(video.url);
              const providerLabel =
                parsed?.provider === "drive"
                  ? "Google Drive video"
                  : parsed?.provider === "youtube"
                    ? "YouTube video"
                    : parsed
                      ? "Video"
                      : "Unrecognized link";
              return (
                <div
                  key={video.id}
                  className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-panel p-2.5"
                >
                  <span className="relative grid h-12 w-16 flex-none place-items-center overflow-hidden rounded-[10px] bg-black">
                    {parsed?.thumbnailUrl ? (
                      <Image
                        src={parsed.thumbnailUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover opacity-80"
                        sizes="64px"
                      />
                    ) : null}
                    <Play
                      aria-hidden="true"
                      size={16}
                      className="relative text-white"
                      fill="currentColor"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-bold text-white">
                      {providerLabel}
                    </span>
                    <span className="block truncate text-[11px] font-medium text-muted">
                      {video.url}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label="Remove video"
                    onClick={() => removeVideo(video.id)}
                    className="grid h-8 w-8 flex-none place-items-center rounded-full bg-white/5 text-muted transition hover:bg-brand hover:text-white"
                  >
                    <X aria-hidden="true" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {uploading ? (
        <p className="inline-flex items-center gap-2 text-[12px] font-bold text-soft">
          <Loader2 aria-hidden="true" size={14} className="animate-spin" />
          Uploading…
        </p>
      ) : null}

      {pendingCrop ? (
        <ImageCropModal
          file={pendingCrop.file}
          aspect={pendingCrop.key === "avatarUrl" ? 1 : 16 / 9}
          shape={pendingCrop.key === "avatarUrl" ? "circle" : "rect"}
          title={
            pendingCrop.key === "avatarUrl"
              ? "Frame your profile photo"
              : "Frame your cover image"
          }
          onCancel={() => setPendingCrop(null)}
          onConfirm={(cropped) => {
            const { key } = pendingCrop;
            setPendingCrop(null);
            void finishSingleUpload(cropped, key);
          }}
        />
      ) : null}

      {galleryQueue[0] ? (
        <ImageCropModal
          file={galleryQueue[0]}
          aspect={4 / 3}
          title={
            galleryTotal > 1
              ? `Frame photo ${galleryTotal - galleryQueue.length + 1} of ${galleryTotal}`
              : "Frame your photo"
          }
          confirmLabel={galleryQueue.length > 1 ? "Use & next" : "Use photo"}
          onCancel={handleGalleryCropCancel}
          onConfirm={handleGalleryCropConfirm}
        />
      ) : null}
    </div>
  );
}

function UploadTile({
  label,
  shape,
  url,
  onFiles,
  onClear,
}: {
  label: string;
  shape: "circle" | "wide";
  url: string;
  onFiles: (files: FileList | null) => void;
  onClear: () => void;
}) {
  const sizing =
    shape === "circle"
      ? "h-24 w-24 rounded-full"
      : "h-24 w-44 rounded-[16px]";

  return (
    <div>
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <div className="relative">
        <label
          className={`relative block cursor-pointer overflow-hidden border border-dashed border-white/20 bg-panel transition hover:border-brand/50 ${sizing}`}
        >
          {url ? (
            <Image
              src={url}
              alt=""
              fill
              unoptimized={!url.startsWith("https://")}
              className="object-cover"
              sizes="180px"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-muted">
              <ImagePlus aria-hidden="true" size={20} />
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              onFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        {url ? (
          <button
            type="button"
            aria-label={`Remove ${label}`}
            onClick={onClear}
            className="absolute -right-1.5 -top-1.5 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-black text-white transition hover:bg-brand"
          >
            <X aria-hidden="true" size={13} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PricingToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 flex-none items-center rounded-full transition ${
        checked ? "bg-brand" : "bg-white/15"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function amountFromInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Math.round(Number(trimmed));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function PricingEditor({
  profile,
  update,
}: {
  profile: TrainerProfileDraft;
  update: (patch: Partial<TrainerProfileDraft>) => void;
}) {
  const plans = profile.plans;
  const [name, setName] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [amount, setAmount] = useState("");

  function addPlan() {
    const totalAmount = amountFromInput(amount);
    if (totalAmount === null || totalAmount <= 0) {
      return;
    }
    update({
      plans: [
        ...plans,
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          daysPerWeek: amountFromInput(daysPerWeek),
          durationDays: amountFromInput(durationDays),
          totalAmount,
        },
      ],
    });
    setName("");
    setDaysPerWeek("");
    setDurationDays("");
    setAmount("");
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Free trial */}
      <div className="rounded-[18px] border border-white/10 bg-panel p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-white">
              Free first session
            </p>
            <p className="mt-1 text-[12px] font-medium leading-5 text-muted">
              Offer a free trial session — the single best way to turn a browser
              into a client. Shows as a “Free trial” option on your profile.
            </p>
          </div>
          <PricingToggle
            checked={profile.offersFreeTrial}
            onChange={(offersFreeTrial) => update({ offersFreeTrial })}
            label="Offer a free first session"
          />
        </div>
      </div>

      {/* Per-session fee */}
      <div className="rounded-[18px] border border-white/10 bg-panel p-4">
        <p className="text-sm font-extrabold text-white">Per-session fee</p>
        <p className="mt-1 text-[12px] font-medium leading-5 text-muted">
          What you charge for a single session. This is the price on your card
          and how clients compare and sort coaches in search.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="grid h-12 w-11 flex-none place-items-center rounded-[12px] border border-white/10 bg-black/30 text-[16px] font-black text-muted">
            ₹
          </span>
          <input
            value={profile.perSessionFee ?? ""}
            onChange={(event) =>
              update({ perSessionFee: amountFromInput(event.target.value) })
            }
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="e.g. 800"
            aria-label="Per-session fee in rupees"
            className="h-12 w-full rounded-[12px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
          />
          <span className="flex-none text-[12px] font-semibold text-muted">
            / session
          </span>
        </div>
      </div>

      {/* Custom packages */}
      <div>
        <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
          Custom packages
        </p>
        <p className="mb-3 text-[12px] font-medium leading-5 text-muted">
          A block of coaching for one total price — set how many days a week you
          train the client, over how many days total, for how much.
        </p>

        {plans.length > 0 ? (
          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-start justify-between gap-3 rounded-[16px] border border-white/10 bg-panel p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-white">
                    {plan.name.trim() || planDefaultName(plan)}
                  </p>
                  {planCadence(plan) ? (
                    <p className="mt-1 text-[12px] font-medium text-muted">
                      {planCadence(plan)}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-none items-center gap-3">
                  <div className="text-right">
                    <p className="font-display text-[18px] font-black text-white">
                      {plan.totalAmount === null
                        ? "—"
                        : `₹${plan.totalAmount.toLocaleString("en-IN")}`}
                    </p>
                    <p className="text-[10px] font-semibold text-muted">total</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${plan.name.trim() || "package"}`}
                    onClick={() =>
                      update({
                        plans: plans.filter((item) => item.id !== plan.id),
                      })
                    }
                    className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-muted transition hover:bg-brand hover:text-white"
                  >
                    <Trash2 aria-hidden="true" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-3 rounded-[18px] border border-white/10 bg-panel p-4">
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
            New package
          </p>
          <div className="space-y-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Package name (optional, e.g. 3-Month Transformation)"
              className="h-12 w-full rounded-[12px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-muted">
                  Days / week
                </span>
                <input
                  value={daysPerWeek}
                  onChange={(event) => setDaysPerWeek(event.target.value)}
                  type="number"
                  min={1}
                  max={7}
                  inputMode="numeric"
                  placeholder="e.g. 3"
                  className="h-12 w-full rounded-[12px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold text-muted">
                  Duration (days)
                </span>
                <input
                  value={durationDays}
                  onChange={(event) => setDurationDays(event.target.value)}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="e.g. 90"
                  className="h-12 w-full rounded-[12px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-extrabold text-muted">
                Total amount (₹)
              </span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="e.g. 45000 — the full price for the whole package"
                className="h-12 w-full rounded-[12px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={addPlan}
            disabled={!amount.trim()}
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-[12px] bg-brand px-4 text-[13px] font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
          >
            <Plus aria-hidden="true" size={15} />
            Add package
          </button>
        </div>
      </div>
    </div>
  );
}

export function CredentialsEditor({
  credentials,
  userId,
  onChange,
}: {
  credentials: ProfileCredential[];
  userId: string;
  onChange: (credentials: ProfileCredential[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState<"image" | "pdf" | "">("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadDocument(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      return;
    }
    setUploading(true);
    setUploadError(null);
    const result = await uploadPublicFile(file, userId);
    // A failed upload returns a tab-local blob: preview that must not be
    // stored; keep the field empty and tell the trainer to retry.
    if (!result.persisted) {
      setUploadError("That document couldn't be uploaded. Please try again.");
      setUploading(false);
      return;
    }
    setFileUrl(result.url);
    setFileType(isPdf ? "pdf" : "image");
    setUploading(false);
  }

  function addCredential() {
    if (!title.trim()) {
      return;
    }
    onChange([
      ...credentials,
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        issuedOn,
        fileUrl,
        fileType,
      },
    ]);
    setTitle("");
    setIssuedOn("");
    setFileUrl("");
    setFileType("");
  }

  return (
    <div className="max-w-xl space-y-5">
      {credentials.length > 0 ? (
        <div className="space-y-2">
          {credentials.map((credential) => (
            <div
              key={credential.id}
              className="flex items-center gap-3 rounded-[16px] border border-white/10 bg-panel p-4"
            >
              <span className="grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-[12px] bg-emerald-500/15 text-emerald-300">
                {credential.fileType === "image" && credential.fileUrl ? (
                  <span className="relative h-full w-full">
                    <Image
                      src={credential.fileUrl}
                      alt=""
                      fill
                      unoptimized={!credential.fileUrl.startsWith("https://")}
                      className="object-cover"
                      sizes="44px"
                    />
                  </span>
                ) : credential.fileType === "pdf" ? (
                  <FileText aria-hidden="true" size={18} />
                ) : (
                  <Award aria-hidden="true" size={18} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-white">
                  {credential.title}
                </p>
                <p className="mt-0.5 text-[12px] font-semibold text-muted">
                  {credential.issuedOn
                    ? new Date(credential.issuedOn).toLocaleDateString(
                        "en-IN",
                        { year: "numeric", month: "short" },
                      )
                    : "No date"}
                  {credential.fileUrl ? " · document attached" : ""}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${credential.title}`}
                onClick={() =>
                  onChange(
                    credentials.filter((item) => item.id !== credential.id),
                  )
                }
                className="grid h-8 w-8 flex-none place-items-center rounded-full bg-white/5 text-muted transition hover:bg-brand hover:text-white"
              >
                <Trash2 aria-hidden="true" size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-[18px] border border-white/10 bg-panel p-4">
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
          New qualification / award
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title (e.g. NSCA-CSCS)"
            className="h-12 w-full rounded-[12px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
          />
          <input
            value={issuedOn}
            onChange={(event) => setIssuedOn(event.target.value)}
            type="date"
            aria-label="Date received"
            className="h-12 w-full rounded-[12px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition [color-scheme:dark] placeholder:text-muted focus:border-brand"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3.5 py-2 text-[12px] font-extrabold text-white transition hover:border-brand/50">
            {uploading ? (
              <Loader2 aria-hidden="true" size={14} className="animate-spin" />
            ) : (
              <CloudUpload aria-hidden="true" size={14} />
            )}
            {fileUrl ? "Replace document" : "Upload image or PDF"}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              onChange={(event) => {
                void uploadDocument(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          {fileUrl ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-300">
              <Check aria-hidden="true" size={14} />
              {fileType === "pdf" ? "PDF attached" : "Image attached"}
            </span>
          ) : null}
        </div>
        {uploadError ? (
          <p className="mt-2 text-[12px] font-semibold text-brand">{uploadError}</p>
        ) : null}
        <button
          type="button"
          onClick={addCredential}
          disabled={!title.trim() || uploading}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-[12px] bg-brand px-4 text-[13px] font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
        >
          <Plus aria-hidden="true" size={15} />
          Add credential
        </button>
      </div>
    </div>
  );
}
