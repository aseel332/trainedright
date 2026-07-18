"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, MapPin } from "lucide-react";
import { cityOptions, searchCategories } from "@/lib/search-categories";

export function HomeHeroSearch() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  function findCoaches() {
    if (!city) {
      return;
    }
    const params = new URLSearchParams();
    params.set("city", city);
    if (category) {
      params.set("cat", category);
    }
    router.push(`/trainers?${params.toString()}`);
  }

  return (
    <div className="rounded-[22px] border border-white/10 bg-panel/90 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex h-14 flex-1 items-center rounded-[15px] border border-white/10 bg-black/35 transition focus-within:border-brand/60">
          <MapPin
            aria-hidden="true"
            size={18}
            className="absolute left-4 text-brand-light"
          />
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            aria-label="Your city"
            className={`h-full w-full appearance-none bg-transparent pl-11 pr-10 text-[15px] font-bold outline-none [&>option]:bg-[#141417] ${
              city ? "text-white" : "text-muted"
            }`}
          >
            <option value="" disabled>
              Select your city
            </option>
            {cityOptions.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            size={16}
            className="pointer-events-none absolute right-4 text-muted"
          />
        </label>

        <button
          type="button"
          onClick={findCoaches}
          disabled={!city}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-[15px] bg-brand px-7 text-sm font-extrabold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted disabled:hover:bg-white/10"
        >
          Find coaches
          <ArrowRight aria-hidden="true" size={17} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {searchCategories.map((item) => {
          const active = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(active ? null : item.id)}
              className={`rounded-full border px-3.5 py-2 text-[12px] font-extrabold transition ${
                active
                  ? "border-brand bg-brand text-white"
                  : "border-white/10 bg-black/30 text-soft hover:border-brand/40 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
