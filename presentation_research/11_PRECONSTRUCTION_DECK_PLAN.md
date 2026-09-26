# Pre-Construction Deck Plan

No PowerPoint should be created until Phase 1 is closed.

## Objective

Build a 7–10 slide presentation that makes judges:

1. understand the cold-chain problem quickly;
2. understand exactly what the system does;
3. see real technical evidence rather than feature claims;
4. understand why AI is used only where it earns its place;
5. see a working demo/prototype;
6. understand open-source and sustainability relevance;
7. remember a small number of distinctive ideas.

Do not optimize for "looking impressive" in isolation.

---

# Phase 1 — Evidence lock

## 1A. Locate or disprove the ColdTrace implementation

Search for the actual source/artifact tree referenced by the handoff.

If found:
- establish repository root;
- inspect git history/status;
- inspect model/data provenance;
- run tests;
- reproduce model evaluation;
- hash exported model;
- run PWA offline test;
- inspect network requests;
- run backend tests;
- inspect BLE firmware/protocol;
- capture current UI;
- classify physical vs simulated evidence.

If not found within a bounded search:
- stop treating ColdTrace implementation claims as verified;
- preserve them only as product/design intent.

## 1B. Audit the dataset

For whichever model is actually used:
- exact dataset repo/revision;
- exact file;
- exact row count;
- exact number of independent shipments;
- exact filter to eligible rows;
- target definition;
- feature allowlist;
- train/test split method;
- class counts;
- model metrics;
- event-level metric method.

Produce:
`12_MODEL_DATA_EVIDENCE.md`.

## 1C. Physical truth update

Before the deck is frozen, check whether hardware is now available.

Record:
- board;
- sensors actually connected;
- flashed firmware;
- serial output;
- physical BLE connection;
- actual phone app;
- one successful live state change;
- failures/limitations.

Photograph the real rig if it works.

Produce:
`13_PHYSICAL_DEMO_EVIDENCE.md`.

## 1D. Freeze canonical product truth

Create:
`PROJECT_TRUTH_FOR_DECK.md`

It must contain only:
- one product name hierarchy;
- one current architecture;
- one current sensor/protocol story;
- one model story;
- one dataset story;
- one demo story;
- explicit implementation/simulation/future boundaries.

Nothing enters the main deck until it is consistent with that file.

---

# Phase 2 — Decide the presentation thesis

Only after evidence lock.

Answer:

> What is the single strongest claim this prototype can honestly prove?

Possible outcome if ColdTrace artifacts are verified:
- edge/offline prediction + conservative evidence/learning story.

Possible outcome if only current ColdLoop Monitor remains verified:
- open sensor-to-phone condition monitoring prototype with strong reliability/UX, while clearly separating the AI decision layer as next work.

Do not decide this now by preference. Let evidence determine it.

---

# Phase 3 — Choose the 3–4 memories

Judges will not remember nine slides.

Choose 3–4 ideas they should still remember later.

Candidate categories, not final wording:
- early/predictive rather than purely reactive;
- works at the edge/offline;
- explains evidence and abstains instead of inventing causality;
- open/reusable architecture;
- learns recurring weak points across trips.

Only retain memories that are backed by the verified final branch.

---

# Phase 4 — Build the argument before the slides

Create a table with one row per candidate slide:

| # | Judge should believe | Evidence shown | Presenter says | Rubric supported |
|---|---|---|---|---|

No visual design yet.

Reject:
- generic "Features" slide;
- giant text problem statement;
- architecture for architecture's sake;
- methodology dump;
- fake impact;
- roadmap masquerading as implementation.

---

# Phase 5 — Proposed story skeleton

This is deliberately provisional.

## If ColdTrace implementation becomes VERIFIED

Likely 8–9 slide structure:

1. **Problem / operational gap**  
   Why reacting after temperature failure is insufficient.

2. **Core insight / product thesis**  
   Data should move from sensing to earlier risk/action, not just another dashboard.

3. **Architecture / why edge**  
   Sensor -> phone inference -> offline warning -> later fleet learning.

4. **Real data + model evidence**  
   Dataset, shipment-level evaluation, model choice, baseline comparison.

5. **Live demo / replay proof**  
   Normal -> risk emergence -> warning -> evidence/action.

6. **Responsible forensics**  
   Observed vs inferred; UNKNOWN; no fake root cause.

7. **Fleet learning / weak points**  
   Events become normalized operational learning.

8. **Open source + deployment/scalability**  
   Open interfaces/hardware path, reuse/adaptation.

9. **Impact + limits + close**  
   SDG 12.3 causal path, explicit unvalidated boundaries, memorable closing thesis.

## If only current ColdLoop Monitor is VERIFIED

Do **not** reuse the structure above and pretend prediction exists.

Likely structure:

1. cold-chain monitoring problem;
2. what ColdLoop Monitor actually captures;
3. sensor -> BLE -> Android architecture;
4. live demo;
5. reliability/error/readiness design;
6. evidence from software QA;
7. open-source/scalable integration path;
8. what AI decision layer comes next + honest limitations;
9. sustainability relevance / close.

That is less ambitious, but scientifically defensible.

---

# Phase 6 — Demo design

The demo must have three versions.

## A. Live physical
Only if physical BLE/sensor path is actually verified.

## B. Deterministic product demo
Must use the real app code path with clearly labelled demo/replay data.

## C. Static/video fallback
2–4 screenshots or short video showing the same sequence.

Never allow the entire judging pitch to depend on one Bluetooth handshake.

---

# Phase 7 — Visual design

Only after story/evidence are frozen.

Build three representative slides first:
- problem;
- technical evidence;
- demo/architecture.

Review them before completing the deck.

Visual constraints already live in:
- `04_VISUAL_DESIGN_DIRECTION.md`;
- `06_DECK_QA_CHECKLIST.md`.

---

# Phase 8 — Deck QA

Before acceptance:

- 7–10 slides;
- 16:9;
- PowerPoint render check;
- no overlap/clipping/reversed text;
- assertion-title story;
- stage-readable text;
- citations/source notes;
- all quantitative claims cross-checked against claim ledger;
- actual app/hardware visuals;
- no generic AI aesthetics;
- full slideshow review;
- PDF export review;
- demo fallback verified;
- timed rehearsal.

---

# Immediate next action

**Do not open PowerPoint yet.**

Next:

1. resolve whether the ColdTrace implementation exists anywhere accessible;
2. if yes, independently verify it;
3. if no, freeze the presentation around the verified ColdLoop branch and explicitly position ColdTrace as future/AI design rather than completed work;
4. update physical hardware evidence;
5. create `PROJECT_TRUTH_FOR_DECK.md`;
6. only then storyboard the 7–10 slides.
