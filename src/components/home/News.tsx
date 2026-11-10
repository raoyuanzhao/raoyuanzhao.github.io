'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NewsItem } from '@/types/page';
import Markdown from '@/components/ui/Markdown';
import SectionHeading from '@/components/ui/SectionHeading';
import { cn } from '@/lib/utils';

interface NewsProps {
    id?: string;
    items: NewsItem[];
    title: string;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "Oct 2026" -> 2026*13+10, "2026" -> 2026*13 (after that year's months), unknown -> null */
function dateKey(date: string): number | null {
    const match = date.trim().match(/^(?:([a-z]{3})[a-z]*\.?\s+)?(\d{4})$/i);
    if (!match) return null;
    const month = match[1] ? MONTHS.indexOf(match[1].toLowerCase()) + 1 : 0;
    if (month < 0) return null;
    return Number(match[2]) * 13 + month;
}

/** Newest first; keeps the file order if any date cannot be parsed. */
function sortNewestFirst(items: NewsItem[]): NewsItem[] {
    const keyed = items.map((item, index) => ({ item, index, key: dateKey(item.date) }));
    if (keyed.some((entry) => entry.key === null)) return items;
    return keyed.sort((a, b) => b.key! - a.key! || a.index - b.index).map((entry) => entry.item);
}

/** Consecutive entries grouped by the year at the end of their date; the year is dropped from `label`. */
function groupByYear(items: NewsItem[]) {
    const groups: Array<{ year: string; entries: Array<{ item: NewsItem; label: string }> }> = [];
    for (const item of items) {
        const year = item.date.trim().match(/(\d{4})$/)?.[1] ?? '';
        const label = (year && item.date.trim().slice(0, -4).trim()) || item.date;
        if (groups.at(-1)?.year !== year) groups.push({ year, entries: [] });
        groups.at(-1)!.entries.push({ item, label });
    }
    return groups;
}

export default function News({ id = 'news', items, title }: NewsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [moreBelow, setMoreBelow] = useState(false);
    const sorted = useMemo(() => sortNewestFirst(items), [items]);
    const years = useMemo(() => groupByYear(sorted), [sorted]);

    const update = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 2);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [update, sorted.length]);

    if (sorted.length === 0) return null;

    return (
        <section aria-labelledby={`${id}-title`}>
            <SectionHeading id={`${id}-title`} title={title} />
            <div className="relative">
                <div
                    ref={scrollRef}
                    onScroll={update}
                    // focusable so keyboard users can scroll it
                    tabIndex={0}
                    role="region"
                    aria-labelledby={`${id}-title`}
                    className="news-scroll max-h-[260px] overflow-y-auto overflow-x-hidden pr-3"
                >
                    <div className="pb-1">
                        {years.map((group) => (
                            <div key={group.year || 'undated'} className="pb-4 last:pb-0">
                                {group.year && (
                                    // stays visible while scrolling through that year
                                    <h3 className="sticky top-0 z-10 bg-background pb-1.5 pt-0.5 text-[13.5px] font-semibold tabular-nums tracking-[0.02em] text-primary">
                                        {group.year}
                                    </h3>
                                )}
                                <ul>
                                    {group.entries.map(({ item, label }, index) => (
                                        <li
                                            key={`${item.date}-${index}`}
                                            className={cn(
                                                // phones: month above the text; wider screens: month column on the left
                                                'relative grid grid-cols-1 pb-3 pl-5 text-[14.5px] leading-relaxed last:pb-0 sm:grid-cols-[2.75rem_1fr] sm:gap-x-3 sm:text-[15px]',
                                                // connecting line to the next dot
                                                'before:absolute before:left-[4px] before:top-[12px] before:-bottom-[12px] before:w-px before:bg-accent/45 last:before:hidden',
                                                // dot
                                                'after:absolute after:left-0 after:top-[8px] after:h-[9px] after:w-[9px] after:rounded-full after:bg-accent'
                                            )}
                                        >
                                            <span className="pt-px text-[13.5px] font-medium tabular-nums text-accent-ink">
                                                {label}
                                                {group.year && label !== item.date && <span className="sr-only"> {group.year}</span>}
                                            </span>
                                            <span className="text-foreground">
                                                <Markdown inline>{item.content}</Markdown>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div
                    aria-hidden="true"
                    className={cn(
                        'news-fade pointer-events-none absolute inset-x-0 bottom-0 mr-3 h-7 transition-opacity duration-200',
                        moreBelow ? 'opacity-100' : 'opacity-0'
                    )}
                />
            </div>
        </section>
    );
}
