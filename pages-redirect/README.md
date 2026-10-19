The site moved to campbellcloud.com (ADR 0004). `.github/workflows/pages-redirect.yml` publishes this folder to
GitHub Pages so old links and Home Screen icons land on the new site. `sw.js` is copied into every folder that had a
service worker on Pages (the root and each game listed in the workflow), so those workers clear themselves away.
