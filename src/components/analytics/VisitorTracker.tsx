'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export type VisitorTrackerConfig =
    | { provider: 'goatcounter'; endpoint: string; hostname: string }
    | { provider: 'umami'; scriptUrl: string; websiteId: string; hostname: string };

declare global {
    interface Window {
        goatcounter?: { count?: (vars: { path: string }) => void };
    }
}

const GOATCOUNTER_SCRIPT = 'https://gc.zgo.at/count.js';

/** Counts only on the deployed site (not local previews) and honours Do Not Track / Global Privacy Control. */
function trackingAllowed(hostname: string): boolean {
    if (window.location.hostname !== hostname) return false;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    return nav.doNotTrack !== '1' && nav.globalPrivacyControl !== true;
}

/**
 * Loads the cookieless counter of the configured provider. Umami tracks client-side navigation
 * itself; GoatCounter is told about each route change. Query strings and fragments are never sent.
 */
export default function VisitorTracker({ config }: { config: VisitorTrackerConfig }) {
    const pathname = usePathname();
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current || !trackingAllowed(config.hostname)) return;
        loaded.current = true;

        const script = document.createElement('script');
        script.async = true;
        if (config.provider === 'goatcounter') {
            script.src = GOATCOUNTER_SCRIPT;
            script.dataset.goatcounter = config.endpoint;
            script.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
            script.onload = () => window.goatcounter?.count?.({ path: window.location.pathname });
        } else {
            script.src = config.scriptUrl;
            script.dataset.websiteId = config.websiteId;
            script.dataset.domains = config.hostname;
            script.dataset.excludeSearch = 'true';
            script.dataset.excludeHash = 'true';
            script.dataset.doNotTrack = 'true';
        }
        document.head.appendChild(script);
    }, [config]);

    const lastPath = useRef<string | null>(null);
    useEffect(() => {
        if (config.provider !== 'goatcounter') return;
        const previous = lastPath.current;
        lastPath.current = pathname;
        if (previous === null || previous === pathname) return;
        window.goatcounter?.count?.({ path: pathname });
    }, [config.provider, pathname]);

    return null;
}
