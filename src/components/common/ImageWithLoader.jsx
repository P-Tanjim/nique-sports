"use client";

import Image from "next/image";
import { forwardRef, useState } from "react";

const ImageWithLoader = forwardRef(function ImageWithLoader(
  {
    className = "",
    containerClassName = "",
    alt,
    loading = "lazy",
    preload = false,
    sizes,
    onLoad,
    onError,
    ...imageProps
  },
  ref
) {
  const [loaded, setLoaded] = useState(false);

  function handleLoad(event) {
    setLoaded(true);
    onLoad?.(event);
  }

  function handleError(event) {
    setLoaded(true);
    onError?.(event);
  }

  return (
    <span className={`block overflow-hidden ${containerClassName}`}>
      <Image
        {...imageProps}
        ref={ref}
        alt={alt}
        sizes={sizes}
        {...(preload ? { preload: true } : { loading })}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {!loaded && (
        <span
          role="status"
          aria-label={alt ? `Loading ${alt}` : "Loading image"}
          className="image-loading-overlay pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
        >
          <span className="image-loading-shimmer" aria-hidden="true" />
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
            <span className="image-loading-progress">
              <span />
            </span>
          </span>
        </span>
      )}
    </span>
  );
});

export default ImageWithLoader;
