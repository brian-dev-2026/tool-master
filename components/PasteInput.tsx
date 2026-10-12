'use client';

import { useState } from 'react';
import { mdiPlay } from '@mdi/js';
import { Icon } from './Icon';

/** Lets file tools take pasted text; it is handed on as a file named "pasted<ext>". */
export function PasteInput({ ext, onSubmit }: { ext: string; onSubmit: (file: File) => void }) {
  const [text, setText] = useState('');
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        spellCheck={false}
        aria-label="Pasted input"
        placeholder={`Paste ${ext.replace('.', '').toUpperCase()} here…`}
        className="w-full rounded-xl border border-border bg-surface p-3 font-mono text-[13px] outline-none focus:border-accent"
      />
      <div>
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => onSubmit(new File([text], `pasted${ext}`, { type: 'text/plain' }))}
          className="inline-flex items-center gap-1.5 rounded-[10px] bg-text px-4 py-2 text-[13px] font-semibold text-bg disabled:opacity-50"
        >
          <Icon path={mdiPlay} size={16} />
          Convert
        </button>
      </div>
    </div>
  );
}
