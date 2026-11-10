'use client';

import { Publication } from '@/types/publication';
import { useMessages } from '@/lib/i18n/useMessages';
import SectionHeading from '@/components/ui/SectionHeading';
import PublicationEntry from '@/components/publications/PublicationEntry';

interface SelectedPublicationsProps {
    id?: string;
    publications: Publication[];
    title: string;
    viewAllHref?: string;
    variant?: 'compact' | 'full';
}

export default function SelectedPublications({
    id = 'publications',
    publications,
    title,
    viewAllHref,
    variant = 'compact',
}: SelectedPublicationsProps) {
    const messages = useMessages();
    if (publications.length === 0) return null;

    return (
        <section aria-labelledby={`${id}-title`}>
            <SectionHeading
                id={`${id}-title`}
                title={title}
                action={viewAllHref ? { href: viewAllHref, label: messages.home.viewAll } : undefined}
            />
            <div className="space-y-3">
                {publications.map((pub) => (
                    <PublicationEntry key={pub.id} pub={pub} variant={variant} />
                ))}
            </div>
        </section>
    );
}
