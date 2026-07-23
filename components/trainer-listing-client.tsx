"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Apple,
  ArrowDownWideNarrow,
  Check,
  ChevronDown,
  Dumbbell,
  Leaf,
  ListFilter,
  Search,
  SlidersHorizontal,
  Trophy,
  VenusAndMars,
  X,
} from "lucide-react";
import { TrainerCard } from "@/components/trainer-card";
import { filterAndSortTrainers } from "@/lib/trainer-utils";
import {
  SPORT_CATEGORY_ID,
  categoryLabels,
  searchCategories,
} from "@/lib/search-categories";
import {
  trainerGenderLabel,
  trainerGenderOptions,
  type TrainerGenderOptionId,
} from "@/lib/trainer-profile";
import type { Trainer, TrainerSort } from "@/lib/types";

const categoryIcons: Record<string, typeof Dumbbell> = {
  gym: Dumbbell,
  sport: Trophy,
  yoga: Leaf,
  diet: Apple,
};

const sortOptions: { id: TrainerSort; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "rating", label: "Top rated" },
  { id: "experience", label: "Most experienced" },
  { id: "price", label: "Price: low to high" },
];

/**
 * The search-and-filter engine for a city hub page. The server passes
 * trainers already scoped to the city, so there is no city state here — and
 * deliberately no localStorage: filters live in this visit only, seeded from
 * the `?cat=` URL param (how the home hero hands over its selection).
 */
