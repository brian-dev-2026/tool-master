'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { mdiFolderZipOutline, mdiPlay } from '@mdi/js';
import { useToolRunner } from '@/lib/use-tool-runner';
import { getTool } from '@/tools/registry';
import { uiLoaders } from '@/tools/ui-loaders';
import type { ToolMeta } from '@/tools/types';
import { Dropzone } from './Dropzone';
import { EngineNotice } from './EngineNotice';
import { FileQueue } from './FileQueue';
import { Icon } from './Icon';
import { OptionsForm } from './OptionsForm';
import { OutputPreview } from './OutputPreview';
import { PasteInput } from './PasteInput';
import { SegmentedControl } from './SegmentedControl';
import { SortableFileList } from './SortableFileList';
import { TextToolLayout } from './TextToolLayout';
import { ToolHeader } from './ToolHeader';

function FileToolLayout({ meta }: { meta: ToolMeta }) {
  const { items, options, setOptions, addFiles, clear, downloadAll, staged, setStaged, runStaged } = useToolRunner(meta);
  const outputs = items.reduce((n, i) => n + (i.outputs?.length ?? 0), 0);
  const onlyOutput = outputs === 1 ? items.flatMap((i) => i.outputs ?? [])[0] : null;
  const [pasting, setPasting] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <EngineNotice meta={meta} />
      {meta.pasteable && (
        <SegmentedControl
          label="Input"
          value={pasting ? 'paste' : 'file'}
          choices={[
            { value: 'file', label: 'Upload file' },
            { value: 'paste', label: 'Paste text' },
          ]}
          onChange={(v) => setPasting(v === 'paste')}
        />
      )}
      {pasting ? (
        <PasteInput ext={meta.accept?.[0] ?? '.txt'} onSubmit={(file) => addFiles([file])} />
      ) : (
        <Dropzone accept={meta.accept ?? []} multiple={meta.multiple} onFiles={addFiles} />
      )}
      <SortableFileList files={staged} onChange={setStaged} />
      <OptionsForm options={meta.options ?? []} values={options} onChange={setOptions} />
      {meta.mode === 'all' && staged.length > 0 && (
        <div>
          <button
            type="button"
            onClick={runStaged}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-text px-4 py-2 text-[13px] font-semibold text-bg"
          >
            <Icon path={mdiPlay} size={16} />
            Combine {staged.length} {staged.length === 1 ? 'file' : 'files'}
          </button>
        </div>
      )}
      <FileQueue items={items} />
      {onlyOutput && <OutputPreview output={onlyOutput} />}
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
    <div className={`mx-auto px-4 py-8 ${meta.wide ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <ToolHeader meta={meta} />
      {Custom ? <Custom meta={meta} /> : meta.input === 'text' ? <TextToolLayout meta={meta} /> : <FileToolLayout meta={meta} />}
    </div>
  );
}
