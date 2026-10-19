# Cloudflare hosting at campbellcloud.com, kept out of search and away from bots

The family site moves from GitHub Pages (`seano288.github.io/campbellcloud/`) to a Cloudflare Worker with static assets on
`campbellcloud.com`. The site is for the family only, and Pages can only serve files: it can't set headers, read a user
agent or refuse a request. It also sits in a subfolder, so a `robots.txt` there is ignored.

`wrangler.jsonc` serves `dist-site/` unchanged (`base: './'` means the move needs no path changes). The Worker in
`src/edge/` runs before every file (`run_worker_first`) and:

- answers `/robots.txt` with `Disallow: /`, for every visitor;
- returns 403 to anything without a `Mozilla/` user agent, anything whose user agent names a crawler, AI scraper, HTTP
  library or headless browser, and anything Cloudflare has tagged as a verified bot;
- adds `X-Robots-Tag: noindex, ...` to every response, on top of the `<meta name="robots">` tag in each page;
- redirects `www.campbellcloud.com` to the bare domain.

A user agent is easy to fake, so the zone's **Bot Fight Mode** and **Block AI bots** settings (Cloudflare dashboard, not
code) do the rest. The `deploy.yml` workflow deploys on every push to `main`, using the `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` repository secrets. CI runs `wrangler deploy --dry-run` to check the config.

## Considered Options

- **Stay on Pages**: free and already working, but it can't refuse anyone.
- **Cloudflare Pages**: similar, but Cloudflare now points new projects to Workers static assets, and Pages Functions
  bill every request the same way a Worker does.
- **Cloudflare Access (login in front of the site)**: the strongest block, but the son would hit a login screen and the
  Home Screen apps would need to sign in again whenever the session runs out. It can be added later without code changes.

## Consequences

- **GitHub Pages now only redirects.** `pages-redirect/` (published by `pages-redirect.yml`) sends every old address to
  the same path on `campbellcloud.com`, and replaces each old service worker with one that deletes its offline copy and
  unregisters, so cached Home Screen apps reach the redirect too. Saves stay behind on the old origin; that was accepted.
- **Link previews are blocked.** iMessage and Slack fetch previews with bot user agents, so a shared link shows no card.
- **Free-plan limit**: every request runs the Worker, and the free plan allows 100,000 a day. That is far more than a
  family uses.
