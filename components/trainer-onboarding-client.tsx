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
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { saveTrainerProfile } from "@/app/trainer/actions";
import {
  cityOptions,
  searchCategories,
  specialtySuggestions,
} from "@/lib/search-categories";
import {
  MAX_SPECIALTIES,
  parseProfileDraft,
  profileRequirements,
  type ProfileCredential,
  type ProfilePlan,
  type TrainerProfileDraft,
} from "@/lib/trainer-profile";
import { uploadPublicFile } from "@/lib/upload";

type StepId =
  | "welcome"
  | "location"
  | "categories"
  | "specialties"
  | "bio"
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
    tip: "Use the name clients already know you by. The headline is your one-liner — think “Strength coach for busy professionals”, not a slogan.",
  },
  {
    id: "location",
    kicker: "Where you coach",
    title: "Which city do you train in?",
    tip: "Clients search by city first. The area helps them judge the commute — “Indiranagar” beats “East Bengaluru”.",
    optional: true,
  },
  {
    id: "categories",
    kicker: "How clients search",
    title: "Where should we list you?",
    tip: "These are the categories clients browse. Pick every one that genuinely fits — you'll appear in each of those searches.",
  },
  {
    id: "specialties",
    kicker: "Your edge",
    title: "Name your specialties — in your own words.",
    tip: "Up to four, written by you. Be specific: “Post-injury strength” tells a client more than “Fitness”.",
  },
  {
    id: "bio",
    kicker: "Your pitch",
    title: "Tell clients how you coach.",
    tip: "Answer three things: who you help, how a session feels, and what changes in the first month. 2–4 honest sentences beat a wall of hype.",
  },
  {
    id: "photos",
    kicker: "Show, don't tell",
    title: "Add the photos clients check first.",
    tip: "A clear face photo builds trust, the cover sets the vibe, and 3–6 gallery shots of real sessions do the selling.",
    optional: true,
  },
  {
    id: "plans",
    kicker: "Your offer",
    title: "Create your own price plans.",
    tip: "You set the structure — per session, monthly, an 8-week block, anything. A free trial plan is the single best converter.",
    optional: true,
  },
  {
    id: "credentials",
    kicker: "Your proof",
    title: "Add qualifications and awards.",
    tip: "Upload the certificate or award itself (image or PDF) with the date. Verified documents earn the badge clients filter by.",
    optional: true,
  },
  {
    id: "contact",
    kicker: "Closing the loop",
    title: "Where should leads reach you?",
    tip: "Clients message you on WhatsApp directly — no middleman. Use the number you actually answer, with country code.",
  },
  {
    id: "review",
    kicker: "Final look",
    title: "Ready to open your profile?",
    tip: "Only the checked items are required — everything else can be added later from your dashboard.",
  },
];

