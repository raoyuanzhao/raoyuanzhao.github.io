'use client';

import type { ProcessedSection } from '@/types/page';
import { useMessages } from '@/lib/i18n/useMessages';
import SectionHeading from '@/components/ui/SectionHeading';
import CardList from '@/components/pages/CardList';
import About from './About';
import News from './News';
import ResearchInterests from './ResearchInterests';
import SelectedPublications from './SelectedPublications';

interface SectionsProps {
    sections: ProcessedSection[];
    enableOnePageMode?: boolean;
}

export default function Sections({ sections, enableOnePageMode = false }: SectionsProps) {
    const messages = useMessages();

    return (
        <div className="space-y-11">
            {sections.map((section) => {
                const cv = section.variant === 'cv';
                switch (section.type) {
                    case 'markdown':
                        return (
                            <About
                                key={section.id}
                                id={section.id}
                                content={section.content || ''}
                                title={section.title || messages.home.about}
                                reachOut={section.reach_out}
                            />
                        );
                    case 'interests':
                        return section.interests ? (
                            <ResearchInterests
                                key={section.id}
                                id={section.id}
                                title={section.title || messages.profile.researchInterests}
                                interests={section.interests}
                            />
                        ) : null;
                    case 'publications':
                        return (
                            <SelectedPublications
                                key={section.id}
                                id={section.id}
                                publications={section.publications || []}
                                title={section.title || messages.home.selectedPublications}
                                viewAllHref={section.link ?? (cv ? undefined : enableOnePageMode ? '/#publications' : '/publications')}
                                variant="compact"
                            />
                        );
                    case 'list':
                        return (
                            <News
                                key={section.id}
                                id={section.id}
                                items={section.items || []}
                                title={section.title || messages.home.news}
                            />
                        );
                    case 'cards': {
                        const cards = section.cards || [];
                        if (cards.length === 0) return null;
                        return (
                            <section key={section.id} aria-labelledby={`${section.id}-title`}>
                                <SectionHeading
                                    id={`${section.id}-title`}
                                    title={section.title || ''}
                                    action={section.link ? { href: section.link, label: section.link_label || messages.home.viewAll } : undefined}
                                />
                                <CardList items={cards} layout={section.layout || 'timeline'} compact={!cv} />
                            </section>
                        );
                    }
                    default:
                        return null;
                }
            })}
        </div>
    );
}
