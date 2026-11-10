#!/usr/bin/env node
/**
 * Fetches all-time visits per country from the configured analytics provider and writes them to
 * .generated/visitor-stats.json, which the build reads to render the sidebar visitor map.
 * The flags of the listed countries are copied to public/flags/.
 *
 * Credentials come from environment variables only (GitHub Actions secrets in CI):
 *   GoatCounter: GOATCOUNTER_API_TOKEN
 *   Umami:       UMAMI_API_KEY (Umami Cloud), or UMAMI_USERNAME + UMAMI_PASSWORD (self-hosted)
 *
 * Exits 0 without writing anything when the provider or its credentials are not configured, and
 * exits 1 when a configured provider cannot be read, so a failed refresh never replaces the
 * statistics of the currently deployed site with an empty map.
 */
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'smol-toml';

const ROOT = process.cwd();
const OUTPUT_FILE = path.join(ROOT, '.generated', 'visitor-stats.json');
const FLAGS_SRC = path.join(ROOT, 'node_modules', 'flag-icons', 'flags', '4x3');
const FLAGS_DEST = path.join(ROOT, 'public', 'flags');
const REQUEST_TIMEOUT_MS = 20_000;
// GoatCounter started in 2019, so no site has data before this date.
const GOATCOUNTER_EPOCH = '2019-01-01T00:00:00Z';

class FetchError extends Error {}

async function getJson(url, init = {}) {
    let response;
    try {
        response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (error) {
        throw new FetchError(`${new URL(url).pathname}: ${error.message}`);
    }
    if (!response.ok) {
        throw new FetchError(`${new URL(url).pathname}: HTTP ${response.status}`);
    }
    return response.json();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchGoatCounter({ code }) {
    const token = process.env.GOATCOUNTER_API_TOKEN;
    if (!code || !token) return null;
    if (!/^[a-z0-9-]+$/i.test(code)) throw new FetchError('visitor_map.goatcounter.code is not a valid site code');

    const base = `https://${code}.goatcounter.com/api/v0`;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const end = new Date();
    end.setUTCMinutes(0, 0, 0);
    end.setUTCHours(end.getUTCHours() + 1);

    const rows = [];
    for (let offset = 0; offset < 1000; offset += 100) {
        const params = new URLSearchParams({ start: GOATCOUNTER_EPOCH, end: end.toISOString(), limit: '100', offset: String(offset) });
        const data = await getJson(`${base}/stats/locations?${params}`, { headers });
        for (const stat of data?.stats ?? []) rows.push({ code: stat?.id, count: stat?.count });
        if (!data?.more) break;
        await sleep(300); // API limit: 4 requests per second
    }
    return { provider: 'goatcounter', rows };
}

async function umamiToken(apiUrl) {
    if (process.env.UMAMI_API_KEY) return process.env.UMAMI_API_KEY;
    const { UMAMI_USERNAME: username, UMAMI_PASSWORD: password } = process.env;
    if (!username || !password) return null;
    const data = await getJson(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (typeof data?.token !== 'string') throw new FetchError('/auth/login: no token in response');
    return data.token;
}

async function fetchUmami({ website_id: websiteId, api_url: apiUrlSetting }) {
    const apiUrl = (apiUrlSetting || 'https://api.umami.is/v1').replace(/\/+$/, '');
    if (!websiteId) return null;
    if (!/^[0-9a-f-]{36}$/i.test(websiteId)) throw new FetchError('visitor_map.umami.website_id is not a valid website ID');
    if (!apiUrl.startsWith('https://')) throw new FetchError('visitor_map.umami.api_url must use https');

    const token = await umamiToken(apiUrl);
    if (!token) return null;
    const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
    const site = `${apiUrl}/websites/${websiteId}`;

    const website = await getJson(site, { headers });
    const startAt = Date.parse(website?.createdAt) || 0;
    const params = new URLSearchParams({ type: 'country', startAt: String(startAt), endAt: String(Date.now()), limit: '500' });

    try {
        const data = await getJson(`${site}/metrics/expanded?${params}`, { headers });
        return { provider: 'umami', rows: (Array.isArray(data) ? data : []).map((row) => ({ code: row?.name, count: row?.visits })) };
    } catch (error) {
        // Umami versions without /metrics/expanded only report unique visitors per country.
        if (!(error instanceof FetchError) || !error.message.endsWith('HTTP 404')) throw error;
        const data = await getJson(`${site}/metrics?${params}`, { headers });
        return { provider: 'umami', metric: 'visitors', rows: (Array.isArray(data) ? data : []).map((row) => ({ code: row?.x, count: row?.y })) };
    }
}

function normalize(rows) {
    const counts = new Map();
    for (const { code, count } of rows) {
        const cc = typeof code === 'string' ? code.trim().toUpperCase() : '';
        const n = Number(count);
        if (!/^[A-Z]{2}$/.test(cc) || !Number.isInteger(n) || n <= 0) continue;
        counts.set(cc, (counts.get(cc) ?? 0) + n);
    }
    return [...counts].map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}

async function copyFlags(countries) {
    await rm(FLAGS_DEST, { recursive: true, force: true });
    await mkdir(FLAGS_DEST, { recursive: true });
    for (const { code } of countries) {
        const file = `${code.toLowerCase()}.svg`;
        const src = path.join(FLAGS_SRC, file);
        if (existsSync(src)) await copyFile(src, path.join(FLAGS_DEST, file));
    }
}

async function main() {
    const config = parse(await readFile(path.join(ROOT, 'content', 'config.toml'), 'utf8'));
    const visitorMap = config.visitor_map ?? {};
    if (visitorMap.enabled === false) {
        console.log('Visitor map disabled; skipping visitor statistics.');
        return;
    }

    const provider = visitorMap.provider || 'goatcounter';
    const fetchers = { goatcounter: fetchGoatCounter, umami: fetchUmami };
    if (!fetchers[provider]) throw new FetchError(`Unknown visitor_map.provider "${provider}"`);

    const result = await fetchers[provider](visitorMap[provider] ?? {});
    if (!result) {
        console.log(`Visitor statistics not configured for ${provider} (site setting or API credential missing); skipping.`);
        return;
    }

    const countries = normalize(result.rows);
    const stats = {
        provider: result.provider,
        metric: result.metric ?? 'visits',
        generatedAt: new Date().toISOString(),
        countries,
    };
    await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
    await writeFile(OUTPUT_FILE, `${JSON.stringify(stats, null, 2)}\n`);
    await copyFlags(countries);
    const total = countries.reduce((sum, c) => sum + c.count, 0);
    console.log(`Visitor statistics: ${total} ${stats.metric} from ${countries.length} ${countries.length === 1 ? 'country' : 'countries'} (${provider}).`);
}

main().catch((error) => {
    console.error(`Could not fetch visitor statistics: ${error instanceof FetchError ? error.message : error}`);
    process.exit(1);
});
