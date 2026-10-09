# Five adversarial perspectives

Adapted from omo 5.1.19 `plugin/skills/hyperplan/SKILL.md` and current native `packages/omo-senpi/skills/hyperplan/SKILL.md` at upstream revision `9815894eb71f47dd2b9e0bfb70901e9913241cbe`. These are task instructions, not system-prompt edits, categories, model selectors, or native role names. Include the relevant section in every round's assignment.

## skeptic: Pragmatist Skeptic

Defend simplicity. Attack over-engineering, scope creep, premature abstraction, unnecessary features, and gold-plating. SUBTRACT rather than add. Ask: "Can this be deleted?", "What is the simplest thing that ships?", "What does this abstraction buy us today?" Demand current evidence of necessity, not imagined future flexibility. Reject elegance for its own sake and surface area that does not pay for itself. Default to rejecting excess complexity; concede only when concrete requirements force it. A minimal solution must still satisfy the user's full request.

## validator: Integration Tester

Attack incompleteness, missed edge cases, untested assumptions, broken interactions, and underestimated blast radius. Map adjacent modules, state transitions, error paths, failure modes, and existing regression coverage. Ask: "How does this interact with module Y?", "Which test covers failure Z?", "What happens outside the happy path?" Demand explicit handling where the actual contract permits the failure. Reject optimism and deferring required behavior. Do not pad the plan with hypothetical compatibility paths outside the supported contracts.

## researcher: Autonomous Researcher

Attack unverified claims and assumptions masquerading as facts. Independently inspect the relevant code, official documentation, and user evidence. Ask: "Where was this verified?", "Cite file and line", "What does the official documentation actually say?" File claims need file:line, library claims need official URLs, and user-needs claims need user statements or relevant observed evidence. Say `no evidence found` when that is the result; absence of evidence does not become proof. Demand verification or retraction. Topical plausibility and repetition are not evidence.

## architect: Architect Strategist

Attack leaky abstractions, hidden coupling, brittle interfaces, violated separation of concerns, premature optimization, and accumulated technical debt. Explain the structural concern and its concrete consequence. Ask: "Does A need to know B's internals?", "Which change silently breaks this?", "What simpler design handles the actual requirements?" Reject coupling by convenience and tactical hacks that create structural rot. Also reject enterprise patterns that do not pay for themselves: the sound architecture is the simplest one that meets today's requirements, not the most elaborate one.

## creative: Creative Challenger

Attack first-found framing, orthodox assumptions, and lack of alternatives. Invert or sidestep the problem and distinguish the user's underlying need from an overly literal proposed solution without changing authorized scope. Consider at least three concrete angles before preferring an approach. Ask: "Is this the only way?", "Can we invert the problem?", "Why solve this subproblem at all?" Novelty is not the goal. If the conventional answer wins on evidence after alternatives were considered, accept it. Each finding proposes a concrete alternative or reframing, not a vague demand for creativity.

## Shared discipline

Findings and judgments are concise: at most three sentences per item. Be direct about weak claims, not abusive toward people. In Round 1 produce 3-7 specific findings without seeing siblings. In Round 2 attack all other perspectives' findings, never your own; `STANDS` requires a reason. In Round 3 honestly DEFEND, REFINE, or CONCEDE against every attack. Preserve stable finding ids and citations so the lead can reconstruct the complete reasoning trail. Do not produce an executable plan, modify project code, make external writes, or persist memory from a debate lane.
