import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Bookmark,
  Check,
  Dumbbell,
  MapPin,
  Share2,
  ShieldCheck,
  Star,
} from "lucide-react";
import { BadgeIcon } from "@/components/badge-icon";
import { BookingBar } from "@/components/booking-bar";
import { MediaGallery } from "@/components/media-gallery";
import { ReviewsSection } from "@/components/reviews-section";
import { StoryCard } from "@/components/story-card";
import { TransformationCard } from "@/components/transformation-card";
import { getTrainerProfile } from "@/lib/data";
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

          <ProfileSection title="Photos & videos">
            <MediaGallery media={trainer.media} />
          </ProfileSection>

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

          <ProfileSection title={`${trainer.firstName}'s stories`}>
            <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:px-0">
              {trainer.stories.map((story) => (
                <StoryCard key={story.id} story={story} size="profile" />
              ))}
            </div>
          </ProfileSection>

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

          <ProfileSection
            title="Reviews"
            note={`${trainer.rating.toFixed(1)} · ${trainer.reviewCount} reviews`}
          >
            <ReviewsSection
              rating={trainer.rating}
              reviewCount={trainer.reviewCount}
              reviews={trainer.reviews}
            />
          </ProfileSection>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <ProfileSection title="Trains at" compact>
              <div className="space-y-2">
                {trainer.locations.map((location) => (
                  <LocationRow key={location.id} location={location} />
                ))}
              </div>
            </ProfileSection>

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
          </div>
        </article>

        <BookingBar priceFromInr={trainer.priceFromInr} />
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
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Share trainer"
            className="grid h-11 w-11 place-items-center rounded-[12px] border border-white/15 bg-black/45 text-white backdrop-blur"
          >
            <Share2 aria-hidden="true" size={19} />
          </button>
          <button
            type="button"
            aria-label="Save trainer"
            className="grid h-11 w-11 place-items-center rounded-[12px] border border-white/15 bg-black/45 text-white backdrop-blur"
          >
            <Bookmark aria-hidden="true" size={19} />
          </button>
        </div>
      </div>

      <div className="relative mx-auto flex min-h-[415px] max-w-7xl items-end px-4 pb-8 sm:px-6 lg:min-h-[510px] lg:px-8 lg:pb-12">
        <div className="max-w-3xl">
          {trainer.isVerified ? (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-extrabold uppercase text-emerald-300">
              <ShieldCheck aria-hidden="true" size={14} />
              Verified coach
            </div>
          ) : primaryBadge ? (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-extrabold uppercase text-white">
              <BadgeIcon badge={primaryBadge} />
              Coach profile
            </div>
          ) : null}
          <h1 className="font-display text-[42px] font-black leading-none text-white md:text-[72px]">
            {trainer.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-soft md:text-base">
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
            <span className="h-1 w-1 rounded-full bg-white/35" />
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" size={16} className="text-muted" />
              {trainer.city}
            </span>
            <span className="h-1 w-1 rounded-full bg-white/35" />
            <span>{formatPriceInr(trainer.priceFromInr)}/session</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsGrid({ trainer }: { trainer: TrainerProfile }) {
  const stats = [
    { value: `${trainer.clientsCount}+`, label: "Clients" },
    { value: `${trainer.yearsExperience} yrs`, label: "Exp" },
    { value: trainer.replyTimeLabel, label: "Replies" },
    { value: trainer.rating.toFixed(1), label: "Rating" },
  ];

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
