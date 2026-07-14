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
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { TrainerCard } from "@/components/trainer-card";
import {
  filterAndSortTrainers,
  formatPriceInr,
} from "@/lib/trainer-utils";
import type { Trainer, TrainerSort } from "@/lib/types";

type GoalOption = {
  id: string;
  name: string;
  desc: string;
  tint: string;
  specs: string[];
  icon: typeof Dumbbell;
};

type CityOption = {
  name: string;
  trainers: string;
};

type PreferenceDialog = "onboarding" | "city" | "goal" | null;

const STORAGE_KEYS = {
  onboarded: "tr_onboarded",
  city: "tr_city",
  goals: "tr_goals",
  goalText: "tr_goaltext",
};

const fallbackCity = "Bengaluru";

const cityOptions: CityOption[] = [
  { name: "Mumbai", trainers: "820 coaches" },
  { name: "Delhi", trainers: "640 coaches" },
  { name: "Bengaluru", trainers: "710 coaches" },
  { name: "Pune", trainers: "390 coaches" },
  { name: "Hyderabad", trainers: "410 coaches" },
  { name: "Chennai", trainers: "320 coaches" },
  { name: "Kolkata", trainers: "280 coaches" },
  { name: "Ahmedabad", trainers: "190 coaches" },
  { name: "Jaipur", trainers: "140 coaches" },
  { name: "Chandigarh", trainers: "120 coaches" },
];

