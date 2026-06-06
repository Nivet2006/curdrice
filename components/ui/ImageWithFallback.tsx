'use client';

import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackText = 'No image uploaded',
}: ImageWithFallbackProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-zinc-900 text-zinc-400 text-sm ${className}`}>
        {fallbackText}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-red-400 text-sm gap-2 p-4 text-center">
          <span>⚠ Failed to load image</span>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 underline"
          >
            Open direct URL
          </a>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    </div>
  );
}
