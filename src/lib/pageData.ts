import { getBibtexContent, getMarkdownContent, getPageConfig } from '@/lib/content';
import { parseBibTeX } from '@/lib/bibtexParser';
import { processSections, resolvePublicAsset } from '@/lib/sections';
import type {
  BasePageConfig,
  CardPageConfig,
  ProcessedSection,
  PublicationPageConfig,
  SectionConfig,
  TextPageConfig,
} from '@/types/page';
import type { Publication } from '@/types/publication';

export type LoadedPage =
  | { type: 'about'; sections: ProcessedSection[] }
  | { type: 'publication'; config: PublicationPageConfig; publications: Publication[] }
  | { type: 'text'; config: TextPageConfig; content: string; sections: ProcessedSection[]; pdfHref?: string }
  | { type: 'card'; config: CardPageConfig };

/** Loads a content page (`content/<name>.toml`) and everything it references. */
export function loadPage(name: string, locale?: string): LoadedPage | null {
  const raw = getPageConfig<BasePageConfig & { sections?: SectionConfig[] }>(name, locale);
  if (!raw) return null;

  if (raw.type === 'about') {
    return { type: 'about', sections: processSections(raw.sections || [], locale) };
  }

  if (raw.type === 'publication') {
    const config = raw as PublicationPageConfig;
    return { type: 'publication', config, publications: parseBibTeX(getBibtexContent(config.source, locale), locale) };
  }

  if (raw.type === 'text') {
    const config = raw as TextPageConfig;
    return {
      type: 'text',
      config,
      content: config.source ? getMarkdownContent(config.source, locale) : '',
      sections: processSections(config.sections || [], locale),
      pdfHref: resolvePublicAsset(config.pdf),
    };
  }

  if (raw.type === 'card') {
    return { type: 'card', config: raw as CardPageConfig };
  }

  return null;
}
