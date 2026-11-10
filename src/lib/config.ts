import fs from 'fs';
import path from 'path';
import { parse } from 'smol-toml';
import type { I18nConfig } from '@/types/i18n';

export interface VisitorMapColors {
  cl?: string;
  co?: string;
}

export interface VisitorMapConfig {
  enabled?: boolean;
  provider?: 'goatcounter' | 'umami';
  title?: string;
  goatcounter?: { code?: string };
  umami?: { website_id?: string; script_url?: string; api_url?: string };
  light?: VisitorMapColors;
  dark?: VisitorMapColors;
}

export interface Affiliation {
  name: string;
  url?: string;
}

export interface SiteConfig {
  site: {
    title: string;
    description: string;
    favicon: string;
    last_updated?: string;
    url?: string;
    keywords?: string[];
    copyright_start?: number;
  };
  author: {
    name: string;
    title: string;
    institution: string;
    institution_url?: string;
    avatar: string;
    avatar_video?: string;
    pronunciation?: string;
    pronunciation_audio?: string;
    affiliations?: Affiliation[];
    location?: string;
  };
  social: {
    email?: string;
    google_scholar?: string;
    semantic_scholar?: string;
    orcid?: string;
    github?: string;
    huggingface?: string;
    linkedin?: string;
    twitter?: string;
    bluesky?: string;
    cv?: string;
    [key: string]: string | string[] | undefined;
  };
  features: {
    enable_one_page_mode?: boolean;
  };
  visitor_map?: VisitorMapConfig;
  /** Pages that are built but not shown in the navigation (e.g. a privacy notice). */
  extra_pages?: Array<{
    title: string;
    target: string;
    href: string;
  }>;
  navigation: Array<{
    title: string;
    type: 'section' | 'page' | 'link';
    target: string;
    href: string;
  }>;
  i18n?: I18nConfig;
}

const DEFAULT_CONTENT_DIR = 'content';

function normalizeLocale(locale: string): string {
  return locale.trim().replace('_', '-').toLowerCase();
}

function readConfigFromPath(configPath: string): Partial<SiteConfig> | null {
  try {
    const fileContent = fs.readFileSync(configPath, 'utf-8');
    return parse(fileContent) as unknown as Partial<SiteConfig>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

function mergeConfig(base: SiteConfig, localized?: Partial<SiteConfig> | null): SiteConfig {
  if (!localized) return base;

  return {
    ...base,
    site: {
      ...base.site,
      ...(localized.site || {}),
    },
    author: {
      ...base.author,
      ...(localized.author || {}),
    },
    social: {
      ...base.social,
      ...(localized.social || {}),
    },
    features: base.features,
    visitor_map: base.visitor_map,
    navigation: localized.navigation || base.navigation,
    extra_pages: localized.extra_pages || base.extra_pages,
    // i18n is always sourced from default content/config.toml
    i18n: base.i18n,
  };
}

function getDefaultConfig(): SiteConfig {
  const defaultPath = path.join(process.cwd(), DEFAULT_CONTENT_DIR, 'config.toml');
  const parsed = readConfigFromPath(defaultPath);

  if (!parsed) {
    throw new Error('Failed to load content/config.toml');
  }

  return parsed as SiteConfig;
}

export function getConfig(locale?: string): SiteConfig {
  try {
    const baseConfig = getDefaultConfig();

    if (!locale) {
      return baseConfig;
    }

    const normalizedLocale = normalizeLocale(locale);
    const localizedPath = path.join(process.cwd(), `${DEFAULT_CONTENT_DIR}_${normalizedLocale}`, 'config.toml');
    const localizedConfig = readConfigFromPath(localizedPath);

    return mergeConfig(baseConfig, localizedConfig);
  } catch (error) {
    console.error('Error loading config:', error);
    throw new Error('Failed to load configuration');
  }
}
