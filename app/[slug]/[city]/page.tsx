import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, SlidersHorizontal } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { SiteHeader } from "@/components/site-header";
import { TrainerCard } from "@/components/trainer-card";
import { cityOptions } from "@/lib/search-categories";
import {
  cityBySlug,
  citySlugOf,
  professionBySlug,
  searchHrefFor,
  seoProfessions,
  type SeoProfession,
} from "@/lib/seo-pages";
import { listActiveTrainers } from "@/lib/server/data";
import { siteUrl } from "@/lib/site";
import { filterAndSortTrainers, formatPriceInr } from "@/lib/trainer-utils";
import type { Trainer } from "@/lib/types";

/**
 * Programmatic SEO landing page: "personal trainers in mumbai" and friends.
 * Statically generated for every profession x city pair and refreshed hourly,
 * so crawlers get fast, fully rendered HTML with unique titles per page.
 */
export const revalidate = 3600;
export const dynamicParams = false;

type LandingParams = { profession: string; city: string };

export function generateStaticParams(): LandingParams[] {
  return seoProfessions.flatMap((profession) =>
    cityOptions.map((city) => ({
      profession: profession.slug,
      city: citySlugOf(city.name),
    })),
  );
}

async function landingTrainers(profession: SeoProfession, cityName: string) {
  return filterAndSortTrainers(await listActiveTrainers(), {
    city: cityName,
    categories: profession.categoryIds,
    sort: "rating",
  });
}

function minSessionPrice(trainers: Trainer[]) {
  const prices = trainers
    .map((trainer) => trainer.priceFromInr)
    .filter((price) => price > 0);
  return prices.length > 0 ? Math.min(...prices) : null;
}

