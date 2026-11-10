import SectionHeading from '@/components/ui/SectionHeading';

interface ResearchInterestsProps {
    id?: string;
    title: string;
    interests: string[];
}

export default function ResearchInterests({ id, title, interests }: ResearchInterestsProps) {
    if (interests.length === 0) return null;

    return (
        <section aria-labelledby={id ? `${id}-title` : undefined}>
            <SectionHeading id={id ? `${id}-title` : undefined} title={title} />
            <ul className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                    <li
                        key={interest}
                        className="rounded-full border border-accent/45 bg-accent/[0.07] px-3.5 py-1 text-[14px] font-medium text-foreground"
                    >
                        {interest}
                    </li>
                ))}
            </ul>
        </section>
    );
}
