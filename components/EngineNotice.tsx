'use client';

import { useEffect, useState } from 'react';
import { mdiInformationOutline } from '@mdi/js';
import { ENGINE_HINTS, type EngineStatus } from '@/lib/engines/hints';
import type { ToolMeta } from '@/tools/types';
import { Icon } from './Icon';

/** Shows what to install when none of the tool's engines is available. */
export function EngineNotice({ meta }: { meta: ToolMeta }) {
  const [engines, setEngines] = useState<EngineStatus | null>(null);

  useEffect(() => {
    if (!meta.requires?.length) return;
    fetch('/api/engines')
      .then((r) => r.json())
      .then(setEngines)
      .catch(() => setEngines(null));
  }, [meta.requires]);

  if (!meta.requires?.length || !engines) return null;
  const available = meta.requires.some((id) => id === 'birefnet' || engines[id as keyof EngineStatus]);
  if (available) return null;

  const missing = meta.requires.filter((id) => id !== 'birefnet');
  return (
    <div className="flex gap-2 rounded-xl border border-border bg-icon-tile px-4 py-3 text-[13px]">
      <span className="text-icon">
        <Icon path={mdiInformationOutline} size={18} />
      </span>
      <div>
        {missing.map((id) => (
          <p key={id}>
            {ENGINE_HINTS[id].label} not found. Install it from{' '}
            <a className="font-semibold text-accent underline" href={ENGINE_HINTS[id].url} target="_blank" rel="noreferrer">
              {ENGINE_HINTS[id].url.replace(/^https:\/\//, '')}
            </a>
          </p>
        ))}
      </div>
    </div>
  );
}
