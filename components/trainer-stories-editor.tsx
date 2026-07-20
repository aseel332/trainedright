"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Newspaper,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { uploadPublicFile } from "@/lib/client/upload";
import {
  isOptimizableImageUrl,
  isValidVideoLink,
  parseVideoLink,
} from "@/lib/media-links";
import {
  emptyStory,
  emptyStorySection,
  type ProfileStory,
  type ProfileStorySection,
  type StoryMedia,
  type TrainerProfileDraft,
} from "@/lib/trainer-profile";

export function StoriesEditor({
  profile,
  userId,
  update,
}: {
  profile: TrainerProfileDraft;
  userId: string;
  update: (patch: Partial<TrainerProfileDraft>) => void;
}) {
  const stories = profile.stories;
  const [editingId, setEditingId] = useState<string | null>(null);

  function setStories(next: ProfileStory[]) {
    update({ stories: next });
  }

  function patchStory(id: string, patch: Partial<ProfileStory>) {
    setStories(
      stories.map((story) =>
        story.id === id ? { ...story, ...patch } : story,
      ),
    );
  }

  function addStory() {
    const story = emptyStory();
    setStories([...stories, story]);
    setEditingId(story.id);
  }

  function deleteStory(id: string) {
    setStories(stories.filter((story) => story.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-muted">
          {stories.length > 0
            ? `${stories.length} ${stories.length === 1 ? "story" : "stories"} — they appear on your public profile and open as full articles.`
            : "Write a story — a title, a lead, a cover, and as many photo/video sections as you like."}
        </p>
        <button
          type="button"
          onClick={addStory}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-[13px] font-extrabold text-white transition hover:bg-brand-dark"
        >
          <Plus aria-hidden="true" size={15} />
          New story
        </button>
      </div>

      {stories.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-white/15 bg-black/20 p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-brand/15 text-brand-light">
            <Newspaper aria-hidden="true" size={24} />
          </span>
          <h2 className="mt-5 font-display text-[24px] font-black text-white">
            No stories yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px] font-semibold leading-6 text-muted">
            Share a client&apos;s journey, your coaching philosophy, or a
            behind-the-scenes look. Mix text with photos and videos.
          </p>
          <button
            type="button"
            onClick={addStory}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-[13px] font-extrabold text-white transition hover:bg-brand-dark"
          >
            <Plus aria-hidden="true" size={15} />
            Write your first story
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) =>
            editingId === story.id ? (
              <StoryEditorCard
                key={story.id}
                story={story}
                userId={userId}
                onPatch={(patch) => patchStory(story.id, patch)}
                onDone={() => setEditingId(null)}
                onDelete={() => deleteStory(story.id)}
              />
            ) : (
              <StorySummaryRow
                key={story.id}
                story={story}
                onEdit={() => setEditingId(story.id)}
                onDelete={() => deleteStory(story.id)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function coverThumb(story: ProfileStory): { url: string; isVideo: boolean } | null {
  const { cover } = story;
  if (!cover.url) {
    return null;
  }
  if (cover.kind === "video") {
    const parsed = parseVideoLink(cover.url);
    return parsed?.thumbnailUrl
      ? { url: parsed.thumbnailUrl, isVideo: true }
      : null;
  }
  return { url: cover.url, isVideo: false };
}

function StorySummaryRow({
  story,
  onEdit,
  onDelete,
}: {
  story: ProfileStory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const thumb = coverThumb(story);
  const sectionCount = story.sections.length;

  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-panel p-3">
      <span className="relative grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-[13px] bg-black">
        {thumb ? (
          <Image
            src={thumb.url}
            alt=""
            fill
            unoptimized={!isOptimizableImageUrl(thumb.url)}
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <Newspaper aria-hidden="true" size={20} className="text-muted" />
        )}
        {thumb?.isVideo ? (
          <span className="absolute inset-0 grid place-items-center bg-black/30 text-white">
            <Play aria-hidden="true" size={15} fill="currentColor" />
          </span>
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[14px] font-extrabold text-white">
            {story.title.trim() || "Untitled story"}
          </span>
          {story.title.trim() ? null : (
            <span className="flex-none rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-amber-200">
              Draft
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[12px] font-medium text-muted">
          {story.intro.trim() ||
            `${sectionCount} ${sectionCount === 1 ? "section" : "sections"}`}
        </span>
      </span>

      <div className="flex flex-none items-center gap-1.5">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3.5 py-2 text-[12px] font-extrabold text-white transition hover:border-brand/50"
        >
          <Pencil aria-hidden="true" size={13} />
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${story.title.trim() || "story"}`}
          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/20 text-muted transition hover:border-brand/50 hover:text-brand-light"
        >
          <Trash2 aria-hidden="true" size={14} />
        </button>
      </div>
    </div>
  );
}

function StoryEditorCard({
  story,
  userId,
  onPatch,
  onDone,
  onDelete,
}: {
  story: ProfileStory;
  userId: string;
  onPatch: (patch: Partial<ProfileStory>) => void;
  onDone: () => void;
  onDelete: () => void;
}) {
  function patchSection(
    sectionId: string,
    patch: Partial<ProfileStorySection>,
  ) {
    onPatch({
      sections: story.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    });
  }

  function addSection() {
    onPatch({ sections: [...story.sections, emptyStorySection()] });
  }

  function removeSection(sectionId: string) {
    onPatch({
      sections: story.sections.filter((section) => section.id !== sectionId),
    });
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    const index = story.sections.findIndex(
      (section) => section.id === sectionId,
    );
    const target = index + direction;
    if (index < 0 || target < 0 || target >= story.sections.length) {
      return;
    }
    const next = [...story.sections];
    [next[index], next[target]] = [next[target], next[index]];
    onPatch({ sections: next });
  }

  return (
    <div className="rounded-[20px] border border-brand/30 bg-black/20 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-light">
          Editing story
        </span>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-panel px-4 py-1.5 text-[12px] font-extrabold text-white transition hover:border-brand/50"
        >
          Done
        </button>
      </div>

      <div className="space-y-5">
        <Field label="Title" hint="The headline clients see first.">
          <input
            value={story.title}
            onChange={(event) => onPatch({ title: event.target.value })}
            placeholder="How Riya lost 18kg in 6 months"
            maxLength={120}
            className="h-[52px] w-full rounded-[14px] border border-white/10 bg-panel px-4 text-[15px] font-bold text-white outline-none transition placeholder:text-muted focus:border-brand"
          />
        </Field>

        <Field
          label="Intro"
          hint="A short lead paragraph shown under the title."
        >
          <textarea
            value={story.intro}
            onChange={(event) => onPatch({ intro: event.target.value })}
            placeholder="A quick summary that makes people want to read on…"
            rows={3}
            maxLength={600}
            className="w-full resize-y rounded-[14px] border border-white/10 bg-panel px-4 py-3 text-[14px] font-medium leading-6 text-white outline-none transition placeholder:text-muted focus:border-brand"
          />
        </Field>

        <Field label="Cover" hint="The main image or video for the story.">
          <StoryMediaField
            media={story.cover}
            userId={userId}
            onChange={(cover) => onPatch({ cover })}
          />
        </Field>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
              Sections
            </span>
            <button
              type="button"
              onClick={addSection}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-panel px-3.5 py-2 text-[12px] font-extrabold text-white transition hover:border-brand/50"
            >
              <Plus aria-hidden="true" size={14} />
              Add section
            </button>
          </div>

          {story.sections.length === 0 ? (
            <p className="rounded-[14px] border border-dashed border-white/15 bg-panel/40 px-4 py-6 text-center text-[12px] font-semibold text-muted">
              Add sections to build the article — each pairs a block of text with
              an optional photo or video.
            </p>
          ) : (
            <div className="space-y-3">
              {story.sections.map((section, index) => (
                <div
                  key={section.id}
                  className="rounded-[16px] border border-white/10 bg-panel p-3.5"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
                      Section {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(section.id, -1)}
                        disabled={index === 0}
                        aria-label="Move section up"
                        className="grid h-8 w-8 place-items-center rounded-full text-muted transition enabled:hover:bg-white/5 enabled:hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp aria-hidden="true" size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(section.id, 1)}
                        disabled={index === story.sections.length - 1}
                        aria-label="Move section down"
                        className="grid h-8 w-8 place-items-center rounded-full text-muted transition enabled:hover:bg-white/5 enabled:hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown aria-hidden="true" size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        aria-label="Remove section"
                        className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-brand hover:text-white"
                      >
                        <X aria-hidden="true" size={15} />
                      </button>
                    </div>
                  </div>

                  <StoryMediaField
                    media={section.media}
                    userId={userId}
                    onChange={(media) => patchSection(section.id, { media })}
                  />

                  <textarea
                    value={section.text}
                    onChange={(event) =>
                      patchSection(section.id, { text: event.target.value })
                    }
                    placeholder="Write this part of the story… Leave a blank line between paragraphs."
                    rows={4}
                    className="mt-3 w-full resize-y rounded-[12px] border border-white/10 bg-black/25 px-3.5 py-3 text-[14px] font-medium leading-7 text-white outline-none transition placeholder:text-muted focus:border-brand"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-panel px-4 py-2 text-[12px] font-extrabold text-brand-light transition hover:border-brand/50"
          >
            <Trash2 aria-hidden="true" size={14} />
            Delete story
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-full bg-brand px-5 py-2 text-[13px] font-extrabold text-white transition hover:bg-brand-dark"
          >
            Done editing
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
          {label}
        </span>
        {hint ? (
          <span className="ml-2 text-[11px] font-medium text-muted/70">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/**
 * A single image/video slot. Images are uploaded to storage; videos are pasted
 * as Google Drive / YouTube / direct-file links. Picking one replaces the
 * other — the old upload is cleaned up server-side on the next save.
 */
function StoryMediaField({
  media,
  userId,
  onChange,
}: {
  media: StoryMedia;
  userId: string;
  onChange: (media: StoryMedia) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [videoInput, setVideoInput] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);

  const parsedVideo =
    media.kind === "video" && media.url ? parseVideoLink(media.url) : null;
  const hasMedia = media.url.trim().length > 0;

  async function uploadImage(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }
    setUploading(true);
    const result = await uploadPublicFile(file, userId);
    setUploading(false);
    // Only keep a URL that actually persisted; a failed upload returns a
    // tab-local blob: preview that must not be saved.
    if (result.persisted) {
      onChange({ kind: "image", url: result.url });
    }
  }

  function addVideo() {
    const url = videoInput.trim();
    if (!url) {
      return;
    }
    if (!isValidVideoLink(url)) {
      setVideoError("Paste a Google Drive, YouTube, or direct video link.");
      return;
    }
    onChange({ kind: "video", url });
    setVideoInput("");
    setVideoError(null);
  }

  function clear() {
    onChange({ kind: "image", url: "" });
    setVideoInput("");
    setVideoError(null);
  }

  return (
    <div className="rounded-[14px] border border-white/10 bg-black/25 p-3">
      {hasMedia ? (
        <div className="relative mb-3 h-44 overflow-hidden rounded-[12px] border border-white/10 bg-black">
          {media.kind === "image" ? (
            <Image
              src={media.url}
              alt=""
              fill
              unoptimized={!isOptimizableImageUrl(media.url)}
              className="object-cover"
              sizes="(min-width: 640px) 520px, 90vw"
            />
          ) : parsedVideo?.thumbnailUrl ? (
            <>
              <Image
                src={parsedVideo.thumbnailUrl}
                alt=""
                fill
                unoptimized
                className="object-cover opacity-80"
                sizes="(min-width: 640px) 520px, 90vw"
              />
              <span className="absolute inset-0 grid place-items-center text-white">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-black/55 backdrop-blur">
                  <Play aria-hidden="true" size={20} fill="currentColor" />
                </span>
              </span>
            </>
          ) : (
            <span className="grid h-full w-full place-items-center gap-2 text-center text-muted">
              <Play aria-hidden="true" size={22} />
            </span>
          )}
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white backdrop-blur">
            {media.kind === "video" ? "Video" : "Image"}
          </span>
          <button
            type="button"
            onClick={clear}
            aria-label="Remove media"
            className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-brand"
          >
            <X aria-hidden="true" size={15} />
          </button>
        </div>
      ) : (
        <div className="mb-3 grid h-28 place-items-center rounded-[12px] border border-dashed border-white/15 bg-panel/40 text-center">
          <span className="text-[12px] font-semibold text-muted">
            Add an image or a video link
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-panel px-3.5 py-2 text-[12px] font-extrabold text-white transition hover:border-brand/50">
          <ImagePlus aria-hidden="true" size={14} />
          {media.kind === "image" && hasMedia ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              void uploadImage(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        {uploading ? (
          <span className="inline-flex items-center gap-2 text-[12px] font-bold text-soft">
            <Loader2 aria-hidden="true" size={14} className="animate-spin" />
            Uploading…
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          value={videoInput}
          onChange={(event) => {
            setVideoInput(event.target.value);
            setVideoError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addVideo();
            }
          }}
          placeholder="or paste a video link (Drive / YouTube)"
          className="h-11 w-full rounded-[12px] border border-white/10 bg-panel px-3.5 text-[13px] font-semibold text-white outline-none transition placeholder:text-muted focus:border-brand"
        />
        <button
          type="button"
          onClick={addVideo}
          disabled={!videoInput.trim()}
          aria-label="Add video link"
          className="grid h-11 w-11 flex-none place-items-center rounded-[12px] bg-brand text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
        >
          <Plus aria-hidden="true" size={18} />
        </button>
      </div>
      {videoError ? (
        <p className="mt-2 text-[12px] font-semibold text-brand-light">
          {videoError}
        </p>
      ) : null}
    </div>
  );
}
