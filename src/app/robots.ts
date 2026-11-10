import type { MetadataRoute } from 'next';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const config = getConfig();
  const base = config.site.url?.replace(/\/+$/, '');

  return {
    rules: { userAgent: '*', allow: '/' },
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
