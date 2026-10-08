'use client';

import { useState } from 'react';
import { filterTools } from '@/lib/filter';
import { tools } from '@/tools/registry';
import type { Category } from '@/tools/types';
import { CategoryTabs } from './CategoryTabs';
import { SearchBox } from './SearchBox';
import { ToolCard } from './ToolCard';

export function HomeGrid() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const shown = filterTools(tools, query, category);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <section className="py-12 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Every tool you need. One place.</h1>
        <p className="mb-6 text-muted">Convert, edit and create — free, private, fast.</p>
        <SearchBox value={query} onChange={setQuery} count={tools.length} />
      </section>
      <div className="mb-6">
        <CategoryTabs value={category} onChange={setCategory} />
      </div>
      {shown.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-muted">No tools match “{query}”</p>
      )}
    </div>
  );
}
