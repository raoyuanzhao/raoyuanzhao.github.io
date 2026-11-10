'use client';

import Sections from '@/components/home/Sections';
import PublicationsList from '@/components/publications/PublicationsList';
import TextPage from '@/components/pages/TextPage';
import CardPage from '@/components/pages/CardPage';
import { Publication } from '@/types/publication';
import { CardPageConfig, ProcessedSection, PublicationPageConfig, TextPageConfig } from '@/types/page';
import { useLocaleStore } from '@/lib/stores/localeStore';

export type HomePageData =
  | { type: 'about'; id: string; sections: ProcessedSection[] }
  | { type: 'publication'; id: string; config: PublicationPageConfig; publications: Publication[] }
  | { type: 'text'; id: string; config: TextPageConfig; content: string; sections: ProcessedSection[]; pdfHref?: string }
  | { type: 'card'; id: string; config: CardPageConfig };

export interface HomePageLocaleData {
  enableOnePageMode?: boolean;
  pagesToShow: HomePageData[];
}

interface HomePageClientProps {
  dataByLocale: Record<string, HomePageLocaleData>;
  defaultLocale: string;
}

export default function HomePageClient({ dataByLocale, defaultLocale }: HomePageClientProps) {
  const locale = useLocaleStore((state) => state.locale);
  const data = dataByLocale[locale] || dataByLocale[defaultLocale] || Object.values(dataByLocale)[0];

  if (!data) {
    return null;
  }

  return (
    <div className="fade-in space-y-14">
      {data.pagesToShow.map((page) => (
        <section key={page.id} id={page.id} className="scroll-mt-24">
          {page.type === 'about' && (
            <Sections sections={page.sections} enableOnePageMode={data.enableOnePageMode} />
          )}
          {page.type === 'publication' && (
            <PublicationsList config={page.config} publications={page.publications} embedded />
          )}
          {page.type === 'text' && (
            <TextPage config={page.config} content={page.content} sections={page.sections} pdfHref={page.pdfHref} embedded />
          )}
          {page.type === 'card' && <CardPage config={page.config} embedded />}
        </section>
      ))}
    </div>
  );
}
