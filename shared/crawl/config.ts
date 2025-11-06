const DEFAULT_MAX_DEPTH = 5;

const UNIVERSAL_LANGUAGE_EXCLUDES = [
  '^/de/',
  '^/es/',
  '^/fr/',
  '^/it/',
  '^/pt/',
  '^/pt-BR/',
  '^/ja/',
  '^/ko/',
  '^/zh/',
  '^/zh-CN/',
  '^/zh-TW/',
  '^/ru/',
  '^/id/',
];

const DOMAIN_LANGUAGE_EXCLUDES: Record<string, string[]> = {
  'docs.firecrawl.dev': ['^/es/', '^/fr/', '^/ja/', '^/pt-BR/', '^/zh/'],
  'docs.claude.com': [
    '^/de/',
    '^/es/',
    '^/fr/',
    '^/id/',
    '^/it/',
    '^/ja/',
    '^/ko/',
    '^/pt/',
    '^/ru/',
    '^/zh-CN/',
    '^/zh-TW/',
  ],
  'docs.unraid.net': ['^/de/', '^/es/', '^/fr/', '^/zh/'],
};

export interface CrawlRequestConfig {
  url: string;
  excludePaths: string[];
  maxDepth: number;
  changeDetection: boolean;
}

export function buildCrawlRequestConfig(targetUrl: string): CrawlRequestConfig | null {
  try {
    const parsed = new URL(targetUrl);
    const baseUrl = `${parsed.protocol}//${parsed.host}`;
    const hostname = parsed.host.toLowerCase();

    const excludePaths = DOMAIN_LANGUAGE_EXCLUDES[hostname] ?? UNIVERSAL_LANGUAGE_EXCLUDES;

    return {
      url: baseUrl,
      excludePaths,
      maxDepth: DEFAULT_MAX_DEPTH,
      changeDetection: true,
    };
  } catch {
    return null;
  }
}

export function shouldStartCrawl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
