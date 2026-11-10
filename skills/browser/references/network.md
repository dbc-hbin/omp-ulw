# Network, response waits and QA evidence

Prefer passive traffic observation when a page already fetched the structured data the task needs.
A response is evidence of what arrived, not automatic proof that it is complete or authoritative.
Verify status, MIME, schema, pagination and requested scope. Do not replay a private endpoint,
mutate requests or export account data merely because its URL appeared in a log.

## Passive request JSON

`tab.requests({ filter?, type?, method?, status?, since?, clear?, limit? })` returns bounded request
records with stable IDs, URLs, methods, status, timing and headers. Use a substring for direct
`filter`; `type` is a resource type or list. OMP 18.18.6's direct facade failed to restore a nested
RegExp filter during this port's live check. For a required regex, construct and apply it inside
`tab.run` rather than passing it in direct-helper options. Read only matching records and omit sensitive headers from
shared output. The current Chromium log retains 200 records; this is bounded history, not a complete
flight recorder for arbitrarily long browsing.

`tab.request(id)` reads a retained record and lazily obtains its response body. Text bodies are
strings; binary bodies use `{ base64 }`. `contentType` and `bodyTruncated` describe the body. OMP
18.18.6 caps returned bodies at 1 MiB, so a truncated payload cannot prove a complete dataset.
Read records before they are evicted and keep only relevant, authorized evidence.

## Subscribe before the triggering action

An event waiter and the action must share one `tab.run`. An outer direct wait can hold the named
tab busy and prevent the click. Functions inside a run cannot capture outer variables; pass actual
observed inputs through args when needed.

For a task-owned test form with `button[type=submit]` that sends `/api/echo`, this captures the exact
response and then separately verifies the rendered postcondition:

```js
const responseEvidence = await tab.run(async ({ tab }) => {
  const response = tab.waitForResponse(/\/api\/echo(?:\?|$)/, { timeout: 5000 });
  await tab.click("button[type=submit]");
  const received = await response;
  return { status: received.status(), url: received.url(), body: await received.json() };
});
console.log(responseEvidence);
```

Use selectors and response patterns established from the actual target, not these fixture values.
On real flows filter by the relevant method/request when several responses share a URL. Wait for the
specific success/error text, URL or selector afterward. A 200 response can still contain an error.
Navigation waits and download waits follow the same subscribe-before-trigger pattern. Direct
`waitForText` and selector waits can be used after a completed action to inspect a persistent state.
Never substitute a fixed delay for an observable condition.

## Infinite scroll and pagination

Discover which API and scroll owner supply the next batch. Record request IDs/cursors, read the
new matching JSON, validate it and deduplicate by the data's real key. Scroll or click the actual
next control, with the expected response subscribed first, then reconcile its batch. Stop at the
user's requested count, an observed end/cursor condition, a repeated no-progress result, or the
run's declared collection allowance. State partial coverage explicitly when bounded history,
truncated bodies or access limitations prevent completeness.

OMP has no `collectWhileScrolling`, `popJson` or `summary` method. A short task-local loop using the
existing request and page helpers is sufficient; do not introduce a collector SDK or guess item
counts, endpoint shapes or stable IDs from unrelated sites.

## Controlled request interception

Interception changes behavior. Use it only for an authorized test or a requested network policy,
not as proof of the unmodified production flow. Native persistent routes use declarative options,
not a Playwright route callback:

```js
await tab.route("**/api/echo", {
  resourceType: "fetch",
  status: 503,
  contentType: "application/json",
  body: { error: "Controlled test failure" },
});
```

Verify the application's error path, then `await tab.unroute("**/api/echo")` in a finally path.
Options include `abort`, `resourceType`, `status`, `headers`, `contentType`, `body` and `delay`.
`routes()` describes active routes. Preserve unrelated routes; do not use blanket `unroute()` on a
borrowed tab. `allowed_domains` can enforce supported host restrictions but is not a sandbox.

Raw Puppeteer request listeners/interception inside a run are scoped to that run and cleaned up;
`tab.route` persists until unroute or tab close. Passive capture is preferable when only reading
traffic. Tern capture covers fetch/XHR and navigation responses; its routes support fetch/XHR only.
Do not claim complete images/scripts/styles/WebSocket coverage on a native webview.

## HAR, Chromium traces and step records

These artifacts have different formats:

- `await tab.harStart({ content: "none" })` starts a HAR recording. `none` avoids response bodies,
  not all sensitive URLs/headers. Use `text` or `all` only when required and permitted.
- `await tab.harStop({ path: actualEvidencePath })` saves a HAR and returns its path. Supply a real,
  task-owned absolute or cwd-relative path; a long recording still depends on bounded retained
  requests. Confirm that the expected entries are present before claiming full coverage.
- `await tab.traceStart({ screenshots: true })`, followed by
  `await tab.traceStop({ path: actualTracePath })`, saves a Chromium performance trace. It is not
  OmOWright's `trace.jsonl` step log. Tracing is connection-level and can conflict with another
  trace on the same shared browser; do not stop a recording you did not start.
- `console()` and `errors()` provide browser diagnostic entries. Screenshots and the action log
  establish actual before/after page states. CPU profiles and video recording are separate optional
  facilities, not required for every browser task.

For reconstructable QA, record the action/expected state, actual response or source result, relevant
console/error entries, before/after capture paths and tested runtime/backend. Stop each recording
that this task successfully started in a finally path; preserve a primary failure if cleanup also
fails. Do not add trace wrappers merely to reproduce upstream's package format. Inspect the actual
returned artifacts and redact secrets/private data before external sharing.

Tern has no Chromium tracing/profiling. Missing wire or trace coverage stays an exact capability gap;
server logs and semantic page state can supply other evidence without being relabeled as that trace.

## Cookies and sessions

Native storage helpers do not authorize exporting or decrypting the user's live browser profile.
Use the authorized existing relay/CDP tab for authenticated criteria. Imports into a dedicated test
profile require an explicitly supplied/authorized state artifact; keep it private and do not claim
that device-bound or tab-bound sessions will transfer. Never clear real user cookies/storage to
recover a failed test, and never print tokens or secret response bodies in a general network report.
