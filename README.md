# דוראק (Durak)

משחק הקלפים דוראק כאפליקציית ווב (PWA) נגד יריבי מחשב. עברית, RTL, מובייל-first.

## Stack

- Vite + React 18 + TypeScript (strict)
- CSS Modules + CSS variables, inline SVG icons, no UI libraries
- Pure game engine in `src/engine/` (no React), driven by `useReducer`
- Vitest tests in `tests/`
- PWA via `vite-plugin-pwa` (offline, installable)

## Scripts

```bash
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
npm test           # engine tests
npm run icons      # regenerate public/icons and favicon
```

## Structure

```
src/
  engine/        rules, deck, seeded RNG, legal moves, reducer
  engine/ai/     bot strategies (easy / normal / hard) on a visible-state projection
  hooks/         useGame: reducer wrapper, bot driver, log and animation state
  components/    cards, ring indicator, buttons, game table pieces, icons/
  screens/       menu, settings, rules, stats, game
  storage/       localStorage settings and stats
  audio/         Web Audio synthesized sounds
tests/           Vitest suites (rules, setup, cards, full-game simulations)
scripts/         PWA icon generator
```

## Deploy

Static hosting. `netlify.toml` builds with `npm run build` and publishes `dist/`.
