# ColdLoop / ColdTrace Edge — Final Exact 10-Slide Storyboard

Status: **LOCKED FOR BUILD PLANNING**  
Version: 2 — revised after red-team review  
Do not build the PPTX until the required assets listed at the end are gathered.

---

# 0. Presentation identity

## Product naming

**ColdLoop** = the broader platform/product vision.

**ColdTrace Edge** = the implemented hackathon AI prototype and the technical core of this presentation.

The presentation should feel like one coherent product story:

> **ColdLoop presents ColdTrace Edge: an edge-first cold-chain warning prototype that turns recent spatial temperature history into an earlier local thermal-risk signal, keeps working offline, and preserves evidence for later operational analysis.**

Do not merge the separate Windows DHT22/MQ-135/ENS160 prototype branch into the main presentation unless it directly becomes part of the final physical demo.

---

# 1. Deck argument

The deck is not a list of features.

The argument is:

1. Cold-chain systems already collect and monitor temperature.
2. ColdTrace targets the narrower gap between monitoring and **earlier local warning**.
3. It converts the previous hour of spatial temperature behavior into a defined future thermal-risk prediction.
4. It runs locally on the edge and does not need cloud inference.
5. We tested it by holding out complete shipments rather than randomly mixing neighboring rows.
6. The results show promise **and substantial limitations**.
7. One held-out shipment demonstrates the real end-to-end product path.
8. Prediction, forensics, and quality-impact estimation are deliberately separated.
9. Offline events can later become evidence for recurring operational weak points.
10. We built a credible prototype and know exactly what still requires field validation.

The judges should leave remembering roughly four things:

- **local/offline inference**
- **real shipment-held-out evaluation**
- **honest evidence handling / UNKNOWN**
- **a reusable edge-to-fleet architecture**

---

# 2. Hard presentation rules

## Official

- Exactly **10 main slides**.
- 16:9 widescreen.
- Must visibly cover approach/methodology.
- Must support prototype readiness, technical execution, communication, open-source alignment, and sustainability/SDG relevance.

## Readability

A judge should understand the **basic point of every slide in about 3 seconds** before hearing the explanation.

Target sizes:

- assertion/title: **40–48 pt**
- hero number: **56–76 pt**
- primary labels/callouts: **24–30 pt**
- chart labels: **20–24 pt**
- necessary text: **never below ~20–22 pt**
- source/footer only: **11–14 pt**

If content does not fit at those sizes, remove content.

No slide may depend on the audience reading a paragraph.

## Visual rule

> **Do not add any shape, icon, color, line, chart, screenshot, or animation unless it encodes state, magnitude, time, flow, comparison, confidence, or evidence.**

If deleting an object loses no information, delete it.

## One-slide composition rule

Prefer:

```
ASSERTION

        ONE DOMINANT VISUAL

1–2 direct annotations              one hero metric if useful

tiny source
```

Avoid:

```
title
paragraph
five bullets
three cards
tiny chart
tiny screenshot
six metrics
disclaimer
logo farm
```

---

# 3. Visual system

## Canvas

- warm off-white: `#F7F4EE` or equivalent
- primary text: near-black charcoal `#1F2529`
- secondary text: slate `#59636C`

## Semantic accents

Use color only when it communicates meaning.

- measured / ColdTrace / cold-chain system signal: **deep teal** `#167C80`
- healthy / recovered: **muted green-teal** `#2F7D6A`
- warning / elevated risk: **amber** `#B66A00`
- severe R2 / critical marker: **red** `#B63A2B`
- unknown / unavailable / not verified: **neutral gray** `#858A90`
- divider/grid: light warm gray `#D8D4CA`

Do **not** use dark navy/purple as the dominant theme.

Do not use gradients unless a gradient literally encodes magnitude/time. Default = flat color.

Do not rely on color alone. Pair risk/unknown states with labels or symbols.

## Banned aesthetics

