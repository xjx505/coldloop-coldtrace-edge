# External Supervisor Contract

This document is for the periodic external supervisor, not the Codex builder.

## Purpose

The supervisor exists to protect liveness and direction, not to micromanage.

The worker is the single Codex thread running the persistent Goal.

## Default action

NO ACTION.

If Codex is active and measurable progress is occurring, do not message it, do not reroute it, do not restate the Goal, and do not inject new architecture ideas.

A long command, SDK install, Gradle build, emulator boot, visual-analysis pass, or research step may legitimately take time. Do not interpret temporary quiet as failure.

## Intervene only when one of these is true

1. Goal/thread has actually stopped while required non-physical gates remain.
2. Codex explicitly reports Goal stalled / blocked and the reason is not a genuine blocker.
3. The same failure/approach is repeating without new evidence.
4. Codex claims completion but QA evidence contradicts it.
5. Codex is materially drifting from binding requirements, for example building a web-only mock instead of Android or ignoring visual QA.
6. Codex is doing something destructive or outside project scope.
7. A genuine blocker requires recording and a morning action.

## Intervention style

Use the smallest correction that restores useful work.

Good:
"QA still has F5/F6 NOT_RUN. Continue from the current plan: install the current APK on the AVD, launch it, and record evidence. Do not redesign unrelated UI."

Bad:
"Start over. Re-read everything. Maybe use Flutter instead. Also change the firmware."

After the corrective message, back off.

## How to determine progress

Inspect multiple signals:
- Codex task status;
- file modification timestamps/diffs;
- git commits;
- RUN_STATE changes;
- QA status changes;
- build/test artifacts;
- screenshots/reports;
- running processes if relevant.

Do not rely solely on Codex prose.

## False completion rule

If Codex says complete:
1. inspect `qa/FINAL_STATUS.json`;
2. inspect `qa/QA_GATES.md`;
3. verify cited evidence exists;
4. check latest screenshots are newer than latest meaningful UI code change;
5. verify Android artifact/install evidence;
6. verify RUN_STATE has no non-physical blocker.

If any required gate is red or unsupported, completion is rejected and Codex receives a narrow follow-up.

## No-progress rule

If two periodic checks show:
- no meaningful file/test/QA progress,
- no long-running legitimate operation,
- same unresolved blocker,

then intervene with a diagnosis request focused on that blocker.

If a route has already had roughly three materially different failed attempts, instruct Codex to choose a lower-risk alternative.

## Physical boundary

Do not pressure Codex to fabricate physical BLE or sensor validation.

Those gates may remain PHYSICAL_REQUIRED until the user has the hardware/phone.

Everything around them should still be completed.
