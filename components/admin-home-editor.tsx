"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Loader2,
  Pin,
  RotateCcw,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { saveHomeSettings } from "@/app/admin/home-actions";
import {
  HERO_BACKGROUNDS,
  HERO_HEIGHTS,
  HOME_SECTIONS,
  defaultHomeSettings,
  type HomeSettings,
} from "@/lib/home-settings";

/** One selectable thing (a trainer, a review, a story) in a pin list. */
export type HomePickerOption = {
  id: string;
  title: string;
  subtitle: string;
};

export type AdminHomeEditorProps = {
  initialSettings: HomeSettings;
  /** false when the site_settings migration has not been applied yet. */
  settingsAvailable: boolean;
  trainers: HomePickerOption[];
  reviews: HomePickerOption[];
  transformations: HomePickerOption[];
  stories: HomePickerOption[];
};

const INPUT_CLASS =
  "w-full rounded-[12px] border border-white/10 bg-black/30 px-3.5 py-3 text-[14px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand/70 focus:bg-black/50";

function Field({
  label,
  hint,
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-extrabold text-white">
        {label}
      </span>
      {hint ? (
        <span className="mt-1 block text-[11.5px] font-medium leading-5 text-muted">
          {hint}
        </span>
      ) : null}
      {multiline ? (
        <textarea
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${INPUT_CLASS} mt-2 resize-y leading-6`}
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${INPUT_CLASS} mt-2`}
        />
      )}
    </label>
  );
}

