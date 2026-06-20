# Agentic Coding Guide

This repository is a legacy Flask/PostGIS web application for generating map-based athlete visualizations. Treat changes as production-impacting: the app handles OAuth tokens, location traces, map-rendering credentials, generated images, background jobs, and deployment configuration.

## Repository context

- Runtime: Python/Flask application with Celery workers, Redis, PostgreSQL/PostGIS, SQLAlchemy models, Alembic migrations, Flask-Assets bundles, Jinja templates, and static JavaScript/CSS.
- Mapping stack: existing production code uses Mapbox GL JS assets and map styles. If adding Google Maps Platform features, keep them isolated behind explicit configuration and avoid mixing providers in one rendering path unless the product requirement says so.
- Deployment target: Heroku-style Procfile/runtime configuration. Preserve compatibility with environment-variable configuration.

## Required workflow for coding agents

1. Read this file before editing. Also check for more deeply nested `AGENTS.md` files in any directory you touch.
2. Inspect `git status --short` before making changes. Do not overwrite user work.
3. Prefer small, reviewable changes with clear migration/deployment notes.
4. Never commit secrets, access tokens, OAuth credentials, API keys, database URLs, Redis URLs, private certificates, generated customer exports, or real athlete GPS traces.
5. Keep credentials in environment variables or platform secret managers only. Do not add fallback demo keys.
6. For web UI changes, verify templates/static assets and take a screenshot when the change is perceptible in a runnable browser environment.
7. For database changes, include Alembic migrations and describe any PostGIS extension or data backfill requirements.
8. For background-job changes, consider Celery idempotency, retry safety, Redis broker settings, and partial failure behavior.
9. For geospatial changes, validate coordinate order, SRID assumptions, bounding boxes, precision, and privacy impact.
10. Update README or operational docs when setup, deployment, environment variables, or provider requirements change.

## Local skills for this repository

Agents should use the local skills in `.codex/skills/` when relevant:

- `agentic-repo-stewardship`: general repo-safe coding, review, and handoff checklist.
- `google-maps-platform-web`: Google Maps Platform web implementation guidance.
- `google-maps-platform-deployment`: deployment, observability, quota, and rollout guidance for Google Maps Platform integrations.
- `google-maps-platform-security`: API key, OAuth, domain restriction, and location-data privacy guidance.

## Coding conventions

- Keep Python 2 compatibility in existing runtime code unless a task explicitly upgrades the application. The current README and runtime configuration indicate a legacy Python 2/Heroku app.
- Avoid broad rewrites. Match nearby style when touching legacy files.
- Do not wrap imports in `try`/`except` blocks.
- Prefer explicit environment-variable names and document every new required variable.
- Keep vendor assets clearly separated from application-authored code.
- Avoid adding new minified/generated assets by hand unless the build process requires it and the source is also committed.

## Security and privacy guardrails

- Treat Strava activity data and GPS tracks as sensitive personal location data.
- Minimize stored location precision when exact routes are not required.
- Avoid logging coordinates, OAuth tokens, signed URLs, API keys, session cookies, or request bodies containing personal data.
- Use HTTPS-only URLs for external APIs and generated asset delivery.
- Review CORS changes carefully; do not broaden origins without a concrete deployment reason.
- Make API abuse controls explicit for map tiles, geocoding, places, elevation, and other billable provider calls.

## Validation expectations

Run the most relevant checks available for the files changed. Examples:

- `git diff --check`
- Python syntax checks for changed Python files, using the interpreter supported by the environment.
- Targeted unit/integration tests when present.
- Template/static smoke checks for UI changes.
- Secret scans with available local tooling, or a focused `rg` review for common credential names.

If the environment cannot run a check because dependencies or services are missing, report that clearly in the final handoff.

## Pull request notes

Summaries should include:

- What changed and why.
- Security/deployment impacts.
- Tests and checks run.
- Any skipped checks or follow-up work.
