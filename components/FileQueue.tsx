'use client';

import { mdiAlertCircle, mdiCheckCircle, mdiClockOutline, mdiDownload, mdiLoading } from '@mdi/js';
import { downloadBlob, formatBytes } from '@/lib/download';
import type { QueueItem } from '@/lib/run-client';
import { Icon } from './Icon';

function StatusIcon({ status }: { status: QueueItem['status'] }) {
  if (status === 'done') return <span className="text-success"><Icon path={mdiCheckCircle} size={20} /></span>;
  if (status === 'failed') return <span className="text-error"><Icon path={mdiAlertCircle} size={20} /></span>;
  if (status === 'working') return <span className="animate-spin text-accent"><Icon path={mdiLoading} size={20} /></span>;
  return <span className="text-muted"><Icon path={mdiClockOutline} size={20} /></span>;
}

function detail(item: QueueItem): string {
  if (item.status === 'failed') return `Failed · ${item.error ?? 'Unknown error'}`;
  if (item.status === 'working') return item.note ?? 'Working…';
  if (item.status === 'waiting') return 'Waiting';
  const size = item.outputs?.reduce((s, o) => s + o.data.size, 0) ?? 0;
  return item.note ?? `Done · ${formatBytes(size)}`;
}

export function FileQueue({ items }: { items: QueueItem[] }) {
  if (!items.length) return null;
  return (
    <ul className="overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
          <StatusIcon status={item.status} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">{item.label}</div>
            <div className={`truncate text-[12px] ${item.status === 'failed' ? 'text-error' : 'text-muted'}`}>{detail(item)}</div>
            {item.status === 'working' && item.progress !== undefined && (
              <div className="mt-1.5 h-1 overflow-hidden rounded bg-icon-tile">
                <div className="h-full bg-gradient-to-r from-accent to-accent-to" style={{ width: `${Math.round(item.progress * 100)}%` }} />
              </div>
            )}
          </div>
          {item.outputs?.map((o) => (
            <button
              key={o.name}
              type="button"
              onClick={() => downloadBlob(o.data, o.name)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-semibold hover:bg-icon-tile"
              title={o.name}
            >
              <Icon path={mdiDownload} size={15} />
              {o.name.split('.').pop()?.toUpperCase()}
            </button>
          ))}
        </li>
      ))}
    </ul>
  );
}
