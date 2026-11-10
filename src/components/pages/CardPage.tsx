import { CardPageConfig } from '@/types/page';
import { generateSlug } from '@/lib/utils';
import PageHeader from './PageHeader';
import CardList, { groupItems } from './CardList';

export default function CardPage({ config, embedded = false }: { config: CardPageConfig; embedded?: boolean }) {
    const items = (config.items || []).filter((item) => !item.hidden);
    const layout = config.layout || 'cards';

    return (
        <div className="fade-in">
            <PageHeader title={config.title} description={config.description} embedded={embedded} />

            {items.length === 0 ? (
                config.empty_message && (
                    <p className="rounded-[14px] border border-dashed border-line px-5 py-6 text-[15px] text-muted">
                        {config.empty_message}
                    </p>
                )
            ) : config.group_by === 'category' ? (
                <div className="space-y-11">
                    {groupItems(items, config.groups).map((group) => {
                        const id = `group-${generateSlug(group.name)}`;
                        return (
                            <section key={group.name} aria-labelledby={id}>
                                <h2 id={id} className="section-title mb-[22px]">{group.name}</h2>
                                <CardList items={group.items} layout={layout} compact={config.compact} />
                            </section>
                        );
                    })}
                </div>
            ) : (
                <CardList items={items} layout={layout} headingLevel={embedded ? 'h3' : 'h2'} compact={config.compact} />
            )}
        </div>
    );
}
