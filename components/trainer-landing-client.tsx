"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  ChevronDown,
  ImagePlus,
  Link2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";

const heroVideo =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
const heroPoster =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1800";

const lifeVideos = [
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    poster:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=78&w=900",
    label: "Fill your morning slots",
  },
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    poster:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=78&w=900",
    label: "Coach who you want to coach",
  },
  {
    src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    poster:
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=78&w=900",
    label: "Own your reputation",
  },
];

const walkthroughSteps = [
  {
    id: "profile",
    kicker: "Step 1 — Your shopfront",
    title: "A profile that sells your coaching while you train.",
    text: "Custom specialties, your own price plans, photos, credentials — assembled into a page that reads like proof, not a flyer.",
    icon: ImagePlus,
  },
  {
    id: "leads",
    kicker: "Step 2 — Real leads",
    title: "Clients land in your WhatsApp, not an inbox you never open.",
    text: "People searching your city and your category message you directly. You keep the relationship and 100% of what you charge.",
    icon: MessageCircle,
  },
  {
    id: "proof",
    kicker: "Step 3 — Verified proof",
    title: "Reviews and transformations your clients submit themselves.",
    text: "Send a private link. Your client rates you, writes the review, uploads the before/after. It lands on your profile with a verified badge.",
    icon: BadgeCheck,
  },
  {
    id: "analytics",
    kicker: "Step 4 — Honest numbers",
    title: "See the demand: views, contacts, and what converts.",
    text: "A clean analytics board shows who found you, who reached out, and which proof made them do it.",
    icon: BarChart3,
  },
];

function useReveal() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return;
    }

    const targets = node.querySelectorAll(".reveal");
    // Only hide elements once the observer is actually in place, so the page
    // never renders blank when JS is delayed or unavailable.
    node.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Reveal anything on screen or already scrolled past (e.g. after
          // scroll restoration), regardless of element height.
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      node.classList.remove("reveal-ready");
    };
  }, []);

  return ref;
}

