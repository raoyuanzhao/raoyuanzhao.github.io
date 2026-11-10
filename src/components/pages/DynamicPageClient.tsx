'use client';

import PublicationsList from '@/components/publications/PublicationsList';
import TextPage from '@/components/pages/TextPage';
import CardPage from '@/components/pages/CardPage';
import { Publication } from '@/types/publication';
import {
  PublicationPageConfig,
  TextPageConfig,
  CardPageConfig,
  ProcessedSection,
} from '@/types/page';
import { useLocaleStore } from '@/lib/stores/localeStore';

export type DynamicPageLocaleData =
  | { type: 'publication'; config: PublicationPageConfig; publications: Publication[] }
  | { type: 'text'; config: TextPageConfig; content: string; sections: ProcessedSection[]; pdfHref?: string }
  | { type: 'card'; config: CardPageConfig };

interface DynamicPageClientProps {
  dataByLocale: Record<string, DynamicPageLocaleData>;
  defaultLocale: string;
}

export default function DynamicPageClient({ dataByLocale, defaultLocale }: DynamicPageClientProps) {
  const locale = useLocaleStore((state) => state.locale);
  const pageData = dataByLocale[locale] || dataByLocale[defaultLocale] || Object.values(dataByLocale)[0];

  if (!pageData) {
    return null;
  }

  return (
    <>
      {pageData.type === 'publication' && (
        <PublicationsList config={pageData.config} publications={pageData.publications} />
      )}
      {pageData.type === 'text' && (
        <TextPage
          config={pageData.config}
          content={pageData.content}
          sections={pageData.sections}
          pdfHref={pageData.pdfHref}
        />
      )}
      {pageData.type === 'card' && <CardPage config={pageData.config} />}
    </>
  );
}
