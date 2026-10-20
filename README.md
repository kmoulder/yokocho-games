# Yokocho Games

The arcade is served by GitHub Pages from the root of `master`, with the custom domain `yokocho.games`.

- `/` opens the home screen.
- `/bit-by-bit/` opens Bit by Bit.
- `/escalation/` opens Escalation.
- `/cart-gauntlet/` opens Cart Gauntlet.

The browsing order is Home → Bit by Bit → Escalation → Cart Gauntlet. The arcade is a vertical, phone-first feed: each game fills the screen and players swipe up for the next game or down for the previous one (mouse wheel, ↑/↓ keys, and the right-hand arrows do the same on desktop). Once a swipe comes to rest the game loads live underneath a tap layer, so swipes keep moving the feed; tapping the game (or Play) hands every touch to it, and the Games button on the right edge returns to swiping. Only one game is loaded at a time, and nothing loads automatically when the browser's data saver is on. This layout does not require the browser's native fullscreen permission.

The home screen is styled like a short-video profile: avatar, stats, a Start playing and Share button, and a three-column grid of every game. Grid tiles are links that scroll the feed to that game. On touch screens the position dots are hidden there, since the grid already lists every game.

Each route has its own static `index.html`, so direct links and reloads work on GitHub Pages. Arcade navigation uses browser history; Back and Forward restore the selected game. The position dots on the right are ordinary links that can be copied or opened in a new tab.

To add a game, add its build under `games/<folder>/` and register its title, folder, entry file, description, and URL slug in `games.json`. Optional `icon` and `poster` (files in the game folder) and `color` (a CSS colour) style the game's grid tile and the cover shown while it loads. A `poster` is a portrait screenshot of the title screen; tiles crop it to 3:4 from the top, and games without one show their icon. Run `node scripts/build-game-pages.mjs` to regenerate dedicated pages. Shared scripts and styles use root-relative paths; each game owns its own assets.

Bit by Bit's production assets are built in the `astra-katamari` source workspace with `npm run build`, then copied here with `node scripts/package-yokocho.mjs <path-to-this-checkout>`. The game build uses relative URLs and includes its music and source-credit notes.

Cart Gauntlet is built in the `dkc-rs` workspace (`dkc/dkc-rs`) and copied here with `py crates/dkc-web/tools/package.py <path-to-this-checkout>`. It's a WebAssembly SNES emulator; players choose their own ROM files, which stay in their browser, so no game files are hosted here.
