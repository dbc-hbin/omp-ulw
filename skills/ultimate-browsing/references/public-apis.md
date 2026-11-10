# Public platform endpoints

Use native `read` on these URLs. Encode path/query values from actual user/source data; braces below describe parameters, not literal values to send. These are endpoint recipes, not availability or quota guarantees. Check provider documentation, returned errors, pagination cursors, quota headers and `Retry-After`/backoff. Public does not mean unlimited, complete or officially supported.

Concrete example:

```json
{"path":"https://hacker-news.firebaseio.com/v0/item/8863.json"}
```

## Communities and social

| Platform | Endpoint recipes and limits |
|---|---|
| Reddit | `https://www.reddit.com/r/{sub}/hot.json?limit=10`, `new.json`, `top.json?t=week`; `/r/{sub}/search.json?q={query}&restrict_sr=1`; `/r/{sub}/comments/{id}/{slug}/.json`. Listings use `data.children`; pagination uses `after`. Post/comments responses contain separate listing trees and `more` nodes; never claim all comments from one response. Access may require approved API authentication. Upstream's mobile-UA workaround is not a native `read` option or access guarantee. |
| Hacker News | `https://hacker-news.firebaseio.com/v0/topstories.json`, `beststories.json`, `newstories.json`, `askstories.json`, `showstories.json`; `/item/{id}.json`. IDs require individual item reads; comments are `kids`, with deleted/dead nodes possible. Optional Firebase limits: `?limitToFirst=10&orderBy=%22%24key%22`. Search: `https://hn.algolia.com/api/v1/search?query={query}&tags=story`; Algolia is a separate search service. |
| Lobsters | `https://lobste.rs/hottest.json`, `/newest.json`, `/t/{tag}.json`, `/s/{short_id}.json`. |
| DEV | `https://dev.to/api/articles?tag=ai&per_page=5`, `?top=7&per_page=5`, `?username={user}&per_page=5`; individual `/api/articles/{id}` for body when available. |
| V2EX | `https://www.v2ex.com/api/topics/hot.json`; `/api/topics/show.json?node_name=python&page=1`; `/api/topics/show.json?id={id}`; `/api/replies/show.json?topic_id={id}&page=1`; `/api/members/show.json?username={name}`. Node directory: `https://www.v2ex.com/planes`. |
| Bluesky | `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor={handle}`; `/xrpc/app.bsky.feed.getAuthorFeed?actor={handle}&limit=10`. Preserve cursor, post URI, account DID and timestamps. Search availability can differ from profile/feed access. |
| Mastodon | On the actual account's instance: `https://{instance}/api/v1/accounts/lookup?acct={user}`, `/api/v1/accounts/{id}/statuses?limit=10`, `/api/v1/timelines/tag/{tag}?limit=10`. Public timeline/search policy varies per instance; follow returned pagination links. |
| Stack Exchange | `https://api.stackexchange.com/2.3/search?order=desc&sort=votes&intitle={query}&site=stackoverflow`; `/questions?tagged={tags}&site=stackoverflow&pagesize=5`; `/questions/{id}/answers?order=desc&sort=votes&site=stackoverflow&filter=withbody`. Respect `has_more`, `quota_remaining`, `backoff`; bodies are HTML. |

For X's public oEmbed and fragile syndication routes, see [social](social.md).

## Academic, books and reference

| Platform | Endpoint recipes |
|---|---|
| arXiv | `https://export.arxiv.org/api/query?search_query=ti:{query}&max_results=5&sortBy=submittedDate&sortOrder=descending`; `au:`, `abs:`, `cat:cs.AI` and `id_list` refine Atom results. Space requests according to current arXiv policy; do not copy upstream's inconsistent "3/sec" claim as a guarantee. Abstract/preprint metadata does not prove peer review. |
| Crossref | `https://api.crossref.org/works?query={query}&filter=from-pub-date:2025-01&rows=5&sort=relevance`; `/works/{DOI}`. Encode the DOI correctly. Polite-pool contact metadata may be supplied only with an authorized address; don't invent one. |
| Open Library | `https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&jscmd=data&format=json`; `/search.json?q={query}&limit=5`. Distinguish work, edition and ISBN. |
| Wikipedia | `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`; `https://en.wikipedia.org/w/api.php?action=opensearch&search={query}&limit=5&format=json`. Substitute the desired language host. Read cited primary sources for disputed factual claims. |

## Packages and code

| Platform | Endpoint recipes |
|---|---|
| npm | `https://registry.npmjs.org/{package}/latest`; `https://registry.npmjs.org/-/v1/search?text={query}&size=5`; `https://api.npmjs.org/downloads/range/last-month/{package}`. Encode scoped package names and distinguish publication, latest dist-tag and download dates. |
| PyPI | `https://pypi.org/pypi/{package}/json`. `https://pypistats.org/api/packages/{package}/recent` is a third-party statistics service, not the package registry. |
| GitHub | `https://api.github.com/search/repositories?q={query}&sort=stars&per_page=5`; `/repos/{owner}/{repo}/releases?per_page=5`; `/repos/{owner}/{repo}`. Code search generally requires authentication. Prefer the host GitHub tool when available or installed `gh`; see [developer channels](dev-career.md). |

For archive endpoints see [archives](archives.md); feeds and Korean sources have their own references. Do not classify Naver's undocumented finance endpoint, X syndication, HN Algolia or third-party statistics as a documented official API merely because they return JSON.
