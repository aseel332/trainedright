import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-center text-white">
      <div>
        <p className="font-display text-[18px] font-black uppercase text-brand-light">
          Trainer not found
        </p>
        <h1 className="mt-3 font-display text-[42px] font-black leading-none">
          This coach profile is not available.
        </h1>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-brand px-5 py-3 text-sm font-extrabold text-white"
        >
          Browse coaches
        </Link>
      </div>
    </main>
  );
}
