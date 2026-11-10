---
name: ultimate-browsing
description: "Read blocked or incomplete pages, platform APIs, historical archives, social content and media/subtitles through OMP's native read, web_search and browser prelude. Includes platform prerequisites and source validation; does not supply a crawler or stealth runtime."
---

# Ultimate browsing

Use the cheapest applicable source that satisfies the user's actual criterion. A search result, metadata fragment, historical copy or public page cannot prove access to full current authenticated content.

1. A known static URL, PDF, feed or public API goes to native `read`. A keyword or handle without a source URL goes to `web_search`, then `read` the discovered source. Prefer official endpoints in [public APIs](references/public-apis.md).
2. Validate the returned content using [extraction and validation](references/extraction.md). HTTP 200, an opened tab or a large HTML shell is not proof of content.
3. For a dead/changed page or a request for historical evidence, use [archives](references/archives.md). Cite the original URL, archive URL and archive's snapshot timestamp.
4. For a platform, consult [social channels](references/social.md), [Naver](references/naver.md), [feeds and web channels](references/feeds-web.md), [media](references/media.md), or [developer and career channels](references/dev-career.md). Use installed applicable utilities only after checking prerequisites; no pack or MCP installation is implied.
5. A JavaScript shell, blocked dynamic page, required interaction, screenshot or authorized account view goes to [native browser escalation](references/browser-escalation.md). Read `skill://browser`, `skill://browser/references/lifecycle.md` and `skill://browser/references/network.md` before interaction. Host routing, including any applicable `skill://aside-browser` explicit-tool rule, wins.
6. [Optional external readers](references/external-readers.md) require an existing authorized key/service and permission for any paid usage or sensitive-data transfer. Native `read` remains the static extraction owner.

Native examples are tool arguments, not shell commands:

```json
{"path":"https://example.com"}
```

```json
{"query":"site:mp.weixin.qq.com battery recycling"}
```

Use the first object with `read`, the second with `web_search`. Read raw HTML with a `:raw` suffix when structured source inspection is needed. Follow the tool's continuation hint for truncated output.

## Boundaries

- The browser is an Eval prelude, available only with Eval/browser enabled; it is not an AgentTool. Read `xd://eval/browser` for the active API. No alternative runtime is bundled here.
- Never auto-install tools, extensions, MCP servers, anti-bot services or subscriptions. Missing channel capabilities are prerequisites or gaps, not permission to build a replacement.
- Do not copy browser profiles, decrypt/export cookies, scrape local session stores or transfer session credentials into a reader/CLI. Authorized account access stays in the real-session relay/CDP browser. Never silently replace it with a public or headless session.
- Do not forward Cookie/Authorization headers, private signed links or account pages to archives, proxies or external readers. Keep credentials out of output, source files, shell history and shared artifacts.
- Respect approval boundaries for external writes, account changes, posts/messages, paid actions and authentication setup. A denied operation is final for its purpose; changing tools or hosts does not authorize it.
- Rate limits, CAPTCHA, paywalls and regional restrictions remain real constraints. Report what remains blocked; do not claim generic WAF bypass or automatically rotate identities/proxies.

Stop when the requested content is supported by attributable evidence, or when available authorized routes are exhausted. State partial content and missing prerequisites precisely. Do not run a compulsory retry grid after a successful read.

Upstream coverage, licensing and runtime omissions: [ATTRIBUTION.md](ATTRIBUTION.md).
