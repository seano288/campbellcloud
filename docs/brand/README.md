# Campbell Cloud brand: Horizon

Picked on 2026-10-19 from five directions (`prototypes.html` in this folder, open it in a browser). It is meant for the whole site, not just the games.

**Mark**: one unbroken line rising out of the horizon into a cloud, with a small sun. Source of truth: `src/brand/mark.ts` (inline mark, Home Screen icon, favicon).

**Wordmark**: `campbell/cloud`, lowercase, Space Grotesk 500, with the slash in the accent colour. Write the name as "Campbell Cloud" in prose and titles.

**Type**: Space Grotesk (400/500) for everything; JetBrains Mono (400) for labels, paths, dates and section headings, often prefixed `//`. Both are bundled with `@fontsource` so pages work offline.

Sizes come from a short scale, each step about 1.25× the last (CSS variables on the landing page):

| token       | size                    | for                                   |
|-------------|-------------------------|---------------------------------------|
| `t-xs`      | 12px                    | domains of sites elsewhere, footer    |
| `t-sm`      | 15px                    | section headings, tile blurbs         |
| `t-md`      | 19px                    | wordmark, tile names                  |
| `t-display` | `clamp(32px,6vw,56px)`  | the one headline per page             |

**Colour**

| token    | light     | dark      |
|----------|-----------|-----------|
| bg       | `#ffffff` | `#0b0c0f` |
| fg       | `#0e0e10` | `#f2f2f2` |
| muted    | `#6e6e73` | `#8a8a90` |
| card     | `#f4f4f5` | `#15161a` |
| line     | `#e4e4e7` | `#232429` |
| edge     | `#929296` | `#5e5f66` |
| accent   | `#2f5bff` | `#7c9bff` |

`line` is for rules; tile outlines use `ring` (the same as `line` in light, a step brighter, `#35363d`, in dark so black tile art keeps its edge); `edge` is for the border of a control (like the theme toggle) so it holds 3:1 against the page. Accent is kept for the wordmark slash, the mark's sun and focus rings, so it never makes plain text look like a link.

The app icon is white on ink (`#0e0e10`) with a `#5c7dff` sun. Pages follow the system theme until the visitor picks one with the toggle (stored as `cc-theme` in localStorage).

**Feel**: minimal and precise. Lots of white space, thin 1px rules, no heavy shadows or outlines. Colour comes from the work shown (game art and so on), not from the page chrome.
