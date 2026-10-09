---
name: "native-ui-design"
description: "Design, implement, review, and refine native application interfaces: macOS/iOS with SwiftUI, AppKit, or UIKit, and Android Kotlin/Java UI with Jetpack Compose, XML Views, or mixed hosting. Use for product art direction, hierarchy, typography, metric alignment, density, semantic surfaces, motion, accessibility, and real-app visual polish without importing web or poster prescriptions. Exclude nonvisual Swift/Kotlin/Java, backend, and build-only work."
---

# Native UI Design

Make the product's purpose visible and its work effortless. Native conventions supply reliable behavior, not a requirement to make every product a gray settings panel. Preserve expressive typography, color, imagery, materials, composition, and motion when they serve the product and remain legible and operable.

## Establish the actual surface

Inspect the requested screen, existing implementation, neighboring components, and established brand before choosing a direction. Identify separately:
- **Platform and context:** macOS, iOS/iPadOS, Android, or another native platform; task, audience, frequency of use, input modes, content, and information density.
- **Framework and constraints:** SwiftUI, AppKit, UIKit, Android Jetpack Compose, Views (XML or programmatic Kotlin/Java), mixed hosting, or another toolkit; deployment/minimum and target SDK constraints, available APIs, existing layout/state ownership, assets and style conventions. Inspect project configuration and UI imports/types/resources: Swift source or `Package.swift` alone does not establish SwiftUI; Kotlin, Java or Gradle alone does not establish Android UI or Compose. Distinguish Android modules, Compose UI, Views layouts and interop hosts from backend/nonvisual code; preserve the existing toolkit rather than forcing migration.
- **Scope:** new product direction, a new surface within an existing product, or targeted repair. Preserve unrelated user changes and behavior. Ask only when a consequential missing decision cannot be recovered from the request or project.

Select the reference for the confirmed target: [Apple native application](apple-native.md) for Apple design, implementation and verification; [Android native application](android-native.md) for Android visual design, implementation and verification. Do not load both by default. For the precise inherited philosophy and excluded source constraints, read [Principles transfer](principles-transfer.md), especially when a source recommendation conflicts with the native task. For other native platforms, keep the transferable principles but use that platform's actual toolkit and official guidance; do not apply Apple units or navigation conventions universally.

## Choose the right workflow

### New design or unresolved art direction

1. Ground the direction in the primary task and intended character: for example, an exacting instrument, a warm personal workspace, or an expressive creative tool. Translate that intent into visible decisions about focal point, type, proportion, density, surfaces and motion. A short rationale in the response is enough; no manifesto, approval gate, mandatory alternatives, or new token framework is required.
2. Compose with real representative content. Establish what is read first, what is compared, what is acted on, and what recedes. Prefer meaningful groups and native navigation over a marketing hero, feature grid, and CTA template. Retain an existing product's direction when adding a surface.
3. Define applicable states alongside the composition: normal, selected/focused/pressed, disabled, loading, empty, stale, warning and error. Identify transitions and combinations that could obscure information or move controls. Use existing styles/assets and semantic roles; introduce only distinctions the design actually needs.
4. Implement in the real toolkit. Evaluate hierarchy and composition first, then refine typography, baselines, rhythm, symbols, surface contrast and state transitions. Stop adding ornament when the problem is alignment or emphasis.
5. Exercise the native app, repair observed failures, and report the actual verification coverage and any unavailable conditions.

### Targeted repair

1. Observe the reported symptom in the actual surface and inspect the responsible layout/state path. Treat user observations as evidence; do not demand that they prove the problem again.
2. State the broken relationship concretely: metric/unit baselines diverge, changing digits shift adjacent content, a warning hides the action, focus disappears after refresh, or a narrow window clips a localized label.
3. Correct the responsible constraint, identity, typography or semantic role using the existing design language. Do not redesign the screen, replace the palette, generate a design system, or add abstraction merely to fix one relationship.
4. Exercise the failing transition and its adjacent states in the native runtime. Compare the same content and environment before/after when available; separate visual evidence from behavioral assertions.

## Design discipline

