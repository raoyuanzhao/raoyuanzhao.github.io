'use client';

import { useEffect } from 'react';
import { useThemeStore, resolveTheme } from '@/lib/stores/themeStore';

type MediaQueryListWithDeprecated = MediaQueryList & {
  addListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
};

/**
 * Keeps the <html> theme class in sync with the stored preference.
 * The initial class is set by an inline script in the root layout, so content
 * renders with the right colours before hydration.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const effective = resolveTheme(theme);
      root.classList.remove('light', 'dark');
      root.classList.add(effective);
      root.setAttribute('data-theme', effective);
    };

    apply();

    if (theme !== 'system' || typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)') as MediaQueryListWithDeprecated;
    try {
      media.addEventListener('change', apply);
    } catch {
      media.addListener?.(apply);
    }
    return () => {
      try {
        media.removeEventListener('change', apply);
      } catch {
        media.removeListener?.(apply);
      }
    };
  }, [theme]);

  return <>{children}</>;
}
