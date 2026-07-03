# Google Maps Platform Web Development

Use this skill when adding or changing Google Maps Platform browser features such as Maps JavaScript API, map IDs, cloud-based styling, markers, data layers, geocoding UI, places, elevation, or route visualization.

Primary references to verify when making substantive changes:

- Maps JavaScript API setup: https://developers.google.com/maps/documentation/javascript/get-api-key
- Maps JavaScript API release notes and versioning: https://developers.google.com/maps/documentation/javascript/releases
- Map IDs overview: https://developers.google.com/maps/documentation/javascript/map-ids/mapid-over
- Cloud-based maps styling: https://developers.google.com/maps/documentation/javascript/cloud-customization
- Cloud-based styling JSON reference: https://developers.google.com/maps/documentation/javascript/cloud-customization/json-reference

## Repository-specific context

- This app currently uses Mapbox GL JS assets and styles. Google Maps work should be explicitly configured and should not silently replace existing Mapbox behavior.
- Keep provider-specific code in clearly named files or modules.
- Document any new template variables, Flask config keys, static assets, or deployment settings.

## Implementation guidelines

- Prefer a map ID for features and styling that require or benefit from Google Cloud-managed configuration.
- Do not combine inline `styles` with `mapId`; manage map appearance through the map ID when using cloud-based styling.
- Load only the libraries needed for the feature.
- Keep initialization idempotent so Turbolinks-like reloads, partial renders, or repeated template includes do not duplicate maps/listeners.
- Preserve accessibility: map containers need labels or surrounding context, controls must be keyboard reachable, and non-map fallbacks should exist for critical data.
- Handle API load failures with user-visible fallback messaging rather than blank screens.
- Avoid sending high-precision private GPS data to browser maps unless the user flow requires it.

## Performance guidelines

- Bound and simplify large GeoJSON/track payloads before rendering.
- Prefer server-side tiling or vector-tile approaches for large datasets.
- Debounce viewport-driven provider calls.
- Cache non-user-specific metadata when allowed.
- Avoid initializing hidden maps until visible, because hidden containers often produce incorrect sizing and wasted billable work.

## Testing checklist

- Verify missing/invalid key behavior.
- Verify map ID/style behavior in development and production-like origins.
- Test large route datasets and empty datasets.
- Confirm no API key or coordinate payload is logged unexpectedly.
- For visible UI changes, capture a screenshot when possible.