- generic AI brain/network art
- glowing purple/blue cards
- glassmorphism
- decorative waves/blobs
- 3D cubes with no data meaning
- unlabeled icon farms
- fake futuristic dashboard chrome
- huge stock imagery that proves nothing
- meaningless gauges
- charts nobody discusses

---

# 4. Exact 10-slide storyboard

---

# Slide 1 — Identity + thesis

## Assertion

**ColdTrace Edge turns temperature history into earlier local warnings.**

Small identity line:

**A ColdLoop prototype**

## Judge should believe

This is a real edge-warning prototype, not merely a monitoring dashboard.

## Visible content

Keep brutally minimal:

- ColdTrace Edge
- A ColdLoop prototype
- Reboot The Earth Doha 2026 · Challenge 2
- one short thesis line:

**Local thermal-risk warning, even offline.**

Team names/logos can sit quietly at the bottom.

## Dominant visual

One project-specific hero composition:

- actual ColdTrace Driver screen crop, ideally normal state;
- behind/beside it, one simplified temperature trace showing historical context moving toward risk;
- no generic truck/AI illustration.

The screenshot should be cropped enough that its key state is legible from a room.

## Presenter says

"ColdLoop is our broader cold-chain platform vision. For this hackathon we built ColdTrace Edge: a local warning layer that uses recent spatial temperature history to predict a defined future thermal-risk state, even when connectivity disappears."

## Slide purpose

Identity, product thesis, challenge fit.

## Time

~15–20 s.

## Source

ColdTrace implementation + official Challenge 2.

---

# Slide 2 — The operational gap

## Assertion

**ColdTrace targets the gap between monitoring and earlier local warning.**

## Judge should believe

We are not pretending existing cold-chain systems are dumb. We are targeting a specific operational gap: turning recent thermal history into an earlier local warning that gives operators a usable intervention window.

## Visible content

Almost none.

One short sequence:

**Monitoring → earlier local warning → operator action window**

Tiny supporting phrase:

**Inspect · verify conditions · prioritize review**

Small differentiation line:

**Existing monitoring + alerts → ColdTrace adds local predictive warning, offline operation, and explicit uncertainty.**

## Dominant visual

A single real/recreated time-series trace:

- horizontal time axis;
- normal region;
- drift/evolving thermal pattern;
- amber **warning window** before R2;
- red **R2 severe thermal-risk state** marker.

Direct labels only. No legend if direct labeling works.

## Presenter says

"Cold-chain systems already monitor temperature and issue alerts. Our question was narrower: can a small open edge layer use recent temperature history to create an earlier, usable warning locally, so an operator has more time to inspect, verify conditions, or prioritize a shipment before the defined severe thermal-risk state?"

## Caveat

R2 must be labeled **processed severe thermal-risk state**, never spoilage.

## Time

~20–25 s.

---

# Slide 3 — Edge-first architecture

## Assertion

**Risk is scored locally; evidence syncs when connectivity returns.**

## Judge should believe

Offline operation is architectural, not a marketing badge.

## Visible content

One 5-node flow:

**3 probes / replay**
→ **10-min aggregation**
→ **60-min history**
→ **local EDGE-3 score**
→ **offline queue → later sync**

Two micro-labels only:

- **No cloud inference**
- **Human review**

## Dominant visual

Clean left-to-right pipeline.

The **phone/PWA** is visually central.

The sync/cloud/backend path is secondary and lighter, because intelligence happens locally.

Use simple semantic icons only where they improve recognition:
temperature probe, phone, queue/database, sync.

## Presenter says

"The phone performs the risk scoring locally. Live or replayed sensor data is aggregated into 10-minute observations, seven observations form the one-hour history, and the risk model runs in JavaScript on the device. If the network disappears, the warning and records stay local and sync later."

## Optional animation

Reveal sensor → phone → queue → sync.

No flying icons.

## Time

~25–30 s.

---

# Slide 4 — What the AI actually predicts

## Assertion

**The AI predicts one defined future thermal-risk state.**

