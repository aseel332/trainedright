import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Check,
  Dumbbell,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { BadgeIcon } from "@/components/badge-icon";
import { BookingBar } from "@/components/booking-bar";
import { InstagramIcon, XIcon, YoutubeIcon } from "@/components/social-icons";
import { ProfileActions } from "@/components/profile-actions";
import { MediaGallery } from "@/components/media-gallery";
import { ReviewsSection } from "@/components/reviews-section";
import { StoryCard } from "@/components/story-card";
import { TransformationCard } from "@/components/transformation-card";
import { getTrainerProfile } from "@/lib/server/data";
import { normalizeSocialUrl } from "@/lib/socials";
import { formatPriceInr } from "@/lib/trainer-utils";
import type {
  PricingOption,
  TrainerCredential,
  TrainerLocation,
  TrainerProfile,
} from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trainer = await getTrainerProfile(slug);

  if (!trainer) {
    return {
      title: "Trainer not found | TrainedRight",
    };
  }

  return {
    title: `${trainer.name} | TrainedRight`,
    description: trainer.bio,
  };
}

export default async function TrainerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trainer = await getTrainerProfile(slug);

  if (!trainer) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background pb-28 text-white lg:pb-12">
      <ProfileHero trainer={trainer} />

      <div className="desktop-profile-layout mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:px-0">
        <article className="min-w-0">
          <StatsGrid trainer={trainer} />

          <section className="mt-6">
            <p className="max-w-4xl text-[15px] leading-7 text-soft md:text-base md:leading-8">
              {trainer.bio}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {trainer.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-soft"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          {trainer.media.length > 0 ? (
            <ProfileSection title="Photos & videos">
              <MediaGallery media={trainer.media} />
            </ProfileSection>
          ) : null}

          {trainer.transformations.length > 0 ? (
            <ProfileSection title="Client transformations">
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-none md:grid md:grid-cols-2 md:overflow-visible">
                {trainer.transformations.map((item) => (
                  <TransformationCard
                    key={item.id}
                    item={item}
                    trainerSlug={trainer.slug}
                  />
                ))}
              </div>
            </ProfileSection>
          ) : null}

          {trainer.stories.length > 0 ? (
            <ProfileSection title={`${trainer.firstName}'s stories`}>
              <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:px-0">
                {trainer.stories.map((story) => (
                  <StoryCard key={story.id} story={story} size="profile" />
                ))}
              </div>
            </ProfileSection>
          ) : null}

          {trainer.pricing.length > 0 ? (
            <ProfileSection
              title="Pricing"
              note={`Set by ${trainer.firstName}. No platform fee.`}
            >
              <div className="grid gap-3 md:grid-cols-3">
                {trainer.pricing.map((item) => (
                  <PricingCard key={item.id} item={item} />
                ))}
              </div>
            </ProfileSection>
          ) : null}

          <ProfileSection
            title="Reviews"
            note={
              trainer.reviewCount > 0
                ? `${trainer.rating.toFixed(1)} · ${trainer.reviewCount} reviews`
                : undefined
            }
          >
            {trainer.reviews.length > 0 ? (
              <ReviewsSection
                rating={trainer.rating}
                reviewCount={trainer.reviewCount}
                reviews={trainer.reviews}
              />
            ) : (
              <EmptyNote>
                No reviews yet. {trainer.firstName} is newly listed on
                TrainedRight.
              </EmptyNote>
            )}
          </ProfileSection>

          {trainer.locations.length > 0 || trainer.credentials.length > 0 ? (
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              {trainer.locations.length > 0 ? (
                <ProfileSection title="Trains at" compact>
                  <div className="space-y-2">
                    {trainer.locations.map((location) => (
                      <LocationRow key={location.id} location={location} />
                    ))}
                  </div>
                </ProfileSection>
              ) : null}

              {trainer.credentials.length > 0 ? (
                <ProfileSection title="Credentials" compact>
                  <div className="space-y-2">
                    {trainer.credentials.map((credential) => (
                      <CredentialRow
                        key={credential.id}
                        credential={credential}
                      />
                    ))}
                  </div>
                </ProfileSection>
              ) : null}
            </div>
          ) : null}
        </article>

        {trainer.whatsappNumber ? (
          <BookingBar
            slug={trainer.slug}
            priceFromInr={trainer.priceFromInr}
            trainerName={trainer.name}
            whatsappNumber={trainer.whatsappNumber}
          />
        ) : null}
      </div>
    </main>
  );
}

