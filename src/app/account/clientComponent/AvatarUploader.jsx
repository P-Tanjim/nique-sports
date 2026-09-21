"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import AvatarCropper from "./AvatarCropper";

const MAX_SOURCE_SIZE = 8 * 1024 * 1024; // 8MB, before cropping

function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function AvatarUploader({ initialImage, name }) {
  const inputRef = useRef(null);
  const [image, setImage] = useState(initialImage || null);
  const [pendingSrc, setPendingSrc] = useState(null); // raw file, waiting to be cropped
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handlePick(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be picked again later
    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SOURCE_SIZE) {
      setError("That image is too large — pick one under 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPendingSrc(reader.result);
    reader.readAsDataURL(file);
  }

  async function handleCropConfirm(dataUrl) {
    setPendingSrc(null);
    setSaving(true);
    setError("");

    const previous = image;
    setImage(dataUrl); // optimistic preview while it saves

    const { error: updateError } = await authClient.updateUser({ image: dataUrl });

    setSaving(false);
    if (updateError) {
      setImage(previous);
      setError("Couldn't save your photo — try again.");
    }
  }

  return (
    <div className="relative mx-auto w-fit">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={image ? "Change profile photo" : "Add profile photo"}
        className="group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-2xl font-semibold text-text-muted transition-colors hover:border-primary/40"
      >
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
            unoptimized={image.startsWith("data:")}
          />
        ) : (
          getInitials(name)
        )}

        <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-white opacity-0 transition-all duration-200 group-hover:bg-ink/40 group-hover:opacity-100">
          <Camera size={20} strokeWidth={1.8} />
        </span>

        {saving && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 size={20} className="animate-spin text-primary" />
          </span>
        )}
      </button>

      <input ref={inputRef} type="file" accept="image/*" onChange={handlePick} className="sr-only" />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 text-xs font-medium text-primary hover:underline"
      >
        {image ? "Change photo" : "Add photo"}
      </button>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {pendingSrc && (
        <AvatarCropper src={pendingSrc} onCancel={() => setPendingSrc(null)} onConfirm={handleCropConfirm} />
      )}
    </div>
  );
}