## Judge should believe

The model task is narrow, reproducible, and honest.

## Visible content

Four pieces only:

**Input**  
7 observations spanning 60 min

**Spatial view**  
Front · Middle · Rear

**Model**  
Regularized logistic regression

**Target**  
R2 within next 120 min

Bottom guardrail:

**Thermal risk ≠ spoilage ≠ food safety ≠ expiry**

Optional very small evidence tag:

**4.2 KB deployment JSON**

## Dominant visual

Input → model → output diagram.

Preferred visual:

three tiny temperature traces / position lanes
→ one compact 60-minute window
→ small model block
→ LOW / HIGH risk output.

No mathematical equation on the main slide.

## Presenter says

"The AI is deliberately narrow. It does not predict whether the food is safe or spoiled. Given the previous hour of spatial temperature behavior, it asks whether the processed severe thermal-risk state R2 appears within the next 120 minutes."

## Time

~30–35 s.

---

# Slide 5 — Evaluation

## Assertion

**We tested on unseen shipments, and the results are uneven.**

## Judge should believe

The evaluation was structurally sound for a hackathon prototype, and we are not hiding the weak generalization.

## Visible content

Only three hero evidence items:

### **6**
shipment-held-out folds

### **11 / 41**
R2 events covered

### **85.5 min**
mean lead **on covered events**

Small secondary line:

**35% of evaluated windows were HIGH**

That is enough numerical content.

Do **not** hero F1/recall/PR-AUC on this slide.

## Dominant visual

Bottom or right side: six-fold F1 strip.

S1 — 0.000  
S2 — 0.743  
S3 — 0.163  
S4 — 0.000  
S5 — 0.220  
S6 — 0.292

Use bars/dots so variation is instantly visible.

Highlight S2, but do not make it look like the overall result.

Small label:

**S2 = strongest fold**

No giant table.

## Presenter says

"We evaluated by holding out complete shipments, not by randomly mixing neighboring measurements. The result is promising but clearly not production-grade: the model covered 11 of 41 R2 events. On those covered events, the mean lead was 85.5 minutes. The fold variation is substantial, and that is exactly why we present this as a prototype."

## Q&A-only metrics

Keep off the main slide but ready:

- macro F1 0.236
- macro recall 0.441
- macro PR-AUC 0.320
- grouped false episodes
- threshold experiments
- FULL-9 comparison

## Time

~35–40 s.

---

# Slide 6 — Demo

## Assertion

**One held-out shipment runs through the complete product pipeline.**

## Judge should believe

The demo uses a real shipment trace and an actually held-out replay model.

## Visible content

Top-left demo tag:

**Shipment S2 · held out from training · illustrative replay**

Do **not** place the S2 F1, recall, coverage, and lead-time block on the slide.

Those metrics already belong to evaluation/Q&A.

Three demo beats:

**Recorded temperatures**
→ **local HIGH warning**
→ **offline queue + later sync**

Optional micro-label:

**S2 is the strongest fold**

If that is already obvious from Slide 5 and the presenter states it, it can remain speaker-notes/Q&A rather than compete with the demo.

## Dominant visual

This is a **demo launchpad**, not a statistics slide.

If live/deterministic demo:

- one cropped Driver screen;
- short prompt:

**Watch the warning appear before the recorded R2 marker.**

If static fallback:

three large crops:
1. normal / warm-up
2. HIGH local warning
3. synced fleet receipt

No tiny full-phone screenshots.

## Presenter says

"For the demonstration we use Shipment S2. The replay model was trained on the other five shipments, so this shipment is genuinely held out. S2 is also the strongest fold, so we use it as an illustrative demonstration, not as our overall performance claim."

Then switch immediately into the product.

## Demo objective

Show:

1. real recorded temperature sequence;
2. local inference;
3. no cloud prediction request;
4. a practical human response prompt: inspect / verify cold-chain condition;
5. offline persistence;
6. later sync.

## Time

