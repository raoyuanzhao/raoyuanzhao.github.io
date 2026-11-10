import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPageConfig } from '@/lib/content';
import { getConfig } from '@/lib/config';
import { loadPage } from '@/lib/pageData';
import DynamicPageClient, { type DynamicPageLocaleData } from '@/components/pages/DynamicPageClient';
import { BasePageConfig } from '@/types/page';
import { getRuntimeI18nConfig } from '@/lib/i18n/config';

function loadDynamicPageData(slug: string, locale?: string): DynamicPageLocaleData | null {
  const page = loadPage(slug, locale);
  if (!page || page.type === 'about') return null;
  return page;
}

function getBuildableSlugs(): string[] {
  const config = getConfig();
  const fromNav = config.navigation.filter((nav) => nav.type === 'page').map((nav) => nav.target);
  const extra = (config.extra_pages || []).map((page) => page.target);
  return Array.from(new Set([...fromNav, ...extra])).filter((slug) => slug !== 'about');
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getBuildableSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pageConfig = getPageConfig(slug) as BasePageConfig | null;
  const config = getConfig();

  if (!pageConfig) {
    return {};
  }

  const description = pageConfig.description || `${pageConfig.title} of ${config.author.name}, ${config.author.title} at ${config.author.institution}.`;

  return {
    title: pageConfig.title,
    description,
    ...(config.site.url ? { alternates: { canonical: `/${slug}/` } } : {}),
    openGraph: {
      title: `${pageConfig.title} | ${config.site.title}`,
      description,
      ...(config.site.url ? { url: `/${slug}/` } : {}),
    },
  };
}

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const baseConfig = getConfig();
  const runtimeI18n = getRuntimeI18nConfig(baseConfig.i18n);
  const targetLocales = runtimeI18n.enabled ? runtimeI18n.locales : [runtimeI18n.defaultLocale];

  const dataByLocale: Record<string, DynamicPageLocaleData> = {};

  for (const locale of targetLocales) {
    const localizedData = loadDynamicPageData(slug, locale);
    if (localizedData) {
      dataByLocale[locale] = localizedData;
    }
  }

  const defaultData = loadDynamicPageData(slug);
  if (defaultData) {
    dataByLocale[runtimeI18n.defaultLocale] = dataByLocale[runtimeI18n.defaultLocale] || defaultData;
  }

  if (Object.keys(dataByLocale).length === 0) {
    notFound();
  }

  return <DynamicPageClient dataByLocale={dataByLocale} defaultLocale={runtimeI18n.defaultLocale} />;
}
