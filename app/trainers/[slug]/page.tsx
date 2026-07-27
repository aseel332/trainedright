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
} from "lucide-react";
import { BadgeIcon } from "@/components/badge-icon";
import { BookingBar } from "@/components/booking-bar";
import { ExpandableBio } from "@/components/expandable-bio";
import { InstagramIcon, XIcon, YoutubeIcon } from "@/components/social-icons";
import { JsonLd } from "@/components/json-ld";
import { ProfileActions } from "@/components/profile-actions";
import { MediaGallery } from "@/components/media-gallery";
import { ReviewsSection } from "@/components/reviews-section";
import { StoryCard } from "@/components/story-card";
import { TransformationCard } from "@/components/transformation-card";
import { categoryLabels } from "@/lib/search-categories";
import {
  citySlugOf,
  isCityLaunched,
  primaryCategoryLabel,
} from "@/lib/seo-pages";
import { getTrainerProfile } from "@/lib/server/data";
import { siteUrl } from "@/lib/site";
import { normalizeSocialUrl } from "@/lib/socials";
import { formatPriceInr } from "@/lib/trainer-utils";
import type {
  PricingOption,
  TrainerCredential,
  TrainerLocation,
  TrainerProfile,
} from "@/lib/types";

/** Cuts descriptions at a word boundary so snippets never end mid-word. */
function summarize(text: string, max = 155) {
  if (text.length <= max) {
    return text;
  }
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trainer = await getTrainerProfile(slug);

  if (!trainer) {
    return {
      title: "Trainer not found",
    };
  }

  const role = primaryCategoryLabel(trainer.categories);
  const title = `${trainer.name} — ${role} in ${trainer.city}`;
  const description = summarize(
    trainer.bio ||
      `${trainer.name} is a ${role.toLowerCase()} in ${trainer.city} on TrainedRight.`,
  );
  const path = `/trainers/${trainer.slug}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "profile",
      images: [trainer.heroImageUrl, trainer.cardImageUrl]
        .filter(Boolean)
        .slice(0, 1),
    },
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

  // The free-trial pricing row is the one published with no price.
  const offersFreeTrial = trainer.pricing.some((item) => item.priceInr === null);
  const hasPlans = trainer.pricing.length > 0;

  const profileUrl = `${siteUrl}/trainers/${trainer.slug}`;
  const businessJsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "HealthAndBeautyBusiness"],
    "@id": `${profileUrl}#business`,
    name: trainer.name,
    description: trainer.bio,
    url: profileUrl,
    image: [trainer.heroImageUrl, trainer.cardImageUrl, trainer.avatarUrl].filter(
      Boolean,
    ),
    address: {
      "@type": "PostalAddress",
      addressLocality: trainer.city,
      addressRegion: trainer.state,
      addressCountry: "IN",
    },
    knowsAbout: [
      ...categoryLabels(trainer.categories),
      ...trainer.sports,
      ...trainer.tags,
    ],
    ...(trainer.priceFromInr > 0
      ? { priceRange: `${formatPriceInr(trainer.priceFromInr)}+` }
      : {}),
    ...(trainer.rating > 0 && trainer.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: trainer.rating,
            reviewCount: trainer.reviewCount,
            bestRating: 5,
          },
        }
      : {}),
  };
  // The trainer's city hub is the natural parent page (when that city has
  // actually launched — legacy rows could hold anything).
  const cityHubPath = isCityLaunched(trainer.city)
    ? `/${citySlugOf(trainer.city)}`
    : null;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      ...(cityHubPath
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: trainer.city,
              item: `${siteUrl}${cityHubPath}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: cityHubPath ? 3 : 2,
        name: trainer.name,
        item: profileUrl,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background pb-28 text-white lg:pb-12">
      <JsonLd data={businessJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <ProfileHero trainer={trainer} />

      <div className="desktop-profile-layout mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:px-0">
        <article className="min-w-0">
          <StatsGrid trainer={trainer} />

          <section className="mt-6">
            <ExpandableBio bio={trainer.bio} />
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
                  <StoryCard
                    key={story.id}
                    story={story}
                    size="profile"
                    href={`/trainers/${trainer.slug}/stories/${story.id}`}
                  />
                ))}
              </div>
            </ProfileSection>
          ) : null}

          {trainer.pricing.length > 0 ? (
            <ProfileSection
              id="plans"
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
            trainerName={trainer.name}
            whatsappNumber={trainer.whatsappNumber}
            offersFreeTrial={offersFreeTrial}
            hasPlans={hasPlans}
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
          href={
            isCityLaunched(trainer.city)
              ? `/${citySlugOf(trainer.city)}`
              : "/"
          }
          aria-label={`Back to coaches in ${trainer.city}`}
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
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden="true" size={16} className="text-muted" />
              {trainer.city}
            </span>
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
    trainer.reviewCount > 0
      ? { value: trainer.rating.toFixed(1), label: "Rating" }
      : { value: "New", label: "Rating" },
  ].filter((stat): stat is { value: string; label: string } => stat !== null);

  return (
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
  );
}

function ProfileSection({
  id,
  title,
  note,
  compact = false,
  children,
}: {
  id?: string;
  title: string;
  note?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-24 ${compact ? "" : "mt-8"}`}>
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
