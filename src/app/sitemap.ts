import type { MetadataRoute } from 'next';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const config = getConfig();
  if (!config.site.url) return [];

  const base = config.site.url.replace(/\/+$/, '');
  const paths = new Set<string>(['/']);
  config.navigation.forEach((item) => item.type === 'page' && paths.add(item.href));
  config.extra_pages?.forEach((page) => paths.add(page.href));

  return Array.from(paths).map((href) => ({
    url: `${base}${href === '/' ? '/' : `${href.replace(/\/+$/, '')}/`}`,
    changeFrequency: 'monthly',
    priority: href === '/' ? 1 : 0.7,
  }));
}
