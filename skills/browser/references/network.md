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
shared output. The 18.18.6 Chromium check retained 200 request records; use the live host's limit.
This is bounded history, not a complete flight recorder for arbitrarily long browsing.

On Chromium, `tab.request(id)` reads a retained record and lazily obtains its response body. Text
bodies are strings; binary bodies use `{ base64 }`. `contentType` and `bodyTruncated` describe the
body. The earlier OMP 18.18.6 implementation check found a 1 MiB return cap; follow the live limit,
and never use a truncated payload to prove a complete dataset. Read records before eviction and
keep only relevant, authorized evidence.

Inspect the returned backend before choosing body evidence. Owned WebKit (ABKit) captures every
resource load, with XHR labeled `fetch` and no timings, but captures no response bodies:
`request(id)` has no `body`, and a response's `text()` throws. Tern captures fetch/XHR plus navigation
responses, not images/scripts/styles; its request bodies cover only the current document. When
authorized page-visible data is available, `evaluate` can read it on WebKit, but that is page data,
not a captured wire response or a HAR body. Do not refetch a private endpoint as an automatic
substitute. A requirement for captured response bodies needs a capable authorized connection,
usually Chromium; never replace an authenticated session with an unrelated owned browser.

## Subscribe before the triggering action

An event waiter and the action must share one `tab.run`. An outer direct wait can hold the named
tab busy and prevent the click. Functions inside a run cannot capture outer variables; pass actual
observed inputs through args when needed.

For a task-owned Chromium test form with `button[type=submit]` that sends `/api/echo`, this captures
the exact response and then separately verifies the rendered postcondition. The body-reading
recipe is not promised by the Puppeteer-like Tern/WebKit subset:

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
Owned WebKit routes also support fetch/XHR only and wrap page-world APIs, making interception
detectable. Do not confuse WebKit's all-resource passive capture with complete interception, or
claim complete images/scripts/styles/WebSocket coverage on Tern.

## Cursor-based console and error evidence

Use this recipe only when the live host advertises the **18.20** contract:
`console({ level?, since?, limit?, clear? })` and `errors({ since?, limit?, clear? })` each return
`{ entries, nextSeq, dropped }`. It is an envelope, not an array. Read `.entries` in JavaScript or
`["entries"]` in Python. `since` is a sequence cursor, not a timestamp or a request-log cursor.

Record separate console/error cursors before navigation or the triggering action, without clearing
history. After the actual scenario and its semantic wait, read the later entries:

```js
// Before the authorized scenario, on its already-open handle:
const consoleBefore = await tab.console();
const errorsBefore = await tab.errors();
let consoleCursor = consoleBefore.nextSeq;
let errorCursor = errorsBefore.nextSeq;

// After the scenario and its expected-state wait:
const consoleBatch = await tab.console({ since: consoleCursor });
const errorBatch = await tab.errors({ since: errorCursor });
console.log({
  consoleEntries: consoleBatch.entries,
  errorEntries: errorBatch.entries,
  cursors: { console: consoleBatch.nextSeq, errors: errorBatch.nextSeq },
  droppedBefore: { console: consoleBefore.dropped, errors: errorsBefore.dropped },
  droppedAfter: { console: consoleBatch.dropped, errors: errorBatch.dropped },
});
consoleCursor = consoleBatch.nextSeq;
errorCursor = errorBatch.nextSeq;
```

Pass each returned `nextSeq` as that stream's next `since` for subsequent checkpoints, rather than
re-reading and duplicating the full history. If a `limit` splits a retained batch, continue from
its cursor within the task's collection allowance. Preserve the starting cursors and drop metadata
with the action/state journal. On the pinned native capture, `dropped` counts buffer-overflow
evictions since the last clear, not the number of errors or a per-scenario loss count; compare
baseline and final counts and report any coverage uncertainty. An empty `entries` array does not
prove lossless coverage when history was dropped or the selected backend cannot capture the
required source. `clear: true` and `clearConsole()` destroy shared diagnostic history, including
the other diagnostic stream; do not use them to isolate a scenario on a shared/borrowed tab.

Older hosts follow their live return shape and timeout contract; do not assume 18.20 envelopes,
manufacture sequence cursors, add a wrapper or upgrade the host to make this recipe appear to work.
For long evidence work on 18.20, direct helpers and `tab.run` without an explicit timeout inherit
a longer Eval-cell timeout. Raise that cell budget where needed; wait timeouts remain milliseconds
and an explicit run timeout is still explicit. See [commands.md](commands.md#tabs-and-execution).

## HAR, Chromium traces and step records

These artifacts have different formats:

- `await tab.harStart({ content: "none" })` starts a HAR recording. `none` avoids response bodies,
  not all sensitive URLs/headers. Use `text` or `all` only when required and permitted on a backend
  that can capture the needed bodies. WebKit HAR has no response bodies regardless of that option;
  Tern retains its partial traffic coverage. A HAR with entries is not proof of body completeness.
- `await tab.harStop({ path: actualEvidencePath })` saves a HAR and returns its path. Supply a real,
  task-owned absolute or cwd-relative path; a long recording still depends on bounded retained
  requests. Confirm that the expected entries are present before claiming full coverage.
- `await tab.traceStart({ screenshots: true })`, followed by
  `await tab.traceStop({ path: actualTracePath })`, saves a Chromium performance trace. It is not
  OmOWright's `trace.jsonl` step log. Tracing is connection-level and can conflict with another
  trace on the same shared browser; do not stop a recording you did not start.
- On 18.20, `console()` and `errors()` provide diagnostic envelopes: retain their `entries`,
  `nextSeq` and `dropped` as above. Screenshots and the action log establish actual before/after
  page states. CPU profiles and video recording are separate optional facilities, not required for
  every browser task.

For reconstructable QA, record the action/expected state, actual response or source result, relevant
console/error entries, before/after capture paths and tested runtime/backend. Stop each recording
that this task successfully started in a finally path; preserve a primary failure if cleanup also
fails. Do not add trace wrappers merely to reproduce upstream's package format. Inspect the actual
returned artifacts and redact secrets/private data before external sharing.

Tern and owned WebKit have no Chromium tracing/profiling. Missing wire or trace coverage stays an
exact capability gap; server logs and semantic page state can supply other evidence without being
relabeled as that trace.

## Cookies and sessions

Native storage helpers do not authorize exporting or decrypting the user's live browser profile.
Use the authorized existing relay/CDP tab for authenticated criteria. Imports into a dedicated test
profile require an explicitly supplied/authorized state artifact; keep it private and do not claim
that device-bound or tab-bound sessions will transfer. Never clear real user cookies/storage to
recover a failed test, and never print tokens or secret response bodies in a general network report.