export function TrainerLandingClient() {
  const pageRef = useReveal();
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = stepRefs.current.indexOf(
              entry.target as HTMLDivElement,
            );
            if (index >= 0) {
              setActiveStep(index);
            }
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );

    stepRefs.current.forEach((node) => {
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main
      ref={pageRef}
      className="min-h-screen overflow-x-clip bg-background text-white"
    >
      {/* Minimal nav */}
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="font-display text-[20px] font-black leading-none text-white"
          >
            TRAINED<span className="text-brand">RIGHT</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/trainer/auth?mode=signin&next=/trainer/dashboard"
              className="rounded-full border border-white/15 bg-black/30 px-4 py-2.5 text-sm font-extrabold text-white backdrop-blur transition hover:border-brand/50"
            >
              Log in
            </Link>
            <Link
              href="/trainer/auth?mode=signup&next=/trainer/onboarding"
              className="hidden rounded-full bg-brand px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-dark sm:inline-flex"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Video hero */}
      <section className="relative flex min-h-[92svh] items-end overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          src={heroVideo}
          poster={heroPoster}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(240,45,40,0.2),transparent_42%)]" />

        <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-36 sm:px-6 lg:px-8 lg:pb-24">
          <p className="reveal inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-soft backdrop-blur">
            <Sparkles aria-hidden="true" size={14} className="text-brand-light" />
            For trainers, coaches & nutritionists
          </p>
          <h1 className="reveal mt-5 max-w-4xl font-display text-[52px] font-black leading-[0.92] sm:text-[72px] lg:text-[96px]">
            Your coaching life,
            <span className="block text-brand-light">elevated.</span>
          </h1>
          <p className="reveal mt-6 max-w-xl text-[15px] font-medium leading-7 text-soft md:text-lg md:leading-8">
            TrainedRight turns your results into a client magnet — a verified
            profile, direct WhatsApp leads, and analytics that show your
            coaching business growing.
          </p>
          <div className="reveal mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/trainer/auth?mode=signup&next=/trainer/onboarding"
              className="inline-flex min-h-13 items-center gap-2 rounded-[16px] bg-brand px-7 py-4 text-sm font-extrabold text-white transition hover:bg-brand-dark"
            >
              Create your profile — free
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <span className="text-[13px] font-bold text-muted">
              5 minutes to set up · 0% platform fee
            </span>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-white/40 md:block">
          <ChevronDown aria-hidden="true" size={22} className="animate-bounce" />
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-white/10 bg-panel/60 py-3">
        <div className="marquee-track flex w-max items-center gap-8 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, copy) => (
            <div
              key={copy}
              aria-hidden={copy === 1}
              className="flex items-center gap-8 text-[12px] font-extrabold uppercase tracking-[0.2em] text-muted"
            >
              {[
                "More clients",
                "Verified reviews",
                "Zero platform fee",
                "Direct WhatsApp leads",
                "Client transformations",
                "Honest analytics",
              ].map((item) => (
                <span key={item} className="flex items-center gap-8">
                  {item}
                  <span className="text-brand">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll walkthrough */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="reveal mb-12 max-w-2xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
            The walkthrough
          </p>
          <h2 className="mt-2 font-display text-[34px] font-black leading-[0.95] md:text-[52px]">
            From unknown to fully booked.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            {walkthroughSteps.map((step, index) => {
              const Icon = step.icon;
              const active = activeStep === index;
              return (
                <div
                  key={step.id}
                  ref={(node) => {
                    stepRefs.current[index] = node;
                  }}
                  // Border color lives in style, not className: React rewrites
                  // className on re-render, which would strip the observer's
                  // imperatively added `is-visible` class.
                  className="reveal border-l-2 py-10 pl-6 transition-colors duration-300 lg:min-h-[46vh]"
                  style={{
                    borderColor: active
                      ? "#f02d28"
                      : "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <span
                    className={`inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] ${
                      active ? "text-brand-light" : "text-muted"
                    }`}
                  >
                    <Icon aria-hidden="true" size={15} />
                    {step.kicker}
                  </span>
                  <h3 className="mt-3 max-w-md font-display text-[26px] font-black leading-tight md:text-[32px]">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-md text-[14px] leading-7 text-muted">
                    {step.text}
                  </p>
                  <div className="mt-6 lg:hidden">
                    <WalkthroughVisual step={index} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden min-w-0 lg:block">
            <div className="sticky top-24">
              <WalkthroughVisual step={activeStep} />
            </div>
          </div>
        </div>
      </section>

      {/* Life videos */}
      <section className="border-t border-white/10 bg-panel/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
                Coach life, upgraded
              </p>
              <h2 className="mt-2 font-display text-[34px] font-black leading-[0.95] md:text-[48px]">
                Spend your day coaching.
                <span className="block text-soft">We handle the finding.</span>
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {lifeVideos.map((video) => (
              <figure
                key={video.src}
                className="reveal group relative h-[340px] overflow-hidden rounded-[22px] border border-white/10 bg-black md:h-[420px]"
              >
                <video
                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-90"
                  src={video.src}
                  poster={video.poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <figcaption className="absolute bottom-4 left-4 right-4 font-display text-[20px] font-black leading-tight text-white">
                  {video.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              icon: Wallet,
              title: "0% platform fee",
              text: "Clients pay you directly. TrainedRight never sits between you and your money.",
            },
            {
              icon: Link2,
              title: "Proof by link",
              text: "Verified reviews and transformations collected through private client links — not screenshots.",
            },
            {
              icon: ShieldCheck,
              title: "Approved, not scraped",
              text: "Every profile is reviewed before going live, so being listed actually means something.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="reveal rounded-[22px] border border-white/10 bg-panel p-6"
              >
                <span className="grid h-12 w-12 place-items-center rounded-[15px] bg-brand/15 text-brand-light">
                  <Icon aria-hidden="true" size={22} />
                </span>
                <h3 className="mt-5 font-display text-[22px] font-black leading-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] leading-6 text-muted">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/10">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-28">
          <h2 className="reveal mx-auto max-w-3xl font-display text-[38px] font-black leading-[0.95] md:text-[64px]">
            The next client is already searching.
            <span className="block text-brand-light">Be the answer.</span>
          </h2>
          <div className="reveal mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/trainer/auth?mode=signup&next=/trainer/onboarding"
              className="inline-flex min-h-13 items-center gap-2 rounded-[16px] bg-brand px-8 py-4 text-sm font-extrabold text-white transition hover:bg-brand-dark"
            >
              Start free today
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <Link
              href="/trainer/auth?mode=signin&next=/trainer/dashboard"
              className="inline-flex min-h-13 items-center rounded-[16px] border border-white/15 px-8 py-4 text-sm font-extrabold text-white transition hover:border-brand/50"
            >
              I already have a profile
            </Link>
          </div>
          <p className="reveal mt-6 text-[12px] font-bold text-muted">
            Free forever for coaches · Approval usually within 48 hours
          </p>
        </div>
      </section>
    </main>
  );
}

/** Mini product mockups shown alongside the walkthrough steps. */
function WalkthroughVisual({ step }: { step: number }) {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-panel p-5 shadow-2xl shadow-black/40 md:p-7">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand/15 blur-3xl" />
      {step === 0 ? <ProfileMockup /> : null}
      {step === 1 ? <LeadsMockup /> : null}
      {step === 2 ? <ProofMockup /> : null}
      {step === 3 ? <AnalyticsMockup /> : null}
    </div>
  );
}

function ProfileMockup() {
  return (
    <div className="relative">
      <div className="relative h-44 overflow-hidden rounded-[18px]">
        <Image
          src="https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&q=78&w=900"
          alt=""
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 560px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <p className="font-display text-[24px] font-black text-white">
            Your Name
          </p>
          <p className="text-[11px] font-bold text-white/70">
            Your city · replies in ~2 hrs
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Your specialty", "Another one", "Up to four"].map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-extrabold text-soft"
          >
            {chip}
          </span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {["Trial", "Per session", "Your plan"].map((plan, index) => (
          <div
            key={plan}
            className={`rounded-[14px] border p-3 ${
              index === 0
                ? "border-brand/50 bg-brand/10"
                : "border-white/10 bg-black/25"
            }`}
          >
            <p className="text-[10px] font-extrabold uppercase text-muted">
              {plan}
            </p>
            <p className="mt-1 font-display text-[16px] font-black text-white">
              {index === 0 ? "Free" : "₹—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadsMockup() {
  return (
    <div className="relative space-y-3">
      {[
        ["Ananya", "Hi! Found you on TrainedRight — do you have morning slots?", "2m"],
        ["Rahul", "Looking for strength coaching near Indiranagar 💪", "18m"],
        ["Sneha", "Can we start with the trial session this week?", "1h"],
      ].map(([name, message, time]) => (
        <div
          key={name}
          className="flex items-start gap-3 rounded-[16px] border border-white/10 bg-black/30 p-3.5"
        >
          <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
            <MessageCircle aria-hidden="true" size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-white">{name}</p>
              <span className="text-[10px] font-bold text-muted">{time}</span>
            </div>
            <p className="mt-0.5 truncate text-[12px] font-medium text-soft">
              {message}
            </p>
          </div>
        </div>
      ))}
      <p className="pt-1 text-center text-[11px] font-bold text-muted">
        Straight to your WhatsApp — no middleman
      </p>
    </div>
  );
}

function ProofMockup() {
  return (
    <div className="relative space-y-3">
      <div className="rounded-[16px] border border-white/10 bg-black/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                aria-hidden="true"
                size={15}
                className="fill-brand text-brand"
              />
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-300">
            <BadgeCheck aria-hidden="true" size={12} />
            Verified
          </span>
        </div>
        <p className="mt-3 text-[13px] font-medium leading-6 text-soft">
          “Down 9 kg in five months. The plan survived my travel weeks — that
          never happened before.”
        </p>
        <p className="mt-2 text-[11px] font-bold text-muted">
          Submitted by your client via private link
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {["Before", "After"].map((label, index) => (
          <div
            key={label}
            className="relative h-32 overflow-hidden rounded-[14px] border border-white/10"
          >
            <Image
              src={
                index === 0
                  ? "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?auto=format&fit=crop&q=74&w=500"
                  : "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=74&w=500"
              }
              alt=""
              fill
              className="object-cover"
              sizes="260px"
            />
            <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-extrabold uppercase text-white backdrop-blur">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  const bars = [34, 48, 42, 60, 72, 66, 88, 96];
  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-2">
        {[
          ["Profile views", "1,284"],
          ["WhatsApp taps", "96"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[14px] border border-white/10 bg-black/30 p-3.5"
          >
            <p className="text-[10px] font-extrabold uppercase text-muted">
              {label}
            </p>
            <p className="mt-1.5 font-display text-[24px] font-black text-white">
              {value}
            </p>
            <p className="text-[10px] font-bold text-emerald-300">
              +18% this week
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-[16px] border border-white/10 bg-black/30 p-4">
        <div className="flex h-28 items-end gap-1.5">
          {bars.map((height, index) => (
            <span
              key={index}
              className={`flex-1 rounded-t-[6px] ${
                index === bars.length - 1 ? "bg-brand" : "bg-brand/40"
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <p className="mt-3 text-[11px] font-bold text-muted">
          Weekly profile visits
        </p>
      </div>
    </div>
  );
}
