import { useId } from 'react';

export function LogoMark({ size = 28 }: { size?: number }) {
  const id = useId();
  const fill = `url(#${id})`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="22" height="22" rx="6" fill={fill} />
      <rect x="6" y="36" width="22" height="22" rx="6" fill={fill} opacity=".55" />
      <rect x="36" y="36" width="22" height="22" rx="6" fill={fill} opacity=".85" />
      <rect x="39" y="9" width="16" height="16" rx="4" transform="rotate(45 47 17)" fill="#F472B6" />
    </svg>
  );
}

export function Logo({ size = 28, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      {withWordmark && (
        <span className="text-[17px] font-bold tracking-tight">
          tool<span className="text-gradient">master</span>
        </span>
      )}
    </span>
  );
}
