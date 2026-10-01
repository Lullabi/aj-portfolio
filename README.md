# Aj Hervey portfolio

Personal UX portfolio site. Open `index.html` in a browser.

- `img/` optimized images used by the site
- `source-images/` original screenshots from Notion

## How it works

Everything lives in `index.html` as separate views (home, four case studies, writing, résumé).
`app.js` shows the right view based on the URL hash, e.g. `index.html#oracle`.

- `styles.css` design tokens and all styling
- `app.js` routing, the tin animation, contents sidebar, screenshot lightbox
- `tools/build_artifact.py` makes a copy for publishing as a Claude artifact
