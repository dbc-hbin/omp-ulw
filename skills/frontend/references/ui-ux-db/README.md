# Local UI/UX research database

Vendored from the installed Next Level Builder UI/UX Pro Max research corpus; search scripts use Python standard library only. This reference is not the soon-disabled skill workflow. Frontend owns design gates and taste; recommendations must be checked for identity, domain and project/platform relevance.

Resolve `DB_DIR` to this directory.

```bash
python3 "$DB_DIR/scripts/search.py" "wellness calm typography" --domain typography
python3 "$DB_DIR/scripts/search.py" "keyboard focus" --stack swiftui
python3 "$DB_DIR/scripts/search.py" "analytics dashboard" --design-system -p "Project"
```

Use one dominant intent, 2-5 meaningful terms, and a relevant constraint. New product direction may use --design-system; targeted fixes use --domain; known stacks use --stack. Inspect the script help/source for supported domain and stack names rather than infer them. Empty/mismatched results warrant one focused rewrite or actual platform reasoning, not generic defaults. Supported native stack searches include swiftui and jetpack-compose only for confirmed implementations; no AppKit/UIKit/Views/XML/Android language stack is invented. [Native workflow](../native/workflow.md) owns native implementation.

Master-plus-overrides persistence is optional explicit project output, not an automatic write to the skill installation. Inherit existing MASTER/page overrides and DESIGN.md; persist only when requested or needed in the authorized project. Search output is research, not a replacement for token extraction, real rendering or accessibility verification. [Quick reference](references/quick-reference.md) and [polish rules](references/pro-rules.md) retain transferable guidance, with native units/toolkits taking precedence.
