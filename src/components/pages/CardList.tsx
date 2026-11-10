import Image from 'next/image';
import { MapPinIcon } from '@heroicons/react/24/outline';
import type { CardItem, CardPageConfig } from '@/types/page';
import Markdown from '@/components/ui/Markdown';
import { cn } from '@/lib/utils';

interface CardListProps {
    items: CardItem[];
    layout?: CardPageConfig['layout'];
    headingLevel?: 'h2' | 'h3' | 'h4';
    compact?: boolean;
}

function CardEntry({ item, headingLevel: Heading, compact }: { item: CardItem; headingLevel: 'h2' | 'h3' | 'h4'; compact: boolean }) {
    const title = item.link ? (
        <a href={item.link} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent-ink">
            {item.title}
        </a>
    ) : (
        item.title
    );

    return (
        <div className="flex items-start gap-4">
            {item.image && (
                <Image
                    src={item.image}
                    alt=""
                    width={52}
                    height={52}
                    // white tile keeps dark logo marks visible in dark mode
                    className="h-11 w-11 flex-shrink-0 rounded-lg border border-line bg-white object-contain p-1 sm:h-[52px] sm:w-[52px]"
                />
            )}
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <Heading className="text-[15.5px] font-semibold leading-snug text-primary">{title}</Heading>
                    {item.status && (
                        <span className="rounded-full border border-accent/60 bg-accent/[0.10] px-2 py-px text-[11.5px] font-medium uppercase tracking-[0.06em] text-accent-ink">
                            {item.status}
                        </span>
                    )}
                </div>
                {item.subtitle && <p className="mt-0.5 text-[14px] text-muted">{item.subtitle}</p>}
                {item.details?.map((detail) => (
                    <p key={detail} className="mt-0.5 text-[14px] text-muted">
                        <Markdown inline>{detail}</Markdown>
                    </p>
                ))}
                {(item.date || item.location) && (
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px]">
                        {item.date && <span className="font-medium text-accent-ink">{item.date}</span>}
                        {item.location && (
                            <span className="inline-flex items-center gap-1 text-muted">
                                <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                {item.location}
                            </span>
                        )}
                    </p>
                )}
                {item.content && !compact && (
                    <Markdown className="mt-2 text-[14.5px] leading-relaxed text-foreground">{item.content}</Markdown>
                )}
                {item.links && item.links.length > 0 && (
                    <p className="mt-2 text-[13px]">
                        {item.links.map((link, index) => (
                            <span key={link.url}>
                                {index > 0 && <span aria-hidden="true" className="mx-1.5 text-muted">/</span>}
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-link-style">
                                    {link.label}
                                </a>
                            </span>
                        ))}
                    </p>
                )}
                {item.tags && item.tags.length > 0 && !compact && (
                    <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Tags">
                        {item.tags.map((tag) => (
                            <li key={tag} className="rounded-full border border-secondary/50 bg-secondary/[0.07] px-2.5 py-0.5 text-[12px] text-secondary-ink">
                                {tag}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default function CardList({ items, layout = 'timeline', headingLevel = 'h3', compact = false }: CardListProps) {
    if (layout === 'timeline') {
        return (
            <ol className="ml-[6px]">
                {items.map((item, index) => (
                    <li
                        key={`${item.title}-${index}`}
                        className={cn(
                            'relative pl-7',
                            index < items.length - 1 ? (compact ? 'pb-5' : 'pb-7') : 'pb-1',
                            // vertical rule
                            'before:absolute before:left-0 before:top-2 before:w-[2px] before:bg-accent/45',
                            index < items.length - 1 ? 'before:bottom-0' : 'before:h-6',
                            // dot
                            'after:absolute after:left-[-5px] after:top-[6px] after:h-3 after:w-3 after:rounded-full after:border-2 after:border-background after:bg-accent'
                        )}
                    >
                        <CardEntry item={item} headingLevel={headingLevel} compact={compact} />
                    </li>
                ))}
            </ol>
        );
    }

    if (layout === 'list') {
        return (
            <ul className="divide-y divide-line-soft">
                {items.map((item, index) => (
                    <li key={`${item.title}-${index}`} className={compact ? 'py-3 first:pt-0' : 'py-5 first:pt-0'}>
                        <CardEntry item={item} headingLevel={headingLevel} compact={compact} />
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <ul className="grid gap-4">
            {items.map((item, index) => (
                <li key={`${item.title}-${index}`} className="rounded-xl border border-line-soft bg-surface p-5">
                    <CardEntry item={item} headingLevel={headingLevel} compact={compact} />
                </li>
            ))}
        </ul>
    );
}

export function groupItems(items: CardItem[], order: string[] = []): Array<{ name: string; items: CardItem[] }> {
    const groups = new Map<string, CardItem[]>();
    order.forEach((name) => groups.set(name, []));
    items.forEach((item) => {
        const name = item.category || 'Other';
        groups.set(name, [...(groups.get(name) || []), item]);
    });
    return Array.from(groups.entries())
        .filter(([, groupItems]) => groupItems.length > 0)
        .map(([name, groupItems]) => ({ name, items: groupItems }));
}
