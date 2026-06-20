# Google Maps Platform Security

Use this skill for Google Maps Platform API keys, browser loading, server-to-server calls, OAuth-adjacent flows, domain controls, and location-data privacy.

Primary references to verify when making substantive changes:

- Google Maps Platform API security best practices: https://developers.google.com/maps/api-security-best-practices
- Maps JavaScript API key setup: https://developers.google.com/maps/documentation/javascript/get-api-key
- Google Maps Platform domains: https://developers.google.com/maps/domains
- Google Maps Platform security and compliance overview: https://developers.google.com/maps/security/compliance/security-compliance

## Key-management rules

- Never commit Google Maps API keys or service credentials.
- Use separate keys for browser JavaScript and server-side web service calls.
- Restrict every key with exactly the appropriate application restriction type and only the APIs that key needs.
- Browser keys should be restricted by HTTPS referrer for deployed domains and localhost development origins as needed.
- Server keys should not be exposed to templates or static JavaScript; store them in environment variables or a platform secret manager.
- Rotate keys when adding restrictions to existing production traffic, when a key may have leaked, or when changing ownership.

## Browser integration rules

- Load Maps JavaScript API over HTTPS.
- Do not interpolate unrestricted keys into templates.
- Prefer runtime configuration that fails closed when a required key or map ID is missing.
- Avoid logging full Maps API URLs that include keys or signed parameters.

## Server integration rules

- Use HTTPS for all Google Maps Platform web service requests.
- Validate and encode URL parameters.
- Add retry logic with exponential backoff for transient errors; do not retry permanent authorization, billing, quota, or validation failures blindly.
- Set explicit timeouts on outbound calls.
- Avoid proxy endpoints that let clients make arbitrary billable Google Maps requests through your server key.

## Location-data privacy

- Treat athlete GPS tracks as sensitive personal data.
- Do not expose private routes, home/work locations, or exact historical coordinates unless authorized by the product flow.
- Prefer aggregation, clipping, simplification, or precision reduction for public maps.
- Avoid shipping raw private coordinates to third-party APIs unless required, disclosed, and protected by configuration.

## Review checklist

- Keys are split by usage and restricted by referrer/IP/API.
- No secrets appear in git diff, fixtures, screenshots, logs, or generated assets.
- CORS/referrer changes are narrow and documented.
- Quota and billing-abuse paths are rate-limited or otherwise controlled.
