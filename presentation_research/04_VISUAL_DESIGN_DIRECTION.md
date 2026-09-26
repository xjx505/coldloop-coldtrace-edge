# Visual Design Direction Research

This is a design system brief, not a finished theme.

## Strategic visual direction

Candidate direction:

> **Scientific field instrument + cold-chain operations + editorial presentation**

The deck should feel like a team that built and tested a real system, not like an AI company generated a landing page at 3 AM.

## Base canvas

Prefer:
- white, off-white or very light warm gray;
- charcoal/near-black typography;
- generous negative space.

Why:
- strong projection contrast;
- avoids generic dark-AI aesthetic;
- supports photographs, traces and screenshots;
- makes warning colors meaningful.

## Accent logic

Color should encode meaning.

Potential semantic family:
- cool cyan/teal: cold-chain / normal / measured state;
- amber/orange: warming / watch;
- red: excursion / failure only;
- green: verified / recovered / success where appropriate.

Do not spray all accents across every slide.

If an accent has no semantic job, remove it.

## Typography

Use a neutral, high-legibility sans-serif that is installed/embeddable and renders reliably.

Requirements:
- large x-height;
- strong regular/bold contrast;
- no ultra-thin weights;
- no decorative techno font;
- no all-caps paragraphs.

Use type scale, not extra boxes, to establish hierarchy.

## Layout

Prefer a few strong composition patterns rather than twenty card grids:
- assertion + hero evidence;
- split comparison;
- full-width visual + annotation;
- sequence/pipeline;
- one big number + proof;
- screenshot with 2–3 callouts.

Avoid:
- 3x3 feature matrices;
- six identical rounded cards;
- nested cards;
- floating chips everywhere;
- tiny icon + paragraph repeated across a slide.

Those patterns are useful in web dashboards and terrible when every slide becomes one.

## Real imagery

Priority:
1. actual prototype/hardware photo;
2. actual app screenshot;
3. actual data trace;
4. simplified custom diagram;
5. carefully chosen contextual photography if truly needed.

Do not use generated decorative imagery where real evidence exists.

## Diagrams

A good system diagram:
- has one reading direction;
- contains only components needed for the current claim;
- uses labels instead of a giant legend;
- can be explained in <30 seconds;
- reveals progressively if complex.

If the architecture has 20 boxes, create a simplified presentation architecture and keep the full one as backup documentation.

## Product screenshots

Do not dump a full phone UI at tiny scale.

Options:
- crop to the relevant state;
- magnify one region;
- pair one phone screenshot with one assertion;
- use sequential screenshots to show state change.

Screenshot should be from the real current build or explicitly labeled replay/demo.

## Data visuals

The deck should have a consistent visual grammar:
- normal = cool line/region;
- risk interval = warm highlight;
- prediction point = distinct marker;
- action = directional label/callout.

This lets judges learn the visual language once.

## Citations

Keep sources available without turning slides into papers.

Recommended:
- short source line bottom edge;
- numeric/endnote marker where needed;
- full references in notes/backup/source document;
- QR/link only if it serves a real use.

Never use a tiny paragraph of URLs.

## Logos

Use organizer/partner logos only where appropriate:
- title/end/acknowledgement, not every slide;
- preserve clear space/aspect ratio;
- do not recolor official logos unless brand rules allow.

The project identity should not fight the Reboot identity.

## Motion

Default: none.

Add only when motion:
- controls reveal order;
- shows a state transition;
- demonstrates a time-series/event;
- turns a complex process into an understandable sequence.

No glowing pulses, orbiting dots or gratuitous morphing.

## The anti-AI-look test

Before accepting a slide, ask:

> If I removed the words "ColdLoop" and "cold chain," would this look like a generic AI consultancy deck?

If yes, redesign it around project-specific evidence.

## The anti-decoration test

For every non-text object ask:

> What information disappears if I delete this?

If the answer is "nothing," delete it.
