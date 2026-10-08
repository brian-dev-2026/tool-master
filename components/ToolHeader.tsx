import Link from 'next/link';
import { mdiArrowLeft } from '@mdi/js';
import type { ToolMeta } from '@/tools/types';
import { Icon } from './Icon';

export function ToolHeader({ meta }: { meta: ToolMeta }) {
  return (
    <>
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted hover:text-text">
        <Icon path={mdiArrowLeft} size={15} />
        All tools
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-[11px] bg-icon-tile text-icon">
          <Icon path={meta.icon} size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{meta.name}</h1>
          <p className="text-[13px] text-muted">{meta.description}</p>
        </div>
      </div>
    </>
  );
}
