import fs from 'fs';
import path from 'path';
import labelPoints from '@/lib/countryLabelPoints.json';
import { resolvePublicAsset } from '@/lib/sections';
import { projectToWorldMap } from '@/lib/worldMap';

/** Written by scripts/fetch-visitor-stats.mjs before the build. */
const STATS_FILE = path.join(process.cwd(), '.generated', 'visitor-stats.json');

// Shorter forms of a few long CLDR region names, to fit the sidebar.
const NAME_OVERRIDES: Record<string, string> = {
  CD: 'DR Congo',
  CG: 'Republic of the Congo',
  HK: 'Hong Kong',
  MM: 'Myanmar',
  MO: 'Macao',
  PS: 'Palestine',
};

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function countryName(code: string): string {
  if (NAME_OVERRIDES[code]) return NAME_OVERRIDES[code];
  try {
    return regionNames.of(code) || code;
  } catch {
    return code;
  }
}

export interface VisitorCountry {
  code: string;
  name: string;
  count: number;
  /** Flag image in public/, if available */
  flag?: string;
  /** Position on the world map (viewBox units); missing for unknown codes */
  point?: { x: number; y: number };
}

export interface VisitorStats {
  metric: 'visits' | 'visitors';
  /** All-time total reported by the provider; includes visits whose country is unknown */
  total: number;
  /** Sorted by count, highest first */
  countries: VisitorCountry[];
  top?: VisitorCountry;
  rarest?: VisitorCountry;
  updatedAt?: string;
}

interface RawStats {
  metric?: unknown;
  generatedAt?: unknown;
  total?: unknown;
  countries?: Array<{ code?: unknown; count?: unknown }>;
}

const byCountThenName = (a: VisitorCountry, b: VisitorCountry) => b.count - a.count || a.name.localeCompare(b.name, 'en');

let cached: VisitorStats | null | undefined;

/** Visitor statistics for the build, or null if they have not been fetched (provider not configured). */
export function getVisitorStats(): VisitorStats | null {
  if (cached !== undefined && process.env.NODE_ENV === 'production') return cached;
  cached = null;

  let raw: RawStats;
  try {
    raw = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
  } catch {
    return cached;
  }

  const points: Record<string, number[]> = labelPoints;
  const countries: VisitorCountry[] = [];
  for (const entry of Array.isArray(raw.countries) ? raw.countries : []) {
    const code = typeof entry?.code === 'string' ? entry.code : '';
    const count = Number(entry?.count);
    if (!/^[A-Z]{2}$/.test(code) || !Number.isInteger(count) || count <= 0) continue;
    const point = points[code];
    countries.push({
      code,
      name: countryName(code),
      count,
      flag: resolvePublicAsset(`/flags/${code.toLowerCase()}.svg`),
      point: point ? projectToWorldMap(point[0], point[1]) : undefined,
    });
  }
  countries.sort(byCountThenName);

  const top = countries[0];
  const others = countries.slice(1);
  const lowest = others.length ? Math.min(...others.map((c) => c.count)) : undefined;
  const rarest = others.filter((c) => c.count === lowest).sort((a, b) => a.name.localeCompare(b.name, 'en'))[0];
  const generatedAt = typeof raw.generatedAt === 'string' && !Number.isNaN(Date.parse(raw.generatedAt)) ? raw.generatedAt : undefined;
  const located = countries.reduce((sum, c) => sum + c.count, 0);
  const reported = Number(raw.total);

  cached = {
    metric: raw.metric === 'visitors' ? 'visitors' : 'visits',
    // Files written before the total was fetched only have per-country counts.
    total: Number.isInteger(reported) && reported >= located ? reported : located,
    countries,
    top,
    rarest,
    updatedAt: generatedAt,
  };
  return cached;
}
