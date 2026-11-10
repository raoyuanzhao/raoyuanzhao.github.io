'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import Link from 'next/link';
import { GlobeEuropeAfricaIcon } from '@heroicons/react/24/outline';
import type { VisitorMapConfig } from '@/lib/config';
import type { VisitorCountry, VisitorStats } from '@/lib/visitorStats';
import { MAP_HEIGHT, MAP_WIDTH } from '@/lib/worldMap';
import { cn } from '@/lib/utils';

const numberFormat = new Intl.NumberFormat('en');
const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Dot radius range in map units at the full-world view (the map is 1000 units wide, about 240–260 px in the sidebar). */
const DOT_MIN_R = 9;
const DOT_MAX_R = 22;
/** How far outside a dot the pointer may be and still select it, in screen pixels. */
const HIT_SLOP_PX = 8;

/** Full-world view: the map plus a small ocean margin, in map units. Panning never leaves this box. */
const WORLD = { x: -32, y: -24, w: MAP_WIDTH + 64, h: MAP_HEIGHT + 48 };
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
/** Zoom level used when a marker is clicked. */
const COUNTRY_ZOOM = 4;
/** Movement before a press counts as a drag instead of a click or tap, in screen pixels. */
const DRAG_THRESHOLD_PX = { mouse: 4, touch: 8 };
/** Time constant of the zoom/pan easing, in ms. */
const EASE_MS = 70;

type PlacedCountry = VisitorCountry & { point: { x: number; y: number }; r: number };

/** Centre of the visible area (map units) and zoom factor relative to the full-world view. */
interface View {
    cx: number;
    cy: number;
    k: number;
}

const HOME: View = { cx: WORLD.x + WORLD.w / 2, cy: WORLD.y + WORLD.h / 2, k: 1 };

function clampView(view: View): View {
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.k));
    const halfW = WORLD.w / (2 * k);
    const halfH = WORLD.h / (2 * k);
    return {
        k,
        cx: Math.min(WORLD.x + WORLD.w - halfW, Math.max(WORLD.x + halfW, view.cx)),
        cy: Math.min(WORLD.y + WORLD.h - halfH, Math.max(WORLD.y + halfH, view.cy)),
    };
}

function viewBoxOf(view: View) {
    const w = WORLD.w / view.k;
    const h = WORLD.h / view.k;
    return { x: view.cx - w / 2, y: view.cy - h / 2, w, h };
}

/** Zooms by `factor` while keeping the map point (x, y) at the same place on screen. */
function zoomAround(view: View, factor: number, x: number, y: number): View {
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.k * factor));
    const ratio = view.k / k;
    return clampView({ k, cx: x - (x - view.cx) * ratio, cy: y - (y - view.cy) * ratio });
}

/** Markers grow a little when zooming in, but much less than the map, so they stay small and apart. */
const dotScale = (k: number) => Math.pow(k, 0.8);

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

type TouchGesture =
    | { kind: 'pan'; startX: number; startY: number; view: View; moved: boolean }
    | { kind: 'pinch'; dist0: number; k0: number; mapX: number; mapY: number }
    /** After a pinch, until every finger is lifted, so the last finger does not pan or tap. */
    | { kind: 'ended' };

/**
 * World map with visitor dots that can be zoomed (wheel, pinch, +/−) and panned (drag) by changing
 * the SVG viewBox, so land and dots always share one coordinate system. Hovering picks the nearest
 * dot; clicking or tapping a dot flies to it; the arrow keys step through countries west to east.
 */
