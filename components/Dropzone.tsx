'use client';

import { useRef, useState } from 'react';
import { mdiCloudUploadOutline } from '@mdi/js';
import { MAX_FILE_MB } from '@/lib/config';
import { Icon } from './Icon';

export function Dropzone({ accept, multiple, onFiles }: { accept: string[]; multiple?: boolean; onFiles: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles([...e.dataTransfer.files]);
      }}
      className={`cursor-pointer rounded-2xl border-[1.5px] border-dashed bg-surface p-8 text-center text-muted outline-none transition focus-visible:border-accent ${
        over ? 'border-accent bg-icon-tile' : 'border-border'
      }`}
    >
      <span className="mb-2 inline-block text-accent">
        <Icon path={mdiCloudUploadOutline} size={32} />
      </span>
      <div>
        <b className="text-text">Drop {multiple ? 'files' : 'a file'} here</b> or click to browse
      </div>
      <small>
        {accept.join(', ')} · up to {MAX_FILE_MB} MB{multiple ? ' each' : ''}
      </small>
      <input
        ref={input}
        type="file"
        hidden
        accept={accept.join(',')}
        multiple={multiple}
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
