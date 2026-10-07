import Link from 'next/link';
import type { ToolMeta } from '@/tools/types';
import { Icon } from './Icon';

export function ToolCard({ tool }: { tool: ToolMeta }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 outline-none transition hover:border-accent hover:shadow-[0_0_0_3px_rgba(99,102,241,.12)] focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_rgba(99,102,241,.12)]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-icon-tile text-icon">
        <Icon path={tool.icon} size={20} />
      </span>
      <span className="text-[14px] font-semibold">{tool.name}</span>
      <span className="text-[13px] text-muted">{tool.description}</span>
    </Link>
  );
}
