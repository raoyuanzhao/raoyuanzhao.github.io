import ReactMarkdown, { type Components } from 'react-markdown';
import { cn } from '@/lib/utils';

function isExternal(href?: string) {
    return !!href && /^https?:\/\//.test(href);
}

const MarkdownLink: Components['a'] = ({ href, children }) => (
    <a
        href={href}
        className="text-link-style"
        {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
        {children}
    </a>
);

const blockComponents: Components = {
    h1: ({ children }) => <h2 className="text-[22px] font-semibold text-primary mt-8 mb-3">{children}</h2>,
    h2: ({ children }) => <h2 className="section-title mt-10 mb-[18px]">{children}</h2>,
    h3: ({ children }) => <h3 className="text-[16px] font-semibold text-primary mt-6 mb-2">{children}</h3>,
    p: ({ children }) => <p className="mb-[14px] last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-5 mb-[14px] space-y-1 marker:text-accent">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 mb-[14px] space-y-1 marker:text-accent">{children}</ol>,
    li: ({ children }) => <li className="pl-1">{children}</li>,
    a: MarkdownLink,
    blockquote: ({ children }) => (
        <blockquote className="border-l-[3px] border-accent pl-4 my-4 text-muted">{children}</blockquote>
    ),
    strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => <hr className="my-8 border-line-soft" />,
    code: ({ children }) => (
        <code className="px-1.5 py-0.5 rounded bg-neutral-100 font-mono text-[0.9em]">{children}</code>
    ),
};

const inlineComponents: Components = {
    ...blockComponents,
    p: ({ children }) => <>{children}</>,
};

interface MarkdownProps {
    children: string;
    inline?: boolean;
    className?: string;
}

export default function Markdown({ children, inline = false, className }: MarkdownProps) {
    const content = (
        <ReactMarkdown
            components={inline ? inlineComponents : blockComponents}
            allowedElements={inline ? ['p', 'a', 'strong', 'em', 'code'] : undefined}
            unwrapDisallowed
        >
            {children}
        </ReactMarkdown>
    );

    if (inline) {
        return className ? <span className={className}>{content}</span> : content;
    }
    return <div className={cn(className)}>{content}</div>;
}
