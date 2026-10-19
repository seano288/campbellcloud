// Runs in front of every request to campbellcloud.com before the static site in dist-site/ is served. The site is for
// the family only, so it asks search engines not to index anything and turns away anything that says it is a bot or
// a script. Cloudflare's own Bot Fight Mode (a dashboard setting) catches bots that pretend to be a browser.
//   npx wrangler deploy

import { CANONICAL_HOST, isBot, NO_INDEX, ROBOTS_TXT } from './bots';

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

function withNoIndex(response: Response): Response {
  const out = new Response(response.body, response);
  out.headers.set('X-Robots-Tag', NO_INDEX);
  return out;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }
    // Answered even for bots, so the polite ones learn to stay away.
    if (url.pathname === '/robots.txt') {
      return withNoIndex(new Response(ROBOTS_TXT, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
    }
    if (isBot(request)) return withNoIndex(new Response('Forbidden\n', { status: 403 }));
    return withNoIndex(await env.ASSETS.fetch(request));
  },
};
