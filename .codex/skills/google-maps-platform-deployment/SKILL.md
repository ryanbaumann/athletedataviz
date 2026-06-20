# Google Maps Platform Deployment

Use this skill when preparing Google Maps Platform features for staging, production, Heroku deployment, CI/CD, observability, quotas, billing, or rollback.

Primary references to verify when making substantive changes:

- Google Maps Platform getting started: https://developers.google.com/maps/get-started
- API security best practices: https://developers.google.com/maps/api-security-best-practices
- Google Maps Platform web service best practices: https://developers.google.com/maps/documentation/mapmanagement/web-services-best-practices
- Google Maps Platform domains for firewall allowlists: https://developers.google.com/maps/domains

## Environment and configuration

- Use separate Google Cloud projects or keys for local, staging, and production where possible.
- Document required environment variables in README or deployment docs.
- For Heroku, configure secrets with `heroku config:set`; never commit `.env` files containing real values.
- Fail closed when required provider config is absent, and make the failure actionable.

## Rollout guidance

- Use feature flags or provider-selection settings for new Google Maps Platform paths in this Mapbox-oriented app.
- Roll out to staging first with production-like referrer restrictions.
- Verify allowed origins before production cutover.
- Keep rollback simple: disabling the feature flag or reverting provider config should restore prior behavior.

## Quota, billing, and reliability

- Set Google Cloud budget alerts and monitor quota usage before launch.
- Apply API restrictions so accidental calls cannot fan out into unrelated billable APIs.
- Use exponential backoff for transient web-service failures.
- Do not create synchronized batch requests; add jitter where many jobs may call provider APIs.
- Define cache policy for data that can be cached under applicable provider terms and product requirements.

## Observability checklist

- Log provider operation names and coarse failure categories, not full URLs with keys or precise private coordinates.
- Track client-side load failures, server-side timeout rates, quota failures, and billing/authorization errors.
- Add runbook notes for key rotation, quota exhaustion, and provider outage fallback.

## Release checklist

- Required APIs are enabled in the correct Google Cloud project.
- Billing is attached and budget alerts are configured.
- Browser and server keys are separately restricted.
- Staging and production domains are included in referrer restrictions.
- Deployment docs list rollback steps.
