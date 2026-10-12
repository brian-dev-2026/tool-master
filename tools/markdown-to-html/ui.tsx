'use client';

import { useMemo, useState } from 'react';
import { mdiDownload } from '@mdi/js';
import { CopyButton } from '@/components/CopyButton';
import { Icon } from '@/components/Icon';
import { downloadBlob } from '@/lib/download';
import { markdownToHtml } from '@/lib/data/formats';
import type { ToolMeta } from '../types';
import { htmlDocument } from './client';

const SAMPLE = `# Hello, Tool-Master

Write **Markdown** on the left and see the result on the right.

- Lists
- [Links](https://example.com)
- \`code\`

| Column | Value |
| ------ | ----- |
| A      | 1     |
`;

export default function MarkdownToHtmlUi({ meta }: { meta: ToolMeta }) {
  const [markdown, setMarkdown] = useState(SAMPLE);
  const html = useMemo(() => markdownToHtml(markdown), [markdown]);
  void meta;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          spellCheck={false}
          aria-label="Markdown"
          className="min-h-96 w-full rounded-xl border border-border bg-surface p-3 font-mono text-[13px] outline-none focus:border-accent"
        />
        <div
          aria-label="Preview"
          className="prose-tm min-h-96 overflow-auto rounded-xl border border-border bg-surface p-4 text-[14px]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <div className="flex justify-end gap-2">
        <CopyButton text={html} label="Copy HTML" />
        <button
          type="button"
          onClick={() => downloadBlob(new Blob([htmlDocument(html)], { type: 'text/html' }), 'document.html')}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-semibold hover:bg-icon-tile"
        >
          <Icon path={mdiDownload} size={15} />
          Download .html
        </button>
      </div>
    </div>
  );
}
