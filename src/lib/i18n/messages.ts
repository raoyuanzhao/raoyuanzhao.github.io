export interface LocaleMessages {
  common: {
    all: string;
    copyToClipboard: string;
    copied: string;
    showMore: string;
    showLess: string;
  };
  navigation: {
    openMainMenu: string;
    skipToContent: string;
  };
  theme: {
    system: string;
    light: string;
    dark: string;
    currentTheme: string;
    cycleTheme: string;
  };
  profile: {
    email: string;
    location: string;
    researchInterests: string;
  };
  home: {
    about: string;
    news: string;
    selectedPublications: string;
    viewAll: string;
  };
  publications: {
    searchPlaceholder: string;
    searchLabel: string;
    filters: string;
    year: string;
    type: string;
    noResults: string;
    abstract: string;
    bibtex: string;
    code: string;
    paper: string;
    pdf: string;
    arxiv: string;
    project: string;
    doi: string;
    showing: (shown: number, total: number) => string;
    moreAuthors: (count: number) => string;
    fewerAuthors: string;
    typeLabels: Record<string, string>;
  };
  cards: {
    upcoming: string;
  };
  cv: {
    download: string;
    notAvailable: string;
  };
  footer: {
    lastUpdated: string;
    builtWithPrism: string;
    privacy: string;
  };
}

const en: LocaleMessages = {
  common: {
    all: 'All',
    copyToClipboard: 'Copy to clipboard',
    copied: 'Copied',
    showMore: 'Show more',
    showLess: 'Show less',
  },
  navigation: {
    openMainMenu: 'Toggle main menu',
    skipToContent: 'Skip to content',
  },
  theme: {
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    currentTheme: 'Theme',
    cycleTheme: 'Click to switch theme',
  },
  profile: {
    email: 'Email',
    location: 'Location',
    researchInterests: 'Research Interests',
  },
  home: {
    about: 'About Me',
    news: 'News',
    selectedPublications: 'Selected Publications',
    viewAll: 'View all',
  },
  publications: {
    searchPlaceholder: 'Search by title, author, or venue…',
    searchLabel: 'Search publications',
    filters: 'Filters',
    year: 'Year',
    type: 'Type',
    noResults: 'No publications match your search.',
    abstract: 'Abstract',
    bibtex: 'BibTeX',
    code: 'Code',
    paper: 'Paper',
    pdf: 'PDF',
    arxiv: 'arXiv',
    project: 'Project',
    doi: 'DOI',
    showing: (shown, total) => (shown === total ? `${total} publications` : `Showing ${shown} of ${total} publications`),
    moreAuthors: (count) => `+${count} more authors`,
    fewerAuthors: 'Show fewer authors',
    typeLabels: {
      conference: 'Conference',
      journal: 'Journal',
      workshop: 'Workshop',
      preprint: 'Preprint',
      'book-chapter': 'Book Chapter',
      book: 'Book',
      thesis: 'Thesis',
      'technical-report': 'Technical Report',
    },
  },
  cards: {
    upcoming: 'Upcoming',
  },
  cv: {
    download: 'Download CV',
    notAvailable: 'PDF coming soon',
  },
  footer: {
    lastUpdated: 'Last updated',
    builtWithPrism: 'Built with PRISM',
    privacy: 'Privacy',
  },
};

const zh: LocaleMessages = {
  common: {
    all: '全部',
    copyToClipboard: '复制到剪贴板',
    copied: '已复制',
    showMore: '显示更多',
    showLess: '收起',
  },
  navigation: {
    openMainMenu: '切换主菜单',
    skipToContent: '跳到正文',
  },
  theme: {
    system: '跟随系统',
    light: '浅色',
    dark: '深色',
    currentTheme: '主题',
    cycleTheme: '点击切换主题',
  },
  profile: {
    email: '邮箱',
    location: '地址',
    researchInterests: '研究兴趣',
  },
  home: {
    about: '关于我',
    news: '动态',
    selectedPublications: '精选论文',
    viewAll: '查看全部',
  },
  publications: {
    searchPlaceholder: '按标题、作者或会议搜索…',
    searchLabel: '搜索论文',
    filters: '筛选',
    year: '年份',
    type: '类型',
    noResults: '没有找到符合条件的论文。',
    abstract: '摘要',
    bibtex: 'BibTeX',
    code: '代码',
    paper: '论文',
    pdf: 'PDF',
    arxiv: 'arXiv',
    project: '项目',
    doi: 'DOI',
    showing: (shown, total) => (shown === total ? `共 ${total} 篇论文` : `显示 ${shown} / ${total} 篇论文`),
    moreAuthors: (count) => `另外 ${count} 位作者`,
    fewerAuthors: '收起作者',
    typeLabels: {
      conference: '会议',
      journal: '期刊',
      workshop: '研讨会',
      preprint: '预印本',
      'book-chapter': '书籍章节',
      book: '书籍',
      thesis: '学位论文',
      'technical-report': '技术报告',
    },
  },
  cards: {
    upcoming: '即将开始',
  },
  cv: {
    download: '下载简历',
    notAvailable: 'PDF 即将提供',
  },
  footer: {
    lastUpdated: '最近更新',
    builtWithPrism: '由 PRISM 构建',
    privacy: '隐私',
  },
};

export const messages: Record<string, LocaleMessages> = {
  en,
  zh,
};

export function getMessages(locale: string): LocaleMessages {
  return messages[locale] || en;
}
