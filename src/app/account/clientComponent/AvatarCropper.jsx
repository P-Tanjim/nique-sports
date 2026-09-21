"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X, ZoomIn } from "lucide-react";

const FRAME = 260; // on-screen crop frame, px
const OUTPUT = 480; // exported image size, px

export default function AvatarCropper({ src, onCancel, onConfirm }) {
  const [mounted, setMounted] = useState(false);
  const [naturalSize, setNaturalSize] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  const baseScale = useMemo(
    () => (naturalSize ? Math.max(FRAME / naturalSize.w, FRAME / naturalSize.h) : 1),
    [naturalSize]
  );
  const scale = baseScale * zoom;
  const dispW = naturalSize ? naturalSize.w * scale : 0;
  const dispH = naturalSize ? naturalSize.h * scale : 0;

  function clamp(p, w, h) {
    const minX = Math.min(0, FRAME - w);
    const minY = Math.min(0, FRAME - h);
    return { x: Math.min(0, Math.max(minX, p.x)), y: Math.min(0, Math.max(minY, p.y)) };
  }

  function handleImageLoad(e) {
    const { naturalWidth: w, naturalHeight: h } = e.target;
    setNaturalSize({ w, h });
    const s = Math.max(FRAME / w, FRAME / h);
    setPos({ x: (FRAME - w * s) / 2, y: (FRAME - h * s) / 2 }); // center on load
  }

  function handleZoomChange(e) {
    const nextZoom = Number(e.target.value);
    setZoom(nextZoom);
    const s = baseScale * nextZoom;
    setPos((p) => clamp(p, naturalSize.w * s, naturalSize.h * s));
  }

  function handlePointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
  }

  function handlePointerMove(e) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(clamp({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy }, dispW, dispH));
  }

  function handleConfirm() {
    const outScale = OUTPUT / FRAME;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    canvas
      .getContext("2d")
      .drawImage(imgRef.current, pos.x * outScale, pos.y * outScale, dispW * outScale, dispH * outScale);
    onConfirm(canvas.toDataURL("image/jpeg", 0.85));
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Adjust your photo</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface hover:text-text"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="relative mx-auto touch-none select-none overflow-hidden rounded-2xl bg-ink"
          style={{ width: FRAME, height: FRAME }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => (dragRef.current = null)}
          onPointerCancel={() => (dragRef.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            onLoad={handleImageLoad}
            draggable={false}
            className="absolute cursor-grab active:cursor-grabbing"
            style={{ left: pos.x, top: pos.y, width: dispW || undefined, height: dispH || undefined }}
          />
          {/* circular crop guide + vignette — purely visual */}
          <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <ZoomIn size={16} className="shrink-0 text-text-muted" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={handleZoomChange}
            disabled={!naturalSize}
            className="w-full accent-primary"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-border py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!naturalSize}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            <Check size={16} />
            Use photo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}