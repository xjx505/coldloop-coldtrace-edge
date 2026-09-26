# Future PowerPoint Build Process

Do not skip directly from notes to polished slides. That is how overlapping text and template sludge happen.

## Phase 0 — Truth lock

Before slide writing:
- reconcile current project architecture;
- lock prototype name;
- lock exact model/data claims;
- lock physical verification status;
- lock which screenshots/artifacts are current;
- mark implemented / simulated / roadmap separately.

Output:
`PROJECT_TRUTH_FOR_DECK.md`

## Phase 1 — Judge argument

Write the presentation as a sequence of claims before designing anything.

For each candidate slide:
- assertion;
- proof/evidence;
- what presenter says;
- why judge should care;
- rubric dimensions it helps satisfy.

Reject slides that exist only because "pitch decks usually have one."

## Phase 2 — Memory design

Choose the 3–4 things judges should remember after the event.

Every main slide should strengthen at least one of those memories.

If a slide adds information but weakens the core memory, it belongs in backup documentation.

## Phase 3 — Storyboard

Use plain boxes/text only.

No theme.
No color hunting.
No animations.

Validate:
- title-only story;
- problem → insight → proof → demo → impact logic;
- demo placement;
- 7–10 slide official constraint.

## Phase 4 — Evidence acquisition

Gather final:
- app screenshots;
- data/model charts;
- prototype photo;
- architecture;
- repo/open-source proof;
- source citations;
- demo fallback frames.

Do not create fake visuals before checking whether real project evidence exists.

## Phase 5 — Visual system

Lock:
- canvas/background;
- typefaces;
- type scale;
- grid/margins;
- semantic colors;
- chart grammar;
- screenshot treatment;
- citation style;
- icon style if icons are actually needed.

Build 2–3 representative slides first. Do not generate all slides until the visual system survives review.

## Phase 6 — Full deck

Construct the 7–10 slide main deck.

Rules:
- one message per slide;
- assertion headline;
- stage-readable text;
- no report paragraphs;
- no decorative visuals;
- no unverified claims.

## Phase 7 — Demo integration

Create:
- live path;
- accelerated/deterministic replay;
- video or screenshot fallback;
- transition into demo;
- transition back to slides.

The presenter should never be left staring at a broken app with no recovery path.

## Phase 8 — Mechanical QA

Programmatically or manually detect:
- shape overflow;
- text clipping;
- overlapping text boxes;
- objects outside slide bounds;
- missing fonts;
- broken images/videos;
- tiny text;
- accidental low contrast;
- malformed animations.

## Phase 9 — Visual QA

Render every slide to images.

Review:
- individual slide;
- montage of entire deck;
- sequential flow;
- projector-distance thumbnail;
- dark/light room if possible.

A valid PPTX file is not a valid presentation.

## Phase 10 — Rehearsal QA

Rehearse in slideshow mode.

Measure:
- total duration;
- demo duration;
- transitions;
- difficult phrases;
- teammate handoffs;
- time-recovery cuts.

Prepare:
- normal version;
- shorter emergency version;
- science-fair conversational path.

## Stop condition

The deck is ready only when:
- content is truthful;
- argument is coherent;
- all official requirements are represented;
- every slide is readable at stage distance;
- demo has fallback;
- PowerPoint rendering has been visually inspected;
- presenters can deliver it without reading the slides.
