import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { VisitorMapConfig } from '@/lib/config';
import type { VisitorCountry, VisitorStats } from '@/lib/visitorStats';
import { MAP_HEIGHT, MAP_WIDTH } from '@/lib/worldMap';
import { cn } from '@/lib/utils';

const numberFormat = new Intl.NumberFormat('en');
const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function sanitizeHex(value?: string): string | undefined {
    const cleaned = value?.replace(/^#/, '').trim();
    return cleaned && /^[0-9a-fA-F]{6}$/.test(cleaned) ? cleaned.toLowerCase() : undefined;
}

function mapColorVars(config?: VisitorMapConfig): CSSProperties {
    const vars: Record<string, string> = {};
    const set = (name: string, value?: string) => {
        const hex = sanitizeHex(value);
        if (hex) vars[name] = `#${hex}`;
    };
    set('--vm-land', config?.light?.cl);
    set('--vm-ocean', config?.light?.co);
    set('--vm-land-dark', config?.dark?.cl);
    set('--vm-ocean-dark', config?.dark?.co);
    return vars as CSSProperties;
}

function countLabel(count: number, metric: VisitorStats['metric']): string {
    const unit = metric === 'visitors' ? 'visitor' : 'visit';
    return `${numberFormat.format(count)} ${unit}${count === 1 ? '' : 's'}`;
}

function Highlight({ icon, label, country, metric }: { icon: string; label: string; country: VisitorCountry; metric: VisitorStats['metric'] }) {
    return (
        <div>
            <dt className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                <span aria-hidden="true" className="text-[12px] tracking-normal">{icon}</span>
                {label}
            </dt>
            <dd className="mt-1 flex items-center gap-2 text-[13px] leading-snug text-foreground">
                {country.flag && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={country.flag}
                        alt=""
                        width={16}
                        height={12}
                        loading="lazy"
                        decoding="async"
                        className="h-3 w-4 shrink-0 rounded-[2px] object-cover shadow-[0_0_0_0.5px_rgba(36,36,36,0.25)]"
                    />
                )}
                <span className="min-w-0 truncate font-medium">{country.name}</span>
                <span className="ml-auto shrink-0 pl-1 text-[12px] tabular-nums text-muted">{countLabel(country.count, metric)}</span>
            </dd>
        </div>
    );
}

interface VisitorMapProps {
    config?: VisitorMapConfig;
    stats?: VisitorStats | null;
    /** A provider is configured, so visits are (or will be) recorded */
    statsEnabled?: boolean;
    privacyHref?: string;
    className?: string;
}

export default function VisitorMap({ config, stats, statsEnabled, privacyHref, className }: VisitorMapProps) {
    if (!config || config.enabled === false) return null;

    const title = config.title || 'Visitor Map';
    const hasVisits = !!stats && stats.total > 0;
    const placed = hasVisits ? stats.countries.filter((c) => c.point) : [];
    const maxCount = placed[0]?.count ?? 1;
    const updated = stats?.updatedAt ? dateFormat.format(new Date(stats.updatedAt)) : undefined;

    const mapLabel = hasVisits
        ? `World map of ${countLabel(stats.total, stats.metric)} from ${stats.countries.length} ${stats.countries.length === 1 ? 'country' : 'countries'}`
        : 'World map. No visits recorded yet.';

    return (
        <section
            aria-label={title}
            className={cn('w-full max-w-[280px] rounded-[14px] border border-dashed border-line px-4 py-4 text-left lg:max-w-[240px]', className)}
        >
            <h2 className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-primary">{title}</h2>

            <div className="visitor-map-frame overflow-hidden rounded-lg" style={mapColorVars(config)}>
                <div className="relative mx-auto my-1.5 w-[94%]" role="img" aria-label={mapLabel}>
                    <div className="world-map-land w-full" />
                    {placed.length > 0 && (
                        <svg
                            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                            className="absolute inset-0 h-full w-full overflow-visible"
                            aria-hidden="true"
                        >
                            {placed.map((country, index) => {
                                const r = 9 + 19 * Math.sqrt(country.count / maxCount);
                                return (
                                    <g key={country.code}>
                                        {index === 0 && <circle cx={country.point!.x} cy={country.point!.y} r={r + 9} className="visitor-dot-halo" />}
                                        <circle cx={country.point!.x} cy={country.point!.y} r={r} className={cn('visitor-dot', index === 0 && 'visitor-dot-top')}>
                                            <title>{`${country.name}: ${countLabel(country.count, stats!.metric)}`}</title>
                                        </circle>
                                    </g>
                                );
                            })}
                        </svg>
                    )}
                </div>
            </div>

            {hasVisits && stats.top && (
                <dl className="mt-3 space-y-2.5">
                    <Highlight icon="🏆" label="Most Visits" country={stats.top} metric={stats.metric} />
                    {stats.rarest && <Highlight icon="💎" label="Rarest Visitor" country={stats.rarest} metric={stats.metric} />}
                </dl>
            )}

            <div className="mt-2.5 text-[12px] leading-relaxed text-muted">
                {hasVisits ? (
                    <p>
                        {countLabel(stats.total, stats.metric)} from {stats.countries.length}{' '}
                        {stats.countries.length === 1 ? 'country' : 'countries'}
                    </p>
                ) : statsEnabled ? (
                    <p>No visits recorded yet.</p>
                ) : (
                    <>
                        <p>Live visitor statistics are not enabled yet.</p>
                        {process.env.NODE_ENV === 'development' && (
                            <p className="mt-1.5 rounded-md bg-neutral-100 px-2 py-1.5 text-[11.5px]">
                                Dev only: set a provider under <code className="font-mono">[visitor_map]</code> in{' '}
                                <code className="font-mono">content/config.toml</code>. See README → Visitor map.
                            </p>
                        )}
                    </>
                )}
                {(statsEnabled || hasVisits) && (updated || privacyHref) && (
                    <p className="text-[11.5px]">
                        {hasVisits && updated && <>Updated {updated}</>}
                        {hasVisits && updated && privacyHref && <span aria-hidden="true"> · </span>}
                        {privacyHref && (
                            <Link href={privacyHref} className="text-link-style">
                                Privacy
                            </Link>
                        )}
                    </p>
                )}
            </div>
        </section>
    );
}
