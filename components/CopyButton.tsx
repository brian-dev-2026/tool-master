'use client';

import { useState } from 'react';
import { mdiCheck, mdiContentCopy } from '@mdi/js';
import { Icon } from './Icon';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-semibold hover:bg-icon-tile"
    >
      <Icon path={copied ? mdiCheck : mdiContentCopy} size={15} />
      {copied ? 'Copied' : label}
    </button>
  );
}
