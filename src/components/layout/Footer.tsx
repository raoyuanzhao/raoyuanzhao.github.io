'use client';

import Link from 'next/link';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { useMessages } from '@/lib/i18n/useMessages';

interface FooterProps {
  authorName: string;
  copyrightStart?: number;
  lastUpdated?: string;
  lastUpdatedByLocale?: Record<string, string | undefined>;
  defaultLocale?: string;
  privacyHref?: string;
}

export default function Footer({
  authorName,
  copyrightStart,
  lastUpdated,
  lastUpdatedByLocale,
  defaultLocale = 'en',
  privacyHref,
}: FooterProps) {
  const locale = useLocaleStore((state) => state.locale);
  const messages = useMessages();

  const resolvedLastUpdated =
    lastUpdatedByLocale?.[locale] ||
    (defaultLocale ? lastUpdatedByLocale?.[defaultLocale] : undefined) ||
    lastUpdated;

  const year = new Date().getFullYear();
  const years = copyrightStart && copyrightStart < year ? `${copyrightStart}–${year}` : `${year}`;

  return (
    <footer data-site-footer className="mx-auto w-full max-w-[1120px] px-5 pb-10 sm:px-8 lg:px-10">
      <div className="border-t border-line-soft pt-6 text-center text-[13px] leading-relaxed text-muted">
        <p>
          © {years} {authorName}
          {resolvedLastUpdated && (
            <>
              <span aria-hidden="true" className="mx-2">·</span>
              {messages.footer.lastUpdated}: {resolvedLastUpdated}
            </>
          )}
          {privacyHref && (
            <>
              <span aria-hidden="true" className="mx-2">·</span>
              <Link href={privacyHref} className="hover:text-link transition-colors">
                {messages.footer.privacy}
              </Link>
            </>
          )}
        </p>
        <p className="mt-1.5 text-[12px]">
          <a href="https://github.com/xyjoey/PRISM" target="_blank" rel="noopener noreferrer" className="hover:text-link transition-colors">
            {messages.footer.builtWithPrism}
          </a>
        </p>
      </div>
    </footer>
  );
}