- **Intent and hierarchy:** use scale, weight, position, grouping and contrast to express task priority. Keep necessary labels, explanation and recovery instructions; minimalism is not missing information.
- **Baseline, rhythm and proportion:** align related text by its intended baseline, not a convenient bounding-box center. Repeat meaningful insets and intervals; make within-group spacing tighter than between-group spacing. Judge optical balance at actual display scale rather than enforcing perfect geometry at the expense of perception.
- **Task-appropriate density:** compact monitoring, editing and comparison tools can be excellent. Preserve scanability and hit areas; use disclosure for genuinely secondary content, not to hide essential context. Spacious layouts are not inherently more polished.
- **Typography and numbers:** establish readable roles, weight and measure. Use platform typography as a strong default, not a ban on licensed custom faces. Test glyph coverage, scaling and fallback. For changing data, consider tabular figures, locale-aware formatting, unit hierarchy and a stable alignment region; a fixed frame that clips a larger value is not stability.
- **Color and surfaces:** distinguish content, background, grouping, controls, selection and status through semantic roles. Preserve brand expression without confusing warning/destructive meaning. Check composed contrast in each relevant appearance; do not rely on color alone. Materials and depth must clarify structure and remain readable in accessibility modes.
- **Meaningful motion:** express feedback, continuity, hierarchy or product character without delaying the task. Keep transitions interruptible and state-correct under rapid updates. Honor reduced motion; immediate updates are appropriate when animation would distract or misrepresent data. Native animation is not limited to CSS transform rules or web timing recipes.
- **Accessibility and craft:** use real native semantics, readable names/values, logical traversal, visible focus and alternatives to gesture-only actions. Refinement means observable legibility, alignment, consistent grouping, correct state feedback, clean edges, responsive input and no accidental clipping/jitter—not claims of museum quality or hours spent.

## Use UI/UX search as evidence, not a native template

When additional research would resolve an actual uncertainty, use the local `../ui-ux-db/scripts/search.py` and data directly. Set `UI_UX_SKILL_DIR` to the observed absolute `references/ui-ux-db` directory. Do not invoke another design-family skill.

```bash
python3 "$UI_UX_SKILL_DIR/scripts/search.py" "number formatting" --domain ux
python3 "$UI_UX_SKILL_DIR/scripts/search.py" "keyboard focus" --stack swiftui
python3 "$UI_UX_SKILL_DIR/scripts/search.py" "single source of truth" --stack jetpack-compose
```

Use the first kind of search for an unresolved semantic concern; use `--stack swiftui` only for an actually SwiftUI implementation and `--stack jetpack-compose` only for confirmed Android Compose UI. These are optional research examples, not a required sequence. The installed registry supports `jetpack-compose`, not `android`, `kotlin`, `java`, `views` or `xml`; there are also no `appkit` or `uikit` stack modes. For those native frameworks, use source inspection and official documentation instead; never infer a framework from its language. Check result identity, category and platform applicability before using it. Search only as needed, without a call quota. If a result is empty or mismatched, narrow the question when useful or use explicit platform reasoning/official documentation; never invent coverage. A general number-formatting result is not evidence for tabular-digit or baseline-alignment guidance; attribute only what the returned content actually supports.

Style, color, typography and chart searches can inform a native direction, but their CSS, Google Fonts, SVG, GSAP and Chart.js output is not an implementation requirement. Broad `--design-system` output can produce web marketing layouts even for a macOS utility query. Do not adopt or persist Hero+Features+CTA, web breakpoints or cursor-pointer as native prescriptions. Native work does not require CSS generation, starter tokens, persisted MASTER files, image services or an installed search tool: if unavailable, state that limit and continue with inspected project conventions and platform guidance.

## Delivery

Deliver the requested design or source change, a brief rationale for consequential choices, and evidence from the actual native surface. Distinguish source review, build results, previews, screenshots and exercised interactions. A browser mockup or PNG concept can explain intent but cannot verify a native app. Respect user permissions and data; inspection does not authorize deleting records, resetting preferences, changing system settings, installing tools or accepting permission prompts.
