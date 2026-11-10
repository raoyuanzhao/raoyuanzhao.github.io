'use client';

import { useMemo, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Publication } from '@/types/publication';
import { PublicationPageConfig } from '@/types/page';
import { cn } from '@/lib/utils';
import { useMessages } from '@/lib/i18n/useMessages';
import PageHeader from '@/components/pages/PageHeader';
import PublicationEntry from './PublicationEntry';

interface PublicationsListProps {
    config: PublicationPageConfig;
    publications: Publication[];
    embedded?: boolean;
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'rounded-full border px-3 py-1 text-[13px] transition-colors',
                active
                    ? 'border-accent bg-accent font-medium text-on-accent'
                    : 'border-line text-foreground hover:border-accent hover:text-accent-ink'
            )}
        >
            {children}
        </button>
    );
}

export default function PublicationsList({ config, publications, embedded = false }: PublicationsListProps) {
    const messages = useMessages();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [selectedType, setSelectedType] = useState<string | 'all'>('all');

    const years = useMemo(
        () => Array.from(new Set(publications.map((p) => p.year))).sort((a, b) => b - a),
        [publications]
    );
    const types = useMemo(() => Array.from(new Set(publications.map((p) => p.type))).sort(), [publications]);

    const filteredPublications = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return publications.filter((pub) => {
            const haystack = [
                pub.title,
                pub.venue,
                pub.venueFull,
                String(pub.year),
                ...pub.authors.map((a) => a.name),
                ...(pub.keywords || []),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            const matchesSearch = !query || haystack.includes(query);
            const matchesYear = selectedYear === 'all' || pub.year === selectedYear;
            const matchesType = selectedType === 'all' || pub.type === selectedType;
            return matchesSearch && matchesYear && matchesType;
        });
    }, [publications, searchQuery, selectedYear, selectedType]);

    const grouped = useMemo(() => {
        const groups = new Map<number, Publication[]>();
        filteredPublications.forEach((pub) => {
            groups.set(pub.year, [...(groups.get(pub.year) || []), pub]);
        });
        return Array.from(groups.entries());
    }, [filteredPublications]);

    const typeLabel = (type: string) => messages.publications.typeLabels[type] || type.replace('-', ' ');

    return (
        <div className="fade-in">
            <PageHeader title={config.title} description={config.description} embedded={embedded} />

            <div className="mb-8 space-y-4" data-print-hidden>
                <div className="relative">
                    <label htmlFor="publication-search" className="sr-only">{messages.publications.searchLabel}</label>
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
                    <input
                        id="publication-search"
                        type="search"
                        placeholder={messages.publications.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-line bg-surface py-2 pl-10 pr-4 text-[15px] text-foreground placeholder:text-muted/80 transition-colors focus:border-accent focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-accent/25"
                    />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8">
                    <div role="group" aria-labelledby="filter-year" className="flex flex-wrap items-center gap-2">
                        <span id="filter-year" className="mr-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                            {messages.publications.year}
                        </span>
                        <FilterChip active={selectedYear === 'all'} onClick={() => setSelectedYear('all')}>
                            {messages.common.all}
                        </FilterChip>
                        {years.map((year) => (
                            <FilterChip key={year} active={selectedYear === year} onClick={() => setSelectedYear(year)}>
                                {year}
                            </FilterChip>
                        ))}
                    </div>
                    {types.length > 1 && (
                        <div role="group" aria-labelledby="filter-type" className="flex flex-wrap items-center gap-2">
                            <span id="filter-type" className="mr-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
                                {messages.publications.type}
                            </span>
                            <FilterChip active={selectedType === 'all'} onClick={() => setSelectedType('all')}>
                                {messages.common.all}
                            </FilterChip>
                            {types.map((type) => (
                                <FilterChip key={type} active={selectedType === type} onClick={() => setSelectedType(type)}>
                                    {typeLabel(type)}
                                </FilterChip>
                            ))}
                        </div>
                    )}
                </div>

                <p className="text-[13px] text-muted" aria-live="polite">
                    {messages.publications.showing(filteredPublications.length, publications.length)}
                </p>
            </div>

            {filteredPublications.length === 0 ? (
                <p className="py-12 text-center text-muted">{messages.publications.noResults}</p>
            ) : (
                <div className="space-y-10">
                    {grouped.map(([year, pubs]) => (
                        <section key={year} aria-labelledby={`pub-year-${year}`}>
                            <h2 id={`pub-year-${year}`} className="section-title mb-[18px]">{year}</h2>
                            <div className="space-y-3">
                                {pubs.map((pub) => (
                                    <PublicationEntry key={pub.id} pub={pub} />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}
