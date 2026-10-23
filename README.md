# City of Trees Triathlon Club — website code

Squarespace 7.1 doesn't have Developer Mode, so this repo holds the custom code and Squarespace loads it through
**Code Injection** via the jsDelivr CDN. Edit, push to GitHub, site updates.

## Layout
- `css/ctoc.css` — brand styles (green / blue / orange, Barlow Condensed + Inter)
- `js/ctoc.js` — renders the workout schedule from JSON
- `data/workouts.json` — **edit this to change the schedule** (set `"sample": false` when real)
- `images/` — site photos (served through the CDN)
- `logo/` — logo mark and lockups (SVG + PNG)
- `snippets/` — copy/paste HTML for Code Injection and Code Blocks

## One-time setup
1. Create a **public** GitHub repo named `ctoc-site` and push this folder to `main`.
   (jsDelivr only serves public repos.)
2. In every file in `snippets/`, placeholders are already filled in.
3. Squarespace → Website Tools → Advanced → Code Injection:
   paste `header-injection.html` in Header, `footer-injection.html` in Footer.
4. Site Styles: set the palette (`#1F4D3A`, `#2A6F97`, `#F28C28`, `#F7F4EC`, `#222222`) and fonts to match.
5. Add Code Blocks (Display Source OFF) from `home-hero-block.html`, `faq-block.html`, `footer-block.html` and `workouts-block.html`;
   add a Form block + `join-block.html` on the Join page.

## Updating
Edit `data/workouts.json`, commit, push. A GitHub Action purges the CDN cache on every push.
Sessions with a `"date"` disappear automatically after that day; sessions with `"day"` (e.g. `"Tuesday"`) repeat weekly.
To refresh by hand, open `https://purge.jsdelivr.net/gh/shacklefordX/ctoc-site@main/data/workouts.json`,
or switch the snippets to a tagged release (`@v1.0.1`) for instant, cache-proof updates.

## Notes
- Code Injection requires a Squarespace Business plan or higher.
- Keep the repo free of secrets; everything here is public.
