---
name: watchtower-write-alerts
description: Write Watchtower alert rules as Prometheus-style rule files and import them. Use when asked to add, tune or review alerts, SLOs or monitors.
---

Rule files use the Prometheus rule-group format. Import with
`wtctl rules import rules.yaml --api "$WT_API_URL" --key "$WT_API_KEY" --project "$WT_PROJECT_ID"`.

```yaml
groups:
  - name: checkout
    interval: 1m
    rules:
      - alert: CheckoutErrorRateHigh
        expr: sum(rate(http_server_requests_total{service="checkout",status=~"5.."}[5m])) / sum(rate(http_server_requests_total{service="checkout"}[5m])) > 0.05
        for: 10m
        labels: { severity: critical }
        annotations:
          summary: "Checkout 5xx above 5%"
          runbook_url: https://example.com/runbooks/checkout
```

Guidelines:
- Alert on symptoms users feel (error rate, latency percentile, saturation), not causes.
- Always set `for:` (at least 5m for ratios) and a `severity` label (critical, high, warning, info). Every rule needs a `summary` and ideally a `runbook_url`.
- Use ratios over absolute counts so traffic changes do not page anyone.
- List existing monitors first: `wtctl agent inspect monitors`. Avoid duplicates; tune thresholds instead.
- Import an existing Alertmanager config with `wtctl routing import-alertmanager <file>` (dry run unless `--apply`).
- Show the user the file before importing anything.
