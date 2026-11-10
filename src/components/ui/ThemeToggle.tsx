'use client';

import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useThemeStore, type Theme } from '@/lib/stores/themeStore';
import { useMessages } from '@/lib/i18n/useMessages';

const ORDER: Theme[] = ['system', 'light', 'dark'];

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const messages = useMessages();

  useEffect(() => {
    setMounted(true);
  }, []);

  const labels: Record<Theme, string> = {
    system: messages.theme.system,
    light: messages.theme.light,
    dark: messages.theme.dark,
  };
  const current = mounted ? theme : 'system';
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon = current === 'dark' ? MoonIcon : current === 'light' ? SunIcon : ComputerDesktopIcon;

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-accent/10 hover:text-accent-ink"
      aria-label={`${messages.theme.currentTheme}: ${labels[current]}. ${messages.theme.cycleTheme}.`}
      title={`${messages.theme.currentTheme}: ${labels[current]}`}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  );
}
