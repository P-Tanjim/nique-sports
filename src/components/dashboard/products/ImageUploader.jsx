'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { deleteFromCloudinary, uploadToCloudinary } from '@/lib/api/requests/requests';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageUploader({ label, value = [], onChange, onUploadingChange, max = 10 }) {
  const inputRef = useRef(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  // iOS-style cubic bezier easing
  const iosEase = [0.32, 0.72, 0, 1];

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; 
    if (!files.length) return;

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

  async function removeAt(index) {
    const urlToDelete = value[index];
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
          {value.map((url, i) => (
            <motion.div
              layout // Smoothly glides remaining images when one is deleted
              initial={{ opacity: 0, x: -30 }} // Starts transparent and shifted left
              animate={{ opacity: 1, x: 0 }}   // Slides into resting position
              exit={{ opacity: 0, scale: 0.8 }} // Shrinks out when deleted
              transition={{ duration: 0.35, ease: iosEase }}
              key={url + i}
              className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <Image src={url} alt={`${label} ${i + 1}`} fill sizes="80px" unoptimized className="object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove image"
                className="cursor-pointer absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
              >
                <X size={11} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {value.length < max && (
          <motion.button
            layout // Keeps the add button moving smoothly alongside images
            type="button"
            onClick={() => inputRef.current?.click()}
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
        multiple
        onChange={handleFiles}
        className="sr-only cursor-pointer"
      />
    </div>
  );
}