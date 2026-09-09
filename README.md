# Yokocho Games

The arcade is served by GitHub Pages from the root of `master`, with the custom domain `yokocho.games`.

- `/` opens the welcome screen.
- `/escalation/` opens Escalation.
- `/bit-by-bit/` opens Bit by Bit.

Each route has its own static `index.html`, so direct links and reloads work on GitHub Pages. Arcade navigation uses browser history; Back and Forward restore the selected game. The indicator dots are ordinary links that can be copied or opened in a new tab.

To add a game, add its build under `games/<folder>/` and register its title, folder, entry file, description, and URL slug in `games.json`. Run `node scripts/build-game-pages.mjs` to regenerate dedicated pages. Shared scripts and styles use root-relative paths; each game owns its own assets.

Bit by Bit's production assets are built in the `astra-katamari` source workspace with `npm run build`, then copied here with `node scripts/package-yokocho.mjs <path-to-this-checkout>`. The game build uses relative URLs and includes its music and source-credit notes.
