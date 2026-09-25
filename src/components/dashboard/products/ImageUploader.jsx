'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteFromCloudinary, uploadToCloudinary } from '@/lib/api/requests/requests';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '@/lib/format';

const PRICED_IMAGE_MODAL_KEYFRAMES = `
  @keyframes priced-image-modal-backdrop {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes priced-image-modal-jelly {
    0% { opacity: 0; transform: translateY(12px) scale(0.72); }
    58% { opacity: 1; transform: translateY(-3px) scale(1.045); }
    80% { transform: translateY(1px) scale(0.985); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .priced-image-modal-backdrop,
    .priced-image-modal-dialog { animation: none !important; }
  }
`;

export default function ImageUploader({ label, value = [], onChange, onUploadingChange, max = 10, withPrice = false }) {
  const inputRef = useRef(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [price, setPrice] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [pendingUploadedUrl, setPendingUploadedUrl] = useState('');
  const [isPricedUploading, setIsPricedUploading] = useState(false);
  const uploadSessionRef = useRef(null);
  const pendingUploadRef = useRef(null);
  const dialogTitleId = `${label.toLowerCase().replace(/\s+/g, '-')}-modal-title`;

  // iOS-style cubic bezier easing
  const iosEase = [0.32, 0.72, 0, 1];

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => () => {
    if (uploadSessionRef.current) uploadSessionRef.current.cancelled = true;
    if (pendingUploadRef.current) void deleteFromCloudinary(pendingUploadRef.current);
  }, []);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen]);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    if (withPrice) {
      const file = files[0];
      const previousUpload = pendingUploadRef.current;
      pendingUploadRef.current = null;
      if (previousUpload) {
        deleteFromCloudinary(previousUpload).then((result) => {
          if (!result.success) toast.error('Could not remove the replaced image from Cloudinary.');
        });
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPendingUploadedUrl('');

      const uploadSession = { cancelled: false };
      uploadSessionRef.current = uploadSession;
      setIsPricedUploading(true);
      setUploadingCount((count) => count + 1);
      onUploadingChange?.(true);

      try {
        const data = new FormData();
        data.append('image', file);
        const result = await uploadToCloudinary(data);
        if (!result.success) {
          toast.error(result.error || 'Image upload failed.');
          return;
        }

        if (uploadSession.cancelled) {
          await deleteFromCloudinary(result.url);
          return;
        }

        pendingUploadRef.current = result.url;
        setPendingUploadedUrl(result.url);
      } catch (error) {
        toast.error('Image upload failed.');
        console.error('Image upload error:', error);
      } finally {
        if (uploadSessionRef.current === uploadSession) {
          uploadSessionRef.current = null;
          setIsPricedUploading(false);
          setUploadingCount((count) => count - 1);
          onUploadingChange?.(false);
        }
      }
      return;
    }

    const room = max - value.length;
    const toUpload = files.slice(0, Math.max(0, room));
    if (!toUpload.length) {
      toast.error(`You can add up to ${max} images here.`);
      return;
    }

    setUploadingCount((c) => c + toUpload.length);
    onUploadingChange?.(true);
    const uploaded = [];

    try {
      for (const file of toUpload) {
        const data = new FormData();
        data.append('image', file);
        const result = await uploadToCloudinary(data);
        if (result.success) {
          uploaded.push(result.url);
        } else {
          toast.error(result.error || 'One image failed to upload.');
        }
      }
    } catch (error) {
      toast.error('One image failed to upload.');
      console.error('Image upload error:', error);
    } finally {
      setUploadingCount((c) => c - toUpload.length);
      onUploadingChange?.(false);
    }

    if (uploaded.length) onChange([...value, ...uploaded]);
  }

  function clearPricedImage() {
    setModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setPrice('');
    setPendingUploadedUrl('');

    if (uploadSessionRef.current) {
      uploadSessionRef.current.cancelled = true;
    }

    const uploadedUrl = pendingUploadRef.current;
    pendingUploadRef.current = null;
    if (uploadedUrl) {
      deleteFromCloudinary(uploadedUrl).then((result) => {
        if (!result.success) toast.error('Could not remove the unused image from Cloudinary.');
      });
    }
  }

  function addPricedImage() {
    if (!selectedFile || !pendingUploadedUrl) {
      toast.error('Choose an image first.');
      return;
    }
    const numericPrice = Number(price);
    if (price.trim() === '' || !Number.isFinite(numericPrice) || numericPrice < 0) {
      toast.error('Enter a valid price.');
      return;
    }

    onChange([...value, { image: pendingUploadedUrl, price: numericPrice }]);
    pendingUploadRef.current = null;
    setPendingUploadedUrl('');
    setModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setPrice('');
  }

  async function removeAt(index) {
    const entry = value[index];
    const urlToDelete = withPrice ? entry?.image : entry;
    const previousValue = [...value];

    // 1. Remove it from the UI instantly for a snappy experience
    onChange(value.filter((_, i) => i !== index));

    // 2. Delete it from Cloudinary in the background
    if (urlToDelete) {
      const result = await deleteFromCloudinary(urlToDelete);

      if(result.success) toast.success(result.message)
      
      if (!result.success) {
        // Optional: Notify the user if the server delete failed
        onChange(previousValue);
        toast.error("Image removed from form, but failed to delete from server.");
      }
    }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <AnimatePresence mode="popLayout">
          {value.map((entry, i) => {
            const url = withPrice ? entry?.image : entry;
            return (
            <motion.div
              layout // Smoothly glides remaining images when one is deleted
              initial={{ opacity: 0, x: -30 }} // Starts transparent and shifted left
              animate={{ opacity: 1, x: 0 }}   // Slides into resting position
              exit={{ opacity: 0, scale: 0.8 }} // Shrinks out when deleted
              transition={{ duration: 0.35, ease: iosEase }}
              key={url + i}
              className={`group relative shrink-0 ${withPrice ? 'w-20' : 'h-20 w-20'} `}
            >
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-border bg-surface">
                <Image src={url} alt={`${label} ${i + 1}`} fill sizes="80px" unoptimized className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label="Remove image"
                  className="cursor-pointer absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                >
                  <X size={11} />
                </button>
              </div>
              {withPrice && (
                <p className="mt-1 text-center text-xs font-semibold text-text">
                  {formatPrice(Number(entry?.price) || 0)}৳
                </p>
              )}
            </motion.div>
            );
          })}
        </AnimatePresence>

        {value.length < max && (
          <motion.button
            layout // Keeps the add button moving smoothly alongside images
            type="button"
            onClick={() => (withPrice ? setModalOpen(true) : inputRef.current?.click())}
            disabled={uploadingCount > 0}
            className="flex h-20 w-20 cursor-pointer shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border bg-white/60 text-text-muted backdrop-blur-md transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {uploadingCount > 0 ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            <span className="text-[10px] font-medium">
              {uploadingCount > 0 ? 'Uploading' : 'Add'}
            </span>
          </motion.button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={!withPrice}
        onChange={handleFiles}
        className="sr-only cursor-pointer"
      />

      {withPrice && modalOpen && createPortal(
            <div
              className="priced-image-modal-backdrop fixed inset-0 z-10000 flex items-center justify-center bg-black/20 backdrop-blur-sm p-3"
              style={{ animation: 'priced-image-modal-backdrop 180ms ease-out both' }}
            >
              <style>{PRICED_IMAGE_MODAL_KEYFRAMES}</style>
              <div
                className="fixed inset-0"
                aria-hidden="true"
                onMouseDown={clearPricedImage}
              />
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                className="priced-image-modal-dialog relative z-10 w-full max-w-xs overflow-hidden rounded-3xl border border-border bg-white"
                style={{ animation: 'priced-image-modal-jelly 560ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
              >
                <div className="flex items-center justify-between px-3 pt-3">
                  <h3 id={dialogTitleId} className="text-sm font-semibold text-text">
                    Add {label.toLowerCase()}
                  </h3>
                  <button
                    type="button"
                    onClick={clearPricedImage}
                    aria-label="Close dialog"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-3 p-3">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={isPricedUploading}
                    aria-label={selectedFile ? 'Choose a different image' : 'Choose an image'}
                    className="group relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-transparent text-text-muted transition-colors hover:border-primary disabled:cursor-wait disabled:opacity-70"
                  >
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt={selectedFile?.name || `${label} preview`}
                        fill
                        unoptimized
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center">
                        <Plus size={20} strokeWidth={1.6} />
                      </span>
                    )}
                    {isPricedUploading && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <Loader2 size={18} className="animate-spin text-primary" />
                      </span>
                    )}
                    {!isPricedUploading && (
                      <span className="absolute inset-x-0 bottom-0 bg-primary/55 py-0.5 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {selectedFile ? 'Change' : 'Choose'}
                      </span>
                    )}
                  </button>

                  <label className="min-w-0 flex-1 text-xs font-semibold text-text-muted">
                    Price (৳)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      placeholder="0"
                      className="mt-1.5 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm font-medium text-text outline-none transition-colors focus:border-primary"
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-2 px-3 pb-3">
                  <button
                    type="button"
                    onClick={clearPricedImage}
                    className="cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-surface hover:text-text"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addPricedImage}
                    disabled={
                      !selectedFile ||
                      !pendingUploadedUrl ||
                      isPricedUploading ||
                      price.trim() === '' ||
                      !Number.isFinite(Number(price)) ||
                      Number(price) < 0
                    }
                    className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPricedUploading && <Loader2 size={14} className="animate-spin" />}
                    Add
                  </button>
                </div>
              </section>
            </div>,
        document.body
      )}
    </div>
  );
}