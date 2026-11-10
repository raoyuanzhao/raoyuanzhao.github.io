import Markdown from '@/components/ui/Markdown';

interface PageHeaderProps {
    title: string;
    description?: string;
    embedded?: boolean;
    children?: React.ReactNode;
}

export default function PageHeader({ title, description, embedded = false, children }: PageHeaderProps) {
    const Heading = embedded ? 'h2' : 'h1';

    return (
        <header className={embedded ? 'mb-6' : 'mb-10'}>
            <Heading className={embedded ? 'section-title mb-[18px]' : 'text-[28px] font-semibold leading-tight tracking-[-0.01em] text-primary sm:text-[32px]'}>
                {title}
            </Heading>
            {!embedded && <div aria-hidden="true" className="mt-4 h-[2px] w-12 rounded-full bg-accent" />}
            {description && (
                <Markdown className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-muted">{description}</Markdown>
            )}
            {children && <div className="mt-5">{children}</div>}
        </header>
    );
}
