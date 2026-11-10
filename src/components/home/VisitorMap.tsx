'use client';

import { useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import Link from 'next/link';
import type { VisitorMapConfig } from '@/lib/config';
import type { VisitorCountry, VisitorStats } from '@/lib/visitorStats';
import { MAP_HEIGHT, MAP_WIDTH } from '@/lib/worldMap';
import { cn } from '@/lib/utils';

const numberFormat = new Intl.NumberFormat('en');
const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Dot radius range in map units (the map is 1000 units wide, about 240–260 px in the sidebar). */
const DOT_MIN_R = 9;
const DOT_MAX_R = 22;
/** How far outside a dot the pointer may be and still select it, in screen pixels. */
const HIT_SLOP_PX = 8;

type PlacedCountry = VisitorCountry & { point: { x: number; y: number }; r: number };

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

function Flag({ src }: { src?: string }) {
    if (!src) return null;
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt=""
            width={16}
            height={12}
            loading="lazy"
            decoding="async"
            className="h-3 w-4 shrink-0 rounded-[2px] object-cover shadow-[0_0_0_0.5px_rgba(36,36,36,0.25)]"
        />
    );
}

function Highlight({ icon, label, country, metric }: { icon: string; label: string; country: VisitorCountry; metric: VisitorStats['metric'] }) {
    return (
        <div>
            <dt className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                <span aria-hidden="true" className="text-[12px] tracking-normal">{icon}</span>
                {label}
            </dt>
            <dd className="mt-1 flex items-center gap-2 text-[13px] leading-snug text-foreground">
                <Flag src={country.flag} />
                <span className="min-w-0 truncate font-medium">{country.name}</span>
                <span className="ml-auto shrink-0 pl-1 text-[12px] tabular-nums text-muted">{countLabel(country.count, metric)}</span>
            </dd>
        </div>
    );
}

/**
 * Dots on the world map with a tooltip. Hovering picks the nearest dot, so small dots in dense
 * regions stay reachable; touch selects on tap; the arrow keys step through countries west to east.
 */
