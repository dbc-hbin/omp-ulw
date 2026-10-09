# Android Native Application and Verification

## Product and platform before toolkit

Apply the common design discipline to Android's actual interaction model. Establish whether the product should feel like a precise instrument, a calm workspace or an expressive creative tool; express that through hierarchy, type, proportion, color and feedback, not a compulsory collection of rounded cards.

Inspect the requested screen, neighboring components and existing theme before choosing APIs:
- Confirm an Android UI target from its app module, manifest, Activity/Fragment entry and actual controls. Kotlin alone does not establish Android or Compose; server, CLI and nonvisual Kotlin work is outside this reference.
- Distinguish Jetpack Compose, Kotlin/Java Views with XML or programmatic layouts, and mixed hosting through `ComposeView` or `AndroidView`. A Gradle Kotlin build script is not UI-toolkit evidence.
- Read `minSdk`, `targetSdk`, relevant compile SDK constraints, resolved/catalogued AndroidX and Material versions, theme inheritance and navigation/state ownership. Check device API level separately from library availability.
- Preserve the existing toolkit, Material generation or custom design system. Visual repair does not authorize Compose adoption, a Material 3/Expressive migration, a library/SDK upgrade or an architecture rewrite.

## Visual language: character through Android roles

### Color, surfaces and depth

Use the app's semantic theme rather than scattering literal colors. In Material 3, map the intended hierarchy to its [color, typography and shape systems](https://developer.android.com/develop/ui/compose/designsystems/material3); apply the same role discipline through existing View theme attributes where applicable.

- Pair container roles with their intended on-colors: for example, `primary`/`onPrimary`, `primaryContainer`/`onPrimaryContainer`, `surface`/`onSurface`, and error pairs. A prominent accent is not a universal text color.
- Use the surface/container roles available in the installed library to distinguish background, grouped content, selection and raised controls. Do not add a card around every row or use elevation as a substitute for spacing and hierarchy.
- Give primary actions clear emphasis; keep secondary actions discoverable without competing. Differentiate selected, pressed, focused, disabled, loading, stale and error states. Status also needs intelligible text or an icon, not hue alone.
- Define shape character consistently across related components. Tonal elevation and shadows communicate depth differently; choose the treatment that clarifies overlap and interaction, including in dark theme. Do not copy a shadow value everywhere.
- Dynamic color is optional personalization, available through platform-backed schemes on Android 12/API 31 and later. When used, retain a deliberate light/dark fallback and verify brand-critical identity, semantic status and composed contrast. Availability is not a mandate to erase the product palette.
- Design dark theme as a readable role scheme, not a global inversion or lowered opacity. Check text on actual containers, overlays, selected surfaces and system-bar backgrounds; static brand colors need suitable counterparts in each appearance.

### Typography, icons and density

Choose type roles for the task: a session title, live metric, body transcript and control label should not compete at the same size and weight. Material's display/headline/title/body/label roles are a useful vocabulary, not a ban on an existing licensed custom face.