const goalOptions: GoalOption[] = [
  {
    id: "gym",
    name: "Gym Trainer",
    desc: "Strength, fat loss, muscle gain",
    tint: "#F02D28",
    specs: ["Strength", "Weight loss"],
    icon: Dumbbell,
  },
  {
    id: "sport",
    name: "Sports Coach",
    desc: "Cricket, football, tennis, athletics",
    tint: "#3B8CFF",
    specs: ["Sports", "Boxing"],
    icon: Trophy,
  },
  {
    id: "yoga",
    name: "Yoga / Aerobics / Zumba",
    desc: "Flexibility, mobility, group energy",
    tint: "#A05CFF",
    specs: ["Yoga"],
    icon: Leaf,
  },
  {
    id: "diet",
    name: "Nutritionist / Dietitian",
    desc: "Meal plans, weight management",
    tint: "#1FCB6B",
    specs: ["Nutrition", "Weight loss"],
    icon: Apple,
  },
];

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
  initialVerified = false,
}: {
  trainers: Trainer[];
  initialQuery?: string;
  initialVerified?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<TrainerSort>("recommended");
  const [verified, setVerified] = useState(initialVerified);
  const [specs, setSpecs] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [city, setCity] = useState(fallbackCity);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [goalText, setGoalText] = useState("");
  const [dialog, setDialog] = useState<PreferenceDialog>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      try {
        const storedCity = localStorage.getItem(STORAGE_KEYS.city);
        const storedGoals = parseStoredGoals(
          localStorage.getItem(STORAGE_KEYS.goals),
        );
        const storedGoalText =
          localStorage.getItem(STORAGE_KEYS.goalText) ?? "";

        if (storedCity) {
          setCity(storedCity);
        }

        if (storedGoals.length > 0) {
          setSelectedGoals(storedGoals);
          setSpecs(goalIdsToSpecs(storedGoals));
        }

        if (storedGoalText) {
          setGoalText(storedGoalText);
        }

        if (localStorage.getItem(STORAGE_KEYS.onboarded) !== "1") {
          setDialog("onboarding");
        }
      } catch {
        setDialog("onboarding");
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
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
        sort,
        verified,
        specs,
        maxPrice,
      }),
    [maxPrice, query, sort, specs, trainers, verified],
  );

  const activeGoalLabel = useMemo(
    () => formatGoalLabel(selectedGoals, goalText),
    [goalText, selectedGoals],
  );

  const filterCount =
    (verified ? 1 : 0) + specs.length + (maxPrice ? 1 : 0);

  function toggleSpec(spec: string) {
    setSpecs((current) =>
      current.includes(spec)
        ? current.filter((item) => item !== spec)
        : [...current, spec],
    );
  }

  function clearFilters() {
    setVerified(false);
    setSpecs(goalIdsToSpecs(selectedGoals));
    setMaxPrice(0);
  }

  function savePreferences(next: {
    city?: string;
    goals?: string[];
    goalText?: string;
    applyGoalFilters?: boolean;
  }) {
    const nextCity = next.city ?? city;
    const nextGoals = next.goals ?? selectedGoals;
    const nextGoalText = next.goalText ?? goalText;

    setCity(nextCity);
    setSelectedGoals(nextGoals);
    setGoalText(nextGoalText);

    if (next.applyGoalFilters ?? true) {
      setSpecs(goalIdsToSpecs(nextGoals));
    }

    try {
      localStorage.setItem(STORAGE_KEYS.onboarded, "1");
      localStorage.setItem(STORAGE_KEYS.city, nextCity);
      localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(nextGoals));
      if (nextGoalText.trim()) {
        localStorage.setItem(STORAGE_KEYS.goalText, nextGoalText.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.goalText);
      }
    } catch {
      // Local storage can be blocked in private contexts; UI state still works.
    }
  }

  const panel = (
    <FilterPanel
      specialities={specialities}
      specs={specs}
      maxPrice={maxPrice}
      verified={verified}
      onToggleSpec={toggleSpec}
      onToggleVerified={() => setVerified((value) => !value)}
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
                  <span className="truncate">{city}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="flex-none text-brand-light"
                    size={18}
                  />
                </button>
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
              <label className="relative inline-flex h-10 flex-none items-center gap-2 rounded-full border border-brand/30 bg-brand/10 pl-3 pr-8 text-[12px] font-extrabold text-white">
                <ArrowDownWideNarrow
                  aria-hidden="true"
                  className="text-brand-light"
                  size={15}
                />
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as TrainerSort)}
                  className="max-w-[142px] appearance-none bg-transparent font-extrabold text-white outline-none"
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
                className="inline-flex h-10 max-w-[190px] flex-none items-center gap-2 rounded-full border border-white/10 bg-panel px-3.5 text-[12px] font-extrabold text-soft transition hover:text-white"
              >
                <Target
                  aria-hidden="true"
                  className="flex-none text-brand-light"
                  size={15}
                />
                <span className="truncate">{activeGoalLabel}</span>
              </button>

              {["Verified", ...specialities.slice(0, 5)].map((chip) => {
                const isVerifiedChip = chip === "Verified";
                const active = isVerifiedChip ? verified : specs.includes(chip);
                return (
                  <button
                    type="button"
                    key={chip}
                    onClick={() =>
                      isVerifiedChip
                        ? setVerified((value) => !value)
                        : toggleSpec(chip)
                    }
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
                {activeGoalLabel === "Set your goal"
                  ? `Showing available trainers near ${city}`
                  : `${activeGoalLabel} near ${city}`}
              </p>
            </div>
            {filterCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="self-start rounded-full border border-brand/30 bg-brand/10 px-3 py-2 text-[12px] font-bold text-brand-light md:self-auto"
              >
                Reset filters
              </button>
            ) : null}
          </div>

          {results.length > 0 ? (
            <div className="grid gap-0 md:grid-cols-2 md:gap-4 desktop-listing-results">
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
          initialGoalText={goalText}
          onClose={() => setDialog(null)}
          onSave={(preferences) => {
            savePreferences(preferences);
            setDialog(null);
          }}
        />
      ) : null}

      {dialog === "city" ? (
        <CityDialog
          initialCity={city}
          onClose={() => setDialog(null)}
          onSave={(nextCity) => {
            savePreferences({ city: nextCity, applyGoalFilters: false });
            setDialog(null);
          }}
        />
      ) : null}

      {dialog === "goal" ? (
        <GoalDialog
          initialGoals={selectedGoals}
          initialGoalText={goalText}
          onClose={() => setDialog(null)}
          onSave={(goals, text) => {
            savePreferences({ goals, goalText: text, applyGoalFilters: true });
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
  verified,
  onToggleSpec,
  onToggleVerified,
  onPrice,
  onClear,
}: {
  specialities: string[];
  specs: string[];
  maxPrice: number;
  verified: boolean;
  onToggleSpec: (spec: string) => void;
  onToggleVerified: () => void;
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

      <button
        type="button"
        onClick={onToggleVerified}
        className={`flex w-full items-center justify-between gap-4 rounded-[14px] border p-4 text-left transition ${
          verified ? "border-brand/60 bg-brand/10" : "border-white/10 bg-panel"
        }`}
      >
        <span>
          <span className="block text-sm font-extrabold text-white">
            Verified coaches only
          </span>
          <span className="mt-1 block text-[12px] font-medium text-muted">
            Certified or ID-verified profiles
          </span>
        </span>
        <span
          className={`relative h-[26px] w-11 rounded-full transition ${
            verified ? "bg-brand" : "bg-white/20"
          }`}
        >
          <span
            className={`absolute top-[3px] h-5 w-5 rounded-full bg-white transition ${
              verified ? "left-[21px]" : "left-[3px]"
            }`}
          />
        </span>
      </button>
    </div>
  );
}

function OnboardingDialog({
  initialCity,
  initialGoals,
  initialGoalText,
  onClose,
  onSave,
}: {
  initialCity: string;
  initialGoals: string[];
  initialGoalText: string;
  onClose: () => void;
  onSave: (preferences: {
    city: string;
    goals: string[];
    goalText: string;
    applyGoalFilters: boolean;
  }) => void;
}) {
  const [step, setStep] = useState(0);
  const [city, setCity] = useState(initialCity);
  const [cityQuery, setCityQuery] = useState(initialCity);
  const [goals, setGoals] = useState(initialGoals);
  const [goalText, setGoalText] = useState(initialGoalText);
  const canContinue = step === 0 ? Boolean(city) : hasGoal(goals, goalText);

  function finish() {
    if (!hasGoal(goals, goalText)) {
      return;
    }

    onSave({
      city,
      goals,
      goalText,
      applyGoalFilters: true,
    });
  }

  return (
    <DialogFrame
      title={step === 0 ? "Which city are you training in?" : "Who are you looking for?"}
      kicker={step === 0 ? "Step 1 · Your city" : "Step 2 · Your goal"}
      onClose={onClose}
      showClose={false}
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
          goalText={goalText}
          onToggle={(goalId) => setGoals(toggleValue(goals, goalId))}
          onGoalText={setGoalText}
        />
      )}

      <div className="mt-6 flex gap-3">
        {step === 1 ? (
          <button
            type="button"
            onClick={() => setStep(0)}
            className="h-12 rounded-[14px] border border-white/10 bg-panel px-5 text-sm font-extrabold text-white"
          >
            Back
          </button>
        ) : null}
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
              finish();
            }
          }}
          className="h-12 flex-1 rounded-[14px] bg-brand px-5 text-sm font-extrabold text-white transition disabled:bg-white/10 disabled:text-muted"
        >
          {step === 0 ? "Continue" : "Show me coaches"}
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
  initialGoalText,
  onClose,
  onSave,
}: {
  initialGoals: string[];
  initialGoalText: string;
  onClose: () => void;
  onSave: (goals: string[], goalText: string) => void;
}) {
  const [goals, setGoals] = useState(initialGoals);
  const [goalText, setGoalText] = useState(initialGoalText);

  return (
    <DialogFrame title="Edit goal" kicker="Training target" onClose={onClose}>
      <GoalStep
        goals={goals}
        goalText={goalText}
        onToggle={(goalId) => setGoals(toggleValue(goals, goalId))}
        onGoalText={setGoalText}
      />
      <button
        type="button"
        disabled={!hasGoal(goals, goalText)}
        onClick={() => onSave(goals, goalText)}
        className="mt-6 h-12 w-full rounded-[14px] bg-brand px-5 text-sm font-extrabold text-white transition disabled:bg-white/10 disabled:text-muted"
      >
        Save goal
      </button>
    </DialogFrame>
  );
}

