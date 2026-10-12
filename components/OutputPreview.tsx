'use client';

import { useEffect, useState } from 'react';
import type { OutputFile } from '@/tools/types';
import { CopyButton } from './CopyButton';

const PREVIEW_LIMIT = 200 * 1024;
const TEXT_TYPES = /^(text\/|application\/json)/;

/** Shows small text results (JSON, CSV, …) inline so they can be read and copied without downloading. */
export function OutputPreview({ output }: { output: OutputFile }) {
  const [text, setText] = useState<string | null>(null);
  const previewable = TEXT_TYPES.test(output.data.type) && output.data.size <= PREVIEW_LIMIT;

  useEffect(() => {
    if (!previewable) return;
    let cancelled = false;
    output.data.text().then((t) => !cancelled && setText(t));
    return () => {
      cancelled = true;
    };
  }, [output, previewable]);

  if (!previewable || text === null) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-muted">{output.name}</span>
        <CopyButton text={text} />
      </div>
      <pre className="max-h-80 overflow-auto rounded-xl border border-border bg-surface p-3 font-mono text-[12.5px] leading-relaxed">{text}</pre>
    </div>
  );
}
