'use client';

import { useEffect, useState } from 'react';
import { mdiContentSave, mdiDeleteOutline, mdiRotateLeft, mdiRotateRight } from '@mdi/js';
import { downloadBlob } from '@/lib/download';
import { baseName, pdfBlob } from '@/lib/pdf/load';
import { moveItem } from '@/lib/reorder';
import { validateFiles } from '@/lib/validate';
import { reorderPages } from '@/tools/organize-pdf/client';
import type { ToolMeta } from '@/tools/types';
import { Dropzone } from './Dropzone';
import { Icon } from './Icon';
import { ThumbCard, usePdfThumbnails } from './PdfThumbnails';

interface PageState {
  index: number;
  rotation: number;
}

const button = 'inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] font-semibold hover:bg-icon-tile';

/** Page grid for Rotate PDF and Organize Pages. Reorder/delete only when `organize` is set. */
export function PdfPagesEditor({ meta, organize }: { meta: ToolMeta; organize: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [rejected, setRejected] = useState<string | null>(null);
  const [pages, setPages] = useState<PageState[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { thumbs, error, loading } = usePdfThumbnails(file);

  useEffect(() => {
    setPages(thumbs.map((t) => ({ index: t.index, rotation: 0 })));
  }, [thumbs]);

  const rotate = (i: number | 'all', by: number) =>
    setPages((prev) => prev.map((p, j) => (i === 'all' || i === j ? { ...p, rotation: (p.rotation + by + 360) % 360 } : p)));

  async function save() {
    if (!file) return;
    setSaving(true);
    setSaveError(null);
    try {
      const bytes = await reorderPages(file, pages.map((p) => p.index), pages.map((p) => p.rotation));
      downloadBlob(pdfBlob(bytes), `${baseName(file.name)}-${organize ? 'organized' : 'rotated'}.pdf`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!file) {
    return (
      <div className="flex flex-col gap-3">
        <Dropzone
          accept={meta.accept ?? []}
          onFiles={(files) => {
            const { ok, rejected: bad } = validateFiles(files, meta);
            setRejected(bad[0]?.reason ?? null);
            if (ok[0]) setFile(ok[0]);
          }}
        />
        {rejected && <p className="text-[13px] text-error">{rejected}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto truncate text-[13px] font-semibold">{file.name}</span>
        <button type="button" className={button} onClick={() => rotate('all', -90)}>
          <Icon path={mdiRotateLeft} size={16} /> All left
        </button>
        <button type="button" className={button} onClick={() => rotate('all', 90)}>
          <Icon path={mdiRotateRight} size={16} /> All right
        </button>
        <button type="button" className={button} onClick={() => setFile(null)}>
          New file
        </button>
      </div>

      {error && <p className="rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-[13px] text-error">{error}</p>}
      {loading && !thumbs.length && <p className="text-[13px] text-muted">Rendering pages…</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {pages.map((p, i) => {
          const thumb = thumbs.find((t) => t.index === p.index);
          if (!thumb) return null;
          return (
            <div
              key={p.index}
              draggable={organize}
              onDragStart={() => setDragging(i)}
              onDragOver={(e) => organize && e.preventDefault()}
              onDrop={() => {
                if (dragging !== null) setPages((prev) => moveItem(prev, dragging, i));
                setDragging(null);
              }}
              className={dragging === i ? 'opacity-50' : ''}
            >
              <ThumbCard thumb={thumb} label={`Page ${p.index + 1}`} rotation={p.rotation}>
                <div className="flex gap-1">
                  <button type="button" aria-label="Rotate page left" className="rounded p-1 text-muted hover:bg-icon-tile hover:text-text" onClick={() => rotate(i, -90)}>
                    <Icon path={mdiRotateLeft} size={16} />
                  </button>
                  <button type="button" aria-label="Rotate page right" className="rounded p-1 text-muted hover:bg-icon-tile hover:text-text" onClick={() => rotate(i, 90)}>
                    <Icon path={mdiRotateRight} size={16} />
                  </button>
                  {organize && (
                    <button
                      type="button"
                      aria-label="Delete page"
                      className="rounded p-1 text-muted hover:bg-icon-tile hover:text-error"
                      onClick={() => setPages((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <Icon path={mdiDeleteOutline} size={16} />
                    </button>
                  )}
                </div>
              </ThumbCard>
            </div>
          );
        })}
      </div>

      {saveError && <p className="text-[13px] text-error">{saveError}</p>}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving || !pages.length}
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-text px-4 py-2 text-[13px] font-semibold text-bg disabled:opacity-50"
        >
          <Icon path={mdiContentSave} size={16} />
          {saving ? 'Saving…' : `Download PDF (${pages.length} ${pages.length === 1 ? 'page' : 'pages'})`}
        </button>
      </div>
    </div>
  );
}
