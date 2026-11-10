# Archives and historical provenance

Use an archive when the user wants history or when a dated public copy can answer the question. An archive is a separate source with incomplete capture and possible modifications. Never describe its content, prices or availability as current.

Start with native `read`:

```json
{"path":"https://archive.org/wayback/available?url=https%3A%2F%2Fexample.com%2F"}
```

Read the returned `archived_snapshots.closest.url`; preserve its `timestamp` and whether it matches the requested date. For a target date add the API's `timestamp=YYYYMMDD` parameter. Record the archive URL, original URL, capture time and retrieval time separately. A link to a snapshot does not prove that its body or assets loaded.

For enumeration, the CDX endpoint is:

`https://web.archive.org/cdx/search/cdx?url=example.com%2F&output=json&fl=timestamp,original,statuscode&filter=statuscode:200&limit=5`

The upstream 2026-08-09 probe reported the availability API working and CDX returning 503. These are historical observations, not a present outage guarantee; inspect the current response. Missing captures, robots restrictions and uncaptured SPA data can prevent reconstruction.

Archive.today lookup uses `https://archive.ph/newest/` followed by the original public URL. Upstream observed rotating archive.ph/archive.md domains and frequent 429s in August 2026. Prefer a stable known capture URL, verify its timestamp/body, and honor current rate limits. Do not loop through domains to evade a denial, submit a new capture or upload private URLs without authorization. A successful lookup is not authorization to publish a page.

## Known false positives

- Upstream's 2026-08-09 AMP cache probe returned a 322-byte meta-refresh to the original blocked page. A redirect stub is not archived content.
- Google Cache ended in 2024; upstream's August 2026 probe saw a search interstitial despite HTTP 200. Do not offer it as a working cache.
- A 200 archive page may itself contain an error, challenge, missing resource or redirect to the live origin.

Do not send credentials, signed private links or authenticated content to archive/reader/proxy services. Archives may preserve deleted or sensitive material; disclose source provenance and quote only what the task needs. If only metadata survives, label it metadata. If an archive disagrees with the live primary source, explain their dates and scope.
