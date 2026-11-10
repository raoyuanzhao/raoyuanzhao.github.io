'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { EnvelopeIcon, MapPinIcon, DocumentTextIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import type { SiteConfig } from '@/lib/config';
import type { VisitorStats } from '@/lib/visitorStats';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { cn } from '@/lib/utils';
import VisitorMap from '@/components/home/VisitorMap';
import { BlueskyIcon, GitHubIcon, GoogleScholarIcon, HuggingFaceIcon, LinkedInIcon, OrcidIcon, SemanticScholarIcon, XIcon } from '@/components/ui/icons';

export interface ProfileData {
    author: SiteConfig['author'];
    social: SiteConfig['social'];
    cvHref?: string;
}

interface ProfileProps {
    profileByLocale: Record<string, ProfileData>;
    defaultLocale: string;
    visitorMap?: SiteConfig['visitor_map'];
    visitorStats?: VisitorStats | null;
    visitorStatsEnabled?: boolean;
    privacyHref?: string;
}

function obfuscateEmail(email: string) {
    return email.replace('@', ' [at] ').replace(/\.(?=[^.]+$)/, ' [dot] ');
}

export default function Profile({ profileByLocale, defaultLocale, visitorMap, visitorStats, visitorStatsEnabled, privacyHref }: ProfileProps) {
    const pathname = usePathname();
    const locale = useLocaleStore((state) => state.locale);
    const data = profileByLocale[locale] || profileByLocale[defaultLocale] || Object.values(profileByLocale)[0];
    const isHome = pathname === '/';

    const asideRef = useRef<HTMLElement>(null);
    const [sticky, setSticky] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const pointerTypeRef = useRef('mouse');
    const [videoPlaying, setVideoPlaying] = useState(false);

    const playVideo = () => {
        const video = videoRef.current;
        if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        video.currentTime = 0;
        video.play().catch(() => setVideoPlaying(false));
    };
    const stopVideo = () => {
        videoRef.current?.pause();
        setVideoPlaying(false);
    };

    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const playPronunciation = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        audio.play().catch(() => setAudioPlaying(false));
    };

    // Stick only on desktop and only while the whole sidebar fits below the 60px header,
    // so it never needs its own scrollbar.
    useEffect(() => {
        const aside = asideRef.current;
        if (!aside) return;
        const desktop = window.matchMedia('(min-width: 1024px)');
        const update = () => setSticky(desktop.matches && aside.scrollHeight <= window.innerHeight - 60);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(aside);
        window.addEventListener('resize', update);
        desktop.addEventListener('change', update);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', update);
            desktop.removeEventListener('change', update);
        };
    }, []);

    if (!data) return null;
    const { author, social, cvHref } = data;
    const NameTag = isHome ? 'h1' : 'p';

    const links = [
        social.google_scholar && { label: 'Google Scholar', href: social.google_scholar, icon: GoogleScholarIcon, external: true },
        social.linkedin && { label: 'LinkedIn', href: social.linkedin, icon: LinkedInIcon, external: true },
        social.semantic_scholar && { label: 'Semantic Scholar', href: social.semantic_scholar, icon: SemanticScholarIcon, external: true },
        social.github && { label: 'GitHub', href: social.github, icon: GitHubIcon, external: true },
        social.huggingface && { label: 'Hugging Face', href: social.huggingface, icon: HuggingFaceIcon, external: true },
        social.email && { label: 'Email', href: `mailto:${social.email}`, icon: EnvelopeIcon, external: false },
        social.orcid && { label: 'ORCID', href: social.orcid, icon: OrcidIcon, external: true },
        social.twitter && { label: 'X (Twitter)', href: social.twitter, icon: XIcon, external: true },
        social.bluesky && { label: 'Bluesky', href: social.bluesky, icon: BlueskyIcon, external: true },
        cvHref && { label: 'CV (PDF)', href: cvHref, icon: DocumentTextIcon, external: true },
    ].filter(Boolean) as Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }>; external: boolean }>;

    return (
        <aside
            ref={asideRef}
            data-site-sidebar
            aria-label="Profile"
            className={cn(
                'w-full lg:w-[300px] xl:w-[320px] lg:shrink-0',
                sticky && 'sticky top-[60px]',
                isHome ? 'block border-b border-line-soft pb-10 lg:border-b-0 lg:pb-14' : 'hidden lg:block lg:pb-14'
            )}
        >
            <div className="flex flex-col items-center pt-10 text-center lg:pt-14 lg:px-2">
                <div
                    className="relative isolate mb-7 h-[148px] w-[148px] overflow-hidden rounded-full border border-line shadow-md transition-all duration-200 hover:scale-105 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:scale-100 sm:h-[180px] sm:w-[180px] lg:h-[200px] lg:w-[200px] xl:h-[220px] xl:w-[220px]"
                    {...(author.avatar_video
                        ? {
                              onPointerEnter: (e: React.PointerEvent) => e.pointerType === 'mouse' && playVideo(),
                              onPointerLeave: (e: React.PointerEvent) => e.pointerType === 'mouse' && stopVideo(),
                              onPointerDown: (e: React.PointerEvent) => {
                                  pointerTypeRef.current = e.pointerType;
                              },
                              // touch and pen have no hover, so a tap toggles the clip
                              onClick: () => {
                                  if (pointerTypeRef.current === 'mouse') return;
                                  if (videoPlaying) stopVideo();
                                  else playVideo();
                              },
                          }
                        : {})}
                >
                    <Image
                        src={author.avatar}
                        alt={`Portrait of ${author.name}`}
                        width={440}
                        height={440}
                        className="h-full w-full object-cover"
                        priority
                    />
                    {author.avatar_video && (
                        <video
                            ref={videoRef}
                            src={author.avatar_video}
                            muted
                            loop
                            playsInline
                            preload="none"
                            aria-hidden="true"
                            tabIndex={-1}
                            onPlaying={() => setVideoPlaying(true)}
                            className={cn(
                                'pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-300',
                                videoPlaying ? 'opacity-100' : 'opacity-0'
                            )}
                        />
                    )}
                </div>

                <NameTag className="mb-2 text-[24px] font-semibold leading-tight text-primary sm:text-[28px]">
                    {author.name}
                </NameTag>
                {author.pronunciation && (
                    <p className="-mt-1 mb-2 flex items-center justify-center gap-1 text-[13.5px] leading-snug text-muted">
                        <span>
                            Pronounced <span className="font-medium text-foreground">{author.pronunciation}</span>
                        </span>
                        {author.pronunciation_audio && (
                            <>
                                <button
                                    type="button"
                                    onClick={playPronunciation}
                                    aria-label={`Listen to the pronunciation of ${author.name.split(' ')[0]}`}
                                    title="Listen"
                                    className={cn(
                                        'inline-flex h-7 w-7 items-center justify-center rounded-full text-accent-strong transition-colors hover:bg-accent/10 hover:text-accent-ink',
                                        audioPlaying && 'bg-accent/10 text-accent-ink'
                                    )}
                                >
                                    <SpeakerWaveIcon className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <audio
                                    ref={audioRef}
                                    src={author.pronunciation_audio}
                                    preload="none"
                                    onPlay={() => setAudioPlaying(true)}
                                    onPause={() => setAudioPlaying(false)}
                                    onEnded={() => setAudioPlaying(false)}
                                />
                            </>
                        )}
                    </p>
                )}
                <p className="text-[15px] leading-snug text-foreground">{author.title}</p>
                <p className="mt-1 text-[15px] leading-snug">
                    {author.institution_url ? (
                        <a href={author.institution_url} target="_blank" rel="noopener noreferrer" className="text-link-style">
                            {author.institution}
                        </a>
                    ) : (
                        <span className="text-foreground">{author.institution}</span>
                    )}
                </p>

                {author.affiliations && author.affiliations.length > 0 && (
                    <p className="mt-1 text-[14px] text-muted">
                        {author.affiliations.map((aff, index) => (
                            <span key={aff.name}>
                                {index > 0 && <span aria-hidden="true" className="mx-1.5">·</span>}
                                {aff.url ? (
                                    <a href={aff.url} target="_blank" rel="noopener noreferrer" className="hover:text-link transition-colors">
                                        {aff.name}
                                    </a>
                                ) : (
                                    aff.name
                                )}
                            </span>
                        ))}
                    </p>
                )}

                {author.location && (
                    <p className="mt-3 inline-flex items-center gap-1 text-[13px] text-muted">
                        <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        {author.location}
                    </p>
                )}

                {social.email && (
                    <p className="mt-1 break-all font-mono text-[13px] text-muted">{obfuscateEmail(social.email)}</p>
                )}

                {links.length > 0 && (
                    <ul className="mt-6 flex flex-wrap justify-center gap-3" aria-label="Contact and profiles">
                        {links.map(({ label, href, icon: Icon, external }) => (
                            <li key={label}>
                                <a
                                    href={href}
                                    aria-label={label}
                                    title={label}
                                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-accent-strong transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-on-accent motion-reduce:hover:translate-y-0"
                                >
                                    <Icon className="h-[18px] w-[18px]" />
                                </a>
                            </li>
                        ))}
                    </ul>
                )}

                <VisitorMap
                    config={visitorMap}
                    stats={visitorStats}
                    statsEnabled={visitorStatsEnabled}
                    privacyHref={privacyHref}
                    className="mx-auto mt-8 lg:mt-10"
                />
            </div>
        </aside>
    );
}
