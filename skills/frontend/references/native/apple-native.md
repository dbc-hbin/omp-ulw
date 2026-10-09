# Apple Native Application and Verification

## Product and platform before framework

Apple's HIG design principles—Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft and Delight—help weigh competing priorities; they are not a rigid visual template. Familiar controls and expressive product character can coexist. Choose the primary task, information hierarchy and interaction model before decorating containers.

Separate the **platform** from the **framework**. SwiftUI supports several Apple platforms; an iOS SwiftUI recipe is not automatically a macOS recipe. AppKit is a macOS framework; UIKit serves iOS/iPadOS and may appear in Mac Catalyst. Mixed hosting is possible. Inspect imports, the actual view/control types, app/scene setup, deployment target and existing conventions. Swift language, an Xcode project or a package manifest does not prove a particular UI framework.

Check API availability against the project's minimum supported OS and the running environment before selecting newer controls, observation, layout, symbol effects or materials. Follow an existing compatibility strategy; do not silently raise deployment targets, replace AppKit with SwiftUI or introduce a new state architecture to perform visual repair.

## Platform branch

### macOS

Design for sustained work, precise pointer input, keyboard operation and comfortable density. Dense tables, compact metrics, sidebars and inspectors are legitimate when they support scanning and comparison. Use sensible resizable window behavior rather than stretching a phone screen into a large rectangle.

- Respect the distinction between app activation, key window, main window, selection, keyboard focus and VoiceOver focus. Inactive selection should remain interpretable without looking active.
- Preserve menu commands, standard shortcuts, command validation, undo where applicable and responder-chain behavior. Controls must work without a mouse; do not replace real buttons with click-only decorative views.
- Maintain expected titlebar, toolbar, sidebar, sheet, settings and multiwindow behavior. Avoid a custom web-style titlebar unless the request and app architecture justify it.
- Test minimum, typical and wider window sizes; content should reflow, resize columns or scroll intentionally. A hardcoded width that conceals data is not a polished compact layout. Horizontal scrolling may be appropriate for a wide data table.
- Preserve focus and selection across data refresh, sorting, navigation and window changes. Do not steal focus when a status changes or open new windows merely to prove a control works.

### iOS and iPadOS

Prioritize primary tasks, touch reach, readable content and system navigation. Test the devices, orientations and size classes the app actually supports; iPad multitasking/window resizing may matter as much as full-screen orientation.

- Use platform-appropriate hit regions; iOS's usual 44×44-point target guidance concerns touch, not CSS pixels or the visible size of every glyph. Avoid conflicting overlapping hit regions.
- Respect safe areas, system gestures and navigation conventions. Content may intentionally extend behind system chrome while essential controls remain reachable and unobscured.
- Account for software keyboard presentation, editing focus, input type, autofill, dismissal and external keyboard navigation where supported. Do not let the keyboard conceal the edited field or recovery action.
- Support Dynamic Type, including accessibility sizes. Reflow rows or stack groups before shrinking text into illegibility. Treat long translations, right-to-left content and expanded text as real layout inputs.
- Keep touch feedback responsive; haptics and animation should reinforce appropriate events rather than become a constant accompaniment to data refresh.

Do not force iOS navigation bars, safe-area recipes or state patterns onto AppKit. Conversely, do not assume a desktop hover or shortcut supplies an adequate touch affordance.

## Framework branch

### SwiftUI

Use the project's established data ownership and observation model. Understand structural identity and stable model identifiers: replacing a subtree or assigning transient IDs can reset local state, focus and animations during updates. Keep presentation changes from becoming accidental state resets.

Inspect proposed sizes, stack alignment, text baselines, layout priority and container behavior before adding fixed frames or arbitrary offsets. For mixed-size text, a baseline-aligned stack such as `HStack(alignment: .firstTextBaseline)` may fit the intended relationship; custom content may need deliberate alignment guides. Verify the rendered result rather than assuming a modifier guarantees optical balance.

Use semantic text styles, appropriate native controls, accessibility labels/values and platform-aware focus/command APIs supported by the deployment target. Apply motion to the intended changing value or transition, not indiscriminately to a whole frequently refreshing hierarchy. Previews are useful for composition but do not exercise the full app's commands, window lifecycle, permissions or runtime data path.

### AppKit

Preserve existing view/controller ownership, target-action, bindings/delegates and responder-chain arrangements. Do not translate an isolated appearance fix into SwiftUI property-wrapper advice.

