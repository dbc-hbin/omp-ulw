# Optional external readers

Native `read` owns static fetch/extraction, including URLs and PDFs. External readers are optional existing services for a demonstrated gap, never an automatic pack/runtime installation or a generic WAF solution.

## Jina Reader

Upstream's 2026-08-09 probe reported anonymous Reader requests returning 401 and sometimes a Turnstile redirect. Treat this as a dated observation; do not promise an anonymous free tier. The upstream route required an existing `JINA_API_KEY` Bearer credential.

Only use a key already configured through an approved secret mechanism and authorize any billable usage. Never put a secret value in a command argument, transcript or artifact. The request contract is:

- URL: `https://r.jina.ai/` followed by the complete public source URL.
- Header: `Authorization: Bearer` with the existing secret.
- Default output: extracted Markdown.
- `Accept: application/json`: structured `data` including title/content/metadata and possibly `external.alternate` feed links.
- `X-Target-Selector`: an observed CSS selector for the requested content.
- `Accept: text/event-stream`: Reader streaming output, which still needs validation.
- `X-Respond-With: text` or `html`: alternate output forms.
- `X-With-Links: true`: link-preserving output.
- `X-No-Cache: true`, `X-Cache-Tolerance: 600`: requested cache behavior, not proof of freshness.
- `X-Respond-With: screenshot`: upstream returned a temporary signed screenshot URL; native browser screenshots are preferred for actual visual proof.

These are service-specific headers, not native `read` arguments. Native `read` does not expose arbitrary credential/header injection. If no approved secret-aware client is available, this route has a prerequisite; do not invent a `read` header option or expose the key through shell interpolation. Confirm current service documentation before using historical response fields/options.

Reader conversion may support PDFs and render SPA pages, but extraction may omit interactions, paywalled bodies, frame content, subtitles or regional content. A reader's rendered copy is not the user's signed-in browser and does not prove authenticated access. Cite the original source and disclose the reader route when relevant; inspect returned source/date/cache metadata.

Do not use the upstream `X-Set-Cookie` recipe. Do not forward account cookies, Authorization headers for another site, private signed URLs or sensitive documents to a reader/proxy. An API key for the reader authorizes service access only, not disclosure of third-party credentials.

## Other source channels

Upstream Web Reader MCP and Exa search/crawling routes are replaced by native `read`/`web_search`; output-format requests should use those tools' real contracts. An already connected authorized service is usable only through its observed schema and host policy. No bridge, MCP install, anti-bot subscription or unsupported method is supplied here.

Camoufox, TLS impersonation libraries, alternate HTTP stacks, residential proxies and CAPTCHA services are not prerequisites for this skill. Their upstream recipes are runtime-specific omissions. Use the native browser for actual rendering, or state that the remaining challenge cannot be passed with available authorized capabilities.
