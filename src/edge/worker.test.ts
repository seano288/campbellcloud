import { describe, expect, it } from 'vitest';
import { NO_INDEX, ROBOTS_TXT } from './bots';
import worker from './worker';

const IPAD_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const IPHONE_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const MAC_CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const ANDROID_FIREFOX = 'Mozilla/5.0 (Android 15; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0';
const WINDOWS_EDGE = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0';

const env = { ASSETS: { fetch: async () => new Response('<!doctype html>site', { headers: { 'Content-Type': 'text/html' } }) } };

const get = (path: string, agent?: string, cf?: object) => {
  const request = new Request(`https://campbellcloud.com${path}`, { headers: agent === undefined ? {} : { 'User-Agent': agent } });
  if (cf) Object.defineProperty(request, 'cf', { value: cf });
  return worker.fetch(request, env);
};

describe('edge worker', () => {
  it.each([IPAD_SAFARI, IPHONE_SAFARI, MAC_CHROME, ANDROID_FIREFOX, WINDOWS_EDGE])('serves the site to a browser: %s', async agent => {
    const response = await get('/time-flies/', agent);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('site');
    expect(response.headers.get('X-Robots-Tag')).toBe(NO_INDEX);
  });

  it.each([
    '', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
    'Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)', 'CCBot/2.0 (https://commoncrawl.org/faq/)',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/140.0.0.0 Safari/537.36',
    'facebookexternalhit/1.1', 'curl/8.7.1', 'Wget/1.21', 'python-requests/2.32', 'Go-http-client/2.0', 'axios/1.7',
  ])('turns away a bot or script: %s', async agent => {
    const response = await get('/', agent);
    expect(response.status).toBe(403);
    expect(response.headers.get('X-Robots-Tag')).toBe(NO_INDEX);
  });

  it('turns away a request with no user agent', async () => {
    expect((await get('/')).status).toBe(403);
  });

  it('turns away a crawler Cloudflare has verified, whatever it calls itself', async () => {
    expect((await get('/', MAC_CHROME, { verifiedBotCategory: 'Search Engine Crawler' })).status).toBe(403);
    expect((await get('/', MAC_CHROME, { verifiedBotCategory: '' })).status).toBe(200);
  });

  it('tells every crawler to stay out, bots included', async () => {
    const response = await get('/robots.txt', 'Mozilla/5.0 (compatible; Googlebot/2.1)');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(ROBOTS_TXT);
  });

  it('sends www to the bare domain', async () => {
    const response = await worker.fetch(new Request('https://www.campbellcloud.com/time-flies/?x=1', { headers: { 'User-Agent': IPAD_SAFARI } }), env);
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://campbellcloud.com/time-flies/?x=1');
  });
});
