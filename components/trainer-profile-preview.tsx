"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BriefcaseBusiness,
  ImageIcon,
  MapPin,
  Star,
  UserRound,
} from "lucide-react";
import { formatPriceInr } from "@/lib/trainer-utils";
import {
  profilePriceFromInr,
  type TrainerProfileDraft,
} from "@/lib/trainer-profile";

type PreviewTab = "listing" | "profile";

export function TrainerProfilePreview({
  profile,
  defaultTab = "listing",
}: {
  profile: TrainerProfileDraft;
  defaultTab?: PreviewTab;
}) {
  const [tab, setTab] = useState<PreviewTab>(defaultTab);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
          Live preview
        </p>
        <div className="inline-flex rounded-full border border-white/10 bg-panel p-0.5 text-[11px] font-extrabold">
          {(
            [
              ["listing", "Listing"],
              ["profile", "Profile page"],
            ] as [PreviewTab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-full px-3 py-1.5 transition ${
                tab === id
                  ? "bg-brand text-white"
                  : "text-muted hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "listing" ? (
        <ListingCardPreview profile={profile} />
      ) : (
        <ProfilePagePreview profile={profile} />
      )}
    </div>
  );
}

function derive(profile: TrainerProfileDraft) {
  const name = profile.name.trim() || "Your name";
  const firstName = name.split(/\s+/)[0] ?? name;
  const location = profile.city
    ? profile.state
      ? `${profile.city}, ${profile.state}`
      : profile.city
    : "Your city";
  const price = profilePriceFromInr(profile);
  const years = Number(profile.yearsExperience) || 0;
  const clients = Number(profile.clientsCount) || 0;
  const tags = profile.specialties.slice(0, 3);
  const bio = profile.bio.trim();
  return { name, firstName, location, price, years, clients, tags, bio };
}

function PlaceholderTile({
  icon: Icon,
  className = "",
}: {
  icon: typeof UserRound;
  className?: string;
}) {
  return (
    <div
      className={`grid h-full w-full place-items-center bg-gradient-to-br from-[#241318] to-[#141417] text-white/25 ${className}`}
    >
      <Icon aria-hidden="true" size={26} />
    </div>
  );
}

function ListingCardPreview({ profile }: { profile: TrainerProfileDraft }) {
  const { name, location, price, years, tags, bio } = derive(profile);
  const showReview = profile.listingBlurb === "review";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none grid select-none grid-cols-[108px_minmax(0,1fr)] gap-4 rounded-[18px] border border-white/10 bg-panel p-4 text-white"
    >
      <div className="relative h-[150px] overflow-hidden rounded-[15px] bg-[#221215]">
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="108px"
          />
        ) : (
          <PlaceholderTile icon={UserRound} />
        )}
      </div>

      <div className="min-w-0 pt-0.5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[18px] font-extrabold leading-tight">
              {name}
            </h3>
            <p className="mt-1 text-[11px] font-semibold text-muted">
              {location}
            </p>
          </div>
          <span className="inline-flex flex-none items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-extrabold uppercase text-brand-light">
            New
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-semibold text-muted">
          <span>No reviews yet</span>
          {years > 0 ? (
            <>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span className="inline-flex items-center gap-1">
                <BriefcaseBusiness aria-hidden="true" size={12} />
                {years} yrs exp
              </span>
            </>
          ) : null}
          {price > 0 ? (
            <>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span>{formatPriceInr(price)}/session</span>
            </>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-soft"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-dashed border-white/15 px-2.5 py-1 text-[10px] font-semibold text-muted">
              Your specialties
            </span>
          )}
        </div>

        {showReview ? (
          <div className="mt-3">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-brand-light">
              <Star
                aria-hidden="true"
                size={11}
                className="fill-brand text-brand"
              />
              Review slot
            </p>
            <p
              className={`mt-1 line-clamp-2 text-[11px] italic leading-5 ${
                bio ? "text-muted" : "text-white/25"
              }`}
            >
              {bio || "Your description shows here until then."}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-white/40">
              Your top client review replaces this once you have one.
            </p>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <span className="mt-1 flex-none font-display text-[30px] font-black leading-[0.6] text-brand/60">
              &quot;
            </span>
            <p
              className={`line-clamp-2 text-[11px] italic leading-5 ${
                bio ? "text-muted" : "text-white/25"
              }`}
            >
              {bio || "Your description will appear here as clients browse."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfilePagePreview({ profile }: { profile: TrainerProfileDraft }) {
  const { name, price, years, clients, tags, bio } = derive(profile);
  const heroUrl = profile.coverUrl || profile.avatarUrl;
  const stats = [
    clients > 0 ? { value: `${clients}+`, label: "Clients" } : null,
    years > 0 ? { value: `${years} yrs`, label: "Exp" } : null,
    { value: "New", label: "Rating" },
  ].filter((stat): stat is { value: string; label: string } => stat !== null);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none overflow-hidden rounded-[18px] border border-white/10 bg-background"
    >
      <div className="relative h-[210px]">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="380px"
          />
        ) : (
          <PlaceholderTile icon={ImageIcon} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display text-[28px] font-black leading-none text-white">
            {name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-soft">
            <span className="font-extrabold text-white">New coach</span>
            <span className="h-1 w-1 rounded-full bg-white/35" />
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden="true" size={13} className="text-muted" />
              {profile.city || "Your city"}
            </span>
            {price > 0 ? (
              <>
                <span className="h-1 w-1 rounded-full bg-white/35" />
                <span>{formatPriceInr(price)}/session</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex-1 rounded-[12px] border border-white/10 bg-panel p-2.5 text-center"
            >
              <div className="font-display text-[16px] font-black text-white">
                {stat.value}
              </div>
              <div className="mt-0.5 text-[9px] font-extrabold uppercase text-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <p
          className={`text-[12.5px] leading-6 ${
            bio ? "text-soft" : "text-white/25"
          }`}
        >
          {bio ||
            "Your description shows here — tell clients who you help, how a session feels, and what changes in the first month."}
        </p>
        {tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-soft"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