Slide explanation ~15–20 s, then demo ~30–60 s depending on pitch allowance.

---

# Slide 7 — Responsible forensics

## Assertion

**When evidence is weak, ColdTrace can say UNKNOWN.**

## Judge should believe

The system separates observation from explanation and refuses false certainty.

## Visible content

Three short zones:

### OBSERVED
- temperature trend
- spatial imbalance
- missing data
- event timing

### INFERRED CAREFULLY
- evidence-ranked hypothesis
- confidence / UNKNOWN
- human process check

### NEVER CLAIMED
- confirmed physical cause
- automatic refrigeration control
- food-safety decision

Maximum 2–3 short lines in each zone.

## Dominant visual

Use a real cropped forensics/evidence screen if readable.

Annotate only:
- **Measured evidence**
- **Forensic result: UNKNOWN**
- **Recommended human check**

Do not use three decorative cards unless the cards truly function as semantic zones.

## Presenter says

"A second design choice was equally important: prediction does not equal root-cause certainty. We separate what we observed from what we infer. If the available telemetry cannot support a cause, the system can return UNKNOWN instead of inventing one."

## Time

~25–30 s.

---

# Slide 8 — Quality-Life separation

## Assertion

**Thermal-risk prediction and quality impact are separate models.**

## Judge should believe

We address the challenge's quality dimension without falsely calling a literature model "AI shelf-life prediction."

## Visible content

Two lanes only.

### COLDTRACE RISK AI
- learned from shipment data
- predicts future R2 thermal risk
- generates warning/evidence

### QUALITY-LIFE ENGINE
- literature-based Arrhenius kinetics
- estimates thermal quality impact
- needs sufficient coverage + external starting state for absolute RQL

Bottom:

**Not food safety · Not legal expiry**

## Dominant visual

Two model paths feeding one label:

**Operator decision support**

Visually distinguish them:

- teal = learned risk model
- neutral/amber = quality-impact model

Do not show dense equations.

One tiny formula icon/equation fragment is acceptable only if it clarifies "kinetic model," otherwise omit it.

## Presenter says

"Challenge 2 also points toward quality and remaining shelf life. We deliberately do not make our classifier pretend to solve that. The learned AI predicts thermal risk. Separately, a literature-calibrated kinetic model estimates how the observed temperature history affects product quality."

## Time

~25–30 s.

---

# Slide 9 — Edge events to operational learning

## Assertion

**Offline events can become evidence for recurring weak points.**

## Judge should believe

The architecture can move from a single local warning to reusable operational records without pretending current fleet results are field-proven.

## Visible content

One flow:

**Local event**
→ **delayed sync**
→ **fleet history**
→ **weak-point view**
→ **human process check**

One small evidence tag:

**LOW SAMPLE / HIGH UNCERTAINTY**

Open/reuse proof must be visible, not optional decoration:

**Apache-2.0 project · Apache-2.0 dataset · JSON model · documented telemetry/schema · reproducible demo path**

If a public/shareable repository link is ready at judging time, add it as a QR or short URL. If not, keep the artifact evidence and omit the QR.

Do not use a row of logo badges.

## Dominant visual

One cropped real Fleet Operations / weak-point screenshot.

Call out only:
1. synced event;
2. low-sample uncertainty.

The screenshot proves the feature exists.

## Presenter says

"When connectivity returns, the local event can sync into the operations layer. In this prototype the facility and handoff context are simulated and the sample count is tiny, so we show that uncertainty instead of pretending it is fleet evidence. The important part is the reusable pattern: local warning now, operational evidence later."

## Sustainability link

Make the causal chain explicit:

**earlier warning + recurring weak-point evidence**
→ **more opportunity for corrective action**
→ **fewer / shorter avoidable thermal excursions**
→ **lower risk of avoidable food loss**

Do **not** state a measured reduction percentage.

## Time

~25–30 s.

---

# Slide 10 — Close

## Assertion

**Earlier warning locally. Evidence that travels forward.**

## Judge should believe

