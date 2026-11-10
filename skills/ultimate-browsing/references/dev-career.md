# Developer and career channels

## GitHub

Prefer native GitHub resources/tools where available; use `read` for known public URLs/API endpoints. An already installed authenticated `gh` is an optional official CLI. Inspect existing authentication without initiating login:

```bash
gh auth status
gh search repos "browser automation" --sort stars --limit 10
gh search code "browser automation" --language typescript
gh repo view cli/cli
gh issue list -R cli/cli --state open
gh pr list -R cli/cli --state open
gh run list --repo cli/cli --limit 10
gh workflow list --repo cli/cli
gh release list -R cli/cli
gh api repos/cli/cli
```

Use observed issue/PR/run IDs with `gh issue view`, `gh pr view`, `gh pr checks` or `gh run view --log-failed`. Structured output example:

```bash
gh issue list --repo cli/cli --json number,title --jq '.[] | "\(.number): \(.title)"'
```

Private repositories and code search can require authentication and scopes; do not infer public access. Set repository/version/commit explicitly when citing code. Host access rules govern any login/setup.

Upstream also listed clone/create/fork/sync, issue/PR creation, and release creation. Those operations remain available only through the actual host/CLI contract with explicit applicable authorization. They are not reading fallbacks; no sample write should be run during research. Other upstream repository/documentation services (zread/context7) are optional connected services, not bundled native readers.

## LinkedIn and career research

Native `web_search` can discover public person/company/job URLs; `read` can retrieve public HTML and JSON-LD where present. Label public summaries and Person metadata as partial, and verify identity, role date and organization. They are not substitutes for an authorized account view, complete employment history or a live job's current availability.

For required account access read `skill://browser`, [lifecycle](skill://browser/references/lifecycle.md) and [network](skill://browser/references/network.md), then use an authorized relay/CDP real session. Do not copy profile/cookies or silently open a public headless view.

Upstream's `linkedin-scraper` service supplied person/company profiles and people/job search but required a valid login session. OMP has no corresponding native structured scraper API. An already connected authorized service requires inspection of its real schema and credentials policy; do not install it or provision cookie credentials. Public Jina output, if authorized, remains subject to [external reader limits](external-readers.md) and may be incomplete.

Viewing/searching does not authorize messages, connection requests, job applications or profile edits. Keep personal data out of unrelated artifacts and collect only the fields the task needs.
