# An already-unlocked 1Password web tab

Use only for the specific item/value the user authorized reading from a vault they have already
unlocked. Authentication and unlocking belong to the owner. Do not type a master password, automate
sign-in, read vault keys from sessionStorage or extract unrelated secrets.

## Preserve the original tab

An unlocked web vault can hold essential state in that tab's sessionStorage. Another tab in the same
profile may still require sign-in; cookies alone do not establish equivalent state. Navigating away,
reloading or closing the original tab can destroy the unlocked session. Do none of those as recovery.

For relay, discover the authorized page with `browser.targets({ app: "relay" })` and use
its returned `target`. For CDP, read the approved endpoint's page metadata and select the observed
page ID using [the CDP procedure](../lifecycle.md#existing-cdp-pages); `browser.targets` does not
support CDP. Open a named handle with that same app connection and the top-level `target`; omit `url`.
Do not guess tab IDs or infer permission from discovery.
If no authenticated connection exists, report that prerequisite instead of creating a headless
substitute or copying cookies/profile files.

## Read narrowly and verify the search

Check the current URL and real page controls, not the title alone: single-page apps can change their
route without updating the title. Inspect only enough state to determine whether the requested vault
is unlocked. If it is locked, follow [human-handoff.md](../human-handoff.md), then re-observe.

Use a fresh snapshot and `fill` to replace the actual search control's prior value; `type` could
append to another actor's query. Read the current autocomplete/listbox corresponding to this query,
not a stale results grid. Verify the requested item identity before revealing the one authorized
value. A value write, search click or successful selector is not proof of the correct item.

Do not use page evaluation to dump tokens, vault storage, keys or every field. Keep the requested
value out of logs and screenshots where unnecessary; mask it in the report unless the user asked
for the exact value. Avoid the shared clipboard. If a task explicitly requires clipboard use, follow
the host's clipboard policy and preserve unrelated clipboard data rather than blindly clearing it.

Return to the authorized item list using the application's normal controls if that preserves the
user's working state. Finish with `await tab.close()` to release the borrowed handle; native OMP
leaves the borrowed relay/CDP page open. Do not close Chrome, reload the vault, clear site data or
change its automation/security settings. Report a remaining lock or access gap without working
around the owner's refusal.
