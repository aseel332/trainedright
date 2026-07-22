import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  MessageCircle,
  Search,
  Star,
  TrendingUp,
} from "lucide-react";
import { HomeHeroSearch } from "@/components/home-hero-search";
import { PopularSearches } from "@/components/popular-searches";
import { SiteHeader } from "@/components/site-header";
import { StoryCard } from "@/components/story-card";
import { TrainerCard } from "@/components/trainer-card";
import { getFeaturedStories, getTrainers } from "@/lib/server/data";
import { searchCategories } from "@/lib/search-categories";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const heroImage =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1800";

const howItWorks = [
  {
    title: "Tell us your goal",
    text: "Pick your city and what you want to change — strength, weight, a sport, or your diet.",
    icon: Search,
  },
  {
    title: "Compare real proof",
    text: "Verified credentials, client transformations, and reviews collected straight from clients.",
    icon: BadgeCheck,
  },
  {
    title: "Start with a free trial",
    text: "Message the coach on WhatsApp and book a first session. No platform fee, ever.",
    icon: CalendarCheck,
  },
];

export default async function Home() {
  const [stories, trainers] = await Promise.all([
    getFeaturedStories(),
    getTrainers({ limit: 4 }),
  ]);

  return (
    <main className="min-h-screen bg-background text-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          className="object-cover opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-background/70 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(240,45,40,0.22),transparent_45%)]" />

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-soft backdrop-blur">
              <Star aria-hidden="true" size={14} className="fill-brand text-brand" />
              Coaches proven by clients
            </span>
            <h1 className="mt-5 font-display text-[46px] font-black leading-[0.95] sm:text-[64px] lg:text-[84px]">
              Find a coach who&apos;s
              <span className="block text-brand-light">actually right.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] font-medium leading-7 text-soft md:text-lg md:leading-8">
              Compare trainers, nutritionists, and sports coaches near you by
              real client results — not ads. Free first session with every
              coach.
            </p>
          </div>

          <div className="mt-8 max-w-2xl">
            <HomeHeroSearch />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] font-bold text-soft">
            <span className="inline-flex items-center gap-2">
              <Star aria-hidden="true" size={15} className="fill-brand text-brand" />
              Verified client reviews
            </span>
            <span className="inline-flex items-center gap-2">
              <MessageCircle aria-hidden="true" size={15} className="text-emerald-300" />
              Direct WhatsApp contact
            </span>
            <span className="inline-flex items-center gap-2">
              <TrendingUp aria-hidden="true" size={15} className="text-brand-light" />
              0% platform fee
            </span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
              Browse by goal
            </p>
            <h2 className="mt-2 font-display text-[30px] font-black leading-none md:text-[40px]">
              What are you training for?
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {searchCategories.map((category) => (
            <Link
              key={category.id}
              href={`/trainers?cat=${category.id}`}
              className="group rounded-[20px] border border-white/10 bg-panel p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-panel-strong"
            >
              <span
                className="inline-block h-2.5 w-10 rounded-full"
                style={{ backgroundColor: category.tint }}
              />
              <h3 className="mt-4 font-display text-[20px] font-black leading-tight text-white">
                {category.label}
              </h3>
              <p className="mt-1.5 text-[13px] font-medium leading-6 text-muted">
                {category.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-extrabold text-brand-light opacity-0 transition group-hover:opacity-100">
                See coaches
                <ArrowRight aria-hidden="true" size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-white/10 bg-panel/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-center">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
                How it works
              </p>
              <h2 className="mt-2 font-display text-[30px] font-black leading-none md:text-[40px]">
                Three steps to your first session.
              </h2>
              <p className="mt-4 text-[14px] leading-7 text-muted">
                Every coach on TrainedRight is reviewed before going live, and
                every review with a verified badge came directly from a client.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {howItWorks.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="rounded-[20px] border border-white/10 bg-panel p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-brand/15 text-brand-light">
                        <Icon aria-hidden="true" size={20} />
                      </span>
                      <span className="font-display text-[28px] font-black text-white/15">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-[18px] font-black leading-tight text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-6 text-muted">
                      {step.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured trainers */}
      {trainers.length > 0 ? (
        <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
                Top rated near you
              </p>
              <h2 className="mt-2 font-display text-[30px] font-black leading-none md:text-[40px]">
                Coaches clients keep recommending.
              </h2>
            </div>
            <Link
              href="/trainers"
              className="hidden flex-none items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2.5 text-sm font-extrabold text-brand-light transition hover:bg-brand/15 md:inline-flex"
            >
              See all coaches
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="grid gap-0 md:grid-cols-2 md:gap-4 desktop-trainer-grid">
            {trainers.map((trainer) => (
              <TrainerCard key={trainer.id} trainer={trainer} showPrice />
            ))}
          </div>
          <Link
            href="/trainers"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-brand/30 bg-brand/10 px-4 py-3 text-sm font-extrabold text-brand-light md:hidden"
          >
            See all coaches
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </section>
      ) : null}

      {/* Stories */}
      {stories.length > 0 ? (
        <section className="border-t border-white/10">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="mb-6">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
                Real transformations
              </p>
              <h2 className="mt-2 font-display text-[30px] font-black leading-none md:text-[40px]">
                Proof beats promises.
              </h2>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:grid md:grid-cols-2 md:px-0 desktop-story-grid">
              {stories.slice(0, 3).map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Trainer CTA */}
      <section className="border-t border-white/10">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="relative overflow-hidden rounded-[28px] border border-brand/30 bg-gradient-to-br from-brand/25 via-panel to-panel p-7 md:p-12">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/25 blur-3xl" />
            <div className="relative max-w-2xl">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
                For coaches
              </p>
              <h2 className="mt-3 font-display text-[32px] font-black leading-[0.98] md:text-[52px]">
                Your clients are already searching. Get found.
              </h2>
              <p className="mt-4 max-w-xl text-[14px] leading-7 text-soft md:text-[15px]">
                Build a profile that sells your coaching, collect verified
                reviews and transformations, and watch real demand in your
                analytics — with zero platform fee.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/trainer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-[14px] bg-brand px-6 py-3 text-sm font-extrabold text-white transition hover:bg-brand-dark"
                >
                  See how it works
                  <ArrowRight aria-hidden="true" size={17} />
                </Link>
                <Link
                  href="/trainer/auth?mode=signup&next=/trainer/onboarding"
                  className="inline-flex min-h-12 items-center rounded-[14px] border border-white/15 bg-black/30 px-6 py-3 text-sm font-extrabold text-white transition hover:border-brand/50"
                >
                  Create your profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PopularSearches />

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-display text-[20px] font-black">
              TRAINED<span className="text-brand">RIGHT</span>
            </p>
            <p className="mt-2 text-[12px] font-semibold text-muted">
              Coaches proven by clients, not ads.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-soft">
            <Link href="/trainers" className="transition hover:text-white">
              Find coaches
            </Link>
            <Link href="/trainer" className="transition hover:text-white">
              For trainers
            </Link>
            <Link
              href="/trainer/auth?mode=signin&next=/trainer/dashboard"
              className="transition hover:text-white"
            >
              Trainer login
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
