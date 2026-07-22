import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { isOptimizableImageUrl } from "@/lib/media-links";
import type { Story } from "@/lib/types";

export function StoryCard({
  story,
  size = "large",
  href,
}: {
  story: Story;
  size?: "large" | "compact" | "profile" | "banner";
  /** When set, the whole card links here (a story detail page). */
  href?: string;
}) {
  const sizeClass =
    size === "banner"
      ? "h-[220px] w-full snap-start md:h-[260px] lg:h-[280px] lg:w-[calc(50%_-_8px)]"
      : size === "large"
        ? "h-[236px] w-[342px] md:h-[300px] md:w-auto"
        : size === "profile"
          ? "h-[280px] w-[330px] md:h-[340px] md:w-[390px]"
          : "h-[210px] w-[250px]";

  const sizes =
    size === "banner"
      ? "(min-width: 1024px) 50vw, 100vw"
      : size === "large"
        ? "(min-width: 1024px) 360px, 342px"
        : size === "profile"
          ? "(min-width: 768px) 390px, 330px"
          : "250px";

  const inner = (
    <>
      <Image
        src={story.imageUrl}
        alt=""
        fill
        unoptimized={!isOptimizableImageUrl(story.imageUrl)}
        className="object-cover opacity-80 transition duration-300 group-hover:scale-[1.03]"
        sizes={sizes}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
      <div className="absolute right-3 top-3 inline-flex max-w-[70%] items-center gap-2 rounded-full border border-white/15 bg-black/45 py-1 pl-1 pr-3 backdrop-blur">
        <span className="relative h-5 w-5 flex-none overflow-hidden rounded-full">
          <Image
            src={story.avatarUrl}
            alt=""
            fill
            unoptimized={!isOptimizableImageUrl(story.avatarUrl)}
            className="object-cover"
            sizes="20px"
          />
        </span>
        <span className="truncate text-[10px] font-semibold text-white">
          {story.authorName}
        </span>
      </div>
      {href ? (
        <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/45 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
          <ArrowUpRight aria-hidden="true" size={15} />
        </span>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
        <h3
          className={`font-display font-extrabold leading-[1.08] text-white ${
            size === "large"
              ? "text-[20px] md:text-[24px]"
              : size === "profile"
                ? "text-[21px] md:text-[26px]"
                : "text-[17px]"
          }`}
        >
          {story.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-[11.5px] leading-5 text-white/65 md:text-[13px]">
          {story.excerpt}
        </p>
      </div>
    </>
  );

  const className = `group relative flex-none overflow-hidden rounded-[22px] bg-[#1a1114] ${sizeClass}`;

  if (href) {
    return (
      <Link
        href={href}
        aria-label={`Read ${story.title}`}
        className={`${className} block outline-none ring-brand/60 transition focus-visible:ring-2`}
      >
        {inner}
      </Link>
    );
  }

  return <article className={className}>{inner}</article>;
}