const planTemplates: Omit<ProfilePlan, "id">[] = [
  {
    name: "Trial session",
    description: "45 min meet and assess",
    price: null,
    unit: "first session",
    badge: "START HERE",
  },
  {
    name: "Per session",
    description: "60 min pay as you go",
    price: 800,
    unit: "per session",
    badge: "",
  },
  {
    name: "Monthly plan",
    description: "12 sessions plus WhatsApp support",
    price: 6000,
    unit: "per month",
    badge: "POPULAR",
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

  function stepIsBlocked() {
    if (step.id === "welcome") {
      return profile.name.trim().length < 2;
    }
    if (step.id === "categories") {
      return profile.searchCategories.length === 0;
    }
    if (step.id === "specialties") {
      return profile.specialties.length === 0;
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
    setFinishing(true);
    setError(null);
    const result = await saveTrainerProfile(profile, {
      completeOnboarding: true,
    });

    if (!result.ok) {
      setFinishing(false);
      setError(result.error ?? "Something went wrong. Please try again.");
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

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6">
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
                  placeholder="e.g. Vikram Rao"
                />
              </Field>
              <Field label="Headline" hint="optional">
                <IconInput
                  icon={Sparkles}
                  value={profile.headline}
                  onChange={(headline) => update({ headline })}
                  placeholder="e.g. Strength coach for busy professionals"
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
                          update({ city: active ? "" : city.name })
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
              <Field label="Area / neighbourhood" hint="optional">
                <IconInput
                  icon={MapPin}
                  value={profile.area}
                  onChange={(area) => update({ area })}
                  placeholder="e.g. Indiranagar"
                />
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
            </div>
          ) : null}

          {step.id === "specialties" ? (
            <SpecialtiesEditor
              specialties={profile.specialties}
              onChange={(specialties) => update({ specialties })}
            />
          ) : null}

          {step.id === "bio" ? (
            <div className="max-w-xl">
              <textarea
                value={profile.bio}
                onChange={(event) => update({ bio: event.target.value })}
                rows={7}
                placeholder="e.g. I coach desk-bound professionals who want to get strong without living in the gym. Sessions are 60 minutes, tracked, and built around your schedule…"
                className="w-full resize-none rounded-[16px] border border-white/10 bg-panel px-4 py-4 text-[15px] font-medium leading-7 text-white outline-none transition placeholder:text-muted focus:border-brand"
              />
              <p
                className={`mt-2 text-[12px] font-bold ${
                  profile.bio.trim().length >= 80
                    ? "text-emerald-300"
                    : "text-muted"
                }`}
              >
                {profile.bio.trim().length} / 80 characters minimum
              </p>
            </div>
          ) : null}

          {step.id === "photos" ? (
            <PhotosEditor profile={profile} userId={userId} update={update} />
          ) : null}

          {step.id === "plans" ? (
            <PlansEditor
              plans={profile.plans}
              onChange={(plans) => update({ plans })}
            />
          ) : null}

          {step.id === "credentials" ? (
            <CredentialsEditor
              credentials={profile.credentials}
              userId={userId}
              onChange={(credentials) => update({ credentials })}
            />
          ) : null}

          {step.id === "contact" ? (
            <div className="max-w-xl space-y-5">
              <Field label="WhatsApp number" required>
                <IconInput
                  icon={MessageCircle}
                  value={profile.whatsapp}
                  onChange={(whatsapp) => update({ whatsapp })}
                  placeholder="919876543210"
                  type="tel"
                />
              </Field>
              <Field label="Years of experience" hint="optional">
                <IconInput
                  icon={Award}
                  value={profile.yearsExperience}
                  onChange={(yearsExperience) => update({ yearsExperience })}
                  placeholder="e.g. 6"
                  type="number"
                />
              </Field>
            </div>
          ) : null}

          {step.id === "review" ? (
            <div className="max-w-xl space-y-2">
              {requirements.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-panel p-3.5"
                >
                  <span
                    className={`grid h-8 w-8 flex-none place-items-center rounded-full ${
                      item.done
                        ? "bg-emerald-400 text-black"
                        : "bg-white/10 text-muted"
                    }`}
                  >
                    <Check aria-hidden="true" size={15} />
                  </span>
                  <span className="text-sm font-bold text-white">
                    {item.label}
                  </span>
                </div>
              ))}
              <p className="pt-2 text-[12px] font-semibold leading-5 text-muted">
                After submitting you&apos;ll land on your dashboard, where you can
                track analytics, collect reviews, and keep polishing the
                profile before it goes for approval.
              </p>
            </div>
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
          {stepIndex < steps.length - 1 ? (
            <button
              type="button"
              disabled={stepIsBlocked()}
              onClick={() => setStepIndex((index) => index + 1)}
              className="inline-flex h-13 items-center gap-2 rounded-[14px] bg-brand px-6 py-3.5 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
            >
              Continue
              <ArrowRight aria-hidden="true" size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={finishing || requirements.some((item) => !item.done)}
              onClick={finish}
              className="inline-flex h-13 items-center gap-2 rounded-[14px] bg-brand px-6 py-3.5 text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
            >
              {finishing ? (
                <Loader2 aria-hidden="true" size={16} className="animate-spin" />
              ) : null}
              Submit profile
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
}: {
  profile: TrainerProfileDraft;
  userId: string;
  update: (patch: Partial<TrainerProfileDraft>) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function uploadSingle(
    files: FileList | null,
    key: "avatarUrl" | "coverUrl",
  ) {
    const [file] = imageAssetsFrom(files);
    if (!file) {
      return;
    }
    setUploading(true);
    const result = await uploadPublicFile(file, userId);
    update({ [key]: result.url } as Partial<TrainerProfileDraft>);
    setUploading(false);
  }

  async function uploadGallery(files: FileList | null) {
    const assets = imageAssetsFrom(files);
    if (assets.length === 0) {
      return;
    }
    setUploading(true);
    const uploaded = await Promise.all(
      assets.map(async (file) => {
        const result = await uploadPublicFile(file, userId);
        return { id: crypto.randomUUID(), url: result.url, name: file.name };
      }),
    );
    update({ gallery: [...profile.gallery, ...uploaded] });
    setUploading(false);
  }

  return (
    <div className="max-w-xl space-y-6">
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
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white opacity-0 backdrop-blur transition hover:bg-brand group-hover:opacity-100"
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

      {uploading ? (
        <p className="inline-flex items-center gap-2 text-[12px] font-bold text-soft">
          <Loader2 aria-hidden="true" size={14} className="animate-spin" />
          Uploading…
        </p>
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

export function PlansEditor({
  plans,
  onChange,
}: {
  plans: ProfilePlan[];
  onChange: (plans: ProfilePlan[]) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("per session");
  const [description, setDescription] = useState("");
  const [badge, setBadge] = useState("");

  function addPlan() {
    if (!name.trim()) {
      return;
    }
    onChange([
      ...plans,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim(),
        price: price.trim() ? Math.max(0, Number(price)) : null,
        unit: unit.trim() || "per session",
        badge: badge.trim(),
      },
    ]);
    setName("");
    setPrice("");
    setDescription("");
    setBadge("");
  }

  return (
    <div className="max-w-xl space-y-5">
      {plans.length > 0 ? (
        <div className="space-y-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-start justify-between gap-3 rounded-[16px] border border-white/10 bg-panel p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-extrabold text-white">
                    {plan.name}
                  </p>
                  {plan.badge ? (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>
                {plan.description ? (
                  <p className="mt-1 text-[12px] font-medium text-muted">
                    {plan.description}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-none items-center gap-3">
                <div className="text-right">
                  <p className="font-display text-[18px] font-black text-white">
                    {plan.price === null
                      ? "Free"
                      : `₹${plan.price.toLocaleString("en-IN")}`}
                  </p>
                  <p className="text-[10px] font-semibold text-muted">
                    {plan.unit}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${plan.name}`}
                  onClick={() =>
                    onChange(plans.filter((item) => item.id !== plan.id))
                  }
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-muted transition hover:bg-brand hover:text-white"
                >
                  <Trash2 aria-hidden="true" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {planTemplates.map((template) => (
            <button
              key={template.name}
              type="button"
              onClick={() =>
                onChange([
                  ...plans,
                  { ...template, id: crypto.randomUUID() },
                ])
              }
              className="rounded-full border border-white/10 bg-panel px-3.5 py-2 text-[12px] font-extrabold text-soft transition hover:border-brand/40 hover:text-white"
            >
              + {template.name}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-[18px] border border-white/10 bg-panel p-4">
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
          New plan
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Plan name (e.g. 8-week block)"
            className="h-12 w-full rounded-[12px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="₹ (blank = free)"
              type="number"
              min={0}
              className="h-12 w-full rounded-[12px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
            />
            <input
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              placeholder="per month"
              className="h-12 w-full rounded-[12px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
            />
          </div>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What's included"
            className="h-12 w-full rounded-[12px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
          />
          <input
            value={badge}
            onChange={(event) => setBadge(event.target.value)}
            placeholder="Badge (e.g. POPULAR) — optional"
            className="h-12 w-full rounded-[12px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
          />
        </div>
        <button
          type="button"
          onClick={addPlan}
          disabled={!name.trim()}
          className="mt-3 inline-flex h-11 items-center gap-2 rounded-[12px] bg-brand px-4 text-[13px] font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
        >
          <Plus aria-hidden="true" size={15} />
          Add plan
        </button>
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
    const result = await uploadPublicFile(file, userId);
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
