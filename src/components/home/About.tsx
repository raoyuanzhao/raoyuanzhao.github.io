import { ArrowUpRightIcon, ChatBubbleLeftEllipsisIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Markdown from '@/components/ui/Markdown';
import SectionHeading from '@/components/ui/SectionHeading';
import type { ReachOutConfig } from '@/types/page';

interface AboutProps {
    id?: string;
    content: string;
    title: string;
    reachOut?: ReachOutConfig;
}

export default function About({ id, content, title, reachOut }: AboutProps) {
    return (
        <section aria-labelledby={id ? `${id}-title` : undefined}>
            <SectionHeading id={id ? `${id}-title` : undefined} title={title} />
            <Markdown className="text-[16px] leading-[1.7] text-foreground">{content}</Markdown>
            {reachOut?.href && (
                <div className="mt-8 rounded-2xl bg-accent/8 px-5 py-4 sm:px-6 sm:py-5">
                    <h3 className="flex items-center gap-2 text-[17.5px] font-semibold leading-snug text-primary">
                        <ChatBubbleLeftEllipsisIcon className="h-5 w-5 shrink-0 text-accent-strong" aria-hidden="true" />
                        {reachOut.title}
                    </h3>
                    {reachOut.text && (
                        <p className="mt-1.5 text-[16px] leading-[1.7] text-foreground text-pretty">{reachOut.text}</p>
                    )}
                    <a
                        href={reachOut.href}
                        className="group mt-2 inline-flex items-center gap-1 text-[15px] font-medium text-accent-ink underline decoration-transparent decoration-[1.5px] underline-offset-4 transition-colors duration-150 hover:decoration-accent"
                    >
                        <EnvelopeIcon className="mr-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        {reachOut.link_label || 'Get in touch'}
                        <ArrowUpRightIcon
                            className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:transform-none"
                            aria-hidden="true"
                        />
                    </a>
                </div>
            )}
        </section>
    );
}
