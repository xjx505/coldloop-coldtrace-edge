# ColdLoop Agent Instructions

This repository is a hackathon prototype with a hard deadline. The goal is not to produce plausible code or a pretty mockup. The goal is to leave a verified, usable product that requires as little manual repair as possible in the morning.

## Read order before changing product code

Read these files in order:

1. `START_HERE.md`
2. `GOAL_PROMPT.md`
3. `context/PROJECT_CONTEXT.md`
4. `context/PRODUCT_REQUIREMENTS.md`
5. `context/UX_SPEC.md`
6. `context/ARCHITECTURE.md`
7. `context/HARDWARE_PROTOCOL.md`
8. `context/CODEX_OPERATING_RULES.md`
9. `context/COLDCHAIN_SYSTEM_MODEL.md`
10. `plans/MASTER_PLAN.md`
11. `qa/QA_GATES.md`
12. `qa/INTERACTION_MATRIX.md`
13. `context/RUN_STATE.md`
14. `context/FAILURES.md`
15. `context/DECISIONS.md`
16. `context/RESEARCH.md`

The full exported conversation is preserved at:

`ChatGPT-Cold Chain Concept Compare-20260925-2213.md`

That file is the raw historical archive. Do not load all ~6,600 lines into working context unless necessary. Use the structured context files first. Consult the raw export only to resolve ambiguity or recover a detail that the structured files do not contain.

## Completion authority

Your own statement that the task is complete is not evidence.

The project is complete only when the non-physical acceptance gates in `qa/QA_GATES.md` are satisfied with evidence. A compile passing, a file existing, unit tests passing, or a screenshot looking acceptable by itself is not sufficient.

Do not weaken, delete, rewrite, or reinterpret acceptance criteria merely to make the project pass. If a gate is genuinely obsolete because the implementation changed, document the reason in `context/DECISIONS.md` and replace it with an equivalent or stricter verification gate.

## Operating behavior

Continue autonomously while useful work remains. A package-install failure, build failure, missing SDK, emulator issue, dependency conflict, visual defect, failing test, API mismatch, or failed implementation approach is work to solve, not a user blocker.

Use at most three materially distinct attempts on the same narrow failure before switching strategy. Do not spend hours proving one preferred implementation can work when a lower-risk route exists.

The only acceptable reasons to stop before completion are genuine dependencies that require physical hardware, user-held credentials/MFA, an unavailable external service, a hard machine/platform limitation after reasonable alternatives are exhausted, or a decision where continuing could damage something outside this project. Record any such blocker in `context/RUN_STATE.md` with evidence and a concrete morning action.

Do not ask the user routine questions overnight. Prefer reversible, low-risk decisions and document them. The user will be asleep.

## Scope boundaries

Work inside `<LOCAL_USER_PATH>\Documents\ColdLoop` except for user-local development tools required to build/test Android or the web app. Avoid system-wide changes and avoid administrator privileges when user-local installation works.

Do not modify unrelated projects or user files.

Do not rewrite working firmware merely for architectural elegance. Preserve compatibility with the existing ESP32-C3 BLE protocol unless a change is necessary and all consumers/tests are updated together.

## UX rule

Every visible element must answer a user question, show state, show magnitude, show trend, show threshold, show history, show health, or provide an action. Decorative visuals with no information value are forbidden.

No generic "AI dashboard" styling. No dark navy/purple cyberpunk palette. No emoji-based interface. No excessive explanatory text. Information density must come from hierarchy, progressive disclosure, useful charts, state indicators, and interaction.

## Quality loop

For every substantial UI milestone:

implement -> run -> interact -> capture screenshots -> inspect as a user journey -> record defects -> fix -> repeat.

Do not review isolated screenshots only. Compare state transitions and flows.

The builder does not certify its own success. Tests, filesystem evidence, Android execution, screenshots, and the final QA report do.
