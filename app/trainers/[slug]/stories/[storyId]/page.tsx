import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { getTrainerProfile } from "@/lib/server/data";
import { isOptimizableImageUrl, resolveStoredVideo } from "@/lib/media-links";
import type { Story, StoryMedia, TrainerProfile } from "@/lib/types";

type StoryPageProps = {
  params: Promise<{ slug: string; storyId: string }>;
};

function decodeId(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    notFound();
  }
}

async function getStoryPageData(
  slug: string,
  encodedStoryId: string,
): Promise<{ trainer: TrainerProfile; story: Story }> {
  const trainer = await getTrainerProfile(slug);

  if (!trainer) {
    notFound();
  }

  const storyId = decodeId(encodedStoryId);
  const story = trainer.stories.find((item) => item.id === storyId);

  if (!story) {
    notFound();
  }

  return { trainer, story };
}

export async function generateMetadata({
  params,
}: StoryPageProps): Promise<Metadata> {
  const { slug, storyId } = await params;
  const { trainer, story } = await getStoryPageData(slug, storyId);

  return {
    title: `${story.title} | ${trainer.name} on TrainedRight`,
    description: story.intro || story.excerpt || undefined,
  };
}

export default async function StoryDetailPage({ params }: StoryPageProps) {
  const { slug, storyId } = await params;
  const { trainer, story } = await getStoryPageData(slug, storyId);

  return (
    <main className="min-h-screen bg-background pb-20 text-white">
      <div className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">
        <Link
          href={`/trainers/${trainer.slug}`}
          aria-label={`Back to ${trainer.name}`}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/10 bg-panel text-white transition hover:border-brand/50"
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
      </div>

      <article className="mx-auto max-w-5xl px-4 sm:px-6">
        <header className="mx-auto max-w-3xl pt-8">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-light">
            Story
          </p>
          <h1 className="mt-3 font-display text-[34px] font-black leading-[1.05] text-white sm:text-[46px]">
            {story.title}
          </h1>

          <div className="mt-5 flex items-center gap-3">
            <span className="relative h-11 w-11 flex-none overflow-hidden rounded-full border border-white/10 bg-panel">
              <Image
                src={trainer.avatarUrl}
                alt=""
                fill
                unoptimized={!isOptimizableImageUrl(trainer.avatarUrl)}
                className="object-cover"
                sizes="44px"
              />
            </span>
            <span className="min-w-0">
              <Link
                href={`/trainers/${trainer.slug}`}
                className="block truncate text-[14px] font-extrabold text-white transition hover:text-brand-light"
              >
                {trainer.name}
              </Link>
              <span className="block text-[12px] font-semibold text-muted">
                Coach on TrainedRight
              </span>
            </span>
          </div>

          {story.intro ? (
            <StoryProse
              text={story.intro}
              className="mt-6 text-[17px] font-medium leading-8 text-soft sm:text-[19px]"
            />
          ) : null}
        </header>

        {story.cover ? (
          <div className="mx-auto mt-8 max-w-3xl">
            <StoryMediaBlock
              media={story.cover}
              priority
              aspect="aspect-video"
              sizes="(min-width: 768px) 720px, 100vw"
            />
          </div>
        ) : null}

        <div className="mt-2">
          {story.sections.map((section, index) => {
            const media = section.media;
            const text = section.text.trim() ? section.text : "";
            const proseClass = "text-[16px] leading-8 text-soft sm:text-[17px]";

            // Image and text side by side on desktop, alternating sides; on
            // phones they stack with the image on top. Alternation counts only
            // the sections that actually have both, so they always zig-zag.
            if (media && text) {
              const imageRight =
                story.sections
                  .slice(0, index)
                  .filter((s) => s.media && s.text.trim()).length %
                  2 ===
                1;

              return (
                <section key={section.id} className="mt-12">
                  <div className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
                    <div className={imageRight ? "md:order-2" : "md:order-1"}>
                      <StoryMediaBlock
                        media={media}
                        aspect="aspect-[4/3]"
                        sizes="(min-width: 768px) 460px, 100vw"
                      />
                    </div>
                    <div className={imageRight ? "md:order-1" : "md:order-2"}>
                      <StoryProse text={text} className={proseClass} />
                    </div>
                  </div>
                </section>
              );
            }

            if (media) {
              return (
                <section key={section.id} className="mx-auto mt-12 max-w-3xl">
                  <StoryMediaBlock
                    media={media}
                    aspect="aspect-[4/3]"
                    sizes="(min-width: 768px) 720px, 100vw"
                  />
                </section>
              );
            }

            if (text) {
              return (
                <section key={section.id} className="mx-auto mt-10 max-w-3xl">
                  <StoryProse text={text} className={proseClass} />
                </section>
              );
            }

            return null;
          })}
        </div>

        <footer className="mx-auto mt-14 max-w-3xl rounded-[22px] border border-white/10 bg-panel p-5 sm:p-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
            Coached by
          </p>
          <div className="mt-3 flex items-center gap-4">
            <span className="relative h-14 w-14 flex-none overflow-hidden rounded-full border border-white/10 bg-black">
              <Image
                src={trainer.avatarUrl}
                alt=""
                fill
                unoptimized={!isOptimizableImageUrl(trainer.avatarUrl)}
                className="object-cover"
                sizes="56px"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[20px] font-black text-white">
                {trainer.name}
              </p>
              {trainer.city ? (
                <p className="mt-0.5 truncate text-[13px] font-semibold text-muted">
                  {trainer.city}
                  {trainer.state ? `, ${trainer.state}` : ""}
                </p>
              ) : null}
            </div>
            <Link
              href={`/trainers/${trainer.slug}`}
              className="inline-flex flex-none items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-[13px] font-extrabold text-white transition hover:bg-brand-dark"
            >
              View profile
              <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}

/**
 * An image or video in a fixed-size frame. Images are scaled to fit entirely
 * (object-contain, so a tall or wide photo is never cropped); a blurred copy
 * fills the frame behind it so there are never empty letterbox bars.
 */
function StoryMediaBlock({
  media,
  priority = false,
  aspect = "aspect-video",
  sizes = "(min-width: 768px) 720px, 100vw",
}: {
  media: StoryMedia;
  priority?: boolean;
  /** Tailwind aspect-ratio class fixing the frame size. */
  aspect?: string;
  sizes?: string;
}) {
  const frame = `relative ${aspect} w-full overflow-hidden rounded-[20px] border border-white/10 bg-black`;

  if (media.kind === "video") {
    const video = resolveStoredVideo(media.url);
    return (
      <div className={frame}>
        {video.isIframe ? (
          <iframe
            src={video.src}
            title="Story video"
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={video.src}
            poster={media.posterUrl || undefined}
            className="absolute inset-0 h-full w-full object-contain"
            controls
            playsInline
          />
        )}
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white backdrop-blur">
          <Play aria-hidden="true" size={11} fill="currentColor" />
          Video
        </span>
      </div>
    );
  }

  const unoptimized = !isOptimizableImageUrl(media.url);

  return (
    <div className={frame}>
      <Image
        src={media.url}
        alt=""
        aria-hidden
        fill
        unoptimized={unoptimized}
        className="scale-110 object-cover opacity-35 blur-2xl"
        sizes={sizes}
      />
      <Image
        src={media.url}
        alt=""
        fill
        priority={priority}
        unoptimized={unoptimized}
        className="object-contain"
        sizes={sizes}
      />
    </div>
  );
}

/** Render a text block as paragraphs, preserving single line breaks. */
function StoryProse({ text, className }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className={`whitespace-pre-line ${index > 0 ? "mt-5" : ""}`}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