function buildFaqs(
  profession: SeoProfession,
  cityName: string,
  trainers: Trainer[],
) {
  const pluralLower = profession.plural.toLowerCase();
  const minPrice = minSessionPrice(trainers);

  return [
    {
      question: `How much does a ${profession.singular} in ${cityName} cost?`,
      answer: minPrice
        ? `Plans on TrainedRight start around ${formatPriceInr(minPrice)} per session in ${cityName}. Most coaches also list monthly packages, and several offer a free trial session.`
        : `Every coach lists their own plans, and many offer a free trial session — open a profile to see exact prices.`,
    },
    {
      question: `How do I pick the right ${profession.singular} in ${cityName}?`,
      answer: `Check three things on a profile: verified client reviews, real before-and-after transformations, and experience with goals like yours. On TrainedRight all three come from real clients — coaches can't write their own reviews.`,
    },
    {
      question: `Can I train online instead of in person?`,
      answer: `Many ${pluralLower} coach both in person in ${cityName} and online. Message the coach on WhatsApp and ask — it's free and there's no obligation.`,
    },
    {
      question: `Is TrainedRight free for clients?`,
      answer: `Yes. Browsing, comparing and contacting coaches is completely free — you pay your coach directly for training.`,
    },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<LandingParams>;
}): Promise<Metadata> {
  const { profession: professionSlug, city: cSlug } = await params;
  const profession = professionBySlug(professionSlug);
  const city = cityBySlug(cSlug);

  if (!profession || !city) {
    return {};
  }

  const trainers = await landingTrainers(profession, city.name);
  const count = trainers.length;
  const minPrice = minSessionPrice(trainers);
  const path = `/${profession.slug}/${cSlug}`;

  const title =
    count >= 3
      ? `${count} Best ${profession.plural} in ${city.name}`
      : `${profession.plural} in ${city.name} — Compare Coaches & Prices`;
  const description = `Find ${profession.plural.toLowerCase()} in ${city.name}, ${city.state} on TrainedRight. Compare verified reviews, real client transformations${
    minPrice ? ` and prices from ${formatPriceInr(minPrice)}/session` : " and prices"
  }, then chat directly on WhatsApp — free.`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
    // Keep thin pages out of the index until the city has coaches.
    robots: count === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function ProfessionCityPage({
  params,
}: {
  params: Promise<LandingParams>;
}) {
  const { profession: professionSlug, city: cSlug } = await params;
  const profession = professionBySlug(professionSlug);
  const city = cityBySlug(cSlug);

  if (!profession || !city) {
    notFound();
  }

  const trainers = await landingTrainers(profession, city.name);
  const faqs = buildFaqs(profession, city.name, trainers);
  const pluralLower = profession.plural.toLowerCase();
  const otherCities = cityOptions.filter((option) => option.name !== city.name);
  const otherProfessions = seoProfessions.filter(
    (option) => option.slug !== profession.slug,
  );
  const pageUrl = `${siteUrl}/${profession.slug}/${cSlug}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: profession.plural,
        item: `${siteUrl}/${profession.slug}`,
      },
      { "@type": "ListItem", position: 3, name: city.name, item: pageUrl },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${profession.plural} in ${city.name}`,
    numberOfItems: trainers.length,
    itemListElement: trainers.map((trainer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: trainer.name,
      url: `${siteUrl}/trainers/${trainer.slug}`,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <main className="min-h-screen bg-background pb-16 text-white">
      <JsonLd data={breadcrumbJsonLd} />
      {trainers.length > 0 ? <JsonLd data={itemListJsonLd} /> : null}
      <JsonLd data={faqJsonLd} />

      <SiteHeader />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="pt-6 text-[12px] font-semibold text-muted"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/${profession.slug}`}
                className="transition hover:text-white"
              >
                {profession.plural}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-soft">
              {city.name}
            </li>
          </ol>
        </nav>

        <header className="mt-6 max-w-3xl">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-light">
            <MapPin aria-hidden="true" size={13} />
            {city.name}, {city.state}
          </p>
          <h1 className="mt-3 font-display text-[34px] font-black leading-[1.02] md:text-[48px]">
            {profession.plural} in {city.name}
          </h1>
          <p className="mt-4 text-[14px] leading-7 text-soft md:text-[15px]">
            {trainers.length > 0
              ? `${trainers.length} verified ${trainers.length === 1 ? profession.singular : pluralLower} in ${city.name} — compare real client reviews, transformations and prices, then message your shortlist on WhatsApp.`
              : `Coaches are joining ${city.name} every week. Browse the full marketplace meanwhile, or be the first ${profession.singular} listed here.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={searchHrefFor(profession, city.name)}
              className="inline-flex min-h-11 items-center gap-2 rounded-[14px] border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-extrabold text-white transition hover:border-brand/50"
            >
              <SlidersHorizontal aria-hidden="true" size={16} />
              Filter &amp; compare in full search
            </Link>
          </div>
        </header>

        {trainers.length > 0 ? (
          <section aria-label={`${profession.plural} in ${city.name}`} className="mt-8">
            <div className="grid gap-x-6 md:grid-cols-2 md:gap-y-4 xl:grid-cols-3">
              {trainers.map((trainer) => (
                <TrainerCard key={trainer.id} trainer={trainer} showPrice />
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-[20px] border border-white/10 bg-panel p-8 text-center">
            <p className="font-display text-xl font-black">
              No {pluralLower} listed in {city.name} yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-soft">
              New coaches join every week. Meanwhile, explore every coach on the
              marketplace or check a nearby city below.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/trainers"
                className="inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-brand px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-dark"
              >
                Browse all coaches
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
              <Link
                href="/trainer"
                className="inline-flex min-h-11 items-center rounded-[14px] border border-white/15 px-5 py-2.5 text-sm font-extrabold text-white transition hover:border-brand/50"
              >
                List yourself — it&apos;s free
              </Link>
            </div>
          </section>
        )}

        <section className="mt-12 max-w-3xl">
          <h2 className="font-display text-[22px] font-black md:text-[26px]">
            Finding a {profession.singular} in {city.name}
          </h2>
          <div className="mt-4 space-y-4 text-[14px] leading-7 text-soft md:text-[15px]">
            <p>
              Looking for a {profession.singular} in {city.name}? TrainedRight
              lists verified {pluralLower} across {city.name}, {city.state} —
              every profile shows real client reviews, before-and-after
              transformations and starting prices, so you can shortlist with
              proof, not promises.
            </p>
            <p>
              {profession.plural} on TrainedRight help with{" "}
              {profession.helpsWith}. People also find them by searching for{" "}
              {profession.alsoKnownAs.join(", ")} in {city.name}. Once you find
              a match, message them directly on WhatsApp — no signup, no
              booking fee.
            </p>
          </div>
        </section>

        <section className="mt-12 max-w-3xl">
          <h2 className="font-display text-[22px] font-black md:text-[26px]">
            Frequently asked questions
          </h2>
          <dl className="mt-5 space-y-5">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-[16px] border border-white/10 bg-panel p-5"
              >
                <dt className="text-[15px] font-extrabold">{faq.question}</dt>
                <dd className="mt-2 text-[13.5px] leading-6 text-soft">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-[18px] font-black text-soft">
            {profession.plural} in other cities
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {otherCities.map((option) => (
              <li key={option.name}>
                <Link
                  href={`/${profession.slug}/${citySlugOf(option.name)}`}
                  className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] font-bold text-soft transition hover:border-brand/50 hover:text-white"
                >
                  {profession.plural} in {option.name}
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 font-display text-[18px] font-black text-soft">
            More coach types in {city.name}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {otherProfessions.map((option) => (
              <li key={option.slug}>
                <Link
                  href={`/${option.slug}/${cSlug}`}
                  className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] font-bold text-soft transition hover:border-brand/50 hover:text-white"
                >
                  {option.plural} in {city.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 overflow-hidden rounded-[24px] border border-white/10 bg-panel">
          <div className="px-6 py-8 md:px-10 md:py-10">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-light">
              For coaches
            </p>
            <h2 className="mt-2 max-w-xl font-display text-[26px] font-black leading-[1.05] md:text-[34px]">
              Coach in {city.name}? Your next clients are searching right now.
            </h2>
            <p className="mt-3 max-w-xl text-[14px] leading-7 text-soft">
              Create a free profile, collect verified reviews and
              transformations, and get found by clients in {city.name} — zero
              platform fee.
            </p>
            <Link
              href="/trainer"
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-[14px] bg-brand px-6 py-3 text-sm font-extrabold text-white transition hover:bg-brand-dark"
            >
              Get listed free
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
