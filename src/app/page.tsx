import { getConfig } from '@/lib/config';
import { loadPage } from '@/lib/pageData';
import HomePageClient, { type HomePageData, type HomePageLocaleData } from '@/components/home/HomePageClient';
import { getRuntimeI18nConfig } from '@/lib/i18n/config';

function loadPageDataForLocale(locale: string | undefined): HomePageLocaleData {
  const localeConfig = getConfig(locale);
  const enableOnePageMode = localeConfig.features.enable_one_page_mode;

  const targets = enableOnePageMode
    ? localeConfig.navigation.filter((item) => item.type === 'page').map((item) => item.target)
    : ['about'];

  const pagesToShow = targets
    .map((target): HomePageData | null => {
      const page = loadPage(target, locale);
      return page ? ({ ...page, id: target } as HomePageData) : null;
    })
    .filter((page): page is HomePageData => page !== null);

  return { enableOnePageMode, pagesToShow };
}

function buildPersonJsonLd() {
  const config = getConfig();
  const sameAs = [config.social.google_scholar, config.social.semantic_scholar, config.social.github, config.social.huggingface, config.social.linkedin, config.social.orcid]
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: config.author.name,
    jobTitle: config.author.title,
    affiliation: [
      { '@type': 'CollegeOrUniversity', name: config.author.institution, ...(config.author.institution_url ? { url: config.author.institution_url } : {}) },
      ...(config.author.affiliations || []).map((aff) => ({ '@type': 'Organization', name: aff.name, ...(aff.url ? { url: aff.url } : {}) })),
    ],
    ...(config.author.location ? { workLocation: { '@type': 'Place', name: config.author.location } } : {}),
    ...(config.site.url ? { url: config.site.url } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export default function Home() {
  const baseConfig = getConfig();
  const runtimeI18n = getRuntimeI18nConfig(baseConfig.i18n);
  const targetLocales = runtimeI18n.enabled ? runtimeI18n.locales : [runtimeI18n.defaultLocale];

  const dataByLocale: Record<string, HomePageLocaleData> = {};

  for (const locale of targetLocales) {
    dataByLocale[locale] = loadPageDataForLocale(locale);
  }

  if (!dataByLocale[runtimeI18n.defaultLocale]) {
    dataByLocale[runtimeI18n.defaultLocale] = loadPageDataForLocale(undefined);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildPersonJsonLd()).replace(/</g, '\\u003c') }}
      />
      <HomePageClient dataByLocale={dataByLocale} defaultLocale={runtimeI18n.defaultLocale} />
    </>
  );
}