function MapDots({ countries, metric, label }: { countries: VisitorCountry[]; metric: VisitorStats['metric']; label: string }) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [activeCode, setActiveCode] = useState<string | null>(null);
    const [announce, setAnnounce] = useState(false);

    // Square-root scaling relative to the busiest country keeps large counts from dominating.
    // Drawn largest first, so smaller dots stay on top where they overlap.
    const placed = useMemo<PlacedCountry[]>(() => {
        const withPoint = countries.filter((c): c is VisitorCountry & { point: { x: number; y: number } } => !!c.point);
        const max = Math.max(1, ...withPoint.map((c) => c.count));
        return withPoint
            .map((c) => ({ ...c, r: DOT_MIN_R + (DOT_MAX_R - DOT_MIN_R) * Math.sqrt(c.count / max) }))
            .sort((a, b) => b.r - a.r);
    }, [countries]);
    const westToEast = useMemo(() => [...placed].sort((a, b) => a.point.x - b.point.x || a.point.y - b.point.y), [placed]);

    if (placed.length === 0) {
        return <div className="world-map-land w-full" role="img" aria-label={label} />;
    }

    const active = placed.find((c) => c.code === activeCode);

    const nearestAt = (clientX: number, clientY: number): PlacedCountry | undefined => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0) return undefined;
        const scale = MAP_WIDTH / rect.width;
        const x = (clientX - rect.left) * scale;
        const y = (clientY - rect.top) * scale;
        let best: PlacedCountry | undefined;
        let bestGap = HIT_SLOP_PX * scale;
        for (const c of placed) {
            const gap = Math.hypot(c.point.x - x, c.point.y - y) - c.r;
            if (gap <= bestGap) {
                best = c;
                bestGap = gap;
            }
        }
        return best;
    };

    const select = (code: string | null, fromKeyboard = false) => {
        setActiveCode(code);
        setAnnounce(fromKeyboard);
    };

    const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
        if (event.pointerType === 'touch') return;
        select(nearestAt(event.clientX, event.clientY)?.code ?? null);
    };

    const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
        if (event.pointerType !== 'touch') return;
        const hit = nearestAt(event.clientX, event.clientY);
        select(hit && hit.code !== activeCode ? hit.code : null);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const index = westToEast.findIndex((c) => c.code === activeCode);
        const last = westToEast.length - 1;
        let next: number | null;
        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                next = index < 0 || index === last ? 0 : index + 1;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                next = index <= 0 ? last : index - 1;
                break;
            case 'Home':
                next = 0;
                break;
            case 'End':
                next = last;
                break;
            case 'Escape':
                if (!activeCode) return;
                select(null);
                event.preventDefault();
                return;
            default:
                return;
        }
        event.preventDefault();
        select(westToEast[next].code, true);
    };

    const xFrac = active ? active.point.x / MAP_WIDTH : 0;
    const below = !!active && active.point.y < MAP_HEIGHT * 0.3;
    const anchorY = active ? (active.point.y + (below ? active.r : -active.r)) / MAP_HEIGHT : 0;

    return (
        <div
            role="group"
            tabIndex={0}
            aria-label={`${label}. Use the arrow keys to show each country.`}
            className="relative"
            onKeyDown={onKeyDown}
            onFocus={(event) => {
                if (!activeCode && event.currentTarget.matches(':focus-visible')) select(placed[0].code, true);
            }}
            onBlur={() => select(null)}
        >
            <div className="world-map-land w-full" />
            <svg
                ref={svgRef}
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                className="absolute inset-0 h-full w-full overflow-visible"
                aria-hidden="true"
                onPointerMove={onPointerMove}
                onPointerLeave={(event) => event.pointerType !== 'touch' && select(null)}
                onPointerDown={onPointerDown}
            >
                {placed.map((c) => (
                    <circle
                        key={c.code}
                        cx={c.point.x}
                        cy={c.point.y}
                        r={c.r}
                        className={cn('visitor-dot', c.code === activeCode && 'visitor-dot-active')}
                    />
                ))}
            </svg>

            {active && (
                <div
                    aria-hidden="true"
                    className="visitor-tooltip pointer-events-none absolute z-20 flex max-w-[240px] items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-[11.5px] leading-tight text-foreground shadow-soft"
                    style={{
                        left: `${xFrac * 100}%`,
                        top: `${anchorY * 100}%`,
                        // Slide the anchor across the tooltip so it never sticks out past the map's edges.
                        transform: `translate(${-xFrac * 100}%, ${below ? '6px' : 'calc(-100% - 6px)'})`,
                    }}
                >
                    <Flag src={active.flag} />
                    <span className="min-w-0 truncate font-medium">{active.name}</span>
                    <span className="shrink-0 tabular-nums text-muted">{countLabel(active.count, metric)}</span>
                </div>
            )}
            <p className="sr-only" aria-live="polite">
                {active && announce ? `${active.name}: ${countLabel(active.count, metric)}` : ''}
            </p>
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
    const updated = stats?.updatedAt ? dateFormat.format(new Date(stats.updatedAt)) : undefined;
    const countryCount = stats?.countries.length ?? 0;
    const countriesLabel = `${countryCount} ${countryCount === 1 ? 'country' : 'countries'}`;

    const mapLabel = hasVisits
        ? `World map of ${countLabel(stats.total, stats.metric)} from ${countriesLabel}`
        : 'World map. No visits recorded yet.';

    return (
        <section
            aria-label={title}
            className={cn('w-full max-w-[340px] rounded-[14px] border border-dashed border-line px-4 py-4 text-left lg:max-w-none', className)}
        >
            <div className="mb-2.5 flex items-start justify-between gap-3">
                <h2 className="text-[12px] font-semibold uppercase leading-[1.35] tracking-[0.08em] text-primary">{title}</h2>
                {hasVisits && (
                    <p className="shrink-0 text-right leading-none">
                        <span className="block text-[14px] font-semibold tabular-nums text-primary">{numberFormat.format(stats.total)}</span>
                        <span className="mt-1 block text-[9.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                            {stats.metric === 'visitors' ? 'Total Visitors' : 'Total Visits'}
                        </span>
                    </p>
                )}
            </div>

            <div className="visitor-map-frame rounded-lg" style={mapColorVars(config)}>
                <div className="mx-auto w-[94%] py-1.5">
                    {hasVisits ? (
                        <MapDots countries={stats.countries} metric={stats.metric} label={mapLabel} />
                    ) : (
                        <div className="world-map-land w-full" role="img" aria-label={mapLabel} />
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
                    <p>From {countriesLabel}</p>
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
