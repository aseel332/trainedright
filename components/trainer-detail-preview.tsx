"use client";

import Image from "next/image";
import { Award, Check, ImageIcon, MapPin, Play } from "lucide-react";
import { InstagramIcon, XIcon, YoutubeIcon } from "@/components/social-icons";
import { parseVideoLink } from "@/lib/media-links";
import { normalizeSocialUrl } from "@/lib/socials";
import { formatPriceInr } from "@/lib/trainer-utils";
import { draftPricingItems } from "@/lib/pricing";
import { type TrainerProfileDraft } from "@/lib/trainer-profile";

/**
 * A faithful, read-only render of how the public trainer detail page will look,
 * driven entirely by the draft. Used on the go-live screen so a trainer sees
 * exactly what they're publishing before they submit for approval.
 */
export function TrainerDetailPreview({
  profile,
}: {
  profile: TrainerProfileDraft;
}) {
  const name = profile.name.trim() || "Your name";
  const firstName = name.split(/\s+/)[0] ?? name;
  const years = Number(profile.yearsExperience) || 0;
  const clients = Number(profile.clientsCount) || 0;
  const heroUrl = profile.coverUrl || profile.avatarUrl;
  const bio = profile.bio.trim();
  const tags = profile.specialties;
  const gallery = profile.gallery.filter((item) => item.url);
  const videos = profile.videos
    .map((item) => ({ id: item.id, parsed: parseVideoLink(item.url) }))
    .filter(
      (item): item is { id: string; parsed: NonNullable<typeof item.parsed> } =>
        item.parsed !== null,
    );
  const pricingItems = draftPricingItems(profile);
  const credentials = profile.credentials;

  const socials = [
    {
      id: "instagram",
      label: "Instagram",
      url: normalizeSocialUrl("instagram", profile.instagram),
      Icon: InstagramIcon,
    },
    {
      id: "x",
      label: "X",
      url: normalizeSocialUrl("x", profile.x),
      Icon: XIcon,
    },
    {
      id: "youtube",
      label: "YouTube",
      url: normalizeSocialUrl("youtube", profile.youtube),
      Icon: YoutubeIcon,
    },
  ].filter((social) => social.url);

  const stats = [
    clients > 0 ? { value: `${clients}+`, label: "Clients" } : null,
    years > 0 ? { value: `${years} yrs`, label: "Exp" } : null,
    { value: "New", label: "Rating" },
  ].filter((stat): stat is { value: string; label: string } => stat !== null);

  return (
    <div className="overflow-hidden rounded-[20px] border border-white/10 bg-background text-white">
      {/* Hero */}
      <div className="relative min-h-[300px]">
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="(min-width: 1024px) 860px, 100vw"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#241318] to-[#141417] text-white/20">
            <ImageIcon aria-hidden="true" size={40} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

        <div className="relative flex min-h-[300px] items-end p-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-[38px] font-black leading-none text-white sm:text-[52px]">
              {name}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-soft">
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" size={15} className="text-muted" />
                {profile.city || "Your city"}
              </span>
            </div>
            {socials.length > 0 ? (
              <div className="mt-5 flex items-center gap-2.5">
                {socials.map(({ id, label, Icon }) => (
                  <span
                    key={id}
                    aria-label={label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur"
                  >
                    <Icon size={17} />
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-8 p-6">
        {/* Stats */}
        <div className="flex gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex-1 rounded-[14px] border border-white/10 bg-panel p-3 text-center sm:p-4"
            >
              <div className="font-display text-[20px] font-black text-white sm:text-[22px]">
                {stat.value}
              </div>
              <div className="mt-1 text-[10px] font-extrabold uppercase text-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* About */}
        <div>
          <p
            className={`max-w-3xl text-[15px] leading-7 ${
              bio ? "text-soft" : "text-white/25"
            }`}
          >
            {bio || "Your description will appear here."}
          </p>
          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-soft"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Photos & videos */}
        {gallery.length > 0 || videos.length > 0 ? (
          <PreviewSection title="Photos & videos">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {videos.map(({ id, parsed }) => (
                <div
                  key={id}
                  className="relative h-32 overflow-hidden rounded-[14px] border border-white/10 bg-black"
                >
                  {parsed.thumbnailUrl ? (
                    <Image
                      src={parsed.thumbnailUrl}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover opacity-80"
                      sizes="240px"
                    />
                  ) : null}
                  <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-black/60 backdrop-blur">
                      <Play aria-hidden="true" size={16} fill="currentColor" />
                    </span>
                  </span>
                </div>
              ))}
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="relative h-32 overflow-hidden rounded-[14px] border border-white/10 bg-black"
                >
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="240px"
                  />
                </div>
              ))}
            </div>
          </PreviewSection>
        ) : null}

        {/* Pricing */}
        {pricingItems.length > 0 ? (
          <PreviewSection title="Pricing" note={`Set by ${firstName}. No platform fee.`}>
            <div className="grid gap-3 md:grid-cols-3">
              {pricingItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-[15px] border p-4 ${
                    item.highlighted
                      ? "border-brand/50 bg-brand/10"
                      : "border-white/10 bg-panel"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-[16px] font-extrabold text-white">
                        {item.name}
                      </h3>
                      {item.description ? (
                        <p className="mt-2 text-[12px] font-medium leading-5 text-muted">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex-none text-right">
                      <div
                        className={`font-display text-[20px] font-black ${
                          item.highlighted ? "text-brand-light" : "text-white"
                        }`}
                      >
                        {formatPriceInr(item.amount)}
                      </div>
                      <div className="mt-1 text-[10px] font-semibold text-muted">
                        {item.unit}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PreviewSection>
        ) : null}

        {/* Credentials */}
        {credentials.length > 0 ? (
          <PreviewSection title="Credentials">
            <div className="grid gap-2 sm:grid-cols-2">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="flex items-center gap-3 rounded-[13px] border border-white/10 bg-panel p-3"
                >
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-emerald-500/15 text-emerald-300">
                    <Award aria-hidden="true" size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-white">
                      {credential.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] font-medium text-muted">
                      {credential.issuedOn
                        ? new Date(credential.issuedOn).toLocaleDateString(
                            "en-IN",
                            { year: "numeric", month: "short" },
                          )
                        : "Qualification"}
                    </span>
                  </span>
                  {credential.fileUrl ? (
                    <Check
                      aria-hidden="true"
                      className="flex-none text-emerald-300"
                      size={18}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </PreviewSection>
        ) : null}

        {/* Reviews */}
        <PreviewSection title="Reviews">
          <p className="rounded-[15px] border border-dashed border-white/15 bg-panel/50 px-4 py-8 text-center text-[13px] font-semibold text-muted">
            No reviews yet. {firstName} is newly listed on TrainedRight.
          </p>
        </PreviewSection>
      </div>
    </div>
  );
}

function PreviewSection({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-[20px] font-black text-white">
          {title}
        </h2>
        {note ? (
          <span className="text-right text-[12px] font-semibold text-muted">
            {note}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
