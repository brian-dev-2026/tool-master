'use client';

import type { Choice } from '@/tools/types';

export function SegmentedControl({ value, choices, onChange, label }: { value: string; choices: Choice[]; onChange: (v: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[10px] bg-icon-tile p-1">
      {choices.map((c) => {
        const active = c.value === value;
        return (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(c.value)}
            className={`rounded-lg px-3 py-1.5 text-[13px] ${active ? 'bg-surface font-semibold text-text shadow-sm' : 'text-muted hover:text-text'}`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