Use Auto Layout's content relationships, intrinsic content sizes, content-hugging and compression-resistance priorities deliberately. Where appropriate, align text-bearing controls with baseline anchors; inspect actual font metrics and multiline behavior. Avoid compensating for an incorrect constraint with a pixel offset. A custom-drawn metric should use real text metrics rather than guessed centers.

Check control size, font, appearance, first responder, key-view traversal, focus rings and enabled/selected states together. Reuse native text and control behavior instead of rebuilding editing, selection or accessibility in drawing code. When custom rendering is necessary, expose meaningful accessibility elements, names, values and actions. Resolve dynamic colors and drawing updates for the current appearance; converting an adaptive color into a static drawing value too early can freeze the wrong appearance.

### UIKit and mixed hosting

Preserve the established view-controller lifecycle, Auto Layout or collection layout, model identity and responder ownership. Use preferred/scaled fonts and content-size-category adaptation as supported; custom fonts need explicit scaling and layout testing rather than a nominal point size alone. Check intrinsic sizes and compression priorities when labels compete for space.

At SwiftUI/AppKit/UIKit boundaries, identify which layer owns sizing, safe-area treatment, focus, accessibility and state. Avoid duplicate accessibility elements, double insets and refresh loops. Mac Catalyst still requires Mac-specific window, input and menu review; UIKit does not imply a phone-only experience.

## Shared visual application

### Typography and symbols

Start from platform text roles and system font metrics appropriate to the actual control/platform. Retain intentional custom display/body faces when licensed, bundled or otherwise correctly available; verify fallback, localized glyphs, line metrics and scaling. Do not hardcode a web base size or import a Google Fonts URL into native text code.

Use tabular/monospaced **digits** for changing numbers when stability is needed; a fully monospaced face is not required for every label. Use locale-aware formatting, controlled precision appropriate to the data and deliberate unit hierarchy. Align metric/unit text by baseline; center icons optically against their intended text role. Use leading/trailing behavior for directional layout, not indiscriminate left/right constants.

Prefer SF Symbols when their semantics and availability fit. Match symbol size, weight and rendering mode to adjacent text and platform conventions; filled/outline differences can legitimately encode selection. Use approved custom assets for identity or unsupported concepts. Raster artwork is not prohibited. Accessible meaning comes from use: decorative accompaniment should not be redundantly announced, while an icon-only action needs an intelligible name and applicable state.

### Color, materials and surface hierarchy

Use system semantic colors and adaptive named assets for labels, backgrounds, controls and selection wherever suitable; retain existing project role names. A “secondary” label color is a role, not permission to make important information unreadable. Distinguish warning, error, stale and selected states with text/symbols as well as color.

Evaluate brand colors as foreground/background pairs in each supported appearance. Measure the composed result, including translucency and background content. Normal text commonly targets 4.5:1 and meaningful non-text controls 3:1 under applicable contrast guidance; do not classify text as “large” merely because a web source says 18px. Use the correct standard and actual size/weight for the assessment.

Native materials can organize controls, establish depth and preserve context while expressing character. Prefer the platform's supported material behavior over a hand-built web glass effect when it fits. Test increased contrast and reduced transparency; provide a readable solid treatment where needed. Do not place opaque or translucent layers indiscriminately over content, or remove all materials to achieve generic gray uniformity.

### Layout, states and motion

Make rhythm and grouping consistent, not mechanically uniform. A monitoring dashboard needs more simultaneous information than an onboarding flow. Reserve enough flexible space for known metric ranges and controls, but allow accessibility/localization reflow rather than clipping to preserve a screenshot.

Define what can coexist: warning while selected, loading while cancel remains available, stale value while disconnected, focused control in an inactive window. Keep errors actionable, preserve useful content during refresh, and do not falsely present missing data as zero. State communication must survive reduced motion and absent color perception.

Motion may clarify hierarchy, maintain continuity or convey product character. Keep it responsive, interruptible and correct after cancellation. Avoid bouncing every live number or pulsing warnings indefinitely. Under reduced motion, preserve the information and final state without requiring spatial animation. Measure the actual refresh/render path before applying generic web performance rules.

## Worked example: live monitoring card

**Task:** Compare CPU usage quickly and notice a sustained warning without losing the current value or keyboard position. Assume the product already defines its warning threshold; do not invent or change the monitoring policy as a design task.

**Composition:** A concise “CPU” label anchors the card. A prominent localized value such as `9.8` and a quieter `%` share an intentional baseline. An optional trend shows context, not decoration. A stable status region communicates “Normal,” “High usage” or “Data unavailable,” and an existing detail action remains discoverable.