function DialogFrame({
  title,
  kicker,
  children,
  onClose,
  showClose = true,
}: {
  title: string;
  kicker: string;
  onClose: () => void;
  showClose?: boolean;
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
          {showClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-10 w-10 flex-none place-items-center rounded-[13px] border border-white/10 bg-panel text-white"
            >
              <X aria-hidden="true" size={18} />
            </button>
          ) : null}
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
          className="h-13 w-full rounded-[14px] border border-white/10 bg-panel pl-12 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand/60"
        />
      </div>

      <div className="mt-4 grid gap-2">
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
                  {option.trainers}
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
  goalText,
  onToggle,
  onGoalText,
}: {
  goals: string[];
  goalText: string;
  onToggle: (goalId: string) => void;
  onGoalText: (value: string) => void;
}) {
  return (
    <div>
      <div className="grid gap-2">
        {goalOptions.map((goal) => {
          const selected = goals.includes(goal.id);
          const Icon = goal.icon;
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => onToggle(goal.id)}
              className={`flex items-center gap-4 rounded-[15px] border p-4 text-left transition ${
                selected
                  ? "border-brand/60 bg-brand/10"
                  : "border-white/10 bg-panel hover:border-white/20"
              }`}
            >
              <span
                className="grid h-11 w-11 flex-none place-items-center rounded-[13px]"
                style={{
                  backgroundColor: selected ? goal.tint : `${goal.tint}22`,
                  color: selected ? "#ffffff" : goal.tint,
                }}
              >
                <Icon aria-hidden="true" size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[15px] font-extrabold text-white">
                  {goal.name}
                </span>
                <span className="mt-1 block text-[12px] font-semibold text-muted">
                  {goal.desc}
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

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">
          Or describe it
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="rounded-[16px] border border-white/10 bg-panel p-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
          <Sparkles aria-hidden="true" className="text-brand-light" size={16} />
          Goal notes
        </div>
        <textarea
          value={goalText}
          onChange={(event) => onGoalText(event.target.value)}
          rows={4}
          placeholder="e.g. Lose 10 kg, get stronger, train around a knee injury, or prepare for a sport."
          className="w-full resize-none rounded-[12px] border border-white/10 bg-black/35 p-3 text-sm font-semibold leading-6 text-white outline-none transition placeholder:text-muted focus:border-brand/60"
        />
      </div>
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
        goalOptions.some((goal) => goal.id === item),
    );
  } catch {
    return [];
  }
}

function goalIdsToSpecs(goalIds: string[]) {
  return Array.from(
    new Set(
      goalOptions
        .filter((goal) => goalIds.includes(goal.id))
        .flatMap((goal) => goal.specs),
    ),
  );
}

function formatGoalLabel(goalIds: string[], goalText: string) {
  if (goalIds.length === 0 && goalText.trim()) {
    return goalText.trim();
  }

  if (goalIds.length === 0) {
    return "Set your goal";
  }

  return goalOptions
    .filter((goal) => goalIds.includes(goal.id))
    .map((goal) => goal.name)
    .join(", ");
}

function hasGoal(goals: string[], goalText: string) {
  return goals.length > 0 || goalText.trim().length > 0;
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
