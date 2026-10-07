import MdiIcon from '@mdi/react';

export function Icon({ path, size = 20, className }: { path: string; size?: number; className?: string }) {
  return <MdiIcon path={path} size={`${size}px`} className={className} aria-hidden="true" />;
}
