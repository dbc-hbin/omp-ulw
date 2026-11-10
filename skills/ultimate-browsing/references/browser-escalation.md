# Native browser escalation

Read `skill://browser`, [lifecycle](skill://browser/references/lifecycle.md), [network](skill://browser/references/network.md), `xd://eval/browser` and the applicable host routing skill before interaction. The active contract and approval rules win. Eval/browser must be enabled; there is no browser AgentTool or library import to substitute.

## Choose the actual session

Use the host-selected browser for normal interaction. For authorized public-page QA that must avoid relay/Tern, the native options are:

```js
const tab = await browser.open({
  name: "public-source",
  url: "https://example.com",
  app: { relay: false, tern: false }
});
print(await tab.observe());
```

These options skip only relay and Tern; configured CDP or cmux may still win before managed Chromium. Inspect the actual backend/session. Managed Chromium is shared by project and not guaranteed to be a fresh isolated profile. Do not clear its state indiscriminately. Native browser startup may install managed Chromium on first use according to the host contract; do not separately install runtimes or change host routing to evade an approval.

For an authorized signed-in criterion, use an already available real-session relay/CDP route from the browser skill. Opening a new named relay tab can preserve the user's selected tab; borrowing a tab and navigating it requires authorization. Do not launch against, clone, clear or delete the user's live profile, and do not export cookies. If relay/authentication is unavailable, report that prerequisite; installing/enabling an extension is a separate authorized setup task, not an automatic fallback.

## Read, act and verify

Use fresh `observe()`/`ariaSnapshot()` results to select actual elements. Re-observe after navigation/re-render; IDs/refs become stale. Wait for expected content rather than fixed sleeps. Read `tab.text()` for rendered content, and inspect `tab.errors()` for diagnostics. A browser screenshot proves only what it shows; inspect the returned image rather than trusting a successful capture or potentially stale inline preview.

```js
await tab.waitForText("Example Domain");
print(await tab.text());
print(await tab.screenshot({ fullPage: true }));
```

Mobile rendering can be requested with the documented API:

```js
await tab.emulate({ device: "iPhone 14" });
print(await tab.observe());
```

Emulation may reload the page; re-establish the scenario and inspect the actual viewport/touch state. It does not emulate a phone's TLS stack, IP reputation or account entitlement. Native-webview backends have narrower capabilities than Chromium.

## Passive network JSON

For list/pagination work, inspect actual page traffic early instead of repeatedly fetching a challenged HTML shell:

```js
print(await tab.requests());
```

Discover fetch/XHR/GraphQL responses through the native network reference. On a Chromium tab, capture a response triggered by one authorized observed UI action in one run:

```js
const response = await tab.run(async ({ page }, selector) => {
  const pending = page.waitForResponse(reply =>
    reply.request().resourceType() === "xhr" &&
    (reply.headers()["content-type"] ?? "").includes("application/json")
  );
  await page.click(selector);
  const reply = await pending;
  return { url: reply.url(), status: reply.status(), body: await reply.json() };
}, { args: [observedSelector] });
print(response);
```

`observedSelector` must be defined from the actual page, not guessed. Narrow the response predicate to the observed endpoint for real work; the first unrelated XHR is not evidence of the requested data. This raw Puppeteer example requires Chromium and is not promised on native-webview backends. Passive request logs may expose URLs/headers containing secrets; return only the needed fields and redact private tokens.

Use the observed response's schema, cursors and actual item IDs. Verify pagination termination, deduplicate by stable IDs, bound collection to the requested scope, and report counts/coverage. Do not infer that an API is unrestricted because it is less protected than HTML. Public discovered URLs can be read with native `read`; account-bound API work stays in the authorized browser session. Do not copy Cookie/Authorization into external clients, invent signed requests, alter intercepted traffic as "passive" reading, or install a crawler.

If challenge/login/paywall content persists, report it with observed evidence. Native managed-browser stealth patches do not promise fixed fingerprints, a dedicated persistent identity, automatic CAPTCHA solving or broad WAF bypass. Those upstream capabilities have no claimed equivalent here.

Release only task-owned tabs/handles under lifecycle rules, normally with `await tab.close()`. Borrowed relay/CDP pages remain the user's pages; do not kill their browser or delete any profile.
