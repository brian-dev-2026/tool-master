'use client';

import { useEffect, useState } from 'react';
import { openPdf, renderPage } from '@/lib/pdf/pdfjs';

export interface Thumb {
  /** Original 0-based page index. */
  index: number;
  url: string;
}

/** Renders small previews of every page of a PDF. */
export function usePdfThumbnails(file: File | null): { thumbs: Thumb[]; error: string | null; loading: boolean } {
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    const urls: string[] = [];
    setThumbs([]);
    setError(null);
    setLoading(true);
    (async () => {
      try {
        const pdf = await openPdf(file);
        for (let i = 0; i < pdf.numPages && !cancelled; i++) {
          const url = URL.createObjectURL(await renderPage(pdf, i, 0.35));
          urls.push(url);
          if (!cancelled) setThumbs((prev) => [...prev, { index: i, url }]);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [file]);

  return { thumbs, error, loading };
}

export function ThumbCard({
  thumb,
  label,
  rotation = 0,
  selected,
  onClick,
  children,
}: {
  thumb: Thumb;
  label: string;
  rotation?: number;
  selected?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-1.5 rounded-xl border bg-surface p-2 ${
        selected ? 'border-accent shadow-[0_0_0_3px_rgba(99,102,241,.15)]' : 'border-border'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex h-36 w-full items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb.url} alt={label} className="max-h-full max-w-full shadow-sm transition-transform" style={{ transform: `rotate(${rotation}deg)` }} />
      </div>
      <span className="text-[12px] text-muted">{label}</span>
      {children}
    </div>
  );
}
