import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Star } from "lucide-react";
import { getTrainerProfile } from "@/lib/data";
import { getTransformationReviewSummary } from "@/lib/transformation-review";
import type { TrainerProfile, Transformation } from "@/lib/types";

type TransformationPageProps = {
  params: Promise<{ slug: string; transformationId: string }>;
};

function decodeTransformationId(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    notFound();
  }
}

async function getTransformationPageData(
  slug: string,
  encodedTransformationId: string,
): Promise<{
  trainer: TrainerProfile;
  transformation: Transformation;
}> {
  const trainer = await getTrainerProfile(slug);

  if (!trainer) {
    notFound();
  }

  const transformationId = decodeTransformationId(encodedTransformationId);
  const transformation = trainer.transformations.find(
    (item) => item.id === transformationId,
  );

  if (!transformation) {
    notFound();
  }

  return { trainer, transformation };
}

export async function generateMetadata({
  params,
}: TransformationPageProps): Promise<Metadata> {
  const { slug, transformationId } = await params;
  const { trainer, transformation } = await getTransformationPageData(
    slug,
    transformationId,
  );

  return {
    title: `${transformation.clientName}'s transformation | ${trainer.name}`,
    description: transformation.review,
  };
}

export default async function TransformationDetailPage({
  params,
}: TransformationPageProps) {
  const { slug, transformationId } = await params;
  const { trainer, transformation } = await getTransformationPageData(
    slug,
    transformationId,
  );
  const review = getTransformationReviewSummary(transformation);

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/trainers/${trainer.slug}`}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/10 bg-panel text-white"
          aria-label={`Back to ${trainer.name}`}
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="overflow-hidden rounded-[24px] border border-white/10 bg-panel">
            <div className="grid h-[330px] grid-cols-2 overflow-hidden sm:h-[420px]">
              <div className="relative">
                <Image
                  src={transformation.beforeImageUrl}
                  alt=""
                  fill
                  priority
                  className="object-cover saturate-75"
                  sizes="(min-width: 1024px) 390px, 50vw"
                />
                <span className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/75 backdrop-blur">
                  Before
                </span>
              </div>
              <div className="relative">
                <Image
                  src={transformation.afterImageUrl}
                  alt=""
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1024px) 390px, 50vw"
                />
                <span className="absolute right-4 top-4 rounded-full bg-emerald-400 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-black">
                  After
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.08em] text-brand-light">
                <span>{transformation.resultLabel}</span>
                <span className="h-1 w-1 rounded-full bg-white/35" />
                <span className="inline-flex items-center gap-1 text-white/70">
                  <Clock aria-hidden="true" size={13} />
                  {transformation.durationLabel}
                </span>
              </div>
              <h1 className="mt-3 font-display text-[34px] font-black leading-none text-white sm:text-[48px]">
                {transformation.clientName}
              </h1>
              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-soft">
                {transformation.review}
              </p>
            </div>
          </article>

          <aside className="rounded-[24px] border border-white/10 bg-panel p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-[14px] bg-brand/15 text-brand-light">
                <Star
                  aria-hidden="true"
                  size={23}
                  className="fill-brand text-brand"
                />
              </span>
              <div>
                <div className="font-display text-[32px] font-black leading-none text-white">
                  {review.rating.toFixed(1)}
                </div>
                <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
                  Overall client rating
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {review.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[16px] border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[14px] font-extrabold text-white">
                      {metric.label}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[12px] font-extrabold text-white">
                      <Star
                        aria-hidden="true"
                        size={13}
                        className="fill-brand text-brand"
                      />
                      {metric.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(metric.rating / 5) * 100}%` }}
                    />
                  </div>
                  <p className="mt-3 text-[12px] leading-5 text-muted">
                    {metric.summary}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
