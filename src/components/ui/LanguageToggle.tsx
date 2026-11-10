'use client';

import { useEffect, useState } from 'react';
import { LanguageIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useLocaleStore } from '@/lib/stores/localeStore';
import type { I18nRuntimeConfig } from '@/types/i18n';

interface LanguageToggleProps {
  i18n: I18nRuntimeConfig;
}

export default function LanguageToggle({ i18n }: LanguageToggleProps) {
  const { locale, setLocale } = useLocaleStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!i18n.enabled || !i18n.switcher || i18n.locales.length <= 1) {
    return null;
  }

  if (!mounted) {
    return (
      <div className="w-14 h-10" aria-hidden="true" />
    );
  }

  const currentLocale = i18n.locales.includes(locale) ? locale : i18n.defaultLocale;
  const currentLabel = i18n.labels[currentLocale] || currentLocale;

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-center gap-1 px-3 h-10 rounded-full',
          'transition-colors duration-200 text-primary hover:bg-accent/10 hover:text-accent-ink'
        )}
        title={currentLabel}
      >
        <LanguageIcon className="h-4 w-4" />
        <span className="text-xs font-medium">{currentLabel}</span>
        <ChevronDownIcon className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-36 rounded-lg shadow-soft border border-line bg-surface z-50"
        >
          <div className="py-1">
            {i18n.locales.map((localeOption) => (
              <button
                key={localeOption}
                onClick={() => {
                  setLocale(localeOption);
                  setIsOpen(false);
                }}
                className={cn(
                  'flex items-center justify-between w-full px-3 py-2 text-sm',
                  'hover:bg-accent/[0.06]',
                  'transition-colors duration-200',
                  currentLocale === localeOption
                    ? 'text-accent-ink bg-accent/10'
                    : 'text-foreground'
                )}
              >
                <span>{i18n.labels[localeOption] || localeOption}</span>
                <span className="text-xs opacity-70">{localeOption.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
