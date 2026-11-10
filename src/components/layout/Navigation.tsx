'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import LanguageToggle from '@/components/ui/LanguageToggle';
import type { SiteConfig } from '@/lib/config';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { useMessages } from '@/lib/i18n/useMessages';
import type { I18nRuntimeConfig } from '@/types/i18n';

interface NavigationProps {
  items: SiteConfig['navigation'];
  siteTitle: string;
  enableOnePageMode?: boolean;
  i18n: I18nRuntimeConfig;
  itemsByLocale?: Record<string, SiteConfig['navigation']>;
  siteTitleByLocale?: Record<string, string>;
}

function normalizePath(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export default function Navigation({
  items,
  siteTitle,
  enableOnePageMode,
  i18n,
  itemsByLocale,
  siteTitleByLocale,
}: NavigationProps) {
  const pathname = normalizePath(usePathname() || '/');
  const locale = useLocaleStore((state) => state.locale);
  const messages = useMessages();
  const [open, setOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('');
  const resolvedLocale = i18n.enabled ? locale : i18n.defaultLocale;

  const effectiveItems = useMemo(
    () => itemsByLocale?.[resolvedLocale] || itemsByLocale?.[i18n.defaultLocale] || items,
    [i18n.defaultLocale, items, itemsByLocale, resolvedLocale]
  );
  const effectiveSiteTitle =
    siteTitleByLocale?.[resolvedLocale] || siteTitleByLocale?.[i18n.defaultLocale] || siteTitle;

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!enableOnePageMode) return;
    const update = () => setActiveHash(window.location.hash);
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, [enableOnePageMode]);

  const hrefFor = (item: SiteConfig['navigation'][number]) =>
    enableOnePageMode ? (item.href === '/' ? '/' : `/#${item.target}`) : item.href;

  const isActive = (item: SiteConfig['navigation'][number]) => {
    if (enableOnePageMode) {
      return item.href === '/' ? !activeHash : activeHash === `#${item.target}`;
    }
    const href = normalizePath(item.href);
    return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header data-site-nav className="fixed inset-x-0 top-0 z-50 border-b border-line-soft bg-background">
      <nav aria-label="Main" className="mx-auto flex h-[60px] w-full max-w-[1120px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="text-[18px] font-semibold text-primary transition-colors hover:text-accent-ink">
          {effectiveSiteTitle}
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <ul className="flex items-center gap-1">
            {effectiveItems.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.target}>
                  <Link
                    href={hrefFor(item)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative rounded-md px-3 py-2 text-[15px] transition-colors',
                      active ? 'font-medium text-accent-ink' : 'text-muted hover:text-primary'
                    )}
                  >
                    {item.title}
                    {active && (
                      <span aria-hidden="true" className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-accent" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="ml-3 flex items-center gap-1">
            <LanguageToggle i18n={i18n} />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <LanguageToggle i18n={i18n} />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-accent/10 hover:text-accent-ink"
          >
            <span className="sr-only">{messages.navigation.openMainMenu}</span>
            {open ? <XMarkIcon className="h-6 w-6" aria-hidden="true" /> : <Bars3Icon className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-line-soft bg-background lg:hidden">
          <ul className="mx-auto max-w-[1120px] space-y-0.5 px-5 py-3 sm:px-8">
            {effectiveItems.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.target}>
                  <Link
                    href={hrefFor(item)}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block rounded-md border-l-[3px] px-3 py-2 text-[16px] transition-colors',
                      active
                        ? 'border-accent bg-accent/[0.08] font-medium text-accent-ink'
                        : 'border-transparent text-foreground hover:bg-accent/[0.06] hover:text-accent-ink'
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
