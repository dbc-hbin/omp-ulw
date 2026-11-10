# Naver and Korean sources

Use native `web_search` for discovery and `read` for known public URLs. Korean new-content indexing can lag; a missing web result does not prove a post does not exist.

## Blog

For a known `blog.naver.com/{blog-id}/{post-id}`, try the platform's public mobile representation with native `read`:

`https://m.blog.naver.com/PostView.naver?blogId={blog-id}&logNo={post-id}`

The blog RSS URL is `https://rss.blog.naver.com/{blog-id}.xml`. Upstream observed about 50 recent entries with short excerpts; inspect current scope rather than calling it full text.

## News, finance and search

Read original news URLs such as `https://n.news.naver.com/article/{press-id}/{article-id}` and finance pages such as `https://finance.naver.com/item/main.naver?code=005930`. Optional external-reader claims of "complete" or "real-time" access are not guarantees; verify body, observation time and currency/market state.

The undocumented public finance endpoint is:

```json
{"path":"https://api.finance.naver.com/siseJson.naver?symbol=005930&requestType=1&startTime=20240101&endTime=20241231&timeframe=day"}
```

Minute-series recipe: `?symbol=005930&requestType=0&timeframe=minute&count=200`. Response rows historically contained date, open, high, low, close, volume and foreign-ownership ratio. It may not be strict JSON; inspect before parsing. This is not a documented official API or a guarantee of licensed live market data.

Naver search URLs accept an encoded `query`:

- `https://search.naver.com/search.naver?query={query}`
- Blog tab: add `where=post`.
- News tab: add `where=news`.

Use `read` if static output suffices, otherwise the native browser. Upstream used TLS impersonation/session warming to fetch search HTML; that runtime is not ported and native `read` has no such options. Search snippets are discovery evidence; read the linked original before quoting a full article.

## Cafe, TV and dynamic pages

Cafe pages can require account membership and iframe navigation. A login wall is an authentication prerequisite; do not keep changing identities. An authorized account flow uses `skill://browser`, its [lifecycle](skill://browser/references/lifecycle.md) and [network](skill://browser/references/network.md) references. Inspect actual frame URLs/handles through documented browser APIs; do not assume the outer document contains the post.

Naver TV metadata/subtitles can use an already installed supported `yt-dlp` on the real `https://tv.naver.com/v/...` URL; see [media](media.md). No automatic utility installation or live-session cookie extraction.
