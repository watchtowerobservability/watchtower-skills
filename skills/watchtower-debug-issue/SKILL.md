---
name: watchtower-debug-issue
description: Investigate a production error, alert or slow request using Watchtower before changing code. Use when debugging an exception, a regression after a deploy, or a latency complaint.
---

Everything here is read-only. Credentials come from `WT_API_URL`, `WT_API_KEY`, `WT_PROJECT_ID`; never print them.

1. `wtctl agent inspect issues --limit 10`: find the issue; note its id, culprit, first seen release and times seen.
2. Read the newest event of the issue (`GET /v1/projects/$WT_PROJECT_ID/issues/<id>/events?limit=1`, or the MCP tools) and take the top in-app stack frame. Open that file at that line.
3. The event carries a `trace_id`: `wtctl agent inspect trace <trace id>` shows the failing span, its parent request and neighbouring spans. Look for the slow or failing child.
4. `wtctl agent inspect logs --text "<error text>"` for the log lines around the failure.
5. Check whether the first-seen release matches a recent deploy; suspect commits are listed on the issue (`/issues/<id>/suspects`).
6. State the root cause with the evidence (frame, span, log line) before editing. Reproduce with a test, fix, and mention the issue id in the commit message so Watchtower links the resolution to the release.

Do not resolve, ignore or merge issues unless the user asks.
