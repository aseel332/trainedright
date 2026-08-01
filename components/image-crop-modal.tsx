"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { Loader2, X, ZoomIn } from "lucide-react";

export type CropShape = "circle" | "rect";

type Size = { w: number; h: number };
type Point = { x: number; y: number };

const FRAME_MAX_WIDTH = 420;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
/** Long edge of the exported crop — sharp anywhere it's shown, small enough to upload fast. */
const OUTPUT_LONG_EDGE = 1200;

function measureFrame(aspect: number): Size {
  const maxW = Math.min(FRAME_MAX_WIDTH, window.innerWidth - 64);
  const maxH = window.innerHeight * 0.5;
  const h = Math.min(maxW / aspect, maxH);
  return { w: h * aspect, h };
}

/**
 * Lets the trainer pan/zoom an image inside a fixed-aspect frame before it
 * uploads, instead of leaving the crop to whatever `object-cover` happens to
 * show. Exports a flattened JPEG of exactly what's inside the frame.
 */
export function ImageCropModal({
  file,
  aspect,
  shape = "rect",
  title = "Frame your photo",
  confirmLabel = "Use photo",
  onCancel,
  onConfirm,
}: {
  file: File;
  aspect: number;
  shape?: CropShape;
  title?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const imgUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [natural, setNatural] = useState<Size | null>(null);
  const [frame, setFrame] = useState<Size>(() => measureFrame(aspect));
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [pos, setPos] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const dragOrigin = useRef<{ start: Point; pos: Point } | null>(null);

  useEffect(() => {
    return () => URL.revokeObjectURL(imgUrl);
  }, [imgUrl]);

  useEffect(() => {
    function onResize() {
      setFrame(measureFrame(aspect));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [aspect]);

  const baseScale = natural
    ? Math.max(frame.w / natural.w, frame.h / natural.h)
    : 1;
  const scale = baseScale * zoom;
  const dispW = natural ? natural.w * scale : 0;
  const dispH = natural ? natural.h * scale : 0;

  const clamp = useCallback(
    (point: Point): Point => {
      const minX = Math.min(0, frame.w - dispW);
      const minY = Math.min(0, frame.h - dispH);
      return {
        x: Math.max(minX, Math.min(0, point.x)),
        y: Math.max(minY, Math.min(0, point.y)),
      };
    },
    [frame, dispW, dispH],
  );

  function handleImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    const img = event.currentTarget;
    const size = { w: img.naturalWidth, h: img.naturalHeight };
    const base = Math.max(frame.w / size.w, frame.h / size.h);
    setNatural(size);
    setZoom(MIN_ZOOM);
    setPos({
      x: (frame.w - size.w * base) / 2,
      y: (frame.h - size.h * base) / 2,
    });
  }

  function setZoomCentered(nextZoom: number) {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
    if (!natural) {
      setZoom(clamped);
      return;
    }
    const centerX = frame.w / 2;
    const centerY = frame.h / 2;
    const imgX = (centerX - pos.x) / scale;
    const imgY = (centerY - pos.y) / scale;
    const nextScale = baseScale * clamped;
    setZoom(clamped);
    setPos(
      clamp({
        x: centerX - imgX * nextScale,
        y: centerY - imgY * nextScale,
      }),
    );
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOrigin.current = { start: { x: event.clientX, y: event.clientY }, pos };
    setDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragOrigin.current) {
      return;
    }
    const dx = event.clientX - dragOrigin.current.start.x;
    const dy = event.clientY - dragOrigin.current.start.y;
    setPos(
      clamp({
        x: dragOrigin.current.pos.x + dx,
        y: dragOrigin.current.pos.y + dy,
      }),
    );
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    dragOrigin.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setZoomCentered(zoom - event.deltaY * 0.0015);
  }

  async function handleConfirm() {
    if (!natural || !imgUrl || busy) {
      return;
    }
    setBusy(true);
    try {
      const sx = -pos.x / scale;
      const sy = -pos.y / scale;
      const sw = frame.w / scale;
      const sh = frame.h / scale;

      const outW =
        aspect >= 1 ? OUTPUT_LONG_EDGE : Math.round(OUTPUT_LONG_EDGE * aspect);
      const outH =
        aspect >= 1 ? Math.round(OUTPUT_LONG_EDGE / aspect) : OUTPUT_LONG_EDGE;

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setBusy(false);
        return;
      }

      const source = new window.Image();
      source.src = imgUrl;
      if (!source.complete) {
        await new Promise<void>((resolve, reject) => {
          source.onload = () => resolve();
          source.onerror = () => reject(new Error("Image failed to load"));
        });
      }

      ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      if (!blob) {
        setBusy(false);
        return;
      }
      const base = file.name.replace(/\.[^.]+$/, "") || "photo";
      onConfirm(new File([blob], `${base}.jpeg`, { type: "image/jpeg" }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-end bg-black/75 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0d0d0f] p-5 shadow-2xl sm:max-w-[460px] sm:rounded-[28px] sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-[20px] font-black leading-none text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="grid h-9 w-9 flex-none place-items-center rounded-[12px] border border-white/10 bg-panel text-white"
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>

        <div
          className="relative mx-auto touch-none select-none overflow-hidden bg-black"
          style={{
            width: frame.w,
            height: frame.h,
            borderRadius: shape === "circle" ? 9999 : 16,
            cursor: dragging ? "grabbing" : "grab",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={handleWheel}
        >
          {imgUrl ? (
            // Interactive pan/zoom surface — next/image's fixed sizing model
            // doesn't fit a freely positioned, draggable crop preview.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgUrl}
              alt=""
              draggable={false}
              onLoad={handleImageLoad}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: dispW || undefined,
                height: dispH || undefined,
                maxWidth: "none",
              }}
            />
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomIn aria-hidden="true" size={15} className="flex-none text-muted" />
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoomCentered(Number(event.target.value))}
            className="h-1.5 w-full accent-brand"
            aria-label="Zoom"
          />
        </div>
        <p className="mt-2 text-[11px] font-medium text-muted">
          Drag to reposition, scroll or use the slider to zoom.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-[12px] border border-white/10 px-4 text-[13px] font-extrabold text-soft transition hover:border-white/25"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!natural || busy}
            className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-brand px-5 text-[13px] font-extrabold text-white transition enabled:hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted"
          >
            {busy ? (
              <Loader2 aria-hidden="true" size={15} className="animate-spin" />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
