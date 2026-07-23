import type { ReactNode } from "react";

/**
 * Minimal line-art landmark per city, drawn with strokes in currentColor so
 * it inherits the surrounding text tone. Ahmedabad: a Sidi Saiyyed-style
 * mosque — twin minarets, central dome, arched hall.
 */
const cityArt: Record<string, ReactNode> = {
  ahmedabad: (
    <>
      {/* ground */}
      <path d="M4 44h64" />
      {/* left minaret */}
      <path d="M11 44V16m6 28V16M11 16c0-4 6-4 6 0M14 12v-4M10 28h8M10 35h8" />
      <path d="M14 12c-1.6 0-2.6-1-2.6-2s1-2 2.6-2 2.6 1 2.6 2-1 2-2.6 2z" />
      {/* right minaret */}
      <path d="M55 44V16m6 28V16M55 16c0-4 6-4 6 0M58 12v-4M54 28h8M54 35h8" />
      <path d="M58 12c-1.6 0-2.6-1-2.6-2s1-2 2.6-2 2.6 1 2.6 2-1 2-2.6 2z" />
      {/* hall */}
      <path d="M21 44V28h30v16" />
      {/* central dome + finial */}
      <path d="M27 28c0-9 18-9 18 0M36 16v5.5" />
      {/* small roof domes */}
      <path d="M22 28c0-4 6-4 6 0M44 28c0-4 6-4 6 0" />
      {/* central arch */}
      <path d="M31 44v-6c0-4 10-4 10 0v6" />
      {/* side arches */}
      <path d="M24 44v-3.4c0-2.6 4-2.6 4 0V44M44 44v-3.4c0-2.6 4-2.6 4 0V44" />
    </>
  ),
};

/* Generic skyline for cities without their own art yet. */
const defaultArt: ReactNode = (
  <>
    <path d="M4 44h64" />
    <path d="M14 44V22h12v22M32 44V14h14v30M52 44V26h10v18" />
    <path d="M18 28h4M18 34h4M36 20h6M36 27h6M36 34h6M55 32h4" />
  </>
);

export function CityIcon({
  city,
  className,
}: {
  /** City slug, e.g. "ahmedabad". */
  city: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 72 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {cityArt[city] ?? defaultArt}
    </svg>
  );
}
