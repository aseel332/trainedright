"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, MapPin, Target } from "lucide-react";

export type SearchCityOption = {
  name: string;
  slug: string;
  /** Published coaches in this city right now. */
  count: number;
};

export type SearchGoalOption = {
  id: string;
  label: string;
  count: number;
};

/**
 * The home search. Two decisions only — where, and what for — because both map
 * straight onto a city hub URL the listing already understands.
 *
 * Every option is built from live data, so the dropdown can never offer a city
 * or a goal with nothing behind it.
 */
export function HomeHeroSearch({
  cities,
  goals,
  defaultCity = "",
}: {
  cities: SearchCityOption[];
  goals: SearchGoalOption[];
  /** Pre-selected city. Set when there is only one live city worth defaulting to. */
  defaultCity?: string;
}) {
  const router = useRouter();
  const [citySlug, setCitySlug] = useState(defaultCity);
  const [goal, setGoal] = useState("");

  function findCoaches() {
    if (!citySlug) {
      return;
    }

    router.push(goal ? `/${citySlug}?cat=${goal}` : `/${citySlug}`);
  }

  const fieldClass =
    "relative flex min-h-[56px] flex-1 items-center rounded-[14px] border border-white/10 bg-black/40 transition focus-within:border-brand/70 focus-within:bg-black/60";
  const selectClass =
    "h-full w-full appearance-none bg-transparent py-4 pl-11 pr-10 text-[16px] font-bold outline-none [&>option]:bg-[#141417] [&>option]:text-white";

  return (
    <div className="rounded-[20px] border border-white/10 bg-panel/80 p-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-4">
      <div className="flex flex-col gap-2.5 md:flex-row">
        <label className={fieldClass}>
          <span className="sr-only">Your city</span>
          <MapPin
            aria-hidden="true"
            size={18}
            className="pointer-events-none absolute left-4 text-brand-light"
          />
          <select
            value={citySlug}
            onChange={(event) => setCitySlug(event.target.value)}
            className={`${selectClass} ${citySlug ? "text-white" : "text-muted"}`}
          >
            <option value="">Select your city</option>
            {cities.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.name} · {city.count} {city.count === 1 ? "coach" : "coaches"}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            size={16}
            className="pointer-events-none absolute right-4 text-muted"
          />
        </label>

        {goals.length > 0 ? (
          <label className={fieldClass}>
            <span className="sr-only">What you want to train for</span>
            <Target
              aria-hidden="true"
              size={18}
              className="pointer-events-none absolute left-4 text-brand-light"
            />
            <select
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              className={`${selectClass} ${goal ? "text-white" : "text-muted"}`}
            >
              <option value="">Any kind of coach</option>
              {goals.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} · {option.count}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              size={16}
              className="pointer-events-none absolute right-4 text-muted"
            />
          </label>
        ) : null}

        <button
          type="button"
          onClick={findCoaches}
          disabled={!citySlug}
          className="inline-flex min-h-[56px] flex-none items-center justify-center gap-2 rounded-[14px] bg-brand px-7 text-[15px] font-extrabold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-muted"
        >
          Find coaches
          <ArrowRight aria-hidden="true" size={17} />
        </button>
      </div>
    </div>
  );
}