export function TrainerListingClient({
  trainers,
  initialCategories = [],
}: {
  trainers: Trainer[];
  initialCategories?: string[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TrainerSort>("recommended");
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [sports, setSports] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [genders, setGenders] = useState<TrainerGenderOptionId[]>([]);
  // Desktop sidebar starts collapsed so results get the full width; the mobile
  // sheet is a separate toggle.
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dialog, setDialog] = useState<"categories" | "sports" | null>(null);

  // The page is statically generated, so the `?cat=` handoff (from the home
  // hero or an SEO landing page) is applied after hydration. Arriving as a
  // Sports Coach seeker drops the visitor straight into narrowing by sport.
  useEffect(() => {
    if (initialCategories.length > 0) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const fromUrl = Array.from(
      new Set(
        (params.get("cat") ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter((id) =>
            searchCategories.some((category) => category.id === id),
          ),
      ),
    );
    if (fromUrl.length > 0) {
      // Post-hydration by necessity: the page is statically generated, so the
      // URL can't be read during the server render or state initialization.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategories(fromUrl);
      if (fromUrl.includes(SPORT_CATEGORY_ID)) {
        setDialog("sports");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The city's known sports are whatever its coaches entered at onboarding.
  const knownSports = useMemo(
    () =>
      Array.from(new Set(trainers.flatMap((trainer) => trainer.sports)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [trainers],
  );

  // The speciality filter is sourced from trainers' own free-text tags, never
  // from the category taxonomy.
  const specialityOptions = useMemo(
    () =>
      Array.from(new Set(trainers.flatMap((trainer) => trainer.tags))).filter(
        Boolean,
      ),
    [trainers],
  );

  const results = useMemo(
    () =>
      filterAndSortTrainers(trainers, {
        query,
        sort,
        categories,
        sports,
        specialties,
        genders,
      }),
    [trainers, query, sort, categories, sports, specialties, genders],
  );

  // The category selection lives in its own "what are you looking for" row;
  // the Filters panel only holds the refinements.
  const panelCount = sports.length + specialties.length + genders.length;
  const sportSelected = categories.includes(SPORT_CATEGORY_ID);

  // Toggling a coach type never touches the speciality filter — the two are
  // fully decoupled. Turning the sport category off clears any chosen sports;
  // turning it on hands over to the sports picker when the dialog closes.
  function toggleCategory(id: string) {
    const active = categories.includes(id);
    setCategories(
      active
        ? categories.filter((item) => item !== id)
        : [...categories, id],
    );
    if (id === SPORT_CATEGORY_ID && active) {
      setSports([]);
    }
  }

  // Leaving the coach-type dialog as a Sports Coach seeker without chosen
  // sports flows straight into narrowing by sport.
  function closeCategoryDialog() {
    setDialog(
      categories.includes(SPORT_CATEGORY_ID) && sports.length === 0
        ? "sports"
        : null,
    );
  }

  function toggleSport(sport: string) {
    setSports((current) =>
      current.includes(sport)
        ? current.filter((item) => item !== sport)
        : [...current, sport],
    );
  }

  function toggleGender(gender: TrainerGenderOptionId) {
    setGenders((current) =>
      current.includes(gender)
        ? current.filter((item) => item !== gender)
        : [...current, gender],
    );
  }

  function toggleSpecialty(tag: string) {
    setSpecialties((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }

  // Clears the refinements only — the "what are you looking for" choice is
  // the visitor's intent, not a filter to sweep away.
  function clearRefinements() {
    setSports([]);
    setSpecialties([]);
    setGenders([]);
  }

  const panelProps = {
    sports,
    genders,
    specialties,
    specialityOptions,
    sportSelected,
    onEditSports: () => setDialog("sports"),
    onRemoveSport: toggleSport,
    onToggleGender: toggleGender,
    onToggleSpecialty: toggleSpecialty,
    onClear: clearRefinements,
  };

  return (
    <>
      <div
        className={`desktop-listing-layout ${
          filtersCollapsed ? "desktop-listing-layout--collapsed" : ""
        } grid gap-6`}
      >
        {!filtersCollapsed ? (
          <aside className="hidden lg:block">
            <div className="sticky top-8 rounded-[18px] border border-white/10 bg-panel p-4">
              <FilterPanel
                {...panelProps}
                onCollapse={() => setFiltersCollapsed(true)}
              />
            </div>
          </aside>
        ) : null}

        <section className="min-w-0">
          <div className="mb-5 border-b border-white/10 pb-5">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                size={20}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, sport or speciality"
                className="h-14 w-full rounded-[16px] border border-white/10 bg-panel pl-12 pr-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand/70 focus:bg-panel-strong"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDialog("categories")}
                className="inline-flex h-10 flex-none items-center gap-2 rounded-full border border-white/10 bg-panel px-3.5 text-[12px] font-extrabold text-white transition hover:border-brand/40"
              >
                <Search aria-hidden="true" size={15} />
                What are you looking for?
                <FilterBadge count={categories.length} />
              </button>

              {filtersCollapsed ? (
                <button
                  type="button"
                  onClick={() => setFiltersCollapsed(false)}
                  className="hidden h-10 flex-none items-center gap-2 rounded-full border border-white/10 bg-panel px-3.5 text-[12px] font-extrabold text-white transition hover:border-brand/40 lg:inline-flex"
                >
                  <SlidersHorizontal aria-hidden="true" size={15} />
                  Filters
                  <FilterBadge count={panelCount} />
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex h-10 flex-none items-center gap-2 rounded-full border border-white/10 bg-panel px-3.5 text-[12px] font-extrabold text-white lg:hidden"
              >
                <SlidersHorizontal aria-hidden="true" size={15} />
                Filters
                <FilterBadge count={panelCount} />
              </button>

              <SortControl sort={sort} onSort={setSort} />

              {categories.map((id) => (
                <FilterChip
                  key={`cat-${id}`}
                  label={categoryLabels([id])[0] ?? id}
                  onRemove={() => toggleCategory(id)}
                />
              ))}
              {sports.map((sport) => (
                <FilterChip
                  key={`sport-${sport}`}
                  label={sport}
                  onRemove={() => toggleSport(sport)}
                />
              ))}
              {genders.map((gender) => (
                <FilterChip
                  key={`gender-${gender}`}
                  label={trainerGenderLabel(gender)}
                  onRemove={() => toggleGender(gender)}
                />
              ))}
              {specialties.map((tag) => (
                <FilterChip
                  key={`spec-${tag}`}
                  label={tag}
                  onRemove={() => toggleSpecialty(tag)}
                />
              ))}

              {panelCount > 0 ? (
                <button
                  type="button"
                  onClick={clearRefinements}
                  className="h-10 flex-none rounded-full px-2 text-[12px] font-bold text-brand-light transition hover:text-white"
                >
                  Clear all
                </button>
              ) : null}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold text-muted">
              <span className="font-extrabold text-white">{results.length}</span>{" "}
              {results.length === 1 ? "coach" : "coaches"} matched
            </p>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-4 desktop-listing-results">
              {results.map((trainer) => (
                <TrainerCard key={trainer.id} trainer={trainer} showPrice />
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-white/10 bg-panel p-10 text-center">
              <ListFilter
                aria-hidden="true"
                className="mx-auto text-muted"
                size={28}
              />
              <h3 className="mt-4 font-display text-xl font-black text-white">
                No coaches match
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                Try another coach type, clear a filter, or search for a
                different speciality.
              </p>
              {panelCount > 0 ? (
                <button
                  type="button"
                  onClick={clearRefinements}
                  className="mt-5 rounded-[12px] border border-brand/30 bg-brand/10 px-5 py-3 text-sm font-bold text-brand-light"
                >
                  Clear all filters
                </button>
              ) : null}
            </div>
          )}
        </section>

        {filtersOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
              className="absolute inset-0 bg-black/65"
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#111114] p-5 shadow-2xl">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-display text-[22px] font-black text-white">
                  Filters
                </h2>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                  className="grid h-9 w-9 place-items-center rounded-[12px] border border-white/10 bg-panel text-white"
                >
                  <X aria-hidden="true" size={18} />
                </button>
              </div>
              <FilterPanel {...panelProps} />
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="mt-5 h-13 w-full rounded-[15px] bg-brand px-5 py-4 text-sm font-extrabold text-white"
              >
                Show {results.length} coaches
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {dialog === "categories" ? (
        <CategoryDialog
          selected={categories}
          resultCount={results.length}
          onToggle={toggleCategory}
          onClose={closeCategoryDialog}
        />
      ) : null}

      {dialog === "sports" ? (
        <SportsDialog
          knownSports={knownSports}
          selected={sports}
          onToggle={toggleSport}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </>
  );
}

function CategoryDialog({
  selected,
  resultCount,
  onToggle,
  onClose,
}: {
  selected: string[];
  resultCount: number;
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <DialogFrame
      title="What are you looking for?"
      kicker="Coach type"
      onClose={onClose}
    >
      <div className="grid grid-cols-1 gap-2">
        {searchCategories.map((category) => {
          const active = selected.includes(category.id);
          const Icon = categoryIcons[category.id] ?? Dumbbell;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onToggle(category.id)}
              className={`flex items-center gap-4 rounded-[15px] border p-4 text-left transition ${
                active
                  ? "border-brand/60 bg-brand/10"
                  : "border-white/10 bg-panel hover:border-white/20"
              }`}
            >
              <span
                className="grid h-11 w-11 flex-none place-items-center rounded-[13px]"
                style={{
                  backgroundColor: active ? category.tint : `${category.tint}22`,
                  color: active ? "#ffffff" : category.tint,
                }}
              >
                <Icon aria-hidden="true" size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[15px] font-extrabold text-white">
                  {category.label}
                </span>
                <span className="mt-1 block text-[12px] font-semibold text-muted">
                  {category.description}
                </span>
              </span>
              <span
                className={`grid h-6 w-6 flex-none place-items-center rounded-full border ${
                  active ? "border-brand bg-brand" : "border-white/20"
                }`}
              >
                {active ? (
                  <Check aria-hidden="true" className="text-white" size={14} />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-[12px] font-semibold leading-5 text-muted">
        Pick the coach types you want. Choosing more than one shows all of
        them.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-5 h-12 w-full rounded-[14px] bg-brand px-5 text-sm font-extrabold text-white transition"
      >
        {selected.length > 0
          ? `Show ${resultCount} ${resultCount === 1 ? "coach" : "coaches"}`
          : "Show everyone"}
      </button>
    </DialogFrame>
  );
}

function SortControl({
  sort,
  onSort,
}: {
  sort: TrainerSort;
  onSort: (sort: TrainerSort) => void;
}) {
  return (
    <label className="relative inline-flex h-10 flex-none items-center gap-2 rounded-full border border-white/10 bg-panel pl-3.5 pr-8 text-[12px] font-extrabold text-white">
      <ArrowDownWideNarrow
        aria-hidden="true"
        className="text-brand-light"
        size={15}
      />
      <select
        value={sort}
        onChange={(event) => onSort(event.target.value as TrainerSort)}
        className="max-w-[132px] appearance-none bg-transparent font-extrabold text-white outline-none [&>option]:bg-[#141417] sm:max-w-none"
        aria-label="Sort trainers"
      >
        {sortOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 text-brand-light"
        size={15}
      />
    </label>
  );
}

function FilterBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }
  return (
    <span className="grid min-h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px]">
      {count}
    </span>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex h-10 flex-none items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 pl-3.5 pr-2 text-[12px] font-extrabold text-white">
      {label}
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
        className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-soft transition hover:bg-brand hover:text-white"
      >
        <X aria-hidden="true" size={11} />
      </button>
    </span>
  );
}

function FilterPanel({
  sports,
  genders,
  specialties,
  specialityOptions,
  sportSelected,
  onEditSports,
  onRemoveSport,
  onToggleGender,
  onToggleSpecialty,
  onClear,
  onCollapse,
}: {
  sports: string[];
  genders: TrainerGenderOptionId[];
  specialties: string[];
  specialityOptions: string[];
  sportSelected: boolean;
  onEditSports: () => void;
  onRemoveSport: (sport: string) => void;
  onToggleGender: (gender: TrainerGenderOptionId) => void;
  onToggleSpecialty: (tag: string) => void;
  onClear: () => void;
  onCollapse?: () => void;
}) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-[22px] font-black text-white">
          Filters
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-bold text-brand-light"
          >
            Clear all
          </button>
          {onCollapse ? (
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Collapse filters"
              className="hidden h-8 w-8 place-items-center rounded-[10px] border border-white/10 bg-panel text-white transition hover:border-brand/40 lg:grid"
            >
              <X aria-hidden="true" size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {sportSelected ? (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase text-muted">
              Sports
            </p>
            <button
              type="button"
              onClick={onEditSports}
              className="text-[12px] font-bold text-brand-light"
            >
              {sports.length > 0 ? "Edit" : "Choose"}
            </button>
          </div>
          {sports.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {sports.map((sport) => (
                <span
                  key={sport}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand/50 bg-brand/10 py-2 pl-3.5 pr-2 text-[12px] font-extrabold text-white"
                >
                  {sport}
                  <button
                    type="button"
                    aria-label={`Remove ${sport}`}
                    onClick={() => onRemoveSport(sport)}
                    className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-soft transition hover:bg-brand hover:text-white"
                  >
                    <X aria-hidden="true" size={11} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={onEditSports}
              className="w-full rounded-[13px] border border-dashed border-white/15 bg-panel p-3 text-left text-[12px] font-semibold text-muted transition hover:border-brand/40 hover:text-white"
            >
              Showing all sports — tap to narrow to specific sports.
            </button>
          )}
        </div>
      ) : null}

      <div className="mb-6">
        <p className="mb-3 text-[10px] font-extrabold uppercase text-muted">
          Coach gender
        </p>
        <div className="grid grid-cols-2 gap-2">
          {trainerGenderOptions.map((option) => {
            const active = genders.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onToggleGender(option.id)}
                className={`flex min-h-[44px] items-center gap-2 rounded-[13px] border px-3 py-2 text-left transition ${
                  active
                    ? "border-brand/60 bg-brand/10"
                    : "border-white/10 bg-panel hover:border-white/20"
                }`}
              >
                <VenusAndMars
                  aria-hidden="true"
                  size={15}
                  className={active ? "text-brand-light" : "text-muted"}
                />
                <span className="min-w-0 flex-1 text-[12px] font-extrabold text-white">
                  {option.label}
                </span>
                {active ? (
                  <Check
                    aria-hidden="true"
                    className="flex-none text-brand-light"
                    size={14}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {specialityOptions.length > 0 ? (
        <div className="mb-2">
          <p className="mb-3 text-[10px] font-extrabold uppercase text-muted">
            Speciality
          </p>
          <div className="flex flex-wrap gap-2">
            {specialityOptions.map((spec) => {
              const active = specialties.includes(spec);
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => onToggleSpecialty(spec)}
                  className={`rounded-full border px-3.5 py-2 text-[12px] font-bold transition ${
                    active
                      ? "border-brand/60 bg-brand/15 text-white"
                      : "border-white/10 bg-panel text-soft hover:text-white"
                  }`}
                >
                  {spec}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SportsDialog({
  knownSports,
  selected,
  onToggle,
  onClose,
}: {
  knownSports: string[];
  selected: string[];
  onToggle: (sport: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const filtered = knownSports.filter((sport) =>
    sport.toLowerCase().includes(term),
  );

  return (
    <DialogFrame title="Which sports?" kicker="Sports Coach" onClose={onClose}>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          size={18}
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search sports"
          className="h-13 w-full rounded-[14px] border border-white/10 bg-panel py-3.5 pl-12 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand/60"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {filtered.map((sport) => {
            const active = selected.includes(sport);
            return (
              <button
                key={sport}
                type="button"
                onClick={() => onToggle(sport)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2.5 text-[13px] font-extrabold transition ${
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-white/10 bg-panel text-soft hover:border-brand/40 hover:text-white"
                }`}
              >
                {sport}
                {active ? <Check aria-hidden="true" size={14} /> : null}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-[16px] border border-white/10 bg-panel p-5 text-center">
          <p className="font-extrabold text-white">
            {knownSports.length === 0 ? "No sports listed yet" : "No matches"}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            {knownSports.length === 0
              ? "As sports coaches join this city, the sports they coach show up here to search."
              : `Nothing matches “${query.trim()}”. Try another sport.`}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-6 h-12 w-full rounded-[14px] bg-brand px-5 text-sm font-extrabold text-white transition"
      >
        {selected.length > 0
          ? `Apply ${selected.length} sport${selected.length > 1 ? "s" : ""}`
          : "Show all sports coaches"}
      </button>
    </DialogFrame>
  );
}

function DialogFrame({
  title,
  kicker,
  children,
  onClose,
}: {
  title: string;
  kicker: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-black/70 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0d0d0f] p-5 shadow-2xl sm:max-w-[460px] sm:rounded-[28px] sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
              {kicker}
            </p>
            <h2 className="font-display text-[28px] font-black leading-none text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 flex-none place-items-center rounded-[13px] border border-white/10 bg-panel text-white"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
