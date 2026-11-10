import fs from 'fs';
import path from 'path';
import { getConfig } from '@/lib/config';
import { getBibtexContent, getMarkdownContent, getPageConfig, getTomlContent } from '@/lib/content';
import { parseBibTeX } from '@/lib/bibtexParser';
import type { CardItem, NewsItem, ProcessedSection, SectionConfig } from '@/types/page';

interface AboutProfile {
  profile?: {
    research_interests?: string[];
  };
}

export function getResearchInterests(locale?: string): string[] {
  return getPageConfig<AboutProfile>('about', locale)?.profile?.research_interests ?? [];
}

export function getCardItems(source: string, locale?: string, category?: string): CardItem[] {
  const data = getTomlContent<{ items?: CardItem[] }>(source, locale);
  return (data?.items ?? [])
    .filter((item) => !item.hidden)
    .filter((item) => !category || item.category === category);
}

/** Replaces `](pub:<BibTeX key>)` links with that publication's URL from publications.bib. */
function resolvePublicationLinks(items: NewsItem[], locale?: string): NewsItem[] {
  if (!items.some((item) => item.content.includes('](pub:'))) return items;

  const urls = new Map(
    parseBibTeX(getBibtexContent('publications.bib', locale), locale).map((pub) => [
      pub.id.toLowerCase(),
      pub.url ?? (pub.doi ? `https://doi.org/${pub.doi}` : undefined),
    ])
  );

  return items.map((item) => ({
    ...item,
    content: item.content.replace(/\]\(pub:([^)\s]+)\)/g, (_match, key: string) => {
      const url = urls.get(key.toLowerCase());
      if (!url) throw new Error(`news: no publication with key "${key}" (or it has no url/doi) in publications.bib`);
      return `](${url})`;
    }),
  }));
}

function applyLimit<T>(items: T[], limit: number | undefined, fallback: number): T[] {
  const effective = limit === undefined ? fallback : limit;
  return effective > 0 ? items.slice(0, effective) : items;
}

export function processSections(sections: SectionConfig[], locale?: string): ProcessedSection[] {
  return sections.map((section): ProcessedSection => {
    switch (section.type) {
      case 'markdown': {
        const email = section.reach_out ? getConfig(locale).social.email : undefined;
        return {
          ...section,
          content: section.source ? getMarkdownContent(section.source, locale) : '',
          reach_out: section.reach_out && email ? { ...section.reach_out, href: `mailto:${email}` } : undefined,
        };
      }
      case 'publications': {
        const bibtex = getBibtexContent(section.source || 'publications.bib', locale);
        const allPubs = parseBibTeX(bibtex, locale);
        const filtered = section.filter === 'selected' ? allPubs.filter((p) => p.selected) : allPubs;
        return { ...section, publications: applyLimit(filtered, section.limit, 5) };
      }
      case 'list': {
        const newsData = section.source ? getTomlContent<{ news: NewsItem[] }>(section.source, locale) : null;
        return { ...section, items: resolvePublicationLinks(newsData?.news || [], locale) };
      }
      case 'interests':
        return { ...section, interests: getResearchInterests(locale) };
      case 'cards': {
        const cards = section.source ? getCardItems(section.source, locale, section.category) : [];
        return { ...section, cards: applyLimit(cards, section.limit, 0) };
      }
      default:
        return section;
    }
  });
}

/** Returns the public URL of a file in `public/` only if it exists at build time. */
export function resolvePublicAsset(publicPath?: string): string | undefined {
  if (!publicPath) return undefined;
  if (/^https?:\/\//.test(publicPath)) return publicPath;

  const publicDir = path.join(process.cwd(), 'public');
  const resolved = path.resolve(publicDir, `.${publicPath.startsWith('/') ? '' : '/'}${publicPath}`);
  if (!resolved.startsWith(publicDir + path.sep)) return undefined;

  return fs.existsSync(resolved) ? publicPath : undefined;
}
