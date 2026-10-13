# OMP visual runtime

Source: omo 5.1.19 frontend workflow, adapted to exposed OMP APIs. Use exposed browser tools for pages; read `skill://cua-driver` before using its browser or native-window route. Capture and emulation guidance: [browser setup](skill://visual-qa/references/browser-setup.md). Use only documented capabilities; do not assume locator, context or emulation helpers.

## Image generation

Use the actual `generate_image` tool. Required: `subject`. Optional composition inputs: `action`, `scene`, `composition`, `lighting`, `style`, `text`, `changes`, `aspect_ratio`, `image_size`, and reference `input: [{path: observedPath}]`. Allowed ratios: 1:1, 3:4, 4:3, 9:16, 16:9, 3:2, 2:3; sizes: 1024x1024, 1536x1024, 1024x1536. Omit model unless the real tool contract and user request require it. There is no provider, count, outputPath or quality flag. Generate separate calls for variants/sections; inspect the returned images using actual returned paths. Source imagegen/Imagen/Stitch labels describe concepts, not callable providers. A supplied reference remains the contract; never replace it with generated imagery. Record unavailable generation as a missing research lane.

## Research and audits

Use the local [UI/UX database](ui-ux-db/README.md), taste/brand corpus and catalog/source URLs. Network catalogs are capability prerequisites; record unavailable endpoints in the Research Log. Fetch through advertised web tools or browser APIs; search saved content through the text search tool, not shell grep. Upstream curl recipes document endpoint contracts, not permission to write files with redirection.

Audits require a production server, real Chrome and an installed Lighthouse Node API/project audit runner; React runtime scans additionally require react-scan/lite and event subscription. No host Lighthouse or Playwright skill is assumed. Inspect existing runner imports/parameters, never auto-install globally, and record missing audits separately from screenshot QA. Preserve the 100/category target without claiming unmeasured scores. New dev tooling belongs to the project and development only; do not install unrelated agent/skill packs.
