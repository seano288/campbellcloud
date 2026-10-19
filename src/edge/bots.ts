// What the edge worker treats as a bot, and what it tells crawlers. Kept apart from worker.ts because a Worker's
// entry file may export only its handler.

export const CANONICAL_HOST = 'campbellcloud.com';
export const NO_INDEX = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
export const ROBOTS_TXT = 'User-agent: *\nDisallow: /\n';

// Crawlers, AI scrapers, HTTP libraries and headless browsers. No real Safari, Chrome or Firefox user agent contains
// any of these words.
const BOT_AGENT = new RegExp([
  'bot', 'crawl', 'spider', 'slurp', 'scrap', 'archiver', 'indexer', 'preview', 'facebookexternalhit', 'embedly',
  'gpt', 'claude', 'anthropic', 'openai', 'perplexity', 'ccbot', 'bytespider', 'cohere', 'diffbot', 'omgili',
  'headless', 'phantomjs', 'puppeteer', 'playwright', 'selenium', 'lighthouse',
  'curl', 'wget', 'httpie', 'python', 'aiohttp', 'httpx', 'go-http', 'java/', 'okhttp', 'axios', 'node-fetch',
  'undici', 'libwww', 'lwp-', 'ruby', 'php', 'perl', 'scrapy', 'postman', 'insomnia', 'http_request', 'winhttp',
].join('|'), 'i');

export function isBot(request: Request): boolean {
  const agent = request.headers.get('user-agent')?.trim() ?? '';
  // Every browser sends a user agent that starts with Mozilla/5.0.
  if (!agent.startsWith('Mozilla/')) return true;
  if (BOT_AGENT.test(agent)) return true;
  // Cloudflare tags crawlers it has verified (Googlebot, Bingbot, ...) even when the user agent looks ordinary.
  const cf = (request as Request & { cf?: { verifiedBotCategory?: string } }).cf;
  return Boolean(cf?.verifiedBotCategory);
}
