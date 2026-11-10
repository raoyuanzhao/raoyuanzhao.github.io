import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import Profile, { type ProfileData } from '@/components/home/Profile';import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { LocaleProvider } from '@/components/ui/LocaleProvider';
import { getConfig } from '@/lib/config';
import { getRuntimeI18nConfig } from '@/lib/i18n/config';
import { getMessages } from '@/lib/i18n/messages';
import { resolvePublicAsset } from '@/lib/sections';
import { getVisitorStats } from '@/lib/visitorStats';
import VisitorTracker, { type VisitorTrackerConfig } from '@/components/analytics/VisitorTracker';
import type { SiteConfig } from '@/lib/config';

// Self-hosted at build time by next/font; visitors' browsers never contact Google Fonts.
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
});

export async function generateMetadata(): Promise<Metadata> {
  const config = getConfig();
  const runtimeI18n = getRuntimeI18nConfig(config.i18n);
  const openGraphLocale = runtimeI18n.defaultLocale === 'zh' ? 'zh_CN' : 'en_US';
  const keywords = config.site.keywords?.length
    ? config.site.keywords
    : [config.author.name, config.author.title, config.author.institution];

  return {
    ...(config.site.url ? { metadataBase: new URL(config.site.url) } : {}),
    title: {
      default: config.site.title,
      template: `%s | ${config.site.title}`,
    },
    description: config.site.description,
    keywords,
    authors: [{ name: config.author.name, ...(config.site.url ? { url: config.site.url } : {}) }],
    creator: config.author.name,
    publisher: config.author.name,
    icons: {
      // PNG fallback for browsers without SVG favicon support (e.g. Safari)
      icon: [
        { url: config.site.favicon, type: 'image/svg+xml' },
        ...(resolvePublicAsset('/favicon-32.png') ? [{ url: '/favicon-32.png', sizes: '32x32', type: 'image/png' }] : []),
      ],
      ...(resolvePublicAsset('/apple-touch-icon.png') ? { apple: '/apple-touch-icon.png' } : {}),
    },
    ...(config.site.url ? { alternates: { canonical: '/' } } : {}),
    openGraph: {
      type: 'profile',
      locale: openGraphLocale,
      title: config.site.title,
      description: config.site.description,
      siteName: config.site.title,
      ...(config.site.url ? { url: '/' } : {}),
    },
    twitter: {
      card: 'summary',
      title: config.site.title,
      description: config.site.description,
    },
  };
}

function buildLocaleBootstrapScript(config: ReturnType<typeof getRuntimeI18nConfig>): string {
  const serializedConfig = JSON.stringify(config).replace(/</g, '\\u003c');

  return `
    try {
      const cfg = ${serializedConfig};
      const storageKey = 'locale-storage';
      const normalize = (value) => typeof value === 'string' ? value.trim().replace('_', '-').toLowerCase() : '';
      const matchLocale = (candidate) => {
        const normalized = normalize(candidate);
        if (!normalized) return null;
        if (cfg.locales.includes(normalized)) return normalized;
        const language = normalized.split('-')[0];
        if (cfg.locales.includes(language)) return language;
        return null;
      };

      let resolved = null;

      if (!cfg.enabled) {
        resolved = cfg.defaultLocale;
      } else if (cfg.persist) {
        resolved = matchLocale(localStorage.getItem(storageKey));
      }

      if (!resolved) {
        if (cfg.mode === 'fixed') {
          resolved = cfg.fixedLocale;
        } else {
          resolved = matchLocale(navigator.language);
        }
      }

      if (!resolved) {
        resolved = cfg.defaultLocale;
      }

      const root = document.documentElement;
      root.lang = resolved;
      root.setAttribute('data-locale', resolved);

      if (cfg.persist) {
        localStorage.setItem(storageKey, resolved);
      }
    } catch (e) {
      const root = document.documentElement;
      root.lang = '${config.defaultLocale}';
      root.setAttribute('data-locale', '${config.defaultLocale}');
    }
  `;
}

function buildLocalizedConfigMaps(locales: string[]) {
  const navigationByLocale: Record<string, SiteConfig['navigation']> = {};
  const siteTitleByLocale: Record<string, string> = {};
  const lastUpdatedByLocale: Record<string, string | undefined> = {};
  const profileByLocale: Record<string, ProfileData> = {};

  for (const locale of locales) {
    const localizedConfig = getConfig(locale);
    navigationByLocale[locale] = localizedConfig.navigation;
    siteTitleByLocale[locale] = localizedConfig.site.title;
    lastUpdatedByLocale[locale] = localizedConfig.site.last_updated;
    profileByLocale[locale] = {
      author: {
        ...localizedConfig.author,
        avatar: resolvePublicAsset(localizedConfig.author.avatar) ?? '/avatar-placeholder.svg',
        avatar_video: resolvePublicAsset(localizedConfig.author.avatar_video),
        pronunciation_audio: resolvePublicAsset(localizedConfig.author.pronunciation_audio),
      },
      social: localizedConfig.social,
      cvHref: resolvePublicAsset(localizedConfig.social.cv),
    };
  }

  return { navigationByLocale, siteTitleByLocale, lastUpdatedByLocale, profileByLocale };
}

