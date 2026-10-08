import Link from 'next/link';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="Tool-Master home">
          <Logo />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
