# Stage, Science-Fair and Demo Strategy Research

This file defines presentation behavior, not final slide order.

## Two different judging environments

### Science-fair round

Likely interaction pattern:
- judges are physically near the team;
- questions can interrupt linear delivery;
- live product/hardware can be shown;
- detailed evidence may be requested out of sequence.

The deck therefore needs:
- fast visual orientation;
- concise slides;
- ability to jump directly to architecture/evidence;
- a clear demo entry point;
- a backup for any live failure.

### Finalist stage round

The official agenda confirms a final pitching/judging block but gives no duration.

Stage implications:
- distance amplifies small-text failures;
- dense dashboards become illegible;
- transitions must be clean;
- the story cannot rely on judges exploring the product themselves;
- a live demo must have a strict beginning and end.

## Demo is evidence, not a feature tour

Bad demo:
- "Here is the home screen."
- "Here is settings."
- "Here is history."
- "Here is another menu."

Better demo logic:
1. establish normal state;
2. create/show meaningful cold-chain risk;
3. show the system detecting/predicting it;
4. show the operationally useful interpretation/action;
5. show what is recorded/learned;
6. return to the main claim.

The demo should prove the presentation's central thesis.

## Demo slide / demo handoff

A dedicated demo beat is justified.

That screen should:
- contain almost no explanatory text;
- tell the audience what to watch;
- optionally show a simple 3-step expectation;
- give the presenter a clean transition to live product.

Example structure only:

`NORMAL → RISK EMERGES → ACTION CHANGES`

Do not freeze this copy until the final product truth is established.

## Always have a fallback

Live demos fail for stupid reasons because computers retain a sense of theater.

Prepare:
- live demo path;
- deterministic replay path;
- short recorded video/GIF path;
- 2–4 screenshot fallback sequence.

The fallback must show the same product state progression as the live demo, not a separate fake UI.

## Demo time budget

Because final pitch duration is unknown, the demo should have:
- a **minimum viable proof** version that can run in roughly 30–60 seconds;
- an expanded version for science-fair questioning.

This is a design recommendation, not an official time rule.

## Presenter/deck separation

The presenter owns:
- motivation;
- causal explanation;
- transition;
- caveats;
- persuasive framing.

The slide owns:
- visible proof;
- diagram;
- comparison;
- number;
- state;
- sequence.

If the presenter is reading the slide, the deck has failed.

## Question-resilient evidence

The 7–10 main slides should stay clean.

Detailed supporting evidence can live outside the main linear deck if allowed/available:
- hidden backup slides;
- app itself;
- repo;
- model card/data card;
- test evidence;
- architecture detail.

Do not contaminate main slides with every answer to every possible judge question.

## Room behavior

Future deck QA should include:
- full-screen slideshow mode;
- 100% zoom on a normal laptop;
- view from several meters away if possible;
- projector/TV if accessible;
- Windows PowerPoint rendering, not only preview;
- PDF export check as backup;
- no reliance on hover/click targets that the presenter can miss.

## Presenter view

Use speaker notes for:
- exact transitions;
- one key number/source;
- demo cue;
- anticipated question;
- optional cut line if time is short.

The audience should never see those notes.

## Transition discipline

Each slide should logically create the need for the next.

A useful test:
- read only the slide titles in sequence;
- they should form a coherent argument.

If the titles read like:
"Problem / Solution / Features / Architecture / Results / Impact"
then the deck has categories, not a story.

## Distinctiveness

Being different does not require weird typography or visual tricks.

The strongest route is **specificity**:
- real thermal behavior;
- real edge inference;
- real offline constraint;
- real tradeoff;
- real operator decision;
- real open-source architecture.

A deck that could be reused for a fintech chatbot after changing five nouns is not specific enough.
