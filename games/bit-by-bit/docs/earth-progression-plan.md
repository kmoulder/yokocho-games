# Beyond Manhattan: Earth playgrounds

## Direction

Keep Bit by Bit a continuous, casual roll-up game. After Manhattan, replace long stretches of low-reward terrain hunting with recognizable, dense playgrounds. Each contains something collectible now, something nearly within reach, and a larger visible target. Size remains the only chapter gate; no mandatory final landmark, quests, or timers.

| Playground | Content | Experience |
| --- | --- | --- |
| New York Harbor | Ferries, container fleets, docks, cranes, bridges, airports | Sweep colorful waterfront groups, then grow into infrastructure |
| Northeast corridor | Suburbs, trains, highways, stadiums, rail yards, downtowns | Follow several branching routes between dense collection areas |
| Across America | Farms, forests, wind farms, reservoirs, mesas, mountains | Distinct landscape patches and occasional large collection sweeps |
| The Americas | Lakes, Caribbean islands, volcano chains, Amazon, Andes | Larger geographic features provide frequent changes of scenery |
| Across the oceans | Archipelagos, reefs, sea ice, currents, hurricanes | Cross productive routes rather than searching empty water |
| Planetary | Coastlines, mountain systems, ice sheets, clouds | Clearly visible changes to the remaining world as it is gathered |

## Rhythm and geography

Aim to introduce a new collectible tier about every 20–30 seconds and a larger visual payoff every 1–2 minutes. These are playtest targets, not enforced delays. Prioritize variety and reliable growth before setting total duration. Keep several directions viable; the map guide should favor useful nearby content.

Retain recognizable geographic relationships. Large-scale collectible groups may exaggerate sizes and compress local spacing for readability. Label authored placements as gameplay approximations, not surveyed infrastructure. Any future global distance compression needs a continuous coordinate/transition design and is not part of this first pass.

Movement should enliven objects that have locomotion. Removal should visibly clear the corresponding scenery. Never delay collection to control pacing: tune growth, distribution, and size thresholds instead.

## First implementation

Add authored harbor, Northeast, and initial North American clusters to the existing Earth map. Use ferry/container fleets, rail yards, suburbs, stadium districts, farms, and forests, alongside existing port, airport, downtown, and mountain models. Spread tiered clusters along multiple geographic routes, with stable save IDs and land/water-aware placement. Use exaggerated fleet/district scale so pickups remain readable after Manhattan.

Render repeated groups through instancing, materialize only captured models, and keep visible detail bounded by scale and distance. Animate harbor fleets along short water-safe paths, with collision positions following their rendered positions. Existing saves, pause, reset, and the Earth-to-space handoff must continue working.

## Subsequent passes

1. Tune the first routes using actual playthroughs, including phone performance.
2. Expand the North American palette with wind farms, deserts, reservoirs, and moving traffic.
3. Build productive ocean crossings and the Americas sequence.
4. Add weather, sea ice, and planetary-scale scenery changes.

Acceptance: immediate collection; no progression starvation; multiple useful targets near the Manhattan exit; visually distinct pickup families; no regression to the very fast Manhattan progression; bounded scene work and persistent collection state.

## First pass delivered — September 12, 2026

- 227 authored clusters: 83 harbor/metro, 72 Northeast corridor, and 72 North American landscapes, with four size tiers in each zone.
- Seven new model families: ferry fleets, container fleets, rail yards, suburbs, stadium districts, farm patchworks, and forests. Existing airport, port, downtown, and mountain models supply four additional families.
- Nearby useful playgrounds take priority in route guidance. Harbor fleets move along short water-safe paths; captured fleets stop moving. Rail yards are currently static displays.
- Repeated scenery uses at most 11 instanced batches, only revealed after Manhattan and culled by distance and size. Individual captured objects are materialized on demand. IDs are stable, and reset/save restoration includes new collections.
- The guided renderless route spends 62.5 seconds in Greater New York and a further 124.5 seconds in the Northeast, then reaches space at 221.2 seconds total without starvation. This is an automated route, not a human duration guarantee. The 20–30-second discovery rhythm still needs human playtesting.
- Initial North American variety is included. Ocean routes, weather, further regional palettes, and the later continental/planetary pacing remain subsequent work; those stages retain their existing progression for now.

Implementation: `src/earth-playgrounds.js`, `src/earth-playground-models.js`, and integration in `src/earth-world.js`. Placement uses the existing regional/country land masks; these clusters exaggerate fleet and district scale for readability and are not exact real-world facilities.
