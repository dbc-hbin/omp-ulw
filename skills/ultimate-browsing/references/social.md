# Social channels and prerequisites

Prefer public API/static content, then the authorized real browser. For every browser action read `skill://browser`, its [lifecycle](skill://browser/references/lifecycle.md) and [network](skill://browser/references/network.md) references. Public metadata cannot replace an authenticated acceptance criterion.

CLI examples below are optional recipes for an already installed tool, known compatible version and authorized configuration. Check `command -v` and the tool's help before use. Never install, upgrade or import browser credentials automatically. Avoid raw account IDs invented from snippets; retain source URLs, IDs, timestamps and access tokens embedded in content links privately when needed.

## X / Twitter

Discover post URLs with native `web_search`:

```json
{"query":"site:x.com open source browser automation"}
```

For a known public post, use `read` on `https://publish.twitter.com/oembed?url=` followed by the percent-encoded post URL. The JSON's `html` contains an embed, with author information; it need not expose complete threads, articles, replies, metrics or private posts.

`https://syndication.twitter.com/srv/timeline-profile/screen-name/{handle}` is an undocumented, fragile public timeline route. Upstream extracted `__NEXT_DATA__.props.pageProps.timeline.entries`, then tweet `full_text`, `id_str`, `created_at`, `favorite_count`, `retweet_count` and media. The observed recent-post limit and absence of pagination do not prove a complete timeline. `hasResults: false`, an X sign-in shell or missing data is failure/partial content, not an empty account.

An existing authorized `twitter-cli` configuration can support:

```bash
twitter feed -n 20
twitter tweet "https://x.com/jack/status/20"
twitter user @jack
twitter user-posts @jack -n 20
```

The installed tool may also expose `article`, `search` and structured output options; inspect its help. Upstream's v0.8.5-era search sometimes returned 404 after GraphQL changes; don't replace a requested search with a home feed and claim equivalence. Likes may be limited to the account's own likes. If configuration relies on browser cookie extraction or exported session cookies, do not use that setup path: use the authorized relay/CDP account instead. Nitter, legacy RSS and cached SPA shells are not guaranteed alternatives.

## Xiaohongshu

An already installed/configured `xhs` can read:

```bash
xhs search "battery recycling"
xhs hot
xhs feed
```

Pass the actual complete URL/token-bearing result returned by search/feed to `xhs read` or `xhs comments`; bare fabricated note IDs can lack required signatures. Upstream v0.6.4 notes reported `user`, `user-posts` and `favorites` unstable. Those are historical version observations. Do not run login flows that extract local browser cookies. Missing acceptable CLI auth is a prerequisite for the CLI; use an authorized real session when available. Stop/slow on platform challenges and quotas; no bulk-rate promise. Posting, commenting and liking require separate explicit authorization even if a CLI supports them.

## Douyin

Read public share URLs or installed `yt-dlp` metadata first. Upstream used external service methods `parse_douyin_video_info`, `get_douyin_download_link` and `extract_douyin_text`; none is a native OMP API or bundled capability. An already connected authorized service can be used only after inspecting its actual schema and access conditions. Otherwise use rendered public content, [media](media.md), or report missing parsing/transcription capability. A downloadable URL is not a transcript or permission to redistribute.

## Weibo

Use `read` on the original public post URL, then authorized browser rendering if needed. An existing authorized Jina key can support a public `https://weibo.com/{uid}/{pid}` reader request under [external reader rules](external-readers.md); it is no guarantee of access. Never forward the account session.

## Bilibili

Use [media](media.md) for `yt-dlp` metadata/subtitles and installed `bili` search/hot/rank. Upstream reported server/overseas IP 412 responses. Do not interpret every 412 as a missing cookie or automatically extract credentials, install a proxy or change region. Use public sources or the authorized account browser; report inaccessible subtitles.

## Reddit and V2EX

[Public endpoints](public-apis.md) cover posts, comments, users and nodes. An installed `rdt-cli` may offer:

```bash
rdt search "battery recycling" --limit 10
rdt sub python --limit 20
rdt popular --limit 10
rdt all --limit 10
```

Use an actual returned post ID with `rdt read`. Upstream v0.4.2+ supported public reading; personal subscriptions (`feed --subs-only`) and saved posts require authorized login. Confirm the installed version's output switches; do not assume all channels share `--json`/`--yaml`. Native public reads cannot prove personal saved/subscribed content.
