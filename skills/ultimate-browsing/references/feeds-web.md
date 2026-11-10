# Feeds and web channels

Use `read` for static web pages, PDFs and feeds. Discover feeds from raw HTML `<link rel="alternate" type="application/rss+xml">` or Atom links before guessing paths. Standard candidates are `/rss`, `/feed`, `/atom.xml`, `/rss.xml`, `/index.xml`; a 200 HTML page at one of those paths is not a feed.

RSS/Atom entries may contain only excerpts. Preserve item URL/GUID, publication and update times, author, timezone, source and whether the entry is full text. A feed's latest window is not a complete site history. Retrieve the original article for context. An already installed `feedparser` may parse local/reachable feeds, but native `read` needs no feedparser install.

## Useful feed recipes

Values in braces come from the actual publication/account:

| Source | Feed |
|---|---|
| Google News keyword search | `https://news.google.com/rss/search?q={encoded-query}&hl=ko&gl=KR&ceid=KR:ko` |
| Google News technology | `https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=ko&gl=KR&ceid=KR:ko` |
| Naver blog | `https://rss.blog.naver.com/{blog-id}.xml` |
| Tistory | `https://{blog}.tistory.com/rss` |
| Velog | `https://v2.velog.io/rss/@{username}` |
| Substack | `https://{publication}.substack.com/feed` |
| GitHub releases | `https://github.com/{owner}/{repo}/releases.atom` |
| YouTube channel | `https://www.youtube.com/feeds/videos.xml?channel_id={id}` |
| HN third-party feed | `https://hnrss.org/frontpage` |

Google News query operators such as `when:7d` or `after:YYYY-MM-DD` can refine discovery. Its result links and snippets still need publisher-source validation.

Upstream's Korean news feed inventory (historical recipes, check current response/redirect):

- SBS: `https://news.sbs.co.kr/news/rss.do`
- Chosun: `http://www.chosun.com/site/data/rss/rss.xml`
- JoongAng: `http://rss.joinsmsn.com/joins_news_list.xml`
- Donga: `http://rss.donga.com/total.xml`
- Kyunghyang: `http://www.khan.co.kr/rss/rssdata/total_news.xml`
- Maeil: `http://file.mk.co.kr/news/rss/rss_30000001.xml`
- MBC: `http://imnews.imbc.com/rss/news/news_00.xml`
- Hankyung: `https://www.hankyung.com/feed/all-news`
- Yonhap: `https://www.yonhapnewsagency.com/RSS/headline.xml`

Old HTTP/domain recipes are not guarantees. Prefer a publisher's current feed discovery link and HTTPS when actually supported; do not silently treat a redirect to a homepage as a working feed.

## WeChat and general articles

Discover public WeChat articles through native `web_search` with `site:mp.weixin.qq.com`, then `read` the actual article. If challenged, use the authorized native browser workflow: `skill://browser`, [lifecycle](skill://browser/references/lifecycle.md), [network](skill://browser/references/network.md). Record incomplete text and the original publication date.

Upstream offered Exa crawling, a Web Reader MCP, and a Camoufox-backed WeChat channel. These services/runtimes are not bundled or required here; native `read` replaces static reading and output extraction, native browser replaces interaction. No automatic service installation or stealth guarantee. Already connected authorized tools may be used only through their observed schemas and host routing rules. Jina's upstream WeChat CAPTCHA failures mean its key does not promise access.

For reader JSON alternate-link discovery or output selectors, see [external readers](external-readers.md). For Weibo/Zhihu and other social sites, public HTML may expose metadata only; apply [validation](extraction.md).

## Search channels

Native `web_search` owns keyword discovery, including technical/code-context discovery. Follow results to primary docs/repositories and read the relevant version. It does not promise Exa's exact code-context payload. Installed/connected Exa or other providers are optional, require their actual schema and any required authorization, and are not a reason to install an MCP bridge.

SearXNG public-instance JSON search was another upstream alternative (`/search?q={query}&format=json`, instance directory `https://searx.space`). Instance availability, JSON support and privacy differ. Native search is the default; never send private queries to an arbitrary instance or treat public instances as unlimited substitutes for a denied operation.
