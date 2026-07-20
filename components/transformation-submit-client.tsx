"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  ImagePlus,
  Link2,
  Loader2,
  X,
} from "lucide-react";
import { submitTransformationByToken } from "@/app/trainer/actions";
import { StarPicker } from "@/components/trainer-dashboard-client";
import { uploadPublicFile } from "@/lib/client/upload";

type TransformationRequest = {
  mode: "client_all" | "trainer_photos";
  clientName: string;
  trainerName: string;
  title: string;
  resultLabel: string;
  durationLabel: string;
  beforeImageUrl: string;
  afterImageUrl: string;
};

export function TransformationSubmitClient({
  token,
  request,
}: {
  token: string;
  request: TransformationRequest | null;
}) {
  const clientAll = request?.mode === "client_all";

  const [clientName, setClientName] = useState(request?.clientName ?? "");
  const [title, setTitle] = useState(request?.title ?? "");
  const [resultLabel, setResultLabel] = useState(request?.resultLabel ?? "");
  const [durationLabel, setDurationLabel] = useState(
    request?.durationLabel ?? "",
  );
  const [beforeUrl, setBeforeUrl] = useState(request?.beforeImageUrl ?? "");
  const [afterUrl, setAfterUrl] = useState(request?.afterImageUrl ?? "");
  const [uploading, setUploading] = useState<"before" | "after" | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canSubmit =
    Boolean(rating) &&
    text.trim().length > 0 &&
    (!clientAll ||
      (clientName.trim().length > 0 &&
        Boolean(beforeUrl) &&
        Boolean(afterUrl)));

  async function upload(files: FileList | null, slot: "before" | "after") {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }
    setUploading(slot);
    const result = await uploadPublicFile(file, "submissions");
    if (!result.persisted) {
      setError("That photo couldn't be uploaded. Check your connection and try again.");
      setUploading(null);
      return;
    }
    if (slot === "before") {
      setBeforeUrl(result.url);
    } else {
      setAfterUrl(result.url);
    }
    setUploading(null);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const result = await submitTransformationByToken({
      token,
      rating,
      reviewText: text,
      clientName,
      title,
      resultLabel,
      durationLabel,
      beforeImageUrl: beforeUrl,
      afterImageUrl: afterUrl,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="font-display text-[18px] font-black leading-none"
          >
            TRAINED<span className="text-brand">RIGHT</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-[10px] font-extrabold uppercase text-emerald-300">
            <BadgeCheck aria-hidden="true" size={12} />
            Client verified
          </span>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-12">
        {!request ? (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-white/[0.06] text-muted">
              <Link2 aria-hidden="true" size={24} />
            </span>
            <h1 className="mt-6 font-display text-[34px] font-black leading-none">
              This link isn&apos;t active.
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm font-semibold leading-6 text-muted">
              It may have been used already or removed by the coach. Ask your
              coach for a fresh link if you still want to share your story.
            </p>
          </div>
        ) : done ? (
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-400 text-black">
              <Check aria-hidden="true" size={26} />
            </span>
            <h1 className="mt-6 font-display text-[34px] font-black leading-none">
              That&apos;s inspiring stuff.
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm font-semibold leading-6 text-muted">
              Your transformation has been recorded and will appear on{" "}
              {request.trainerName}&apos;s profile as client-confirmed proof.
            </p>
            <Link
              href="/trainers"
              className="mt-8 inline-flex items-center gap-2 rounded-[14px] border border-white/15 px-5 py-3 text-sm font-extrabold text-white transition hover:border-brand/50"
            >
              Browse coaches on TrainedRight
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-light">
              {request.clientName ? `Hi ${request.clientName}` : "Your story"}
            </p>
            <h1 className="mt-3 font-display text-[36px] font-black leading-[0.98] sm:text-[44px]">
              {clientAll
                ? `Share your transformation with ${request.trainerName}.`
                : `Confirm your transformation with ${request.trainerName}.`}
            </h1>
            <p className="mt-4 text-sm font-semibold leading-6 text-muted">
              {clientAll
                ? "Upload your before and after photos, tell the story, and rate your coach. You control everything that gets shown."
                : "Your coach added the photos and result below. Check them, then rate and review to confirm — nothing goes live without you."}
            </p>

            <div className="mt-8 space-y-4">
              {clientAll ? (
                <div className="rounded-[20px] border border-white/10 bg-panel p-5">
                  <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                    About you
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      value={clientName}
                      onChange={(event) => setClientName(event.target.value)}
                      placeholder="Your name"
                      className="h-12 w-full rounded-[13px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                    />
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Title (e.g. Desk job to first 5k)"
                      className="h-12 w-full rounded-[13px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                    />
                    <input
                      value={resultLabel}
                      onChange={(event) => setResultLabel(event.target.value)}
                      placeholder="Result (e.g. -14 kg)"
                      className="h-12 w-full rounded-[13px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                    />
                    <input
                      value={durationLabel}
                      onChange={(event) => setDurationLabel(event.target.value)}
                      placeholder="How long it took (e.g. 6 months)"
                      className="h-12 w-full rounded-[13px] border border-white/10 bg-black/30 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
                    />
                  </div>
                </div>
              ) : null}

              {/* Photos */}
              <div className="rounded-[20px] border border-white/10 bg-panel p-5">
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  {clientAll ? "Your before & after" : "Photos from your coach"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["before", beforeUrl, setBeforeUrl],
                      ["after", afterUrl, setAfterUrl],
                    ] as const
                  ).map(([slot, url, setUrl]) => (
                    <div key={slot} className="relative">
                      {clientAll ? (
                        <label className="relative block h-44 cursor-pointer overflow-hidden rounded-[16px] border border-dashed border-white/20 bg-black/30 transition hover:border-brand/50">
                          {url ? (
                            <Image
                              src={url}
                              alt={`${slot} photo`}
                              fill
                              unoptimized={!url.startsWith("https://")}
                              className="object-cover"
                              sizes="(min-width: 640px) 280px, 45vw"
                            />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-muted">
                              {uploading === slot ? (
                                <Loader2
                                  aria-hidden="true"
                                  size={20}
                                  className="animate-spin"
                                />
                              ) : (
                                <ImagePlus aria-hidden="true" size={20} />
                              )}
                            </span>
                          )}
                          <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-extrabold uppercase text-white backdrop-blur">
                            {slot}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => {
                              void upload(event.target.files, slot);
                              event.target.value = "";
                            }}
                          />
                        </label>
                      ) : (
                        <div className="relative block h-44 overflow-hidden rounded-[16px] border border-white/10 bg-black/30">
                          {url ? (
                            <Image
                              src={url}
                              alt={`${slot} photo`}
                              fill
                              unoptimized={!url.startsWith("https://")}
                              className="object-cover"
                              sizes="(min-width: 640px) 280px, 45vw"
                            />
                          ) : null}
                          <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-extrabold uppercase text-white backdrop-blur">
                            {slot}
                          </span>
                        </div>
                      )}
                      {clientAll && url ? (
                        <button
                          type="button"
                          aria-label={`Remove ${slot} photo`}
                          onClick={() => setUrl("")}
                          className="absolute -right-1.5 -top-1.5 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-black text-white transition hover:bg-brand"
                        >
                          <X aria-hidden="true" size={13} />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                {!clientAll && (request.resultLabel || request.durationLabel) ? (
                  <p className="mt-3 text-[13px] font-bold text-soft">
                    {request.resultLabel}
                    {request.resultLabel && request.durationLabel ? " · " : ""}
                    {request.durationLabel}
                  </p>
                ) : null}
              </div>

              {/* Rating + review */}
              <div className="rounded-[20px] border border-white/10 bg-panel p-5">
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  Rate your coach
                </p>
                <StarPicker rating={rating} onChange={setRating} />
                <p className="mb-3 mt-6 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                  Your words
                </p>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={4}
                  placeholder="What changed for you? How did your coach make the difference?"
                  className="w-full resize-none rounded-[14px] border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition placeholder:text-muted focus:border-brand"
                />
              </div>

              {error ? (
                <p className="text-[12px] font-bold text-brand-light">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                onClick={submit}
                disabled={busy || !canSubmit}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-brand text-sm font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
              >
                {busy ? (
                  <Loader2 aria-hidden="true" size={17} className="animate-spin" />
                ) : (
                  <BadgeCheck aria-hidden="true" size={17} />
                )}
                {clientAll
                  ? "Submit my transformation"
                  : "Confirm & submit review"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