function ZoomableMap({
    countries,
    metric,
    label,
    style,
}: {
    countries: VisitorCountry[];
    metric: VisitorStats['metric'];
    label: string;
    style: CSSProperties;
}) {
    const groupRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const clipId = `vm-land-${useId().replace(/[^\w-]/g, '')}`;
    const [view, setView] = useState<View>(HOME);
    const viewRef = useRef<View>(HOME);
    const targetRef = useRef<View>(HOME);
    const frameRef = useRef(0);
    const [hoverCode, setHoverCode] = useState<string | null>(null);
    const [pinnedCode, setPinnedCode] = useState<string | null>(null);
    const [announce, setAnnounce] = useState(false);
    const [dragging, setDragging] = useState(false);
    const dragRef = useRef<{ id: number; startX: number; startY: number; view: View; moved: boolean } | null>(null);
    const touchRef = useRef<TouchGesture | null>(null);

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

    const showView = (next: View) => {
        viewRef.current = next;
        setView(next);
    };

    const jumpTo = (next: View) => {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
        targetRef.current = next;
        showView(next);
    };

    /** Eases towards `next`; repeated calls (e.g. wheel ticks) just move the target. */
    const animateTo = (next: View) => {
        if (prefersReducedMotion()) return jumpTo(next);
        targetRef.current = next;
        if (frameRef.current) return;
        let last = performance.now();
        const step = (now: number) => {
            const t = 1 - Math.exp(-(now - last) / EASE_MS);
            last = now;
            const cur = viewRef.current;
            const target = targetRef.current;
            const k = Math.exp(Math.log(cur.k) + (Math.log(target.k) - Math.log(cur.k)) * t);
            const next = clampView({ k, cx: cur.cx + (target.cx - cur.cx) * t, cy: cur.cy + (target.cy - cur.cy) * t });
            const unit = WORLD.w / k / 1000;
            if (Math.abs(Math.log(target.k / next.k)) < 0.002 && Math.abs(target.cx - next.cx) < unit && Math.abs(target.cy - next.cy) < unit) {
                frameRef.current = 0;
                showView(target);
                return;
            }
            showView(next);
            frameRef.current = requestAnimationFrame(step);
        };
        frameRef.current = requestAnimationFrame(step);
    };

    useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

    /** Map position (map units) under a point on screen, and the size of one screen pixel in map units. */
    const toMap = (clientX: number, clientY: number, at: View = viewRef.current) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0) return null;
        const box = viewBoxOf(at);
        return {
            x: box.x + ((clientX - rect.left) / rect.width) * box.w,
            y: box.y + ((clientY - rect.top) / rect.height) * box.h,
            unitsPerPx: box.w / rect.width,
            fx: (clientX - rect.left) / rect.width,
            fy: (clientY - rect.top) / rect.height,
        };
    };

    const nearestAt = (clientX: number, clientY: number): PlacedCountry | undefined => {
        const at = toMap(clientX, clientY);
        if (!at) return undefined;
        const shrink = dotScale(viewRef.current.k);
        let best: PlacedCountry | undefined;
        let bestGap = HIT_SLOP_PX * at.unitsPerPx;
        for (const c of placed) {
            const gap = Math.hypot(c.point.x - at.x, c.point.y - at.y) - c.r / shrink;
            if (gap <= bestGap) {
                best = c;
                bestGap = gap;
            }
        }
        return best;
    };

    const flyTo = (country: PlacedCountry) => {
        setPinnedCode(country.code);
        animateTo(clampView({ k: Math.max(targetRef.current.k, COUNTRY_ZOOM), cx: country.point.x, cy: country.point.y }));
    };

    /** A click or tap that did not move: fly to the marker under it, or unpin when there is none. */
    const pressAt = (clientX: number, clientY: number) => {
        const hit = nearestAt(clientX, clientY);
        setAnnounce(false);
        if (hit) flyTo(hit);
        else setPinnedCode(null);
    };

    const reset = () => {
        setPinnedCode(null);
        animateTo(HOME);
    };

    // Mouse and pen. Touch is handled by the touch listeners below.
    const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
        if (event.pointerType === 'touch' || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        jumpTo(viewRef.current);
        dragRef.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, view: viewRef.current, moved: false };
    };

    const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
        if (event.pointerType === 'touch') return;
        const drag = dragRef.current;
        if (!drag || drag.id !== event.pointerId) {
            setHoverCode(nearestAt(event.clientX, event.clientY)?.code ?? null);
            return;
        }
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX.mouse) return;
        if (!drag.moved) {
            drag.moved = true;
            setDragging(true);
            setHoverCode(null);
        }
        const unitsPerPx = toMap(event.clientX, event.clientY, drag.view)?.unitsPerPx ?? 0;
        jumpTo(clampView({ k: drag.view.k, cx: drag.view.cx - dx * unitsPerPx, cy: drag.view.cy - dy * unitsPerPx }));
    };

    const endDrag = (event: PointerEvent<SVGSVGElement>, cancelled: boolean) => {
        const drag = dragRef.current;
        if (!drag || drag.id !== event.pointerId) return;
        dragRef.current = null;
        setDragging(false);
        if (!drag.moved && !cancelled) pressAt(event.clientX, event.clientY);
    };

    // Wheel and touch need non-passive native listeners so they can stop the page from scrolling.
    const handlers = {
        wheel: (event: WheelEvent) => {
            const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
            const delta = event.deltaY * unit;
            if (delta === 0) return;
            const target = targetRef.current;
            // At the full-world view, scrolling down scrolls the page instead of doing nothing.
            if (delta > 0 && target.k <= MIN_ZOOM + 1e-3) return;
            event.preventDefault();
            const at = toMap(event.clientX, event.clientY);
            if (!at) return;
            animateTo(zoomAround(target, Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.002)), at.x, at.y));
        },
        touchstart: (event: TouchEvent) => {
            const touches = event.touches;
            if (touches.length === 1 && !touchRef.current) {
                jumpTo(viewRef.current);
                touchRef.current = { kind: 'pan', startX: touches[0].clientX, startY: touches[0].clientY, view: viewRef.current, moved: false };
            } else if (touches.length === 2) {
                const midX = (touches[0].clientX + touches[1].clientX) / 2;
                const midY = (touches[0].clientY + touches[1].clientY) / 2;
                const at = toMap(midX, midY);
                if (!at) return;
                jumpTo(viewRef.current);
                const dist0 = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY) || 1;
                touchRef.current = { kind: 'pinch', dist0, k0: viewRef.current.k, mapX: at.x, mapY: at.y };
                setHoverCode(null);
            }
        },
        touchmove: (event: TouchEvent) => {
            const gesture = touchRef.current;
            const touches = event.touches;
            const rect = svgRef.current?.getBoundingClientRect();
            if (!gesture || !rect) return;
            if (gesture.kind === 'pinch' && touches.length >= 2) {
                if (event.cancelable) event.preventDefault();
                const dist = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
                const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, (gesture.k0 * dist) / gesture.dist0));
                const fx = ((touches[0].clientX + touches[1].clientX) / 2 - rect.left) / rect.width;
                const fy = ((touches[0].clientY + touches[1].clientY) / 2 - rect.top) / rect.height;
                // Keep the map point first under the fingers' midpoint under it as they move.
                jumpTo(clampView({ k, cx: gesture.mapX - (fx - 0.5) * (WORLD.w / k), cy: gesture.mapY - (fy - 0.5) * (WORLD.h / k) }));
            } else if (gesture.kind === 'pan' && touches.length === 1) {
                const dx = touches[0].clientX - gesture.startX;
                const dy = touches[0].clientY - gesture.startY;
                if (!gesture.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX.touch) return;
                gesture.moved = true;
                // At the full-world view there is nothing to pan: let the page scroll.
                if (gesture.view.k <= MIN_ZOOM + 1e-3) return;
                if (event.cancelable) event.preventDefault();
                const unitsPerPx = viewBoxOf(gesture.view).w / rect.width;
                jumpTo(clampView({ k: gesture.view.k, cx: gesture.view.cx - dx * unitsPerPx, cy: gesture.view.cy - dy * unitsPerPx }));
            }
        },
        touchend: (event: TouchEvent) => {
            const gesture = touchRef.current;
            if (!gesture) return;
            if (event.touches.length > 0) {
                if (gesture.kind === 'pinch') touchRef.current = { kind: 'ended' };
                return;
            }
            touchRef.current = null;
            if (event.type === 'touchend' && gesture.kind === 'pan' && !gesture.moved) {
                const touch = event.changedTouches[0];
                if (touch) pressAt(touch.clientX, touch.clientY);
            }
        },
    };
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const wheel = (e: WheelEvent) => handlersRef.current.wheel(e);
        const start = (e: TouchEvent) => handlersRef.current.touchstart(e);
        const move = (e: TouchEvent) => handlersRef.current.touchmove(e);
        const end = (e: TouchEvent) => handlersRef.current.touchend(e);
        svg.addEventListener('wheel', wheel, { passive: false });
        svg.addEventListener('touchstart', start, { passive: true });
        svg.addEventListener('touchmove', move, { passive: false });
        svg.addEventListener('touchend', end);
        svg.addEventListener('touchcancel', end);
        return () => {
            svg.removeEventListener('wheel', wheel);
            svg.removeEventListener('touchstart', start);
            svg.removeEventListener('touchmove', move);
            svg.removeEventListener('touchend', end);
            svg.removeEventListener('touchcancel', end);
        };
    }, []);

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const target = targetRef.current;
        if (event.key === '+' || event.key === '=' || event.key === '-' || event.key === '_') {
            event.preventDefault();
            animateTo(zoomAround(target, event.key === '+' || event.key === '=' ? 1.6 : 1 / 1.6, target.cx, target.cy));
            return;
        }
        if (event.key === '0') {
            event.preventDefault();
            reset();
            return;
        }
        if (event.key === 'Escape') {
            if (pinnedCode) setPinnedCode(null);
            else if (target.k > MIN_ZOOM + 1e-3) reset();
            else return;
            event.preventDefault();
            return;
        }
        const index = westToEast.findIndex((c) => c.code === pinnedCode);
        const last = westToEast.length - 1;
        let next: number;
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
            default:
                return;
        }
        event.preventDefault();
        const country = westToEast[next];
        setPinnedCode(country.code);
        setAnnounce(true);
        if (target.k > MIN_ZOOM + 1e-3) animateTo(clampView({ ...target, cx: country.point.x, cy: country.point.y }));
    };

    const box = viewBoxOf(view);
    const shrink = dotScale(view.k);
    const zoomed = view.k > MIN_ZOOM + 1e-3;
    const activeCode = dragging ? null : (hoverCode ?? pinnedCode);
    const active = placed.find((c) => c.code === activeCode);

    let tooltip: CSSProperties | undefined;
    if (active) {
        const fx = (active.point.x - box.x) / box.w;
        const fy = (active.point.y - box.y) / box.h;
        if (fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) {
            const below = fy < 0.3;
            const r = active.r / shrink;
            tooltip = {
                left: `${fx * 100}%`,
                top: `${((active.point.y + (below ? r : -r) - box.y) / box.h) * 100}%`,
                // Slide the anchor across the tooltip so it never sticks out past the map's edges.
                transform: `translate(${-fx * 100}%, ${below ? '6px' : 'calc(-100% - 6px)'})`,
            };
        }
    }

    return (
        <div className="relative">
            <div
                ref={groupRef}
                role="group"
                tabIndex={0}
                aria-label={`${label}. Use the arrow keys to show each country, plus and minus to zoom, and 0 to show the whole world.`}
                className="visitor-map-frame overflow-hidden rounded-lg"
                style={style}
                onKeyDown={onKeyDown}
                onFocus={(event) => {
                    if (!pinnedCode && event.currentTarget.matches(':focus-visible')) {
                        setPinnedCode(placed[0].code);
                        setAnnounce(true);
                    }
                }}
                onBlur={(event) => {
                    if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) setPinnedCode(null);
                }}
            >
                <svg
                    ref={svgRef}
                    viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
                    className={cn(
                        'block w-full select-none',
                        dragging ? 'cursor-grabbing' : hoverCode ? 'cursor-pointer' : zoomed ? 'cursor-grab' : 'cursor-default'
                    )}
                    style={{ aspectRatio: `${WORLD.w} / ${WORLD.h}`, touchAction: zoomed ? 'none' : 'pan-y' }}
                    aria-hidden="true"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={(event) => endDrag(event, false)}
                    onPointerCancel={(event) => endDrag(event, true)}
                    onPointerLeave={(event) => event.pointerType !== 'touch' && !dragRef.current && setHoverCode(null)}
                >
                    {/* The outline file relies on its own viewBox to crop shapes that wrap around the antimeridian. */}
                    <clipPath id={clipId}>
                        <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} />
                    </clipPath>
                    <use href="/world-map.svg#land" className="visitor-map-land" clipPath={`url(#${clipId})`} />
                    {placed.map((c) => (
                        <circle
                            key={c.code}
                            cx={c.point.x}
                            cy={c.point.y}
                            r={c.r / shrink}
                            className={cn('visitor-dot', c.code === activeCode && 'visitor-dot-active')}
                        />
                    ))}
                </svg>
            </div>

            {zoomed && (
                <button
                    type="button"
                    onClick={() => {
                        reset();
                        // The button disappears at the world view, so keep focus on the map.
                        groupRef.current?.focus({ preventScroll: true });
                    }}
                    aria-label="Show the whole world"
                    title="Show the whole world"
                    className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface/90 text-muted shadow-[0_1px_2px_var(--shadow-color)] transition-colors hover:text-accent-strong"
                >
                    <GlobeEuropeAfricaIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
            )}

            {active && tooltip && (
                <div
                    aria-hidden="true"
                    className="visitor-tooltip pointer-events-none absolute z-20 flex max-w-[240px] items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-[11.5px] leading-tight text-foreground shadow-soft"
                    style={tooltip}
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

            {hasVisits && stats.countries.some((c) => c.point) ? (
                <ZoomableMap countries={stats.countries} metric={stats.metric} label={mapLabel} style={mapColorVars(config)} />
            ) : (
                <div className="visitor-map-frame rounded-lg" style={mapColorVars(config)}>
                    <div className="mx-auto w-[94%] py-1.5">
                        <div className="world-map-land w-full" role="img" aria-label={mapLabel} />
                    </div>
                </div>
            )}

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