function ProfileHero({ trainer }: { trainer: TrainerProfile }) {
  const primaryBadge = trainer.badges[0];

  return (
    <section className="desktop-profile-hero relative min-h-[520px] overflow-hidden border-b border-white/10 lg:min-h-[620px]">
      <Image
        src={trainer.heroImageUrl}
        alt={`${trainer.name} training`}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

      <div className="relative mx-auto flex max-w-7xl justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link
          href="/trainers"
          aria-label="Back to trainers"
          className="grid h-11 w-11 place-items-center rounded-[12px] border border-white/15 bg-black/45 text-white backdrop-blur"
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <ProfileActions slug={trainer.slug} trainerName={trainer.name} />
      </div>

      <div className="relative mx-auto flex min-h-[415px] max-w-7xl items-end px-4 pb-8 sm:px-6 lg:min-h-[510px] lg:px-8 lg:pb-12">
        <div className="max-w-3xl">
          {primaryBadge ? (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-extrabold uppercase text-white">
              <BadgeIcon badge={primaryBadge} />
              Coach profile
            </div>
          ) : null}
          <h1 className="font-display text-[42px] font-black leading-none text-white md:text-[72px]">
            {trainer.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-soft md:text-base">
            {trainer.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Star
                  aria-hidden="true"
                  size={16}
                  className="fill-brand text-brand"
                />
                <span className="font-extrabold text-white">
                  {trainer.rating.toFixed(1)}
                </span>
                ({trainer.reviewCount})
              </span>
            ) : (
              <span className="font-extrabold text-white">New coach</span>
            )}
            <span className="h-1 w-1 rounded-full bg-white/35" />
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" size={16} className="text-muted" />
              {trainer.city}
            </span>
            {trainer.priceFromInr > 0 ? (
              <>
                <span className="h-1 w-1 rounded-full bg-white/35" />
                <span>{formatPriceInr(trainer.priceFromInr)}/session</span>
              </>
            ) : null}
          </div>
          <SocialLinks trainer={trainer} />
        </div>
      </div>
    </section>
  );
}

function SocialLinks({ trainer }: { trainer: TrainerProfile }) {
  const links = [
    {
      id: "instagram",
      label: "Instagram",
      url: normalizeSocialUrl("instagram", trainer.instagram),
      Icon: InstagramIcon,
    },
    {
      id: "x",
      label: "X",
      url: normalizeSocialUrl("x", trainer.x),
      Icon: XIcon,
    },
    {
      id: "youtube",
      label: "YouTube",
      url: normalizeSocialUrl("youtube", trainer.youtube),
      Icon: YoutubeIcon,
    },
  ].filter((link) => link.url);

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 flex items-center gap-2.5">
      {links.map(({ id, label, url, Icon }) => (
        <a
          key={id}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${trainer.firstName} on ${label}`}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/45 text-white backdrop-blur transition hover:border-brand/60 hover:bg-black/60 hover:text-brand-light"
        >
          <Icon size={18} />
        </a>
      ))}
    </div>
  );
}

function StatsGrid({ trainer }: { trainer: TrainerProfile }) {
  // A newly published trainer has no clients or ratings recorded yet, so show
  // only the stats that carry real information.
  const stats = [
    trainer.clientsCount > 0
      ? { value: `${trainer.clientsCount}+`, label: "Clients" }
      : null,
    trainer.yearsExperience > 0
      ? { value: `${trainer.yearsExperience} yrs`, label: "Exp" }
      : null,
    { value: trainer.replyTimeLabel, label: "Replies" },
    trainer.reviewCount > 0
      ? { value: trainer.rating.toFixed(1), label: "Rating" }
      : { value: "New", label: "Rating" },
  ].filter((stat): stat is { value: string; label: string } => stat !== null);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[14px] border border-white/10 bg-panel p-4 text-center"
        >
          <div className="font-display text-[22px] font-black text-white">
            {stat.value}
          </div>
          <div className="mt-1 text-[10px] font-extrabold uppercase text-muted">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileSection({
  title,
  note,
  compact = false,
  children,
}: {
  title: string;
  note?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={compact ? "" : "mt-8"}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-[20px] font-black text-white md:text-[24px]">
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

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[15px] border border-dashed border-white/15 bg-panel/50 px-4 py-8 text-center text-[13px] font-semibold text-muted">
      {children}
    </p>
  );
}

function PricingCard({ item }: { item: PricingOption }) {
  const highlighted = item.badge === "START HERE";

  return (
    <div
      className={`relative rounded-[15px] border p-4 ${
        highlighted
          ? "border-brand/50 bg-brand/10"
          : "border-white/10 bg-panel"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[16px] font-extrabold text-white">
              {item.name}
            </h3>
            {item.badge ? (
              <span className="rounded-full bg-brand px-2 py-1 text-[9px] font-extrabold uppercase text-black">
                {item.badge}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-[12px] font-medium leading-5 text-muted">
            {item.description}
          </p>
        </div>
        <div className="flex-none text-right">
          <div
            className={`font-display text-[20px] font-black ${
              highlighted ? "text-brand-light" : "text-white"
            }`}
          >
            {formatPriceInr(item.priceInr)}
          </div>
          <div className="mt-1 text-[10px] font-semibold text-muted">
            {item.unit}
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationRow({ location }: { location: TrainerLocation }) {
  return (
    <div className="flex items-center gap-3 rounded-[13px] border border-white/10 bg-panel p-3">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-brand/15 text-brand-light">
        <Dumbbell aria-hidden="true" size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white">
          {location.name}
        </span>
        <span className="mt-0.5 block truncate text-[12px] font-medium text-muted">
          {location.area}
        </span>
      </span>
    </div>
  );
}

function CredentialRow({ credential }: { credential: TrainerCredential }) {
  const Icon = credential.credentialType === "award" ? Award : ShieldCheck;

  return (
    <div className="flex items-center gap-3 rounded-[13px] border border-white/10 bg-panel p-3">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-emerald-500/15 text-emerald-300">
        <Icon aria-hidden="true" size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white">
          {credential.title}
        </span>
        <span className="mt-0.5 block truncate text-[12px] font-medium text-muted">
          {credential.subtitle}
        </span>
      </span>
      {credential.isVerified ? (
        <Check aria-hidden="true" className="flex-none text-emerald-300" size={18} />
      ) : null}
    </div>
  );
}
