import type { Metadata } from "next";
import { HomeCoachCta } from "@/components/home/coach-cta";
import { HomeCoaches } from "@/components/home/coaches";
import { HomeCities, HomeGoals } from "@/components/home/discover";
import { HomeHero } from "@/components/home/hero";
import { HomeHowItWorks } from "@/components/home/how-it-works";
import { HomeProof } from "@/components/home/proof";
import { HomeFooter } from "@/components/home/site-footer";
import { PopularSearches } from "@/components/popular-searches";
import { SiteHeader } from "@/components/site-header";
import { StoryCard } from "@/components/story-card";
import { getHomeContent, liveCategories } from "@/lib/server/home-content";
import { cityOptions } from "@/lib/search-categories";
import {
  citySlugOf,
  cityHubHref,
  isCityLaunched,
  professionForCategory,
} from "@/lib/seo-pages";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The landing page is assembled entirely from published marketplace data plus
 * the admin's editorial settings, so it is regenerated on a schedule rather
 * than per request. Approving, republishing or deleting a trainer — and saving
 * the home settings — all call `revalidatePath`, so edits still appear at once.
 */
export const revalidate = 3600;

export default async function Home() {
  const content = await getHomeContent();
  const { settings, numbers, featuredTrainers, reviews, transformations } =
    content;

  // Search and browse only ever offer cities that are launched *and* have
  // someone in them — a dropdown entry leading to an empty listing is a
  // broken promise, not a feature.
  const liveCities = cityOptions
    .filter(
      (city) => isCityLaunched(city.name) && (numbers.cityCounts[city.name] ?? 0) > 0,
    )
    .map((city) => ({
      name: city.name,
      state: city.state,
      slug: citySlugOf(city.name),
      href: `/${citySlugOf(city.name)}`,
      count: numbers.cityCounts[city.name] ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  const upcomingCities = cityOptions
    .filter((city) => !liveCities.some((live) => live.name === city.name))
    .map((city) => ({ name: city.name, state: city.state }));

  const goals = liveCategories(numbers).map(({ category, count }) => ({
    category,
    count,
    href: cityHubHref(
      numbers.primaryCity,
      professionForCategory(category.id) ?? undefined,
    ),
  }));

  // With a single live city, pre-selecting it makes the search usable in one
  // tap instead of two. With several, the visitor has a real choice to make.
  const defaultCity = liveCities.length === 1 ? liveCities[0].slug : "";

  const browseHref = liveCities[0]?.href ?? "/fitness-trainers";
  const browseLabel = liveCities[0]
    ? `All ${numbers.coachCount} coaches in ${liveCities[0].name}`
    : "Browse every coach";

  const slugByTrainerId = new Map(
    featuredTrainers.map((trainer) => [trainer.id, trainer.slug]),
  );
  const stories = content.stories.slice(0, 3);

  return (
    <>
      <SiteHeader />

      <main id="main" className="min-h-screen bg-background text-white">
        <HomeHero
          settings={settings}
          numbers={numbers}
          trainers={featuredTrainers}
          review={reviews[0] ?? null}
          cities={liveCities}
          goals={goals.map(({ category, count }) => ({
            id: category.id,
            label: category.label,
            count,
          }))}
          defaultCity={defaultCity}
        />

        {settings.sections.coaches ? (
          <HomeCoaches
            headline={settings.coaches.headline}
            body={settings.coaches.body}
            trainers={featuredTrainers.slice(0, 4)}
            totalCount={numbers.coachCount}
            browseHref={browseHref}
            browseLabel={browseLabel}
          />
        ) : null}

        {settings.sections.proof ? (
          <HomeProof
            headline={settings.proof.headline}
            body={settings.proof.body}
            transformation={transformations[0] ?? null}
            reviews={reviews.slice(0, transformations[0] ? 4 : 3)}
          />
        ) : null}

        <HomeHowItWorks />

        {settings.sections.goals ? <HomeGoals goals={goals} /> : null}

        {settings.sections.cities ? (
          <HomeCities live={liveCities} upcoming={upcomingCities} />
        ) : null}

        {settings.sections.stories && stories.length > 0 ? (
          <section className="border-t border-white/8">
            <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
              <div className="max-w-2xl">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
                  Stories
                </p>
                <h2 className="mt-2.5 font-display text-[30px] font-black leading-[1.02] tracking-[-0.01em] md:text-[42px]">
                  Longer reads from the people behind the profiles.
                </h2>
              </div>
              {/* The editorial two-column grid needs a second card to lean
                  against — with one story it leaves a hole, so a single story
                  just runs full width. */}
              <div
                className={`scrollbar-none -mx-4 mt-7 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:px-0 ${
                  stories.length > 1
                    ? "desktop-story-grid md:grid-cols-2"
                    : "md:grid-cols-1"
                }`}
              >
                {stories.map((story) => {
                  const slug = story.trainerId
                    ? slugByTrainerId.get(story.trainerId)
                    : undefined;
                  return (
                    <StoryCard
                      key={story.id}
                      story={story}
                      href={
                        slug
                          ? `/trainers/${slug}/stories/${story.id}`
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {settings.sections.trainerCta ? (
          <HomeCoachCta settings={settings} />
        ) : null}

        <PopularSearches />
      </main>

      <HomeFooter
        cities={liveCities.map((city) => ({ name: city.name, href: city.href }))}
      />
    </>
  );
}
