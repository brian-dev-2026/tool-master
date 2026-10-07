'use client';

import { useEffect, useRef } from 'react';
import { mdiMagnify } from '@mdi/js';
import { Icon } from './Icon';

export function SearchBox({ value, onChange, count }: { value: string; onChange: (v: string) => void; count: number }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        ref.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <label className="mx-auto flex w-full max-w-md items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-sm focus-within:border-accent">
      <span className="text-muted">
        <Icon path={mdiMagnify} size={18} />
      </span>
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Search ${count} tools…`}
        aria-label="Search tools"
        className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted"
      />
      <kbd className="hidden rounded border border-border px-1.5 text-[11px] text-muted sm:block">Ctrl K</kbd>
    </label>
  );
}
