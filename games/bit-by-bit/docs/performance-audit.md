# Performance audit — September 12, 2026

The reported stop-and-start building absorption was partly a gameplay throttle: Manhattan accepted 90 buildings per simulated second, with a six-building burst ceiling, and two land pieces per second. Eligible buildings could remain beneath the player after a sweep. Slow frames further reduced the effective real-time rate because the simulation clamps its time step to 50 ms.

## Changes implemented

- Removed both collection throttles. All eligible contacts resolve immediately, including growth and saved collection IDs. No pending pickup queue is introduced.
- Sampled building attachments separately from collection: up to two new building visuals per simulation frame. The core retains at most 80 attached objects. Other collected buildings disappear from the map and grant their full configured growth immediately.
- Coalesced pickup toast, sound, and sparkle feedback within each simulation frame. HUD updates use the existing periodic refresh instead of rewriting the interface for every building. Chapter transitions still refresh immediately.
- Released evicted building attachment materials and objects, preserving shared geometry and collection state. Previously the visible attachment limit removed scene nodes but retained the materialized objects through item references.
- Disposed expired sparkle materials as well as their geometry. Previously only geometry was disposed.
- Cached static building transforms and reused the instance color scratch object during visibility updates.

The 20% building growth multiplier at 75 m and above and the 1.8 km land threshold remain. Movement speed is unchanged. A renderless run with real collision and growth logic, starting at neighborhood size and holding dash, completes Manhattan in 153.1 seconds. The route includes navigation stalls; this is a regression benchmark, not a guaranteed human completion time or a mandatory timer.

## Measurements

Reproduce with `node scripts/audit-performance.mjs <label>` against the local development server. Raw results are in `artifacts/performance-baseline.json` and `artifacts/performance-optimized.json`.

The harness exercises 360 simulation frames at 60 Hz for each of four starting chapters: park paths, skyline, neighborhoods, and whole island. It includes real collection, UI, saves, world updates, and renderer submission. Tests used desktop Chromium at 960 × 720 with software WebGL. Instrumented phase durations are inclusive, so nested timings must not be added together. Different growth changes the later route and view; these are equivalent starting scenarios, not identical final scenes.

| Six-second neighborhood scenario | Before | After |
| --- | ---: | ---: |
| Items collected | 324 | 770 |
| Total collection CPU time | 61.0 ms | 20.8 ms |
| HUD refreshes | 352 | 29 |
| Median draw calls | 296 | 266 |
| Retained visible attachments | 140 | 80 |
| 95th-percentile measured frame work | 12.7 ms | 12.3 ms |

At whole-island scale, world-update p95 decreased from 10.8 to 7.4 ms, while measured frame-work p95 decreased from 20.8 to 19.1 ms. Autosave took 0.4–1.1 ms in these short optimized scenarios; large late-game saves were not benchmarked.

These results show cheaper collection and fewer rendering submissions, but do not establish a phone FPS improvement. Shader warm-up and software-renderer synchronization caused isolated large spikes; total wall time and maximum frame duration are unsuitable before/after FPS comparisons here. Physical-phone GPU profiling remains necessary.

## Next performance opportunities

1. **Batch sparkle rendering.** The existing particle ceiling is 96 separate meshes. An instanced particle batch could reduce up to 96 submissions to one and reuse geometry/material resources.
2. **Spread large-scale visibility work across frames.** Manhattan rebuilds visible instance lists roughly every 160 ms. That periodic work still reaches 7.4 ms at p95 in the whole-island sample. Incremental tile refresh and distant borough LOD should reduce spikes; verify that newly collected objects hide immediately and scenery does not pop into view late.
3. **Load geography by region/stage.** The production JavaScript is approximately 16.7 MB uncompressed, 5.66 MB gzip, largely because geographic datasets ship in the initial bundle. Deferred data loading and prefetching during earlier stages should improve startup, but require explicit loading and transition handling.
4. **Profile representative physical phones.** Measure GPU time, memory growth across a full island run, and frame pacing at normal device pixel ratios before choosing resolution scaling or more aggressive LOD. Software WebGL cannot answer those questions reliably.

## Regression coverage

- A 300-building overlap collects entirely in the first frame at 30, 60, and 120 Hz.
- The real game collection path grants growth and save IDs for all 300 buildings while creating only two building attachment objects.
- Pickup feedback is emitted once per frame, and evicted attachment materials are disposed without disposing shared geometry.
- The neighborhood-to-Greater-NYC pacing test still requires at least two minutes.
- Existing core, chapter, collision, ambient motion, and cosmic progression tests pass.