**Implementation choices:**
- Use tabular digits for the changing metric, locale-aware formatting and the existing precision policy. Align the smaller unit to the metric baseline rather than centering their bounding boxes.
- Accommodate values such as `9.8` → `10.0` → `100.0` and locale-specific separators without moving the unit unpredictably or shrinking/clipping the metric. A trailing-aligned flexible metric region can stabilize comparison; verify the maximum expected display and accessibility text sizes. Tabular digits alone do not solve digit-count changes.
- Keep label, value and unit positions stable when the state changes. A status region can reflow at narrow widths; do not reserve an inflexible tiny badge that truncates a translation.
- At the product's warning transition, update a semantic warning treatment plus a symbol and “High usage” text. Do not repaint the whole card as destructive or let the badge displace the primary value. Distinguish “Stale” with last-update context from a current warning; missing data is not `0%`.
- Preserve the detail control's identity and focus during refresh. Expose a coherent accessible value such as “CPU, 10 percent, high usage.” Avoid announcing every sample; meaningful status changes should be communicated without a continuous speech flood or focus jump.
- SwiftUI: inspect baseline stack alignment and stable identity. AppKit: inspect text-field baseline constraints, intrinsic sizes and compression. UIKit: inspect corresponding baseline constraints and scaled-font behavior. None requires a new token framework.

**Exercise:** Drive the app's real supported data path or controlled non-destructive debug input through digit growth, warning entry/recovery, stale/disconnected state and rapid updates. Observe the metric/unit relationship, status legibility, focus preservation and final state with motion both enabled and reduced. Never alter production monitoring thresholds or trigger actual resource exhaustion just to create the visual state. If a state cannot safely be reached, report it as unverified rather than fabricating success.

## Verify the real native app

Use the project's existing launch path and an available native inspection tool. Read that tool's skill before driving the GUI. Preserve user files, active sessions and permissions. Inspect the selected window, use fresh accessibility state for actions, and check the result after each consequential interaction. A screenshot shows appearance, not that a command or accessibility action works.

Choose coverage from the changed surface rather than a mandatory device or variant count:

| Dimension | Relevant checks |
|---|---|
| Appearance | Light/dark when supported; active/inactive Mac windows; increased contrast; reduced transparency for affected materials. Check composed surfaces, label contrast, selection and warnings independently. |
| Layout/content | Minimum, typical and wider supported windows or device layouts; localization including long/RTL text when relevant; maximum expected metric widths; scrolling and clipping; display scale and actual-size text rendering. |
| State/data | Normal, loading, empty, stale, error, warning, selected, disabled and focused where applicable; transitions and rapid refresh. Confirm no accidental resets, jitter, focus theft or concealed recovery actions. |
| Input | macOS keyboard traversal, shortcuts, menus, pointer and window behavior; iOS touch, gestures, software keyboard, safe areas and external keyboard where supported. Exercise actual actions safely, not just hover visuals. |
| Accessibility | VoiceOver names, values, order and actionable controls; visible unobscured keyboard focus; applicable text scaling/Dynamic Type and accessibility sizes; reduced motion; non-color status meaning. macOS text-size support should follow the actual OS/framework and app rather than an assumed iOS mechanism. |

Inspect the real output, repair the source, and re-exercise the affected path. Use screenshots at matching state/size to judge baseline, rhythm, proportion, clipping and surface separation; use semantic readback and interaction to verify behavior. Builds, source scans and previews complement this evidence but do not replace it. HTML/PNG mockups are conceptual references, never native runtime verification.

If native runtime/inspection is unavailable, complete reachable source work and report exactly what was checked and what remains unverified. Do not install tooling, grant permissions, reset preferences, delete data, terminate unrelated work or change system settings merely to complete a checklist without authorization. Use available app-local or debug overrides safely; restore only settings you changed with permission.

## Authoritative references

Use current documentation for disputed platform behavior and API availability; these links are not permission to retrofit the latest OS style into an older deployment target.

- [Apple HIG: Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles)
- [Apple HIG: Designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos)
- [Apple HIG: Designing for iOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ios)
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/): consult the relevant typography, color, materials, accessibility and component guidance for the actual platform.
- [SwiftUI documentation](https://developer.apple.com/documentation/swiftui), [AppKit documentation](https://developer.apple.com/documentation/appkit), [UIKit documentation](https://developer.apple.com/documentation/uikit): confirm the specific API and availability in the selected implementation.

If an HIG HTML read returns metadata only, its public DocC content is available at `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<slug>.json`, for example `design-principles.json`. Read the actual content; do not treat a title-only response as evidence of a detailed rule.
