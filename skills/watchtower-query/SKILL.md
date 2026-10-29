---
name: watchtower-query
description: Query Watchtower traces, logs, metrics and profiles to answer how production is behaving. Use for "how slow is X", "show errors for Y", "find logs containing Z".
---

Read-only. Credentials from `WT_API_URL`, `WT_API_KEY`, `WT_PROJECT_ID` (never print them).

- Logs: `wtctl agent inspect logs --text "<substring>" --limit 50`.
- One trace: `wtctl agent inspect trace <trace id>`; sort spans by duration to find the slow child.
- Issues and monitors: `wtctl agent inspect issues|monitors --limit 20`.
- Metrics and anything else: the MCP server (`wtctl mcp serve --stdio`) exposes the API; the OpenAPI document is the source of truth for paths under `/v1/projects/$WT_PROJECT_ID/`.
- Profiles: `GET /v1/projects/$WT_PROJECT_ID/profiles/table?service=<svc>` lists functions with self and total cost.

Always bound the time range and the limit. Summarise results (counts, top offenders, one representative id) instead of pasting raw JSON, and give the user the ids so they can open them in Watchtower.
