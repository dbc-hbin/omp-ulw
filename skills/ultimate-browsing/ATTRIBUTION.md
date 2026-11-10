# Attribution and source coverage

This is an OMP-native instruction adaptation of `ultimate-browsing` in the oh-my-openagent/OMO repository, source commit `42d5746e72bfcfb782db6b5182b70a3e9c55f1cc`, under `packages/shared-skills/skills/ultimate-browsing/`. Source repository: <https://github.com/code-yeongyu/oh-my-openagent>. Migration reviewed 2026-11-11.

MODIFIED COPY: the source instructions have been rewritten for OMP's native tools, consolidated into new reference paths, and stripped of replacement runtimes and credential-extraction procedures. The upstream repository declares `SUL-1.0`; its complete license terms are preserved in [LICENSE.md](LICENSE.md). Its skill attribution's statement that the reference prose has no third-party obligations does not remove the repository's own license.

The source `ATTRIBUTION.md` identifies its skill and reference prose as project-original OMO content and separately attributes a modified vendored engine to <https://github.com/fivetaku/insane-search>. That engine was imported by OMO on 2026-06-21, commit `a4e4ed797`, from a pre-0.7.0 snapshot; OMO reported no upstream LICENSE in that snapshot and warned against inferring project-original licensing. This port includes no engine code or engine templates and makes no new license grant for them. Preserve this provenance notice; consult the upstream repository's applicable license before redistribution. Named external tools/APIs retain their own licenses and terms; none of their source is included here.

These references are rewritten instructions, not a vendored runtime. Upstream historical probe dates (notably 2026-08-09), version quirks and archive timestamps remain explicitly historical. Current API availability and quotas require actual response/provider evidence.

## Coverage map

All upstream reference files were read. Consolidation keeps each source territory reachable from the skill:

| Upstream source | Native adaptation and coverage |
|---|---|
| `SKILL.md` | [SKILL.md](SKILL.md): routing by static/platform/archive/media/dynamic/auth need, no compulsory fetch grid, prerequisites and privacy |
| `references/insane-search/README.md` | [extraction](references/extraction.md), [public APIs](references/public-apis.md), [browser escalation](references/browser-escalation.md): official endpoints, response proof, API discovery and explicit runtime gaps |
| `insane-search/fallback.md` | [extraction](references/extraction.md): signal-based escalation, partial-content labels, authentication, soft blocks, empty SPA/JSON, quotas and stop criteria |
| `insane-search/tls-impersonate.md` | [extraction](references/extraction.md), [browser escalation](references/browser-escalation.md): TLS/UA/JS/IP distinctions, no native fingerprint/grid equivalent; no imported library/proxy/CAPTCHA recipes |
| `insane-search/playwright.md` | [browser escalation](references/browser-escalation.md): native observation/waits/rendering/mobile/network, backend prerequisites and account/session boundaries |
| `insane-search/metadata.md` | [extraction](references/extraction.md): OGP, Twitter Cards, JSON-LD/schema types, canonical/feed links, Next/RSC payload handling without executing untrusted scripts |
| `insane-search/jina.md` | [external readers](references/external-readers.md): key prerequisite, historical anonymous failure, structured/selector/stream/cache/text/HTML/PDF/link/screenshot capabilities; credential forwarding removed |
| `insane-search/cache-archive.md` | [archives](references/archives.md): availability/CDX, archive.today, exact snapshot provenance, historical failures and redirect/interstitial false positives |
| `insane-search/json-api.md` | [public APIs](references/public-apis.md): Reddit, HN/Firebase/Algolia, Lobsters, DEV, npm, PyPI, Wikipedia, V2EX |
| `insane-search/public-api.md` | [public APIs](references/public-apis.md), [archives](references/archives.md): Bluesky, Mastodon, Stack Exchange, arXiv, Crossref, Open Library, GitHub and Wayback; quotas/errors and undocumented-route distinctions |
| `insane-search/rss.md` | [feeds/web](references/feeds-web.md): discovery, common feed URLs, Korean news/blog feeds, Google News, optional parsing, SearXNG prerequisites |
| `insane-search/twitter.md` | [social](references/social.md): native discovery/oEmbed, fragile syndication and embedded fields, pagination/search/private-account limits, dead/partial alternatives |
| `insane-search/naver.md` | [Naver](references/naver.md): blog mobile/RSS, news, finance/undocumented series, search tabs, Cafe frames/auth, TV |
| `insane-search/media.md` | [media](references/media.md): installed yt-dlp metadata/captions/search/playlists/comments, video/audio/Korean/news territories, provenance and extractor limits |
| `references/agent-reach/README.md` | Skill router plus [social](references/social.md), [feeds/web](references/feeds-web.md), [media](references/media.md), [developer/career](references/dev-career.md): per-channel prerequisites instead of pack installation |
| `agent-reach/social.md` | [social](references/social.md), [public APIs](references/public-apis.md): xhs signed-result links/version limits, Douyin service gap, twitter-cli prerequisites, Weibo, Bilibili 412, V2EX, rdt public/private boundaries |
| `agent-reach/web.md` | [feeds/web](references/feeds-web.md), [external readers](references/external-readers.md): native page/PDF/feed reading, WeChat discovery/rendering, optional service gaps |
| `agent-reach/video.md` | [media](references/media.md): YouTube, Bilibili/bili, Xiaoyuzhou transcription/provider/ffmpeg prerequisites, Douyin limitations |
| `agent-reach/career.md` | [developer/career](references/dev-career.md): LinkedIn public metadata vs authenticated profiles, people/company/jobs search scope and structured-scraper gap |
| `agent-reach/dev.md` | [developer/career](references/dev-career.md): installed gh read/search/API/CI/release routes, scopes, write/clone/sync authorization and optional docs services |
| `agent-reach/search.md` | [feeds/web](references/feeds-web.md): native web/technical/code discovery, no assumed Exa/Zhipu/MCP payload or installation |
| `references/chrome-stealth.md` | [browser escalation](references/browser-escalation.md): actual native lifecycle/network links, public vs real-session selection, mobile effects, challenge proof and no stealth/identity guarantee |

## Deliberate runtime-specific omissions

- Entire upstream `engine/**`, templates, tests, WAF/TLS/URL grids, schemas, surrogate registry, bias gate and automatic dependency installation: not imported. Native `read` owns static extraction; content validation knowledge lives in the references. Official endpoint recipes are documentation, not new runtime site-specific code.
- Entire upstream `scripts/**`, including cookie extraction, OS decryption, profile discovery and injection helpers/tests: not imported. Authorized real sessions use native relay/CDP. No local session copying or secret export recipe remains.
- Owned/attached replacement libraries, stealth binaries, plugin onboarding, pack/bridge installs, proxies, anti-bot subscriptions and CAPTCHA-solving services: not installed, wrapped or promised. Native browser is the only interaction path in this port, subject to host routing.
- Native gaps remain explicit: no controllable TLS fingerprint grid, guaranteed pinned stealth identity/fresh profile, universal WAF/CAPTCHA bypass, bundled platform scraper, speech-to-text provider or media extractor. Existing authorized installed utilities/services can cover only their real documented capabilities.
- Upstream commands that create posts, issues, PRs, repositories, releases, captures or account relationships are not automatic reading steps. Their underlying channel knowledge is preserved with applicable authorization boundaries.

No test/build/lint/formatter or live browser verification is claimed by this attribution. The port records source coverage and documented contracts; integration and real-surface checks belong to the parent task.
