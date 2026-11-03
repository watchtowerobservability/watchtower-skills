# Watchtower agent skills

Five skills that teach coding agents to use Watchtower: `watchtower-setup`, `watchtower-debug-issue`,
`watchtower-write-alerts`, `watchtower-query` and `watchtower-activity` (add a customer-facing activity
log: record events, mint viewer sessions, and show the log embedded or in the app's own components). They drive the read-only `wtctl agent inspect` commands
and the Watchtower MCP server; they never print or store a key.

## Install

```sh
npx @watchtowerobservability/skills install            # every tool, in the current project
npx @watchtowerobservability/skills install claude     # claude | cursor | codex | gemini | all
```

| Tool | Written to |
|---|---|
| Claude Code | `.claude/skills/<skill>/SKILL.md` |
| Cursor | `.cursor/rules/<skill>.mdc` |
| Codex | managed block in `AGENTS.md` |
| Gemini | managed block in `GEMINI.md` |

Re-running updates in place; text outside the managed block is kept. To also trace the agent itself and
give it read access, run `wtctl agent setup <tool> --endpoint <gateway url>`.

## Quick start

```sh
export WT_API_URL=... WT_API_KEY=... WT_PROJECT_ID=...
npx @watchtowerobservability/skills install claude
# ask your agent: "debug the newest Watchtower issue"
```

## Configuration

| Variable | Used by | Meaning |
|---|---|---|
| `WT_API_URL` | `wtctl agent inspect` | API base URL |
| `WT_API_KEY` | `wtctl agent inspect` | API key (read) |
| `WT_PROJECT_ID` | `wtctl agent inspect` | project id |
| `WT_INGEST_KEY` | `wtctl agent setup` | ingest key, read at runtime, never written to disk |
| `WT_OTLP_ENDPOINT` | `wtctl agent setup` | gateway OTLP/HTTP URL (default `http://localhost:4318`) |

## Integrations

| Agent | Skills | Telemetry of the agent |
|---|---|---|
| Claude Code | yes | via `wtctl agent setup claude` |
| Cursor | yes (rules) | MCP only |
| Codex | yes | via `wtctl agent setup codex` |
| Gemini CLI | yes | via `wtctl agent setup gemini` |

Source of truth for the commands: `plugins/claude-code/` and `go/wtctl/agent.go` in the monorepo.

## Verify a release

`gh attestation verify watchtowerobservability-skills-0.1.0.tgz --repo watchtowerobservability/watchtower-skills`

## License

Apache-2.0.
