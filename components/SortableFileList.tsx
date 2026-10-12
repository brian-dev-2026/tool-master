'use client';

import { useState } from 'react';
import { mdiClose, mdiDragVertical } from '@mdi/js';
import { formatBytes } from '@/lib/download';
import { moveItem } from '@/lib/reorder';
import { Icon } from './Icon';

/** Drag-to-reorder list of files waiting to be processed together. */
export function SortableFileList({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const [dragging, setDragging] = useState<number | null>(null);
  if (!files.length) return null;

  return (
    <ol className="overflow-hidden rounded-xl border border-border bg-surface">
      {files.map((file, index) => (
        <li
          key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
          draggable
          onDragStart={() => setDragging(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragging !== null) onChange(moveItem(files, dragging, index));
            setDragging(null);
          }}
          onDragEnd={() => setDragging(null)}
          className={`flex cursor-grab items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0 ${dragging === index ? 'opacity-50' : ''}`}
        >
          <span className="text-muted">
            <Icon path={mdiDragVertical} size={18} />
          </span>
          <span className="w-5 text-right text-[12px] tabular-nums text-muted">{index + 1}</span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{file.name}</span>
          <span className="text-[12px] text-muted">{formatBytes(file.size)}</span>
          <button
            type="button"
            aria-label={`Remove ${file.name}`}
            onClick={() => onChange(files.filter((_, i) => i !== index))}
            className="rounded p-1 text-muted hover:bg-icon-tile hover:text-text"
          >
            <Icon path={mdiClose} size={16} />
          </button>
        </li>
      ))}
    </ol>
  );
}