The team built something real, knows its limitations, and has a credible path to field validation.

## Visible content

Not a checklist.

Three concise anchors:

### BUILT IN THE HACKATHON
model + shipment-held-out evaluation · edge PWA · offline queue/sync · forensics · fleet layer · ESP32 firmware path

Small proof line:
**21 automated tests · 23/23 preflight checks**

### PRIMARY SDG ALIGNMENT
**SDG 12.3 — reduce food loss along production and supply chains**

Causal path:
**earlier warning → intervention opportunity → lower risk of avoidable thermal loss**

### NEXT VALIDATION
physical probe/phone testing · more independent shipments · partner pilot

Small identity:

**ColdTrace Edge · a ColdLoop prototype**

Optional QR only if the repository/public link is confirmed and usable.

## Dominant visual

Return visually to Slide 1 with one clean impact ribbon:

**Temperature history → local warning → operator action → evidence → better next decision**

Place a restrained **SDG 12** marker beside the food-loss causal path. Do not display the full 17-goal icon set.

Use a tiny app/prototype image if useful, but do not tile screenshots.

## Presenter says

"Our claim is not that this is production-ready. In the hackathon we built and tested the core of an edge-warning system: real shipment data, local inference, offline operation, conservative evidence handling, and later operational learning. The sustainability path is straightforward but not yet measured: earlier warning gives operators more opportunity to prevent avoidable thermal loss, directly aligning with SDG 12.3. The next step is physical validation and broader external data."

Final spoken line:

**"Earlier warning. Local inference. Reusable evidence."**

## Time

~20–25 s.

---

# 5. Slide-to-rubric coverage

| Slide | Main rubric contribution |
|---|---|
| 1 | Communication, challenge fit |
| 2 | Solution effectiveness, innovation |
| 3 | Technical execution, feasibility, scalability |
| 4 | Responsible AI, technical explanation |
| 5 | Technical execution, scope/effort, credibility |
| 6 | Prototype readiness, communication |
| 7 | Responsible AI, technical feasibility |
| 8 | Challenge fit, methodology, responsible modeling |
| 9 | Open-source alignment, scalability, adaptability, sustainability |
| 10 | Scope & effort, sustainability & SDG 12.3, communication, impact path |

No slide is created solely "for the rubric." The rubric is satisfied through the argument.

---

# 6. Presentation timing

Official finalist pitch duration remains unknown.

Build for modular delivery.

## Full version

Target: ~4.5–5.5 min plus demo depending on allowance.

Approximate:

- Slide 1 — 0:20
- Slide 2 — 0:25
- Slide 3 — 0:30
- Slide 4 — 0:35
- Slide 5 — 0:40
- Slide 6 — 0:20 setup + demo
- Slide 7 — 0:30
- Slide 8 — 0:30
- Slide 9 — 0:30
- Slide 10 — 0:25

## Emergency short version

Keep:

1 → 2 → 3 → 4 → 5 → 6/demo → 10

Slides 7–9 can be compressed verbally if pitch time is unexpectedly short.

Do not delete them from the submitted 10-slide deck.

---

# 7. Demo plan

## Primary dependable path

**Deterministic S2 held-out replay through the actual ColdTrace application.**

This is currently stronger evidence than an unverified physical ESP32/phone pairing.

## Demo sequence

1. Driver screen before replay.
2. Start held-out S2 replay.
3. Highlight local inference/device status.
4. Show HIGH warning before recorded R2 stop.
5. Show offline/pending queue.
6. Reconnect/sync.
7. Show fleet receipt if time allows.

## Fallback A

Recorded short video of exactly that sequence.

## Fallback B

Three or four static screenshots:
normal → HIGH → queued → synced.

Fallback must show the actual app, not a redesigned fake slide mockup.

---

# 8. Required assets before PPTX build

## Pull from Kali

