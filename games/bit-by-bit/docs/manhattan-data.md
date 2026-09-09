# Manhattan level data

`src/data/manhattan.json` is a compact, baked extract for the Manhattan roll-up level. It uses the contract origin `[-73.9665, 40.7740]` and local coordinates in metres:

```text
x = (longitude - -73.9665) * 111320 * cos(40.7740°)
z = -(latitude - 40.7740) * 111320
```

Coordinates are rounded to 0.1 m. The source rings are simplified in local metres while retaining the source geometry and closed rings.

## Rebuild

From the repository root, run:

```sh
node scripts/build-manhattan.mjs
```

After landmark-only corrections, `node scripts/build-manhattan.mjs --landmarks-only` rewrites just the landmark array without downloading the GIS layers again. `node scripts/build-manhattan.mjs --roads-only` refreshes only centerlines and applies the shoreline filter without downloading the building records.

The script has no credentials or third-party package dependencies. It fetches public JSON from NYC ArcGIS services, selects the largest Manhattan mainland shoreline ring, filters records to that ring, converts source heights and street widths from feet to metres, and writes the contract-shaped JSON.

## Sources

- [NYC Borough Boundary](https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/ArcGIS/rest/services/NYC_Borough_Boundary/FeatureServer/0) — NYC Department of City Planning shoreline at mean high tide. The largest Manhattan ring is used, which excludes Roosevelt Island, Governors Island, Randall's/Wards Islands, and other satellite polygons.
- [Centerline_view](https://services6.arcgis.com/yG5s3afENB5iO9fj/arcgis/rest/services/Centerline_view/FeatureServer) — NYC Citywide Street Centerline (CSCL), including `RW_TYPE=6` Central Park paths.
- [BUILDING_view](https://services6.arcgis.com/yG5s3afENB5iO9fj/arcgis/rest/services/BUILDING_view/FeatureServer) — NYC OTI building footprints and `HEIGHT_ROOF`. The [NYC building metadata](https://github.com/CityOfNewYork/nyc-geo-metadata/blob/main/Metadata/Metadata_BuildingFootprints.md) documents the footprint capture and height field; the source height values are treated as US survey feet and converted to metres.
- [NYC Parks Properties](https://services1.arcgis.com/8cuieNI8NbqQZQVJ/ArcGIS/rest/services/NYC_Parks_Properties_view/FeatureServer/0) — park property polygons and sign names.
- [Hydrography_2022](https://services6.arcgis.com/yG5s3afENB5iO9fj/ArcGIS/rest/services/Hydrography_2022/FeatureServer) — NYC OTI planimetric hydrography, updated from 2022 Manhattan imagery.

The extract currently contains 1 coastline ring (3,479 points), 402 park polygons, 19 water polygons, 11,170 road/path centerlines, 44,524 building footprints, and 17 landmarks. The JSON is approximately 10.2 MiB because it retains every building footprint on the mainland island.

The small landmark points around the pond were checked against the current [OpenStreetMap Central Park extract](https://api.openstreetmap.org/api/0.6/map?bbox=-73.970,40.772,-73.960,40.778): Kerbs' Boathouse (`40.7739672,-73.9665435`), Alice in Wonderland (`40.7750382,-73.9665337`), and Hans Christian Andersen (`40.7744790,-73.9677251`). The [NYC Landmarks Preservation Commission Kerbs Memorial Boathouse material](https://www.nyc.gov/assets/lpc/downloads/pdf/presentation-materials/20260623/Central-Park-Kerbs-Memorial-Boathouse.pdf) is the official project reference. The two GWB anchors use the Manhattan and Fort Lee tower positions (`40.8499,-73.9436` and `40.8526,-73.9588`) rather than two points near the bridge midpoint.

Centerlines omit source `RW_TYPE=14` ferry-route geometries and `STATUS=5` demapped geometries. Bridges, tunnels, paths/trails, step streets, driveways, ramps, alleys, and U-turns remain because they are physical centerline features represented in CSCL.

## Conservatory Water

The OTI hydrography record centered at approximately `40.77418, -73.96747` is the Conservatory Water pond. Its source `NAME` is `BOAT BASIN`, a known source attribution issue; the builder identifies this feature by its source geometry and renames it `Conservatory Water` in the output. The baked ring has 62 points and local bounds `x=-100.4..-6.1`, `z=-90.1..39.5` metres. No hand-drawn replacement polygon is used.

## Known source limitations

The NYC building service includes duplicate BINs for physically separate condominium or split footprints; `OBJECTID` is used only as a fallback ID when BIN is missing. Features with a missing or zero roof height receive a conservative 6 m gameplay height. The NYC shoreline is a mean-high-tide borough boundary rather than a historic natural shoreline, and the largest-ring selection intentionally omits satellite islands. Landmark points are curated public map positions with visual mass heights for gameplay; they are not substituted for building footprints.
