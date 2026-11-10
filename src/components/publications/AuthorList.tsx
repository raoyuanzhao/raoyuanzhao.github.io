'use client';

import { useState } from 'react';
import type { Author } from '@/types/publication';
import { useMessages } from '@/lib/i18n/useMessages';
import { cn } from '@/lib/utils';

const MAX_VISIBLE = 10;
const LEADING = 6;

function AuthorName({ author }: { author: Author }) {
    return (
        <span
            className={cn(
                author.isHighlighted && 'font-semibold text-primary underline decoration-accent decoration-2 underline-offset-[3px]',
                author.isCoAuthor && !author.isHighlighted && 'underline decoration-neutral-400 underline-offset-4'
            )}
        >
            {author.name}
            {author.isCorresponding && <sup className="ml-px">†</sup>}
        </span>
    );
}

export default function AuthorList({ authors }: { authors: Author[] }) {
    const messages = useMessages();
    const [expanded, setExpanded] = useState(false);

    if (authors.length <= MAX_VISIBLE || expanded) {
        return (
            <>
                {authors.map((author, idx) => (
                    <span key={`${author.name}-${idx}`}>
                        <AuthorName author={author} />
                        {idx < authors.length - 1 && ', '}
                    </span>
                ))}
                {expanded && (
                    <>
                        {' '}
                        <button type="button" onClick={() => setExpanded(false)} className="text-link-style text-[0.95em]">
                            ({messages.publications.fewerAuthors})
                        </button>
                    </>
                )}
            </>
        );
    }

    const leading = authors.slice(0, LEADING);
    const highlightedIndex = authors.findIndex((a) => a.isHighlighted);
    const showHighlighted = highlightedIndex >= LEADING;
    const hiddenCount = authors.length - leading.length - (showHighlighted ? 1 : 0);

    return (
        <>
            {leading.map((author, idx) => (
                <span key={`${author.name}-${idx}`}>
                    <AuthorName author={author} />
                    {', '}
                </span>
            ))}
            {showHighlighted && (
                <>
                    <span aria-hidden="true">…, </span>
                    <AuthorName author={authors[highlightedIndex]} />
                    {', '}
                </>
            )}
            <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-link-style text-[0.95em]"
                aria-label={`${messages.publications.moreAuthors(hiddenCount)}: show all ${authors.length} authors`}
            >
                {messages.publications.moreAuthors(hiddenCount)}
            </button>
        </>
    );
}