1. current Driver normal-state screenshot
2. current Driver HIGH-state S2 replay screenshot
3. offline queue state
4. synced Fleet Operations receipt
5. forensics / UNKNOWN evidence view
6. AI Reliability view
7. Quality-Life output/state
8. current architecture screenshot/diagram source
9. S2 replay trace/data
10. model comparison JSON / fold metrics
11. project logo/icon assets if appropriate

## Create specifically for the deck

1. Slide 2 thermal timeline
2. Slide 3 simplified edge architecture
3. Slide 4 input-window → model → R2 diagram
4. Slide 5 six-fold variation chart
5. Slide 6 three-beat demo fallback strip
6. Slide 8 Risk AI vs Quality-Life diagram
7. Slide 9 local event → fleet evidence flow
8. Slide 10 closing ribbon

These visuals should be redrawn for presentation scale, not pasted from technical documents.

---

# 9. Build-phase QA gates

Before accepting a slide:

## Three-second test

At thumbnail size, can someone identify:
- the point;
- the visual focus;
- the key evidence?

If not, simplify.

## Distance test

If the slide only works from 40 cm away on a laptop, it fails.

## Text test

No necessary information below 20–22 pt.

## Screenshot test

Every screenshot:
- aggressively cropped;
- current;
- legible;
- at most 1–2 annotations;
- not surrounded by a huge fake phone bezel.

## Evidence test

Every number has:
- exact source;
- exact scope;
- correct denominator;
- no hidden condition.

Examples:
- 85.5 min must say **on covered events**
- S2 0.743 must never look like overall model F1
- R2 must never be called spoilage
- Quality-Life must never be called learned AI

## Visual-purpose test

Every object must encode:
- state;
- magnitude;
- time;
- flow;
- comparison;
- confidence;
- or evidence.

Otherwise delete it.

## PowerPoint mechanical QA

- no clipping
- no overlap
- no mirrored/reversed text
- no object outside slide bounds
- no missing font
- no low-contrast projection failure
- no unreadable chart label
- no animation that delays comprehension

Render every slide to image and inspect the entire sequence before finalizing.

---

# 10. Speaker title-only story

Read only these titles:

1. **ColdTrace Edge turns temperature history into earlier local warnings.**
2. **ColdTrace targets the gap between monitoring and earlier local warning.**
3. **Risk is scored locally; evidence syncs when connectivity returns.**
4. **The AI predicts one defined future thermal-risk state.**
5. **We tested on unseen shipments, and the results are uneven.**
6. **One held-out shipment runs through the complete product pipeline.**
7. **When evidence is weak, ColdTrace can say UNKNOWN.**
8. **Thermal-risk prediction and quality impact are separate models.**
9. **Offline events can become evidence for recurring weak points.**
10. **Earlier warning locally. Evidence that travels forward.**

This is the locked narrative chain.

---

# 11. Things explicitly removed from Version 1

The following were removed or demoted after review:

- Slide 1 no longer lets "ColdLoop" obscure the implemented prototype name.
- Slide 2 no longer makes a universal claim that early warning is "the hard part" for all industry.
- Slide 5 no longer shows seven+ headline metrics simultaneously.
- F1 / recall / PR-AUC move to speaker notes / backup unless needed.
- Slide 6 no longer duplicates the full S2 metric block.
- Slide 7 and Slide 8 remain separate because they answer different judge questions and merging them would increase density.
- Slide 9 no longer relies on multiple open-source badges.
- Slide 10 no longer ends primarily on limitations.
- dominant system color stays teal/neutral rather than drifting back into generic corporate dark-blue AI styling.
- readability is now a hard gate, not a design suggestion.

---

# 12. Stop condition before building

The PowerPoint build may start once:

- [ ] this exact 10-slide structure is accepted;
- [ ] current Kali screenshots/assets are gathered;
- [ ] open-source/public link status is known or omitted;
- [ ] final physical-hardware status is updated;
- [ ] logo/team-name assets are known;
- [ ] demo fallback assets exist.

After that, the job is implementation and visual QA, not further broad storyboard research.
