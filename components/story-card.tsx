import Image from "next/image";
import type { Story } from "@/lib/types";

export function StoryCard({
  story,
  size = "large",
}: {
  story: Story;
  size?: "large" | "compact" | "profile";
}) {
  const sizeClass =
    size === "large"
      ? "h-[236px] w-[342px] md:h-[300px] md:w-auto"
      : size === "profile"
        ? "h-[280px] w-[330px] md:h-[340px] md:w-[390px]"
        : "h-[210px] w-[250px]";

  return (
    <article
      className={`group relative flex-none overflow-hidden rounded-[22px] bg-[#1a1114] ${sizeClass}`}
    >
      <Image
        src={story.imageUrl}
        alt=""
        fill
        className="object-cover opacity-80 transition duration-300 group-hover:scale-[1.03]"
        sizes={
          size === "large"
            ? "(min-width: 1024px) 360px, 342px"
            : size === "profile"
              ? "(min-width: 768px) 390px, 330px"
              : "250px"
        }
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
      <div className="absolute right-3 top-3 inline-flex max-w-[70%] items-center gap-2 rounded-full border border-white/15 bg-black/45 py-1 pl-1 pr-3 backdrop-blur">
        <span className="relative h-5 w-5 flex-none overflow-hidden rounded-full">
          <Image
            src={story.avatarUrl}
            alt=""
            fill
            className="object-cover"
            sizes="20px"
          />
        </span>
        <span className="truncate text-[10px] font-semibold text-white">
          {story.authorName}
        </span>
      </div>
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
    </article>
  );
}
