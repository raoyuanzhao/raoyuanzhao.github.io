'use client';

import { useEffect, useState } from 'react';

/** Tracks the effective theme applied to <html> (after resolving "system"). */
export function useResolvedTheme(): 'light' | 'dark' | null {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTheme(root.classList.contains('dark') ? 'dark' : 'light');
    read();

    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
