# Cosmic world

Bit by Bit continues beyond Earth through seven cosmic chapters, bringing the journey to 22 chapters. Every continuous chapter advances when local growth reaches 5×. No named object is required. Reaching 5× in the Cosmic Web completes the journey.

## Chapters

The deterministic catalog in `src/cosmic-data.js` contains 1,345 pickups. These are internal level indices; the player sees chapters 16 through 22.

| Index | Chapter | Collectibles |
| --- | --- | --- |
| 15 | The Solar System | Moon, rocky planets, Jupiter, and a 176-body asteroid belt |
| 16 | The Solar Giants | Giant planets, dwarf worlds, comets, Kuiper belt, and the Sun |
| 17 | The Stellar Neighborhood | Planetary systems, nebulae, and star clusters |
| 18 | The Milky Way | Systems in broad spiral arms, the Orion Spur, and a central bar |
| 19 | Neighboring Galaxies | Magellanic Clouds, Andromeda, Triangulum, dwarf galaxies |
| 20 | Galaxy Clusters | Galaxy groups and galaxies around Fornax, Perseus, Coma, Virgo, and other clusters |
| 21 | The Cosmic Web | Cluster chains and superclusters including Laniakea and Shapley |

Jupiter, the Sun, Orion, and Virgo are ordinary optional pickups. The duplicate whole-stage Milky Way, Local Group, and gathered cosmic web objects have been removed. The HUD shows growth toward the next scale, and guidance chooses reachable material rather than a fixed final target.

## Scale and continuity

Each chapter's physical scale is five times the previous one. Crossing its growth threshold divides the local size by five and changes the chapter labels while retaining physical diameter, position, momentum, camera controls, attachments, elapsed time, and music. The final threshold completes free roam without requiring another object.

The active cosmic chapter follows the game state, independently of collected IDs. Solar debris can remain across the two Solar System chapters. At later scale transitions, previous fields recede without granting a special end reward. The final threshold clears the remaining cosmic field.

All gameplay remains on a flat plane with deliberately compressed sizes and distances. The Solar System is arranged around Earth's geographic anchor, with Earth on the third orbit and the Moon nearby. Asteroids are smaller than planets but remain visible on a phone; comet swarms contain smaller individual rocks. Large orbit guides appear during the two solar chapters.

## Milky Way shape

`src/milky-way.js` defines a shared schematic barred spiral. Two prominent arms and two fainter arms curve from the central bar to the outer disk. A short Orion Spur sits between arms. The disk has a radius of 65 local chapter units, with its reference Orion position about 63% of the way to the rim. Actual continuous entry retains the player's current location.

The 168 arm pickups follow these curves with widened lateral placement. Another 20 clusters occupy the local spur and central bar. Requirements increase with distance from the local reference point. There is no whole-galaxy pickup at the center.

`src/galaxy-backdrop.js` connects systems with 6,750 decorative stars and soft arm bands in two draw calls. The arms are roughly 60–80% broader than the initial spiral layout. The fixed background appears only during the Milky Way chapter and disappears when growth opens the next scale. The map shows the whole disk and the player's position. Small background stars provide context; larger systems and clusters are collectible.

## Rendering and saves

Procedural models are matte, low-poly, and instanced. Planetary systems contain central stars, colored planets, three to five complete orbital rings, and ringed outer planets. Clusters contain several smaller systems. Planet counts around named stars are fictional rather than exoplanet catalogs.

Only current and earlier chapter bodies are visible. The Sun is the sole preview exception, marking the orbital center in the first solar chapter. View and size culling limit rendering work, and named objects receive labels. Mobile browser emulation verifies framing and draw calls, not real-device performance.

Existing saves retain earned growth, position, camera state, time, and collected IDs. The three removed aggregate IDs remain accepted for round-trip compatibility but create no objects and cannot advance chapters. Old saves already at or above 5× continue on play without hunting the former final target. Completed saves from the earlier Earth ending still migrate into the Solar System.

## Balance and verification

Normal movement covers 1.4 diameters per second, or 2.52 while dashing. The four chapters from the Solar System through the Milky Way retain their 50% boost: 2.1 and 3.78 diameters per second. Regular stellar and galactic rewards retain the prior 1.8× increase. All current-chapter rewards retain their full value as the player grows.

The deterministic guided cosmic route completes in about 623 seconds, or 10.4 minutes, with 488 direct pickups. It needs 36 pickups in the Stellar Neighborhood and 47 in the Milky Way. These are ideal-route balance measurements, not human play-time estimates. The Earth route reaches space in about 741 seconds; its former globe reward is distributed into continent pickups so size progression has enough growth.

Run `node scripts/simulate-cosmic.mjs` for the renderer-free route, `npm test` for unit and progression checks, and `npm run test:cosmic` with Vite running for the browser journey. Browser checks cover all size transitions, completion, save/reload, legacy saves above the old goal, phone views, widened arms, and runtime errors. `npm run test:earth` checks the geographic handoff in the same world.

## Sources and limitations

- [NASA Solar System structure](https://science.nasa.gov/learn/basics-of-space-flight/chapter1-3/)
- [NASA Solar System planets](https://science.nasa.gov/solar-system/planets/)
- [The Milky Way Galaxy](https://science.nasa.gov/resource/the-milky-way-galaxy/)
- [Galaxies and large-scale structures](https://science.nasa.gov/universe/galaxies/large-scale-structures/)

These sources inform names and broad relationships. The game imports no measurements or positional data from them. Its layouts are schematic and should not be used as scientific diagrams.
