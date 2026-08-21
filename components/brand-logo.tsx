import Link from "next/link";

export function BrandLogo({
  compact = false,
  tagline = true,
}: {
  compact?: boolean;
  tagline?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="TrainedRight — home"
      className="group inline-flex flex-col leading-none"
    >
      <span
        className={`font-display font-black text-white ${
          compact ? "text-[21px]" : "text-[28px] md:text-[32px]"
        }`}
      >
        TRAINED<span className="text-brand">RIGHT</span>
      </span>
      {tagline ? (
        <span
          className={`mt-1 font-bold uppercase text-muted ${
            // In the header the strapline has to stay on one line next to the
            // nav, so it is tighter there than on the standalone lockup.
            compact
              ? "whitespace-nowrap text-[8.5px] tracking-[0.055em]"
              : "max-w-[220px] text-[10px] leading-[1.25]"
          }`}
        >
          Find the right coach for your story
        </span>
      ) : null}
    </Link>
  );
}
