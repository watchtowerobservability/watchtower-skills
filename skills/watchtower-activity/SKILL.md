---
name: watchtower-activity
description: Add a customer-facing activity (audit) log to an app with Watchtower - record events on the server, mint viewer sessions, and show the log in the app's own UI (embedded <wt-activity> or app-native components over the feed API). Use for "add an audit log", "show customers their activity", "record who did what", "SOC 2 audit trail for our tenants".
---

Goal: every tenant of the user's app sees its own tamper-evident activity log inside the app, styled like the app. Three parts: record (server), session (server), display (client). Do them in this order and test each before the next.

## Rules

- Two credentials, never mixed: the project secret `wti_...` (`WT_SECRET_KEY`, server only: record events, mint sessions) and a short-lived viewer session token (browser). Never send the secret to a browser, a mobile app, a log line or a commit; read it from the environment and tell the user where to set it.
- The account is the app's tenant (organisation, workspace, team id), never the end user. Take it from the authenticated server session, never from a request parameter.
- Actions are `noun.verb` in past tense (`invoice.paid`, `member.role_changed`, `api_key.created`); `wt.*` is reserved. Keep one list of action constants in the codebase.
- Never put secrets, passwords, tokens or full card numbers in `metadata`; configure redaction (`PUT /v1/projects/$WT_PROJECT_ID/activity/redaction`) for fields that might carry personal data.

## 1. Record (server)

Install the server SDK of the stack: npm `@watchtowerobservability/activity`, PyPI `watchtower-activity`, Go `github.com/watchtowerobservability/watchtower-activity-go`, and the Ruby, PHP (Laravel facade), Java, .NET, Rust and Elixir packages from `github.com/watchtowerobservability/watchtower-activity-<lang>`. Find the places where the app changes state (handlers, service methods, model hooks, webhook receivers) and record after the change commits:

```ts
await activity.record({ account_id: org.id, action: 'member.role_changed', actor: { id: user.id, name: user.name, email: user.email },
  target: { type: 'member', id: member.id, name: member.email }, changes: [{ field: 'role', old: before, new: after }],
  outcome: 'success', context: { ip: req.ip, user_agent: req.headers['user-agent'], request_id: req.id },
  idempotency_key: `member-${member.id}-role-${version}` });
```

Record denials too (`outcome: 'denied'`, `severity: 'warning'`): they are what auditors look for. When an AI agent or an API key acts for a person, set `actor` to the agent or key and `on_behalf_of` to the person. A stable `idempotency_key` makes retries safe (delivery is at least once). Check the shape without storing with `POST /v1/activity/events/validate` or `record(..., { dryRun: true })`; register schemas for the important actions (`PUT /v1/projects/$WT_PROJECT_ID/activity/schemas/{action}`, start with `mode: warn`).

## 2. Session (server)

Add one authenticated endpoint in the app, for example `POST /api/activity-session`, that checks the signed-in user may see the tenant's log and returns a viewer session:

```ts
const { token } = await activity.createViewerSession({ accountId: org.id, capabilities: ['read', 'export', 'verify'], expiresIn: 900, locale: user.locale, timeZone: user.timeZone });
return { token };
```

Give `export`/`verify` only to roles that should have them; `actorId` limits a session to one user's own events and `subScope` to one object. On logout or a tenant offboarding call `revokeAccountSessions(org.id)`. The client refreshes the token before `expiresIn` runs out.

## 3. Display (client)

Match the app first: read its design tokens (CSS variables, Tailwind config, theme file) and component library before writing UI. Then pick one:

- Embedded element, least code: `npm i @watchtowerobservability/activity-web` plus the wrapper of the framework: `/react` (`<ActivityLog session={token} />`), `@watchtowerobservability/activity-vue` (`<ActivityLog :session="token" @open="..." />`), `@watchtowerobservability/activity-angular` (`<wt-activity [session]="token" (activityOpen)="...">` with the standalone `WtActivityComponent` in `imports`), `@watchtowerobservability/activity-svelte` (`<div use:wtActivity={{ session: token }} />` or `<ActivityLog session={token} />`). Plain HTML: `<wt-activity session="..." base-url="https://api..."></wt-activity>`. Set `theme`, `accent`, `density` and `locale` from the app; brand colours, fonts, columns and strings go in the project theme (`PUT /v1/projects/$WT_PROJECT_ID/activity/theme` then `.../theme/publish`), so every surface matches.
- App-native UI, when the log must look exactly like the app: build the list with the app's own table, filter and drawer components over the viewer API, with the token as `Authorization: Bearer`. `GET /v1/activity/feed?limit=&cursor=&q=&actor_id=&action=&outcome=&from=&to=` returns `{data: [Event], next_cursor, theme}`; `GET /v1/activity/feed/facets?field=action|actor|target_type|target` fills filter selects; `GET /v1/activity/actions` gives display names; `GET /v1/activity/feed/histogram` the volume chart; `GET /v1/activity/feed/export?format=csv|ndjson|ocsf` (cap `export`) downloads; `GET /v1/activity/feed/verify` and `.../feed/proof?id=` (cap `verify`) prove integrity; `GET /v1/activity/feed/stream` is live SSE. An Event has `id, account_id, action, actor {id, name, email, type}, on_behalf_of, target, targets[], changes[], outcome, severity, context {country, request_id}, metadata, occurred_at, received_at`. Render `changes` as before/after, times in the user's zone, and keep a "Verified" badge from the verify call. Search input takes the query language (`action:member.* -actor:bot outcome:denied created:>=2026-01-01`); an AI search box can call `POST /v1/activity/query/translate {text}` and run the returned `q` when it is not null.

Every list needs empty, loading and error states, keyboard access and pagination by `next_cursor` (never by page numbers).

## 4. Verify

Run the app, perform one recorded action, open the log as a tenant user and confirm the event shows with actor, target and changes. Confirm a second tenant cannot see it (a foreign account is a 404). Then summarise for the user: the actions now recorded (file and line of each), the session endpoint and who may call it, and the config they must set (`WT_SECRET_KEY`, `WT_API_URL`, the project id). Optional: Terraform resources `watchtower_activity_stream`, `_rule`, `_schema`, `_retention`, `_redaction`, `_theme`, `_domain`, `_export_schedule` keep the configuration in code; the MCP server's `activity` toolset (`search_activity`, `verify_activity`, ...) lets an agent inspect the log afterwards.
