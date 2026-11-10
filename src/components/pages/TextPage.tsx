'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ProcessedSection, TextPageConfig } from '@/types/page';
import Markdown from '@/components/ui/Markdown';
import Sections from '@/components/home/Sections';
import { useMessages } from '@/lib/i18n/useMessages';
import PageHeader from './PageHeader';

interface TextPageProps {
    config: TextPageConfig;
    content: string;
    sections?: ProcessedSection[];
    /** Set only when the configured PDF exists in `public/` */
    pdfHref?: string;
    embedded?: boolean;
}

export default function TextPage({ config, content, sections = [], pdfHref, embedded = false }: TextPageProps) {
    const messages = useMessages();
    const label = config.pdf_label || messages.cv.download;

    const download = config.pdf ? (
        pdfHref ? (
            <a
                href={pdfHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[14px] font-medium text-on-primary transition-colors hover:bg-accent hover:text-on-accent"
            >
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                {label}
            </a>
        ) : (
            <button
                type="button"
                disabled
                title={messages.cv.notAvailable}
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-dashed border-line px-4 py-2 text-[14px] font-medium text-muted"
            >
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                {label}
                <span className="text-[12px] font-normal">({messages.cv.notAvailable})</span>
            </button>
        )
    ) : null;

    return (
        <div className="fade-in">
            <PageHeader title={config.title} description={config.description} embedded={embedded}>
                {download}
            </PageHeader>
            {content.trim() && (
                <Markdown className="mb-11 text-[16px] leading-[1.7] text-foreground">{content}</Markdown>
            )}
            {sections.length > 0 && <Sections sections={sections} />}
        </div>
    );
}
