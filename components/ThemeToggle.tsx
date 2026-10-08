'use client';

import { mdiWeatherNight, mdiWhiteBalanceSunny } from '@mdi/js';
import { Icon } from './Icon';

export function ThemeToggle() {
  function toggle() {
    const dark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('tm-theme', dark ? 'dark' : 'light');
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-icon hover:bg-icon-tile"
    >
      <span className="dark:hidden">
        <Icon path={mdiWeatherNight} size={18} />
      </span>
      <span className="hidden dark:inline">
        <Icon path={mdiWhiteBalanceSunny} size={18} />
      </span>
    </button>
  );
}
