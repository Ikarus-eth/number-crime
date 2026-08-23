# DISPATCH — number sense through detective work

A police-themed number game for a pre-reader (age ~5). Everything that matters is spoken.

## Files

- `App.tsx` — the whole app, one React file. This is the only file you edit.
- `index.html` — loads the built bundle.
- `app.js` — prebuilt bundle of `App.tsx` (committed so Pages works with no build step).
- `audio/` — (optional, add it yourself) recorded voice clips, `<id>.mp3`. The full
  list of clip ids is in the header comment of `App.tsx`. Anything missing falls
  back to the browser voice automatically.

## Deploy to GitHub Pages

1. Create a repository and push these files to the `main` branch root.
2. Repository Settings → Pages → Source: "Deploy from a branch" → `main` / `(root)`.
3. Open the Pages URL on the iPad in Safari, then Share → "Add to Home Screen".
   The home-screen copy runs fullscreen and its saved progress is not subject to
   Safari's 7-day storage cleanup, so use that, not a bookmark.

## After editing App.tsx

Rebuild the bundle, then commit both files:

    npx esbuild main.jsx --bundle --minify --outfile=app.js

(`main.jsx` is three lines that mount the app; it is included.)

## Progress safety

Parent panel (hold the "Grown-ups — hold" button on the title screen):
per-numeral stats, voice picker, two-player toggle, and a backup code you can
copy before travel and paste back to restore.
