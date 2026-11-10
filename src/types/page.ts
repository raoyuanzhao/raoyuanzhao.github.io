import type { Publication } from './publication';

export interface BasePageConfig {
    type: 'about' | 'publication' | 'card' | 'text';
    title: string;
    description?: string;
}

export interface PublicationPageConfig extends BasePageConfig {
    type: 'publication';
    source: string;
}

export interface CardLink {
    label: string;
    url: string;
}

export interface CardItem {
    title: string;
    subtitle?: string;
    date?: string;
    content?: string;
    tags?: string[];
    link?: string;
    image?: string;
    /** Group name used when the page sets `group_by = "category"` */
    category?: string;
    location?: string;
    /** Short badge, e.g. "Upcoming" or "Current" */
    status?: string;
    /** Secondary lines, rendered as inline Markdown (e.g. "Role: Teaching Assistant") */
    details?: string[];
    links?: CardLink[];
    /** Set to true to keep an entry in the file without showing it on the site */
    hidden?: boolean;
}

export interface CardPageConfig extends BasePageConfig {
    type: 'card';
    items: CardItem[];
    layout?: 'cards' | 'timeline' | 'list';
    /** Tighter spacing between entries; entry `content` and `tags` are not shown */
    compact?: boolean;
    group_by?: 'category';
    /** Display order for groups; groups without items are skipped */
    groups?: string[];
    empty_message?: string;
}

export interface NewsItem {
    date: string;
    content: string;
}

export type SectionType = 'markdown' | 'publications' | 'list' | 'interests' | 'cards';

export interface SectionConfig {
    id: string;
    type: SectionType;
    title?: string;
    source?: string;
    filter?: string;
    /** Max entries (publications, cards) or entries visible before "Show more" (news). 0 = no limit. */
    limit?: number;
    /** For `cards` sections: only include items of this category */
    category?: string;
    layout?: CardPageConfig['layout'];
    /** Optional "View all" link */
    link?: string;
    link_label?: string;
    /** Rendering variant; "cv" gives compact, print-friendly output */
    variant?: 'default' | 'cv';
    /** For `markdown` sections: a short invitation to get in touch, linking to `social.email` */
    reach_out?: ReachOutConfig;
}

export interface ReachOutConfig {
    title: string;
    text?: string;
    link_label?: string;
    /** Set at build time from `social.email`; the block is hidden when there is no email */
    href?: string;
}

export interface ProcessedSection extends SectionConfig {
    content?: string;
    publications?: Publication[];
    items?: NewsItem[];
    cards?: CardItem[];
    interests?: string[];
}

export interface TextPageConfig extends BasePageConfig {
    type: 'text';
    source?: string;
    /** Path of a PDF inside `public/`, e.g. "/cv/Raoyuan_Zhao_CV.pdf" */
    pdf?: string;
    pdf_label?: string;
    sections?: SectionConfig[];
}
