'use client';

import { CATEGORY_LABELS } from '@/lib/filter';
import type { Category } from '@/tools/types';

const ORDER: (Category | 'all')[] = ['all', 'documents', 'data', 'images', 'dev'];

export function CategoryTabs({ value, onChange }: { value: Category | 'all'; onChange: (c: Category | 'all') => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2" role="tablist">
      {ORDER.map((c) => {
        const active = c === value;
        return (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(c)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] ${
              active ? 'border-text bg-text text-bg' : 'border-border bg-surface text-muted hover:text-text'
            }`}
          >
            {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
          </button>
        );
      })}
    </div>
  );
}