- Use **dp** for layout and **sp** for text through framework dimension handling. Let Android apply font scaling; do not hardcode pixel conversion or assume scaling is always a single linear multiplier. See [density and text units](https://developer.android.com/training/multiscreen/screendensities).
- Let text-bearing rows grow or reflow at larger font sizes; replace inappropriate fixed heights rather than shrinking or clipping text to protect a screenshot. Check fallback glyphs, long translations, multiline labels and display-size changes.
- Compact monitoring and comparison layouts are legitimate. Preserve at least **48×48dp touch regions** for interactive elements; that is not a requirement to draw every icon at 48dp. Keep adjacent regions distinct rather than overlapping invisible targets.
- Use a coherent icon family and appropriate vector or raster assets already supported by the app. Match stroke/fill, optical size and alignment to adjacent text; filled selection can be useful, but retain explicit state semantics. An icon-only action needs a meaningful name.
- Give changing metrics tabular digits where the font supports them, locale-aware formatting, deliberate precision and a flexible comparison region. Align a smaller unit to the number's text baseline, not bounding-box center; Compose baseline alignment or View baseline constraints can express the relationship.
- Exercise digit-count growth and wide units; tabular figures do not prevent `9.8` → `100.0` from changing width. Preserve a useful numeric hierarchy without clipping, moving neighboring controls or forcing all prose into monospace.
- Use start/end relationships and localized resources for RTL. Mirror directional affordances when their meaning requires it, not logos, every icon or every chart. Check mixed-direction IDs, numbers and units in actual localized text.

Android's [accessibility guidance](https://developer.android.com/guide/topics/ui/accessibility/apps) recommends 4.5:1 text contrast below 18sp regular or 14sp bold, and 3:1 for other text. Measure actual foreground/background pairs; do not use a web pixel threshold to classify Android text or assume a theme guarantees every custom combination.

## Adaptive composition and navigation

Design for the **available app window**, not a device-name test or a stretched phone screenshot. Windows can resize within a tablet, foldable or multiwindow environment; height, font size, input mode and fold posture also affect usable composition. Follow [Android adaptive guidance](https://developer.android.com/develop/ui/compose/layouts/adaptive/get-started-with-adaptive-apps) using the project's existing layout mechanisms.

- Select navigation bar, rail or drawer by destination structure, reach and available space. A bar/rail usually represents top-level destinations; a drawer can accommodate a richer hierarchy. Do not add navigation chrome merely because the window crossed a width threshold.
- Use a list-detail arrangement when simultaneous selection and inspection help the task. In narrower space, show the appropriate single destination; in wider space, preserve context beside detail rather than producing giant rows or redundant cards.
- Bound reading measure, give comparison columns useful width, and keep related actions near their content. Redistribute space intentionally; do not fill every empty area with another panel.
- Account for hinge/occlusion and posture where relevant; keep important content and touch targets out of obstructed regions. Recompute from current window information rather than caching the initial screen dimensions.
- Preserve selected item, destination/back history, scroll position and draft ownership when panes appear or disappear. Selection, keyboard focus and TalkBack focus are different states; a layout switch must not silently move the user to another record.
- Use compatible adaptive components when already appropriate; Views can use existing constraints, resource variants and WindowManager information. Adaptive behavior does not require replacing Views with Compose or importing web breakpoints.

## Insets, keyboard and Back ownership

[Window insets](https://developer.android.com/develop/ui/compose/system/insets) describe system bars, cutouts, gestures and IME occlusion; they are not constant decorative padding. Edge-to-edge defaults and enforcement depend on OS version and `targetSdk`; check the current guidance for that combination rather than asserting one rule for every Android release.

- Allow background/content to extend behind system chrome when intentional, while protecting essential text and interactive controls. Include caption/taskbar and cutout conditions when relevant; keep status/navigation-bar icon contrast legible.
- Assign each inset responsibility once. Inspect Activity/window configuration, scaffold content padding, View inset listeners and nested Compose padding/consumption before adding more. Mixed hosting must not apply system bars or IME padding twice or consume them before the responsible child sees them.
- Keep the edited field, caret and relevant action visible as the IME opens, resizes or animates. Use a real text input with suitable IME options, multiline behavior and selection; do not replace editing with a painted label.
- Preserve platform keyboard dismissal and the app's existing navigation semantics. Verify gesture Back and three-button Back: dismiss the applicable keyboard/overlay before navigating when expected, and avoid competing callbacks that both consume one event.
- Use the installed navigation and supported AndroidX/platform Back integration, not raw key interception or a custom edge swipe. Enable interception only for the state that actually owns it; ordinary navigation should retain system behavior.
- Where supported, verify predictive Back progress, commit and **cancellation**. A cancelled preview restores the current pane, focus and draft without popping history or executing an action. Do not opt out, upgrade dependencies or change manifest settings merely to hide a visual defect.

Consult [predictive Back guidance](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture) for the actual OS, target, navigation and Activity versions; do not copy old developer-option or opt-in instructions indiscriminately.

## Implementation branch: preserve continuity

### Jetpack Compose

Use the established state owner and unidirectional data path. Hoist state to the lowest owner that needs to coordinate it, not automatically to a new global store. See [state in Compose](https://developer.android.com/develop/ui/compose/state).

- Keep stable model identity and lazy-item keys through refresh/reordering. Do not regenerate IDs or replace an editing subtree to update color, a badge or a live value; that can reset focus, scroll and local state.
- `remember` survives recomposition while its composition identity remains; it is not restoration. Use supported `rememberSaveable`/saved-state mechanisms for small restorable UI state such as a selection ID or draft when the product requires it.
- A `ViewModel` can retain screen state across configuration changes, but not process death by itself. Saved state is a bounded restoration mechanism, not durable storage for transcripts, large models or user documents. Persist durable data through the app's existing storage policy.
- Collect Android flows lifecycle-aware, for example with supported `collectAsStateWithLifecycle`, and use established effect lifetimes. A visual refresh must not start duplicate subscriptions, repeat a submission or restart work each recomposition.
- Inspect measurement, baseline alignment and modifier order before adding offsets or fixed sizes. Keep frequent metric updates from animating/re-laying out unrelated content without need.

### Views/XML and mixed hosting

Preserve existing Activity/Fragment ownership, adapters, bindings and navigation. Correct constraints, text appearances, dimension resources and actual control states in place instead of translating the repair into Compose recipes.

- Respect intrinsic/wrap-content sizing, baseline relationships and constraints under large text; examine a custom view's measurement and drawing metrics rather than patching an incorrect baseline with guessed pixels.
- Preserve stable row identity and existing adapter update/restoration behavior so refresh does not reset selection or scroll. Use stable View IDs and the existing saved-instance-state path for restorable controls; restore custom UI state after its view exists.
- A Fragment's view lifecycle is separate from the Fragment lifecycle. Observe UI data against the appropriate view lifecycle and release view references after destruction; recreation must not retain an old view or duplicate observers. See [Fragment lifecycle](https://developer.android.com/guide/fragments/lifecycle).
- At `ComposeView`/`AndroidView` boundaries, identify one owner for sizing, theme, insets, focus, semantics and state. Select a composition disposal strategy matching the host lifecycle and preserve unique IDs for multiple restorable `ComposeView`s; see [Compose in Views](https://developer.android.com/develop/ui/compose/migrate/interoperability-apis/compose-in-views).

## Accessibility and feedback

Use real controls and their built-in semantics before custom gesture surfaces. Check the rendered accessibility experience, not only source labels; [Compose semantics](https://developer.android.com/develop/ui/compose/accessibility/semantics) explains roles, state, actions and grouping.

- Expose meaningful TalkBack names, roles, selected/checked/disabled state, values, errors and actions. Group a coherent reading unit without hiding independently actionable descendants. Order traversal by task, including across adaptive panes and overlays.
- Do not repeat visible text through an unnecessary content description, include “button” in a label already announced as a button, or expose decorative icons redundantly. Repeated actions need sufficient item context.
- Communicate important state transitions without stealing accessibility focus. Avoid live-region announcements for every token, elapsed second or metric sample; use restrained announcements for consequential changes and leave current values available on demand.
- Verify touch, keyboard Tab/directional traversal, visible focus and action activation. Provide accessible actions or visible alternatives for swipe/drag-only operations; check Switch Access where that interaction is affected.
- Keep pressed/focused feedback immediate and meaningful. Honor device/app motion and animation settings through supported behavior; custom effects must not defeat disabled/reduced animation preferences or delay final state. Sound and haptics supplement, not replace, visible and semantic feedback.

## Worked example: live sessions and prompt composer

**Task and character:** A precise, calm session workspace lets users find the active run, inspect its output and prepare the next prompt. Reuse existing submission/cancellation and draft policies; a design task does not redefine execution semantics.

**Composition:** A restrained session list prioritizes title, readable status and last activity. Selection uses a semantic container/on-color pair, not a full-screen accent wash. Detail gives the session title and current state clear hierarchy above a comfortably measured transcript; a bottom composer keeps its label, draft and send action distinct from output. A compact throughput metric uses baseline-aligned `12.4` and quieter `tokens/s`, not a competing hero number.

**Transitions and implementation:**
- In a compact window, opening a row navigates to detail. With room for both panes, keep the list visible and identify selection while detail retains its useful reading width. Resizing or folding preserves the selected session and its draft rather than selecting the first row.
- During refresh, retain readable output and selection; show stale/disconnected context with a recovery action instead of clearing the transcript. Distinguish initial loading from refreshing existing content and absence of sessions from a load error.
- During streaming, update the active status and existing cancellation control. Preserve the reader's scroll position when inspecting older output; follow new output only according to the app's existing follow behavior, with an explicit way to return to latest content.
- Keep a multiline draft editable above the IME, with a reachable send action and no double bottom inset. Preserve the existing Enter/newline and IME-send policy; keyboard dismissal must not submit. Submission failure retains recoverable input and gives an inline explanation, not only a transient snackbar.
- Back with the keyboard visible follows normal dismissal; subsequent navigation follows the current pane/back history and draft policy. A cancelled predictive gesture leaves detail and draft untouched. Rotation/recreation restores the required selection, draft and scroll context without resubmitting or reopening the keyboard merely because a refresh arrived.
- Expose list status and selection coherently to TalkBack; identify send/cancel actions by purpose. Announce meaningful completion/error without reading every streamed token or repeatedly moving focus to the transcript.

**Exercise:** Use safe existing debug/sample data to stream output, refresh, enter a draft, expose the IME, dismiss it, navigate and resize/rotate. Compare stale/error recovery and rapid updates without sending a real external prompt, cancelling active user work or changing production thresholds simply to create a state.

## Verify the real Android app

Use an available **emulator or physical device** and the project's safe existing launch path with an authorized app/data target. Discover installed tooling and its actual capabilities; host GUI automation is not proof of Android accessibility inspection or input support. Read the applicable tool skill before driving it. Do not install SDKs, emulators or tools, grant permissions or change device/system settings without authority.

Select checks from the changed surface, not a fixed device quota:
- Inspect actual-size light/dark rendering, relevant dynamic/static schemes, contrast, typography/baselines and status/selection treatment with representative content.
- Exercise relevant narrow/wide/resized windows, rotation, fold/posture, large font/display size and long/RTL text. Check reflow, hinge/cutout clearance and metric growth rather than only a static preview.
- Exercise touch and keyboard actions, IME open/dismiss, gesture/three-button Back, and supported predictive-Back cancellation. Verify visible focus, scroll position, draft preservation and no duplicate action after refresh.
- Use TalkBack and, where relevant and available with permission, Switch Access to check reading/traversal and actual actions. Screenshots establish appearance, not accessibility behavior or successful command execution.
- Check recreation/restoration through the existing safe debug/test path. Rotation or activity recreation is **not proof of real process-death recovery**. Validate process death separately only with an authorized disposable target and a suitable saved-state-preserving procedure; do not force-stop, clear data or remove a real user's app/task to simulate it. See [saving UI state](https://developer.android.com/topic/libraries/architecture/saving-states).

Observe the result after consequential interactions, repair the responsible source, and re-exercise the affected path. Builds, previews, screenshots and source inspection complement runtime evidence but do not replace it. If a device, state or inspection capability is unavailable, complete reachable work and name exactly what remains unverified; never fabricate Android automation support or equate a browser mockup with native verification.
