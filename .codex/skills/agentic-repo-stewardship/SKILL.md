# Agentic Repo Stewardship

Use this skill when planning, implementing, reviewing, or handing off code changes in this repository.

## Start-of-task checklist

1. Read the root `AGENTS.md` and any nested instructions in touched paths.
2. Run `git status --short` and preserve existing user changes.
3. Identify the smallest safe change that satisfies the request.
4. List affected runtime surfaces: Flask routes, templates, static assets, Celery jobs, database migrations, provider APIs, deployment config, or docs.

## Implementation guidance

- Prefer explicit, documented configuration over implicit defaults.
- Keep changes reversible and easy to review.
- Do not add secrets or real user data to tests, fixtures, docs, screenshots, or logs.
- For legacy code, match the local style before introducing new patterns.
- If modernizing, isolate compatibility changes and document migration risks.

## Review checklist

- `git diff --check` has no whitespace errors.
- New environment variables are documented.
- Security and privacy impacts are called out.
- Database and background-job changes include operational notes.
- User-visible web changes include screenshot evidence when a browser is available.
- Generated files are intentionally updated and source files are included.

## Handoff format

Provide a concise summary, cite changed files, list checks with pass/warn/fail status, and mention any follow-up risks.