/** A small segmented control for the hero's fixed-choice settings. */
function Choice<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: { id: T; label: string; hint: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  const active = options.find((option) => option.id === value);

  return (
    <div>
      <p className="text-[12px] font-extrabold text-white">{label}</p>
      {hint ? (
        <p className="mt-1 text-[11.5px] font-medium leading-5 text-muted">
          {hint}
        </p>
      ) : null}
      <div
        role="radiogroup"
        aria-label={label}
        className="mt-2 flex gap-1 rounded-[12px] border border-white/10 bg-black/30 p-1"
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={option.id === value}
            onClick={() => onChange(option.id)}
            className={`min-h-9 flex-1 rounded-[9px] px-3 text-[12px] font-extrabold transition ${
              option.id === value
                ? "bg-brand text-white"
                : "text-muted hover:text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {active ? (
        <p className="mt-1.5 text-[11.5px] font-medium leading-5 text-muted">
          {active.hint}
        </p>
      ) : null}
    </div>
  );
}

/** An on/off row for a single boolean setting. */
function Toggle({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  on: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onToggle(!on)}
      className={`flex w-full items-center gap-3 rounded-[12px] border px-3.5 py-3 text-left transition ${
        on
          ? "border-emerald-400/30 bg-emerald-500/[0.08]"
          : "border-white/10 bg-black/25"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid h-6 w-6 flex-none place-items-center rounded-full transition ${
          on
            ? "bg-emerald-400 text-black"
            : "border border-white/20 text-transparent"
        }`}
      >
        <Check size={14} />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-extrabold text-white">
          {label}
        </span>
        <span className="block text-[11.5px] font-medium text-muted">
          {hint}
        </span>
      </span>
    </button>
  );
}

function Group({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-white/10 bg-panel p-4 sm:p-5">
      <h3 className="font-display text-[19px] font-black leading-none text-white">
        {title}
      </h3>
      <p className="mt-2 text-[12.5px] font-medium leading-5 text-muted">
        {description}
      </p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

/**
 * Pin-and-order control.
 *
 * Nothing pinned means automatic, which is the right default for a marketplace
 * that changes under you: new coaches and new reviews flow onto the page by
 * themselves. Pinning is an override for when a human wants one specific thing
 * to lead, and the empty state says so rather than looking broken.
 */
function FeaturePicker({
  label,
  autoHint,
  options,
  picked,
  onChange,
}: {
  label: string;
  autoHint: string;
  options: HomePickerOption[];
  picked: string[];
  onChange: (next: string[]) => void;
}) {
  const byId = useMemo(
    () => new Map(options.map((option) => [option.id, option])),
    [options],
  );

  // A pinned id whose row has since been deleted or unpublished is dropped from
  // the view; saving then quietly cleans it out of the stored list too.
  const pinned = picked.filter((id) => byId.has(id));
  const available = options.filter((option) => !pinned.includes(option.id));

  function move(index: number, delta: number) {
    const next = [...pinned];
    const target = index + delta;
    if (target < 0 || target >= next.length) {
      return;
    }
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <p className="text-[12px] font-extrabold text-white">{label}</p>

      {pinned.length === 0 ? (
        <p className="mt-2 flex items-start gap-2 rounded-[12px] border border-dashed border-white/12 px-3.5 py-3 text-[11.5px] font-medium leading-5 text-muted">
          <Sparkles
            aria-hidden="true"
            size={14}
            className="mt-0.5 flex-none text-brand-light"
          />
          {autoHint}
        </p>
      ) : (
        <ol className="mt-2 space-y-2">
          {pinned.map((id, index) => {
            const option = byId.get(id);
            if (!option) {
              return null;
            }

            return (
              <li
                key={id}
                className="flex items-center gap-2 rounded-[12px] border border-brand/30 bg-brand/[0.08] px-3 py-2.5"
              >
                <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-brand text-[11px] font-black text-white">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-extrabold text-white">
                    {option.title}
                  </span>
                  <span className="block truncate text-[11.5px] font-semibold text-muted">
                    {option.subtitle}
                  </span>
                </span>
                <span className="flex flex-none items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${option.title} up`}
                    className="grid h-8 w-8 place-items-center rounded-[9px] border border-white/12 text-soft transition enabled:hover:text-white disabled:opacity-30"
                  >
                    <ArrowUp aria-hidden="true" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === pinned.length - 1}
                    aria-label={`Move ${option.title} down`}
                    className="grid h-8 w-8 place-items-center rounded-[9px] border border-white/12 text-soft transition enabled:hover:text-white disabled:opacity-30"
                  >
                    <ArrowDown aria-hidden="true" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange(pinned.filter((item) => item !== id))
                    }
                    aria-label={`Unpin ${option.title}`}
                    className="grid h-8 w-8 place-items-center rounded-[9px] border border-white/12 text-soft transition hover:border-brand/50 hover:text-white"
                  >
                    <X aria-hidden="true" size={14} />
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {available.length > 0 ? (
        <div className="mt-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
            Pin one to the front
          </p>
          <ul className="mt-2 max-h-[248px] space-y-1.5 overflow-y-auto pr-1">
            {available.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => onChange([...pinned, option.id])}
                  className="flex w-full items-center gap-2.5 rounded-[12px] border border-white/8 bg-black/25 px-3 py-2.5 text-left transition hover:border-brand/40 hover:bg-black/45"
                >
                  <Pin
                    aria-hidden="true"
                    size={14}
                    className="flex-none text-muted"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold text-white">
                      {option.title}
                    </span>
                    <span className="block truncate text-[11.5px] font-semibold text-muted">
                      {option.subtitle}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function AdminHomeEditor({
  initialSettings,
  settingsAvailable,
  trainers,
  reviews,
  transformations,
  stories,
}: AdminHomeEditorProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(initialSettings),
    [settings, initialSettings],
  );

  function patch(next: Partial<HomeSettings>) {
    setSettings((current) => ({ ...current, ...next }));
    setSaved(false);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveHomeSettings(settings);
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error ?? "Saving failed. Try again.");
      }
    });
  }

  return (
    <div className="pb-28">
      {!settingsAvailable ? (
        <p className="mb-5 rounded-[12px] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-[13px] font-semibold leading-5 text-amber-200">
          The <code className="font-mono">site_settings</code> table is not there
          yet. Run{" "}
          <code className="font-mono">
            supabase/migrations/20260821000000_site_settings.sql
          </code>{" "}
          in the Supabase SQL editor — until then the landing page uses the
          built-in defaults and saving will fail.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Group
          title="Hero"
          description="The first screen. The coach count, average rating and lowest price under it are read live from the marketplace and are not editable here."
        >
          <Field
            label="Headline"
            hint="Write {city} to drop in the city with the most coaches."
            value={settings.hero.title}
            onChange={(title) => patch({ hero: { ...settings.hero, title } })}
          />
          <Field
            label="One line under it"
            hint="Leave empty to show nothing but the headline."
            multiline
            rows={2}
            value={settings.hero.subtitle}
            onChange={(subtitle) =>
              patch({ hero: { ...settings.hero, subtitle } })
            }
          />

          <Choice
            label="Background"
            options={HERO_BACKGROUNDS}
            value={settings.hero.background}
            onChange={(background) =>
              patch({ hero: { ...settings.hero, background } })
            }
          />

          {settings.hero.background === "ambient" ? (
            <label className="block">
              <span className="block text-[12px] font-extrabold text-white">
                Colour comes from
              </span>
              <span className="mt-1 block text-[11.5px] font-medium leading-5 text-muted">
                Their photo is blurred past recognition and used as light — you
                are picking a colour, not a picture.
              </span>
              <select
                value={settings.hero.ambientSlug}
                onChange={(event) =>
                  patch({
                    hero: { ...settings.hero, ambientSlug: event.target.value },
                  })
                }
                className={`${INPUT_CLASS} mt-2 appearance-none [&>option]:bg-[#141417]`}
              >
                <option value="">
                  Automatic — whoever leads the page
                </option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <Choice
            label="Height"
            options={HERO_HEIGHTS}
            value={settings.hero.height}
            onChange={(height) => patch({ hero: { ...settings.hero, height } })}
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle
              label="Category chips"
              hint="Live coach-type shortcuts under the search."
              on={settings.hero.showGoalChips}
              onToggle={(showGoalChips) =>
                patch({ hero: { ...settings.hero, showGoalChips } })
              }
            />
            <Toggle
              label="Coach panel"
              hint="The 'Listed now' list. Desktop only."
              on={settings.hero.showCoachPanel}
              onToggle={(showCoachPanel) =>
                patch({ hero: { ...settings.hero, showCoachPanel } })
              }
            />
          </div>
        </Group>

        <Group
          title="Coaches"
          description="The card grid. Pin the coaches you want to lead with, or leave it automatic and the strongest client proof rises on its own."
        >
          <Field
            label="Headline"
            hint="{city} works here too."
            value={settings.coaches.headline}
            onChange={(headline) =>
              patch({ coaches: { ...settings.coaches, headline } })
            }
          />
          <Field
            label="One line under it"
            hint="Leave empty to drop it."
            multiline
            rows={2}
            value={settings.coaches.body}
            onChange={(body) => patch({ coaches: { ...settings.coaches, body } })}
          />
          <FeaturePicker
            label="Featured coaches"
            autoHint="Automatic: coaches with the most client proof (rating, reviews, transformations) come first, then your manual sort rank."
            options={trainers}
            picked={settings.featuredTrainerSlugs}
            onChange={(featuredTrainerSlugs) => patch({ featuredTrainerSlugs })}
          />
        </Group>

        <Group
          title="Client proof"
          description="The before/after and the review quotes. Only confirmed transformations and published reviews can appear here."
        >
          <Field
            label="Headline"
            value={settings.proof.headline}
            onChange={(headline) =>
              patch({ proof: { ...settings.proof, headline } })
            }
          />
          <Field
            label="One line under it"
            hint="Leave empty to drop it."
            multiline
            rows={2}
            value={settings.proof.body}
            onChange={(body) => patch({ proof: { ...settings.proof, body } })}
          />
          <FeaturePicker
            label="Lead transformation"
            autoHint="Automatic: the newest confirmed before/after. Pin one to keep it in place."
            options={transformations}
            picked={settings.featuredTransformationIds}
            onChange={(featuredTransformationIds) =>
              patch({ featuredTransformationIds })
            }
          />
          <FeaturePicker
            label="Quoted reviews"
            autoHint="Automatic: verified reviews first, then highest rated, then newest."
            options={reviews}
            picked={settings.featuredReviewIds}
            onChange={(featuredReviewIds) => patch({ featuredReviewIds })}
          />
        </Group>

        <Group
          title="For coaches"
          description="The sign-up panel near the bottom. A trainer who is already signed in sees a link to their dashboard here instead."
        >
          <Field
            label="Headline"
            value={settings.trainerCta.headline}
            onChange={(headline) =>
              patch({ trainerCta: { ...settings.trainerCta, headline } })
            }
          />
          <Field
            label="One line under it"
            hint="Leave empty to drop it."
            multiline
            rows={2}
            value={settings.trainerCta.body}
            onChange={(body) =>
              patch({ trainerCta: { ...settings.trainerCta, body } })
            }
          />
          <Field
            label="Button label"
            value={settings.trainerCta.primaryLabel}
            onChange={(primaryLabel) =>
              patch({ trainerCta: { ...settings.trainerCta, primaryLabel } })
            }
          />
        </Group>

        <Group
          title="Stories"
          description="Long-form stories published against a coach. Turn the section off below if you have nothing worth leading with yet."
        >
          <FeaturePicker
            label="Featured stories"
            autoHint="Automatic: stories marked featured first, then their sort order."
            options={stories}
            picked={settings.featuredStoryIds}
            onChange={(featuredStoryIds) => patch({ featuredStoryIds })}
          />
        </Group>

        <Group
          title="Sections"
          description="Switch a block off and it disappears from the page. A block with no data behind it hides itself anyway."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {HOME_SECTIONS.map((section) => (
              <Toggle
                key={section.id}
                label={section.label}
                hint={section.hint}
                on={settings.sections[section.id]}
                onToggle={(next) =>
                  patch({
                    sections: { ...settings.sections, [section.id]: next },
                  })
                }
              />
            ))}
          </div>
        </Group>
      </div>

      {/* Save bar: pinned to the bottom so it is reachable no matter how far
          down the editor you are. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0d0d10]/95 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center gap-3 px-5 py-3">
          <div className="min-w-0 flex-1">
            {error ? (
              <p className="text-[12.5px] font-semibold leading-5 text-brand-light">
                {error}
              </p>
            ) : saved && !dirty ? (
              <p className="inline-flex items-center gap-1.5 text-[12.5px] font-extrabold text-emerald-300">
                <Check aria-hidden="true" size={14} />
                Saved — the landing page has been refreshed.
              </p>
            ) : (
              <p className="text-[12.5px] font-semibold text-muted">
                {dirty ? "Unsaved changes." : "Everything is up to date."}
              </p>
            )}
          </div>

          <Link
            href="/"
            target="_blank"
            className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-white/12 px-4 text-[13px] font-extrabold text-soft transition hover:text-white"
          >
            <ExternalLink aria-hidden="true" size={14} />
            View page
          </Link>

          <button
            type="button"
            onClick={() => {
              setSettings(defaultHomeSettings);
              setSaved(false);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-white/12 px-4 text-[13px] font-extrabold text-soft transition hover:text-white"
          >
            <RotateCcw aria-hidden="true" size={14} />
            Defaults
          </button>

          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-brand px-5 text-[13px] font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-muted"
          >
            {pending ? (
              <Loader2 aria-hidden="true" size={15} className="animate-spin" />
            ) : (
              <Save aria-hidden="true" size={15} />
            )}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
