'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { Publication } from '@/types/publication';
import { useMessages } from '@/lib/i18n/useMessages';
import { cn } from '@/lib/utils';
import FormattedBibTeXText from './FormattedBibTeXText';
import AuthorList from './AuthorList';

interface PublicationEntryProps {
    pub: Publication;
    /** "compact" omits abstract/BibTeX toggles and previews (homepage, CV) */
    variant?: 'full' | 'compact';
    headingLevel?: 'h3' | 'h4';
}

const pillClass =
    'inline-flex items-center rounded-md border border-line px-2.5 py-[3px] text-[12.5px] font-medium text-accent-ink transition-colors hover:border-accent hover:bg-accent/[0.08]';

function isSameArxivUrl(url: string | undefined, arxivId: string | undefined) {
    return !!url && !!arxivId && url.includes(`arxiv.org/abs/${arxivId}`);
}

export default function PublicationEntry({ pub, variant = 'full', headingLevel: Heading = 'h3' }: PublicationEntryProps) {
    const messages = useMessages();
    const [panel, setPanel] = useState<'abstract' | 'bibtex' | null>(null);
    const [copied, setCopied] = useState(false);
    const full = variant === 'full';

    const links = [
        pub.url && { label: messages.publications.paper, href: pub.url },
        pub.pdfUrl && { label: messages.publications.pdf, href: pub.pdfUrl },
        pub.arxivId && !isSameArxivUrl(pub.url, pub.arxivId) && {
            label: messages.publications.arxiv,
            href: `https://arxiv.org/abs/${pub.arxivId}`,
        },
        pub.code && { label: messages.publications.code, href: pub.code },
        pub.project && { label: messages.publications.project, href: pub.project },
        full && pub.doi && { label: messages.publications.doi, href: `https://doi.org/${pub.doi}` },
    ].filter(Boolean) as Array<{ label: string; href: string }>;

    const panelId = `${pub.id}-panel`;
    const secondaryVenue = pub.venueFull && pub.venueFull !== pub.venue && (full || !pub.venue) ? pub.venueFull : undefined;
    const venueHasYear = [pub.venue, secondaryVenue].some((v) => v?.includes(String(pub.year)));

    const copyBibtex = async () => {
        try {
            await navigator.clipboard.writeText(pub.bibtex || '');
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    return (
        <article className="border-l-[3px] border-accent py-[14px] pl-4">
            <div className={cn('flex flex-col gap-4', full && pub.preview && 'sm:flex-row')}>
                {full && pub.preview && (
                    <div className="relative aspect-[4/3] w-full flex-shrink-0 overflow-hidden rounded-md bg-neutral-100 sm:w-40">
                        <Image
                            src={`/papers/${pub.preview}`}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 160px"
                        />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <Heading className="mb-1 text-[15.5px] font-semibold leading-snug text-primary text-pretty">
                        {pub.url ? (
                            <a href={pub.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent-ink">
                                <FormattedBibTeXText nodes={pub.titleNodes} fallback={pub.title} />
                            </a>
                        ) : (
                            <FormattedBibTeXText nodes={pub.titleNodes} fallback={pub.title} />
                        )}
                    </Heading>
                    <p className="mb-1 text-[14px] leading-relaxed text-muted">
                        <AuthorList authors={pub.authors} />
                    </p>
                    <p className="mb-2 text-[14px] leading-relaxed">
                        {pub.venue && <span className="font-semibold text-secondary-ink">{pub.venue}</span>}
                        {secondaryVenue && (
                            <>
                                {pub.venue && <span className="text-muted" aria-hidden="true"> · </span>}
                                <span className="italic text-muted">{secondaryVenue}</span>
                            </>
                        )}
                        {!venueHasYear && (
                            <span className="text-muted">{pub.venue || secondaryVenue ? ', ' : ''}{pub.year}</span>
                        )}
                    </p>

                    {pub.description && (
                        <p className="mb-2 text-[14px] text-muted">{pub.description}</p>
                    )}

                    {(links.length > 0 || (full && (pub.abstract || pub.bibtex))) && (
                        <div className="flex flex-wrap gap-1.5">
                            {links.map((link) => (
                                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className={pillClass}>
                                    {link.label}
                                </a>
                            ))}
                            {full && pub.abstract && (
                                <button
                                    type="button"
                                    onClick={() => setPanel(panel === 'abstract' ? null : 'abstract')}
                                    aria-expanded={panel === 'abstract'}
                                    aria-controls={panelId}
                                    className={cn(pillClass, panel === 'abstract' && 'border-accent bg-accent/10')}
                                >
                                    {messages.publications.abstract}
                                </button>
                            )}
                            {full && pub.bibtex && (
                                <button
                                    type="button"
                                    onClick={() => setPanel(panel === 'bibtex' ? null : 'bibtex')}
                                    aria-expanded={panel === 'bibtex'}
                                    aria-controls={panelId}
                                    className={cn(pillClass, panel === 'bibtex' && 'border-accent bg-accent/10')}
                                >
                                    {messages.publications.bibtex}
                                </button>
                            )}
                        </div>
                    )}

                    {full && panel && (
                        <div id={panelId} className="mt-3 rounded-lg border border-line-soft bg-surface p-4">
                            {panel === 'abstract' ? (
                                <p className="text-[14px] leading-relaxed text-foreground">{pub.abstract}</p>
                            ) : (
                                <div className="relative">
                                    <pre className="overflow-x-auto whitespace-pre-wrap break-words pr-10 font-mono text-[12px] leading-relaxed text-foreground">
                                        {pub.bibtex}
                                    </pre>
                                    <button
                                        type="button"
                                        onClick={copyBibtex}
                                        className="absolute right-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-accent hover:text-accent-ink"
                                        aria-label={messages.common.copyToClipboard}
                                        title={messages.common.copyToClipboard}
                                    >
                                        {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                                    </button>
                                    <span className="sr-only" aria-live="polite">{copied ? messages.common.copied : ''}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
