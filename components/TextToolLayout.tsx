'use client';

import { useState } from 'react';
import { mdiDownload, mdiPlay } from '@mdi/js';
import { downloadBlob } from '@/lib/download';
import { useToolRunner } from '@/lib/use-tool-runner';
import type { ToolMeta, ToolOutput } from '@/tools/types';
import { CopyButton } from './CopyButton';
import { Icon } from './Icon';
import { OptionsForm } from './OptionsForm';

export function TextToolLayout({ meta }: { meta: ToolMeta }) {
  const { items, options, setOptions, runText } = useToolRunner(meta);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<ToolOutput | null>(null);
  const failed = items.find((i) => i.status === 'failed');
  const text = output?.kind === 'text' ? output.text : '';

  return (
    <div className="flex flex-col gap-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={10}
        spellCheck={false}
        aria-label="Input"
        placeholder="Paste or type here…"
        className="w-full rounded-xl border border-border bg-surface p-3 font-mono text-[13px] outline-none focus:border-accent"
      />
      <OptionsForm options={meta.options ?? []} values={options} onChange={setOptions} />
      <div>
        <button
          type="button"
          onClick={async () => setOutput(await runText(input))}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-text px-4 py-2 text-[13px] font-semibold text-bg"
        >
          <Icon path={mdiPlay} size={16} />
          Run
        </button>
      </div>
      {failed && <p className="rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-[13px] text-error">{failed.error}</p>}
      {output?.kind === 'text' && !failed && (
        <div className="flex flex-col gap-2">
          <textarea
            readOnly
            value={text}
            rows={12}
            aria-label="Output"
            className="w-full rounded-xl border border-border bg-surface p-3 font-mono text-[13px] outline-none"
          />
          <div className="flex justify-end gap-2">
            <CopyButton text={text} />
            <button
              type="button"
              onClick={() => downloadBlob(new Blob([text], { type: output.mime ?? 'text/plain' }), output.filename ?? 'output.txt')}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-semibold hover:bg-icon-tile"
            >
              <Icon path={mdiDownload} size={15} />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
