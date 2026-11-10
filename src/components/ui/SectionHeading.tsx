import Link from 'next/link';

interface SectionHeadingProps {
    id?: string;
    title: string;
    as?: 'h1' | 'h2';
    action?: { href: string; label: string };
}

export default function SectionHeading({ id, title, as: Tag = 'h2', action }: SectionHeadingProps) {
    return (
        <div className="flex items-end justify-between gap-4 mb-[18px]">
            <Tag id={id} className="section-title">{title}</Tag>
            {action && (
                <Link
                    href={action.href}
                    className="text-link-style text-[13px] pb-[10px] whitespace-nowrap"
                >
                    {action.label} <span aria-hidden="true">→</span>
                </Link>
            )}
        </div>
    );
}