/** Counter for the deployed site, if a provider is configured under [visitor_map]. */
function getVisitorTrackerConfig(config: SiteConfig): VisitorTrackerConfig | undefined {
  const visitorMap = config.visitor_map;
  if (!visitorMap || visitorMap.enabled === false || !config.site.url) return undefined;
  const hostname = new URL(config.site.url).hostname;

  if ((visitorMap.provider ?? 'goatcounter') === 'goatcounter') {
    const code = visitorMap.goatcounter?.code?.trim();
    if (!code || !/^[a-z0-9-]+$/i.test(code)) return undefined;
    return { provider: 'goatcounter', endpoint: `https://${code}.goatcounter.com/count`, hostname };
  }

  const websiteId = visitorMap.umami?.website_id?.trim();
  const scriptUrl = visitorMap.umami?.script_url?.trim() || 'https://cloud.umami.is/script.js';
  if (!websiteId || !/^[0-9a-f-]{36}$/i.test(websiteId) || !scriptUrl.startsWith('https://')) return undefined;
  return { provider: 'umami', scriptUrl, websiteId, hostname };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = getConfig();
  const runtimeI18n = getRuntimeI18nConfig(config.i18n);
  const targetLocales = runtimeI18n.enabled ? runtimeI18n.locales : [runtimeI18n.defaultLocale];
  const messages = getMessages(runtimeI18n.defaultLocale);

  const { navigationByLocale, siteTitleByLocale, lastUpdatedByLocale, profileByLocale } =
    buildLocalizedConfigMaps(targetLocales);

  const privacyHref = config.extra_pages?.find((page) => page.target === 'privacy')?.href;
  const visitorTracker = getVisitorTrackerConfig(config);
  const visitorStats = config.visitor_map?.enabled === false ? null : getVisitorStats();

  return (
    <html lang={runtimeI18n.defaultLocale} className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme-storage');
                const parsed = theme ? JSON.parse(theme) : null;
                const setting = parsed?.state?.theme || 'system';
                const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                const effective = setting === 'dark' ? 'dark' : (setting === 'light' ? 'light' : (prefersDark ? 'dark' : 'light'));
                var root = document.documentElement;
                root.classList.add(effective);
                root.setAttribute('data-theme', effective);
              } catch (e) {
                var root = document.documentElement;
                root.classList.add('light');
                root.setAttribute('data-theme', 'light');
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: buildLocaleBootstrapScript(runtimeI18n),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-link focus:shadow-soft"
        >
          {messages.navigation.skipToContent}
        </a>
        <ThemeProvider>
          <LocaleProvider config={runtimeI18n}>
            <Navigation
              items={config.navigation}
              siteTitle={config.site.title}
              enableOnePageMode={config.features.enable_one_page_mode}
              i18n={runtimeI18n}
              itemsByLocale={navigationByLocale}
              siteTitleByLocale={siteTitleByLocale}
            />
            <div className="mx-auto w-full max-w-[1120px] px-5 pt-[60px] sm:px-8 lg:flex lg:items-start lg:gap-12 lg:px-10 xl:gap-16">
              <Profile
                profileByLocale={profileByLocale}
                defaultLocale={runtimeI18n.defaultLocale}
                visitorMap={
                  config.visitor_map && {
                    enabled: config.visitor_map.enabled,
                    title: config.visitor_map.title,
                    light: config.visitor_map.light,
                    dark: config.visitor_map.dark,
                  }
                }
                visitorStats={visitorStats}
                visitorStatsEnabled={!!visitorTracker || !!visitorStats}
                privacyHref={privacyHref}
              />
              <main id="main-content" tabIndex={-1} className="min-h-[70vh] min-w-0 flex-1 pb-16 pt-10 focus:outline-none lg:pt-14">
                {children}
              </main>
            </div>
            <Footer
              authorName={config.author.name}
              copyrightStart={config.site.copyright_start}
              lastUpdated={config.site.last_updated}
              lastUpdatedByLocale={lastUpdatedByLocale}
              defaultLocale={runtimeI18n.defaultLocale}
              privacyHref={privacyHref}
            />
          </LocaleProvider>
        </ThemeProvider>
        {visitorTracker && <VisitorTracker config={visitorTracker} />}
      </body>
    </html>
  );
}
