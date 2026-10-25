"use client";

import Image from "next/image";
import { forwardRef, startTransition, useCallback, useEffect, useRef, useState } from "react";

const ImageWithLoader = forwardRef(function ImageWithLoader(
  {
    className = "",
    containerClassName = "",
    alt,
    loading = "lazy",
    preload = false,
    priority = false,
    sizes,
    onLoad,
    onError,
    src,
    ...imageProps
  },
  forwardedRef
) {
  const internalRef = useRef(null);
  const isEager = Boolean(priority || preload || loading === "eager");
  const [loaded, setLoaded] = useState(isEager);

  const setRefs = useCallback(
    (element) => {
      internalRef.current = element;
      if (typeof forwardedRef === "function") {
        forwardedRef(element);
      } else if (forwardedRef) {
        forwardedRef.current = element;
      }
    },
    [forwardedRef]
  );

  const handleImgLoad = useCallback(
    (e) => {
      startTransition(() => {
        setLoaded(true);
      });
      onLoad?.(e);
    },
    [onLoad]
  );

  const handleImgError = useCallback(
    (e) => {
      startTransition(() => {
        setLoaded(true);
      });
      onError?.(e);
    },
    [onError]
  );

  // If the browser already cached the image, it's complete on mount
  useEffect(() => {
    const img = internalRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <span
      className={`relative block ${containerClassName}`}
    >
      <Image
        {...imageProps}
        ref={setRefs}
        src={src}
        alt={alt || "Image"}
        sizes={sizes}
        decoding="async"
        priority={priority}
        {...(preload ? { preload: true } : { loading: isEager ? "eager" : loading })}
        onLoad={handleImgLoad}
        onError={handleImgError}
        className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      {!loaded && (
        <span
          data-img-skeleton
          role="status"
          aria-label={alt ? `Loading ${alt}` : "Loading image"}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden bg-neutral-200/60"
        >
          <span className="image-loading-brand" aria-hidden="true">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              className="image-loading-jersey"
            >
              <path
                d="m15.5 8 8.5 4 8.5-4 10 6.5-4.5 8-4-2v19h-20v-19l-4 2-4.5-8L15.5 8Z"
                fill="currentColor"
                fillOpacity=".08"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="m19 9.5 5 5 5-5M24 15v14m-5 0h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m10.5 15 5 3m22-3-5 3"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                opacity=".55"
              />
            </svg>
            <span className="image-loading-wordmark">NIQUE SPORTS</span>
          </span>
        </span>
      )}
    </span>
  );
});

export default ImageWithLoader;
