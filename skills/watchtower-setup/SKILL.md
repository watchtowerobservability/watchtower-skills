---
name: watchtower-setup
description: Wire an application to Watchtower (errors, traces, logs, releases) and trace this coding agent itself. Use when asked to add Watchtower, instrument a service, or send telemetry.
---

1. Detect the stack (package.json, pyproject.toml, go.mod, pom.xml, composer.json, Gemfile, Cargo.toml) and install the matching SDK from `github.com/watchtowerobservability/watchtower-<lang>` (node, python, go, java, php, ruby, dotnet, rust, browser, android, ios). Or run `npx @watchtowerobservability/wizard`.
2. Configure with environment variables, identical in every SDK: `WT_INGEST_KEY` (secret, server SDKs only), `WT_OTLP_ENDPOINT` (default `http://localhost:4318`), `WT_SERVICE`, `WT_ENVIRONMENT`, `WT_RELEASE`. Browser, mobile and desktop SDKs take the publishable key as an option instead.
3. Never write a key into a file, a commit or a log. Read it from the environment or a secret manager and tell the user where to set it.
4. Verify with `wtctl send-test --endpoint "$WT_OTLP_ENDPOINT" --key "$WT_INGEST_KEY"`, then confirm the service appears with `wtctl agent inspect issues --limit 5`.
5. To trace this coding session too: `wtctl agent setup claude|cursor|codex|gemini --endpoint <gateway url>` (run once; the ingest key stays in `WT_INGEST_KEY`).
6. Upload source maps or debug files from CI with `wtctl sourcemaps upload <dir>` and `wtctl debug-files upload <path>`, and create the release with `wtctl release create <version> --deploy <env>`.
