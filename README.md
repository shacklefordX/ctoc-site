# City of Trees Triathlon Club — website code

Squarespace 7.1 doesn't have Developer Mode, so this repo holds the custom code and Squarespace loads it through
**Code Injection** from **GitHub Pages** (https://shacklefordx.github.io/ctoc-site/). Edit, push to GitHub, site updates in about a minute.

One-time: repo Settings → Pages → Source: Deploy from a branch → `main` / (root).

## Layout
- `css/ctoc.css` — brand styles (green / blue / orange, Barlow Condensed + Inter)
- `js/ctoc.js` — renders the home page, schedule and footer from the JSON files
- `data/workouts.json` — **the schedule**
- `data/content.json` — **all page copy** (hero, steps, photos, FAQ, footer)
- `images/` — site photos (served through the CDN)
- `logo/` — logo mark and lockups (SVG + PNG)
- `snippets/` — copy/paste HTML for Code Injection and Code Blocks

## One-time Squarespace setup (never touched again)
1. Code Injection: paste `snippets/header-injection.html` (Header) and `snippets/footer-injection.html` (Footer).
2. Home page: one Code Block (Display Source OFF) with `snippets/home-hero-block.html`.
3. Group Workouts page: one Code Block with `snippets/workouts-block.html`.
4. Join page: a Squarespace Form block plus the Strava button from `snippets/join-block.html`.
5. Site Styles: palette `#1F4D3A`, `#2A6F97`, `#F28C28`, `#F7F4EC`, `#222222`; fonts Barlow Condensed / Inter.
6. Header logo: upload `logo/ctoc-lockup.png`; browser icon: `logo/ctoc-mark.png`.

## Day-to-day (everything from Git)
- **Schedule:** edit `data/workouts.json`. Dated sessions (`"date": "2026-11-07"`) vanish the day after; weekly ones use `"day": "Tuesday"`.
- **Copy, FAQ, steps, photos, footer:** edit `data/content.json`. Add images to `images/` and reference them as `images/name.jpg`.
- **Look and feel:** edit `css/ctoc.css`.
- Commit and push to `main`. GitHub Pages republishes in about a minute (browsers may cache files up to ~10 minutes).

## Notes
- Code Injection requires a Squarespace Business plan or higher.
- Keep the repo free of secrets; everything here is public.
