'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { mdiFolderZipOutline } from '@mdi/js';
import { useToolRunner } from '@/lib/use-tool-runner';
import { getTool } from '@/tools/registry';
import { uiLoaders } from '@/tools/ui-loaders';
import type { ToolMeta } from '@/tools/types';
import { Dropzone } from './Dropzone';
import { FileQueue } from './FileQueue';
import { Icon } from './Icon';
import { OptionsForm } from './OptionsForm';
import { TextToolLayout } from './TextToolLayout';
import { ToolHeader } from './ToolHeader';

function FileToolLayout({ meta }: { meta: ToolMeta }) {
  const { items, options, setOptions, addFiles, clear, downloadAll } = useToolRunner(meta);
  const outputs = items.reduce((n, i) => n + (i.outputs?.length ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <Dropzone accept={meta.accept ?? []} multiple={meta.multiple} onFiles={addFiles} />
      <OptionsForm options={meta.options ?? []} values={options} onChange={setOptions} />
      <FileQueue items={items} />
      {items.length > 0 && (
        <div className="flex justify-end gap-2">
          <button type="button" onClick={clear} className="rounded-[10px] border border-border bg-surface px-3.5 py-2 text-[13px] font-semibold">
            Clear
          </button>
          {outputs > 1 && (
            <button
              type="button"
              onClick={downloadAll}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-text px-3.5 py-2 text-[13px] font-semibold text-bg"
            >
              <Icon path={mdiFolderZipOutline} size={16} />
              Download all (.zip)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ToolPage({ slug }: { slug: string }) {
  const meta = getTool(slug)!;
  const Custom = useMemo(
    () => (meta.customUi && uiLoaders[slug] ? dynamic(uiLoaders[slug], { ssr: false }) : null),
    [meta.customUi, slug],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ToolHeader meta={meta} />
      {Custom ? <Custom meta={meta} /> : meta.input === 'text' ? <TextToolLayout meta={meta} /> : <FileToolLayout meta={meta} />}
    </div>
  );
}
