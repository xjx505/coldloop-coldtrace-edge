# ColdLoop Presentation Research Workspace

Status: **research phase only**. No PowerPoint should be built from this folder until the project-truth reconciliation is finished.

## Purpose

The presentation is not a written report with backgrounds.

Its job is to help the team:
1. make the judges understand the problem and solution quickly;
2. prove that the work is real and technically credible;
3. make the important ideas memorable;
4. support the live explanation and demo rather than compete with them;
5. visibly satisfy the official judging criteria;
6. preserve enough flexibility for both science-fair judging and a finalist stage pitch.

The governing idea for this workspace is:

> **Comprehension + evidence + memorability + demo continuity > decoration.**

A beautiful slide that does not make the argument clearer is wasted space.

## Source priority

When sources disagree, use this order:

1. Official Reboot The Earth Doha 2026 documents
2. Actual current ColdLoop/ColdTrace code, QA evidence, model artifacts and physical verification
3. Final team handoff and current team decisions
4. Peer-reviewed presentation / multimedia-learning research
5. High-quality practitioner guidance from technical communication groups
6. Old brainstorming/chat history

Do not let an old summary override the actual implementation.

## Important official constraint

The official CMU/Reboot FAQ says the final documentation may include a **short presentation of 7–10 slides** describing the submission, including approach and methodology.

The event has two judging contexts on September 26:
- 2:00 PM: science-fair style judging
- 3:30 PM: finalist pitching/judging

The exact finalist pitch duration was **not found in the official documents reviewed**. Do not invent it.

## Design stance

Do not copy generic AI/startup deck aesthetics.

Forbidden by default:
- dark navy/purple AI dashboard styling;
- neon glows;
- gradient fog;
- glassmorphism cards used as decoration;
- robot/brain/network-sphere stock art;
- decorative charts;
- text-heavy report slides;
- tiny citations/labels that are needed to understand the slide;
- fake dashboards or fake metrics;
- visual density added merely to look sophisticated.

Preferred:
- light or warm-neutral canvas;
- very high contrast;
- concept-specific cold-chain visual language;
- real app screenshots, model/data evidence and hardware photography;
- strong assertion-style headlines;
- one message per slide;
- generous negative space;
- graphics that encode state, mechanism, comparison, trend, evidence, action or impact.

## Files

- `01_OFFICIAL_CONSTRAINTS.md` — event rules, deliverables, judging and pitch context.
- `02_PRESENTATION_SCIENCE.md` — evidence-backed communication and slide-design findings.
- `03_STAGE_AND_DEMO_STRATEGY.md` — how the deck must behave in a room and around a live demo.
- `04_VISUAL_DESIGN_DIRECTION.md` — visual system principles without locking final art direction.
- `05_JUDGE_EVIDENCE_MATRIX.md` — what each judging criterion needs to see.
- `06_DECK_QA_CHECKLIST.md` — mechanical and visual QA gates for the future deck.
- `07_OPEN_QUESTIONS.md` — unresolved facts that must not be silently guessed.
- `sources\SOURCE_INDEX.md` — official/research source map.
- `sources\official_*.txt` — local snapshots of important official wording.
- `sources\pdf\` — downloaded source PDFs.

## Before slide construction

Create a canonical project-truth sheet answering:

- What exactly is the current hackathon prototype?
- Which architecture is current?
- What hardware was actually used?
- Which parts are physically verified?
- Which parts are software-verified only?
- Which parts are simulated/replayed?
- What is the exact model task?
- What dataset/model metrics are valid?
- What is product vision vs. implemented prototype?
- What claims are prohibited or unsupported?

There is currently a meaningful conflict between the older sensor-monitoring ColdLoop implementation context and the newer ColdTrace Edge handoff. That must be resolved against real artifacts before slide copy is frozen.
