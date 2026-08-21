import Link from "next/link";

export function BrandLogo({
  compact = false,
  /** The strapline under the wordmark. Off in the site header, where the
      nav sits on the same line and a second line of text just adds noise. */
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
          compact ? "text-[22px]" : "text-[28px] md:text-[32px]"
        }`}
      >
        TRAINED<span className="text-brand">RIGHT</span>
      </span>
      {tagline ? (
        <span className="mt-1 max-w-[220px] text-[10px] font-bold uppercase leading-[1.25] text-muted">
          Find the right coach for your story
        </span>
      ) : null}
    </Link>
  );
}
