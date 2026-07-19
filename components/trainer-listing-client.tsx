"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Apple,
  ArrowDownWideNarrow,
  ArrowLeft,
  Check,
  ChevronDown,
  Dumbbell,
  Leaf,
  ListFilter,
  MapPin,
  Search,
  SlidersHorizontal,
  Target,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { TrainerCard } from "@/components/trainer-card";
import { filterAndSortTrainers, formatPriceInr } from "@/lib/trainer-utils";
import {
  categoryIdsToSpecs,
  cityOptions,
  searchCategories,
} from "@/lib/search-categories";
import type { Trainer, TrainerSort } from "@/lib/types";

type PreferenceDialog = "onboarding" | "city" | "goal" | null;

const STORAGE_KEYS = {
  onboarded: "tr_onboarded",
  city: "tr_city",
  goals: "tr_goals",
};

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

const priceOptions = [
  { label: "Any", value: 0 },
  { label: "Under ₹700", value: 700 },
  { label: "Under ₹900", value: 900 },
  { label: "Under ₹1000", value: 1000 },
];

export function TrainerListingClient({
  trainers,
  initialQuery = "",
  initialCity = "",
  initialCategory = "",
}: {
  trainers: Trainer[];
  initialQuery?: string;
  initialCity?: string;
  initialCategory?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<TrainerSort>("recommended");
  const [specs, setSpecs] = useState<string[]>(() =>
    initialCategory ? categoryIdsToSpecs([initialCategory]) : [],
  );
  const [maxPrice, setMaxPrice] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [city, setCity] = useState(initialCity);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  );
  const [dialog, setDialog] = useState<PreferenceDialog>(null);

  // Load saved preferences once. URL params always win, and the first-visit
  // dialog never opens when the visitor arrived with an explicit choice.
  useEffect(() => {
    const cameWithIntent = Boolean(initialCity || initialCategory);

    const timeoutId = window.setTimeout(() => {
      try {
        const storedCity = localStorage.getItem(STORAGE_KEYS.city);
        const storedGoals = parseStoredGoals(
          localStorage.getItem(STORAGE_KEYS.goals),
        );

        if (!initialCity && storedCity) {
          setCity(storedCity);
        }

        if (!initialCategory && storedGoals.length > 0) {
          setSelectedGoals(storedGoals);
          setSpecs(categoryIdsToSpecs(storedGoals));
        }

        if (cameWithIntent) {
          localStorage.setItem(STORAGE_KEYS.onboarded, "1");
          if (initialCity) {
            localStorage.setItem(STORAGE_KEYS.city, initialCity);
          }
          if (initialCategory) {
            localStorage.setItem(
              STORAGE_KEYS.goals,
              JSON.stringify([initialCategory]),
            );
          }
        } else if (localStorage.getItem(STORAGE_KEYS.onboarded) !== "1") {
          setDialog("onboarding");
        }
      } catch {
        if (!cameWithIntent) {
          setDialog("onboarding");
        }
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const specialities = useMemo(
    () =>
      Array.from(new Set(trainers.flatMap((trainer) => trainer.specialties))),
    [trainers],
  );

  const results = useMemo(
    () =>
      filterAndSortTrainers(trainers, {
        query,
        city,
        sort,
        specs,
        maxPrice,
      }),
    [city, maxPrice, query, sort, specs, trainers],
  );

  const activeGoalLabel = useMemo(
    () => formatGoalLabel(selectedGoals),
    [selectedGoals],
  );

  const filterCount = specs.length + (maxPrice ? 1 : 0);

  const cityLabel = city || "All cities";

  function toggleSpec(spec: string) {
    setSpecs((current) =>
      current.includes(spec)
        ? current.filter((item) => item !== spec)
        : [...current, spec],
    );
  }

  // A full reset clears everything — including goal-applied specialty
  // filters — so nobody gets stuck inside a stored goal.
  function clearFilters() {
    setSpecs([]);
    setMaxPrice(0);
    setSelectedGoals([]);
  }

  function persist(nextCity: string, nextGoals: string[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.onboarded, "1");
      localStorage.setItem(STORAGE_KEYS.city, nextCity);
      localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(nextGoals));
    } catch {
      // Local storage can be blocked; UI state still works.
    }
  }

  function saveCity(nextCity: string) {
    setCity(nextCity);
    persist(nextCity, selectedGoals);
  }

  // Selecting goals seeds the specialty filters once; after that the chips
  // are fully in the user's hands.
  function saveGoals(nextGoals: string[]) {
    setSelectedGoals(nextGoals);
    setSpecs(categoryIdsToSpecs(nextGoals));
    persist(city, nextGoals);
  }

  function skipOnboarding() {
    try {
      localStorage.setItem(STORAGE_KEYS.onboarded, "1");
    } catch {
      // Non-fatal.
    }
    setDialog(null);
  }

  const panel = (
    <FilterPanel
      specialities={specialities}
      specs={specs}
      maxPrice={maxPrice}
      selectedGoals={selectedGoals}
      onToggleGoal={(goalId) => {
        const nextGoals = selectedGoals.includes(goalId)
          ? selectedGoals.filter((id) => id !== goalId)
          : [...selectedGoals, goalId];
        saveGoals(nextGoals);
      }}
      onToggleSpec={toggleSpec}
      onPrice={setMaxPrice}
      onClear={clearFilters}
    />
  );

  return (
    <>
      <div className="desktop-listing-layout mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-0 lg:py-8">
        <aside className="hidden lg:block">
          <div className="sticky top-8 rounded-[18px] border border-white/10 bg-panel p-4">
            {panel}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                aria-label="Back to home"
                className="grid h-12 w-12 flex-none place-items-center rounded-[14px] border border-white/10 bg-panel text-white transition hover:border-brand/50 hover:text-brand-light"
              >
                <ArrowLeft aria-hidden="true" size={20} />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted">
                  Coaches in
                </p>
                <button
                  type="button"
                  onClick={() => setDialog("city")}
                  className="mt-0.5 inline-flex max-w-full items-center gap-1.5 text-left font-display text-[26px] font-black leading-none text-white transition hover:text-brand-light md:text-[34px]"
                >
                  <span className="truncate">{cityLabel}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="flex-none text-brand-light"
                    size={18}
                  />
                </button>
              </div>
              <div className="hidden flex-none items-center md:flex">
                <label className="relative inline-flex h-11 items-center gap-2 rounded-[13px] border border-white/10 bg-panel pl-3 pr-8 text-[12px] font-extrabold text-white">
                  <ArrowDownWideNarrow
                    aria-hidden="true"
                    className="text-brand-light"
                    size={15}
                  />
                  <select
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as TrainerSort)
                    }
                    className="appearance-none bg-transparent font-extrabold text-white outline-none [&>option]:bg-[#141417]"
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
              </div>
            </div>

            <div className="relative mt-4">
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                size={20}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or speciality"
                className="h-14 w-full rounded-[16px] border border-white/10 bg-panel pl-12 pr-4 text-[15px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand/70 focus:bg-panel-strong"
              />
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <label className="relative inline-flex h-10 flex-none items-center gap-2 rounded-full border border-brand/30 bg-brand/10 pl-3 pr-8 text-[12px] font-extrabold text-white md:hidden">
                <ArrowDownWideNarrow
                  aria-hidden="true"
                  className="text-brand-light"
                  size={15}
                />
                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as TrainerSort)
                  }
                  className="max-w-[142px] appearance-none bg-transparent font-extrabold text-white outline-none [&>option]:bg-[#141417]"
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

              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex h-10 flex-none items-center gap-2 rounded-full border border-white/10 bg-panel px-3.5 text-[12px] font-extrabold text-white lg:hidden"
              >
                <SlidersHorizontal aria-hidden="true" size={15} />
                Filters
                {filterCount > 0 ? (
                  <span className="grid min-h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px]">
                    {filterCount}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setDialog("goal")}
                className={`inline-flex h-10 max-w-[210px] flex-none items-center gap-2 rounded-full border px-3.5 text-[12px] font-extrabold transition ${
                  selectedGoals.length > 0
                    ? "border-brand/40 bg-brand/10 text-white"
                    : "border-white/10 bg-panel text-soft hover:text-white"
                }`}
              >
                <Target
                  aria-hidden="true"
                  className="flex-none text-brand-light"
                  size={15}
                />
                <span className="truncate">{activeGoalLabel}</span>
                {selectedGoals.length > 0 ? (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Clear goal"
                    onClick={(event) => {
                      event.stopPropagation();
                      saveGoals([]);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.stopPropagation();
                        saveGoals([]);
                      }
                    }}
                    className="grid h-5 w-5 flex-none place-items-center rounded-full bg-white/10 transition hover:bg-brand"
                  >
                    <X aria-hidden="true" size={11} />
                  </span>
                ) : null}
              </button>

              {specialities.slice(0, 6).map((chip) => {
                const active = specs.includes(chip);
                return (
                  <button
                    type="button"
                    key={chip}
                    onClick={() => toggleSpec(chip)}
                    className={`h-10 flex-none rounded-full border px-3.5 text-[12px] font-extrabold transition ${
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-white/10 bg-panel text-soft hover:text-white"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-muted">
                <span className="font-extrabold text-white">
                  {results.length}
                </span>{" "}
                coaches matched
              </p>
              <p className="mt-1 text-[12px] font-semibold text-muted">
                {selectedGoals.length === 0
                  ? city
                    ? `Showing available trainers in ${city}`
                    : "Showing available trainers across all cities"
                  : city
                    ? `${activeGoalLabel} in ${city}`
                    : `${activeGoalLabel} across all cities`}
              </p>
            </div>
            {filterCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="self-start rounded-full border border-brand/30 bg-brand/10 px-3 py-2 text-[12px] font-bold text-brand-light md:self-auto"
              >
                Reset all filters
              </button>
            ) : null}
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
              <h2 className="mt-4 font-display text-xl font-black text-white">
                No coaches match
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                Try clearing a filter or searching for a different speciality.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-[12px] border border-brand/30 bg-brand/10 px-5 py-3 text-sm font-bold text-brand-light"
              >
                Clear all filters
              </button>
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
              {panel}
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

      {dialog === "onboarding" ? (
        <OnboardingDialog
          initialCity={city}
          initialGoals={selectedGoals}
          onSkip={skipOnboarding}
          onSave={(nextCity, nextGoals) => {
            setCity(nextCity);
            setSelectedGoals(nextGoals);
            setSpecs(categoryIdsToSpecs(nextGoals));
            persist(nextCity, nextGoals);
            setDialog(null);
          }}
        />
      ) : null}

      {dialog === "city" ? (
        <CityDialog
          initialCity={city}
          onClose={() => setDialog(null)}
          onSave={(nextCity) => {
            saveCity(nextCity);
            setDialog(null);
          }}
        />
      ) : null}

      {dialog === "goal" ? (
        <GoalDialog
          initialGoals={selectedGoals}
          onClose={() => setDialog(null)}
          onSave={(goals) => {
            saveGoals(goals);
            setDialog(null);
          }}
        />
      ) : null}
    </>
  );
}

function FilterPanel({
  specialities,
  specs,
  maxPrice,
  selectedGoals,
  onToggleGoal,
  onToggleSpec,
  onPrice,
  onClear,
}: {
  specialities: string[];
  specs: string[];
  maxPrice: number;
  selectedGoals: string[];
  onToggleGoal: (goalId: string) => void;
  onToggleSpec: (spec: string) => void;
  onPrice: (price: number) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-[22px] font-black text-white">
          Filters
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-bold text-brand-light"
        >
          Clear all
        </button>
      </div>

      <div className="mb-6">
        <p className="mb-3 text-[10px] font-extrabold uppercase text-muted">
          Coach type
        </p>
        <div className="grid grid-cols-1 gap-2">
          {searchCategories.map((category) => {
            const Icon = categoryIcons[category.id] ?? Dumbbell;
            const active = selectedGoals.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onToggleGoal(category.id)}
                className={`flex items-center gap-3 rounded-[13px] border p-3 text-left transition ${
                  active
                    ? "border-brand/60 bg-brand/10"
                    : "border-white/10 bg-panel hover:border-white/20"
                }`}
              >
                <span
                  className="grid h-9 w-9 flex-none place-items-center rounded-[10px]"
                  style={{
                    backgroundColor: active
                      ? category.tint
                      : `${category.tint}22`,
                    color: active ? "#ffffff" : category.tint,
                  }}
                >
                  <Icon aria-hidden="true" size={17} />
                </span>
                <span className="min-w-0 flex-1 text-[13px] font-extrabold text-white">
                  {category.shortLabel}
                </span>
                {active ? (
                  <Check
                    aria-hidden="true"
                    className="flex-none text-brand-light"
                    size={16}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-3 text-[10px] font-extrabold uppercase text-muted">
          Speciality
        </p>
        <div className="flex flex-wrap gap-2">
          {specialities.map((spec) => {
            const active = specs.includes(spec);
            return (
              <button
                key={spec}
                type="button"
                onClick={() => onToggleSpec(spec)}
                className={`rounded-full border px-3.5 py-2 text-[12px] font-bold transition ${
                  active
                    ? "border-brand/60 bg-brand/15 text-white"
                    : "border-white/10 bg-panel text-soft"
                }`}
              >
                {spec}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-3 text-[10px] font-extrabold uppercase text-muted">
          Max price / session
        </p>
        <div className="grid grid-cols-2 gap-2">
          {priceOptions.map((price) => (
            <button
              key={price.value}
              type="button"
              onClick={() => onPrice(price.value)}
              className={`rounded-[12px] border px-3 py-3 text-[12px] font-bold transition ${
                maxPrice === price.value
                  ? "border-brand/60 bg-brand/15 text-white"
                  : "border-white/10 bg-panel text-soft"
              }`}
            >
              {price.value === 0 ? price.label : formatPriceInr(price.value)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OnboardingDialog({
  initialCity,
  initialGoals,
  onSkip,
  onSave,
}: {
  initialCity: string;
  initialGoals: string[];
  onSkip: () => void;
  onSave: (city: string, goals: string[]) => void;
}) {
  const [step, setStep] = useState(0);
  const [city, setCity] = useState(initialCity);
  const [cityQuery, setCityQuery] = useState(initialCity);
  const [goals, setGoals] = useState(initialGoals);
  const canContinue = step === 0 ? Boolean(city) : true;

  return (
    <DialogFrame
      title={
        step === 0 ? "Which city are you training in?" : "Who are you looking for?"
      }
      kicker={step === 0 ? "Step 1 · Your city" : "Step 2 · Your goal"}
      onClose={onSkip}
    >
      <div className="mb-5 flex gap-2">
        {[0, 1].map((index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index <= step ? "bg-brand" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {step === 0 ? (
        <CityStep
          city={city}
          query={cityQuery}
          onQuery={(value) => {
            setCityQuery(value);
            setCity("");
          }}
          onSelect={(value) => {
            setCity(value);
            setCityQuery(value);
          }}
        />
      ) : (
        <GoalStep
          goals={goals}
          onToggle={(goalId) => setGoals(toggleValue(goals, goalId))}
        />
      )}

      <div className="mt-6 flex items-center gap-3">
        {step === 1 ? (
          <button
            type="button"
            onClick={() => setStep(0)}
            className="h-12 rounded-[14px] border border-white/10 bg-panel px-5 text-sm font-extrabold text-white"
          >
            Back
          </button>
        ) : (
          <button
            type="button"
            onClick={onSkip}
            className="h-12 px-2 text-sm font-extrabold text-muted transition hover:text-white"
          >
            Skip
          </button>
        )}
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => {
            if (!canContinue) {
              return;
            }
            if (step === 0) {
              setStep(1);
            } else {
              onSave(city, goals);
            }
          }}
          className="h-12 flex-1 rounded-[14px] bg-brand px-5 text-sm font-extrabold text-white transition disabled:bg-white/10 disabled:text-muted"
        >
          {step === 0
            ? "Continue"
            : goals.length > 0
              ? "Show me coaches"
              : "Show me everyone"}
        </button>
      </div>
    </DialogFrame>
  );
}

function CityDialog({
  initialCity,
  onClose,
  onSave,
}: {
  initialCity: string;
  onClose: () => void;
  onSave: (city: string) => void;
}) {
  const [city, setCity] = useState(initialCity);
  const [query, setQuery] = useState(initialCity);

  return (
    <DialogFrame title="Change city" kicker="Location" onClose={onClose}>
      <CityStep
        city={city}
        query={query}
        onQuery={(value) => {
          setQuery(value);
          setCity("");
        }}
        onSelect={(value) => {
          setCity(value);
          setQuery(value);
        }}
      />
      <button
        type="button"
        disabled={!city}
        onClick={() => onSave(city)}
        className="mt-6 h-12 w-full rounded-[14px] bg-brand px-5 text-sm font-extrabold text-white transition disabled:bg-white/10 disabled:text-muted"
      >
        Save city
      </button>
    </DialogFrame>
  );
}

function GoalDialog({
  initialGoals,
  onClose,
  onSave,
}: {
  initialGoals: string[];
  onClose: () => void;
  onSave: (goals: string[]) => void;
}) {
  const [goals, setGoals] = useState(initialGoals);

  return (
    <DialogFrame title="Edit goal" kicker="Training target" onClose={onClose}>
      <GoalStep
        goals={goals}
        onToggle={(goalId) => setGoals(toggleValue(goals, goalId))}
      />
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => onSave([])}
          className="h-12 rounded-[14px] border border-white/10 bg-panel px-5 text-sm font-extrabold text-soft transition hover:text-white"
        >
          Clear goal
        </button>
        <button
          type="button"
          onClick={() => onSave(goals)}
          className="h-12 flex-1 rounded-[14px] bg-brand px-5 text-sm font-extrabold text-white transition"
        >
          Save goal
        </button>
      </div>
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

function CityStep({
  city,
  query,
  onQuery,
  onSelect,
}: {
  city: string;
  query: string;
  onQuery: (value: string) => void;
  onSelect: (value: string) => void;
}) {
  const filteredCities = cityOptions.filter((option) =>
    option.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          size={18}
        />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search your city"
          className="h-13 w-full rounded-[14px] border border-white/10 bg-panel py-3.5 pl-12 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand/60"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        {filteredCities.map((option) => {
          const selected = city === option.name;
          return (
            <button
              key={option.name}
              type="button"
              onClick={() => onSelect(option.name)}
              className={`flex items-center gap-3 rounded-[14px] border p-4 text-left transition ${
                selected
                  ? "border-brand/60 bg-brand/10"
                  : "border-white/10 bg-panel hover:border-white/20"
              }`}
            >
              <MapPin
                aria-hidden="true"
                className={selected ? "text-brand-light" : "text-muted"}
                size={18}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-white">
                  {option.name}
                </span>
                <span className="mt-1 block text-[12px] font-semibold text-muted">
                  {option.note}
                </span>
              </span>
              {selected ? (
                <Check aria-hidden="true" className="text-brand-light" size={18} />
              ) : null}
            </button>
          );
        })}
      </div>

      {filteredCities.length === 0 ? (
        <div className="mt-5 rounded-[16px] border border-white/10 bg-panel p-5 text-center">
          <p className="font-extrabold text-white">We are not there yet</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Try the nearest metro for now. We will add more cities as supply
            comes online.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function GoalStep({
  goals,
  onToggle,
}: {
  goals: string[];
  onToggle: (goalId: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-2">
        {searchCategories.map((category) => {
          const selected = goals.includes(category.id);
          const Icon = categoryIcons[category.id] ?? Dumbbell;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onToggle(category.id)}
              className={`flex items-center gap-4 rounded-[15px] border p-4 text-left transition ${
                selected
                  ? "border-brand/60 bg-brand/10"
                  : "border-white/10 bg-panel hover:border-white/20"
              }`}
            >
              <span
                className="grid h-11 w-11 flex-none place-items-center rounded-[13px]"
                style={{
                  backgroundColor: selected
                    ? category.tint
                    : `${category.tint}22`,
                  color: selected ? "#ffffff" : category.tint,
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
                  selected
                    ? "border-brand bg-brand"
                    : "border-white/20 bg-transparent"
                }`}
              >
                {selected ? (
                  <Check aria-hidden="true" className="text-white" size={14} />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-[12px] font-semibold leading-5 text-muted">
        Picking a goal pre-selects matching specialities — you can change or
        clear them any time from the filters.
      </p>
    </div>
  );
}

function parseStoredGoals(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is string =>
        typeof item === "string" &&
        searchCategories.some((category) => category.id === item),
    );
  } catch {
    return [];
  }
}

function formatGoalLabel(goalIds: string[]) {
  if (goalIds.length === 0) {
    return "Set your goal";
  }

  return searchCategories
    .filter((category) => goalIds.includes(category.id))
    .map((category) => category.shortLabel)
    .join(", ");
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
