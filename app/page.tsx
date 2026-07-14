import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";
import { StoryCard } from "@/components/story-card";
import { TrainerCard } from "@/components/trainer-card";
import { getFeaturedStories, getTrainers } from "@/lib/data";

export default async function Home() {
  const [stories, trainers] = await Promise.all([
    getFeaturedStories(),
    getTrainers({ limit: 4 }),
  ]);

  return (
    <main className="min-h-screen bg-background pb-16 text-white">
      <SiteHeader />

      <section className="desktop-page-shell px-4 py-5 sm:px-6 lg:px-0 lg:py-8">
        <div className="grid gap-6 desktop-home-layout">
          <div className="min-w-0">
            <section className="mb-10">
              <SectionHeading>Stories</SectionHeading>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:grid md:grid-cols-2 md:px-0 desktop-story-grid">
                {stories.slice(0, 3).map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-3">
              <div className="rounded-[18px] border border-white/10 bg-panel p-4">
                <p className="text-[11px] font-extrabold uppercase text-muted">
                  Marketplace pulse
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    ["120+", "client wins"],
                    ["4.8", "avg rating"],
                    ["7", "coach types"],
                    ["0", "platform fee"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-[14px] border border-white/10 bg-black/30 p-3"
                    >
                      <div className="font-display text-2xl font-black text-white">
                        {value}
                      </div>
                      <div className="mt-1 text-[11px] font-bold uppercase text-muted">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Link
                href="/trainers"
                className="flex items-center justify-between rounded-[18px] border border-brand/30 bg-brand/10 p-4 text-brand-light transition hover:bg-brand/15"
              >
                <span className="font-display text-lg font-black text-white">
                  See all trainers
                </span>
                <ArrowRight aria-hidden="true" size={20} />
              </Link>
            </div>
          </aside>
        </div>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <h2 className="font-display text-[26px] font-black uppercase leading-none text-white md:text-[34px]">
                Trainers
              </h2>
              <span className="h-px flex-1 bg-gradient-to-r from-brand to-transparent" />
            </div>
            <Link
              href="/trainers"
              className="hidden flex-none items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 text-sm font-bold text-brand-light transition hover:bg-brand/15 md:inline-flex"
            >
              See all
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="grid gap-0 md:grid-cols-2 md:gap-4 desktop-trainer-grid">
            {trainers.map((trainer) => (
              <TrainerCard key={trainer.id} trainer={trainer} />
            ))}
          </div>
          <Link
            href="/trainers"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-brand/30 bg-brand/10 px-4 py-3 text-sm font-bold text-brand-light md:hidden"
          >
            See all trainers
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </section>
      </section>
    </main>
  );
}
