# Presentation Science and Technical-Communication Findings

This is not a collection of arbitrary slide rules. It records principles supported by multimedia-learning research, technical-communication research, accessibility guidance and strong practitioner guidance.

## 1. One message per slide

Multiple independent sources converge here:
- MIT Communication Lab: each slide should carry one message;
- Duarte: every element should support the slide's central idea;
- Y Combinator: short pitches depend on a few memorable points;
- assertion-evidence research: replace topic headers + bullet dumps with a sentence assertion + supporting visual evidence.

### Rule for ColdLoop

Every slide should answer one sentence:

> **What should the judge believe after seeing this slide?**

If the answer contains "and" three times, the slide is probably doing too much.

## 2. Titles should make claims, not name topics

Weak:
- "Our Architecture"
- "Model"
- "Results"
- "The Problem"

Stronger structure:
- "Cold-chain alarms tell you what happened; our edge model warns before the severe event."
- "Three probes preserve spatial observability without a nine-sensor rig."
- "The phone keeps warning even when the network disappears."

These are examples of form, not approved final copy.

### Why

Research on assertion-evidence presentations has found improved comprehension/recall and lower cognitive burden compared with conventional topic-heading/bullet slides in engineering/scientific settings.

## 3. Do not make judges read and listen at the same time

Speech + paragraphs + unrelated visuals creates competing channels.

Use the slide for:
- evidence;
- diagram;
- number;
- comparison;
- screenshot;
- sequence;
- short labels.

Use the presenter for:
- explanation;
- context;
- transitions;
- caveats that do not need to remain visually persistent.

Speaker notes can contain the detailed script. The visible slide should not.

## 4. Coherence beats decoration

Mayer's coherence principle: irrelevant material consumes cognitive resources.

For this deck:
- no decorative particles;
- no fake circuit lines;
- no giant AI brain;
- no stock refrigerator truck just because "cold chain";
- no graphs that are not discussed;
- no icons repeated purely to fill white space.

A visual earns its place by proving or explaining something.

## 5. Signaling matters

Judges should not have to hunt.

Use:
- direct annotation;
- one highlighted trace;
- one emphasized number;
- clear before/after;
- visual hierarchy;
- purposeful contrast.

Do not create a technically correct chart and then force the audience to discover the conclusion themselves.

## 6. Stage legibility is stricter than laptop legibility

Published accessibility/practical guidance varies, but all treats 18 pt as a baseline rather than a good stage target.

For this event, a safer design target is:

- major assertion/title: **36–48+ pt**
- key number: **44–72+ pt** when it is the hero
- primary body/labels: **24–30+ pt**
- chart labels: ideally **20–24+ pt**
- small source/citation line: **12–16 pt**, only because it is not required to follow the argument

Do not shrink text to make a bad layout fit. Remove content.

These are design targets, not official Reboot rules.

## 7. Contrast is measurable

Use WCAG-style contrast as a floor:
- normal text: at least **4.5:1**
- large text: at least **3:1**

For projection, prefer stronger contrast than the minimum.

Avoid:
- mid-gray text on light gray;
- pale cyan on white;
- thin green text;
- transparency that reduces legibility;
- relying on red/green alone to convey state.

## 8. Widescreen 16:9

PowerPoint's current widescreen default is 16:9 and is appropriate for modern displays/projectors.

Future deck target:
- 16:9 widescreen;
- keep critical elements away from the extreme edges;
- keep important content out of the lowest strip of the slide where room sightlines may be poor.

## 9. Visual evidence should be native to the project

Highest-value presentation visuals:
- actual application screen;
- actual thermal trace;
- actual model result;
- actual prototype photograph;
- simplified architecture;
- actual before/after behavior;
- actual evaluation comparison;
- actual event timeline.

Lower-value visuals:
- generic stock photo;
- generic icon grid;
- text inside decorative cards;
- unsourced impact number;
- generic "AI" illustration.

## 10. Charts must be presentation charts, not exported analysis plots

A notebook plot is usually optimized for inspection, not a room.

For every chart:
- assertion title states the conclusion;
- remove unused axes/grid lines/legend clutter;
- direct-label the series when possible;
- highlight only the evidence being discussed;
- show units;
- make labels stage-readable;
- do not use 3D chart effects;
- do not show more series than the presenter can explain.

## 11. Animation can pace cognition

Use animation only when it controls sequence:
- reveal pipeline stages one at a time;
- expose a thermal excursion after showing normal conditions;
- reveal the decision/result after the model input;
- progressively annotate a complex diagram.

Do not animate:
- titles for drama;
- icons floating in;
- arbitrary card entrances;
- background elements.

The audience should never be waiting for decoration to finish moving.

## 12. Memorability is a design constraint

YC's Demo Day guidance emphasizes that audiences retain only a few core points.

For ColdLoop, the deck should deliberately decide what **3–4 things** judges should remember after ten other teams blur together.

That memory set is not finalized yet. It should be chosen only after project truth is reconciled.

## 13. No arbitrary "7 words per slide" religion

There is no magic universal word count.

The stronger rule is:
- one message;
- minimum text required to make the evidence self-explanatory;
- large enough to read;
- no duplicate narration;
- visual if a visual communicates faster.

A slide with a 14-word assertion and one strong figure can be better than a slide with seven vague words.

## 14. The glance test

A judge should be able to look up mid-sentence and understand:
- what the slide is about;
- where to look;
- what changed or matters.

If understanding requires 20 seconds of silent reading, the slide is functioning as a document, not a presentation aid.
