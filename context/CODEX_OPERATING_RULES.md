# Codex Operating Rules

## Default behavior

Take initiative. Do not wait for the user for routine implementation decisions.

The user intends to sleep while this work runs. Optimize for leaving verified progress, not for producing frequent explanations.

## Do not stop for ordinary engineering failures

The following are NOT valid blockers:
- npm/pnpm installation failure;
- Gradle build failure;
- missing JDK;
- missing Android SDK;
- missing AVD;
- dependency incompatibility;
- lint/type errors;
- emulator boot issue;
- Playwright failure;
- screenshot defect;
- CSS/layout defect;
- BLE plugin API mismatch;
- first implementation route failing;
- test failure;
- package version conflict;
- a warning that needs investigation.

Investigate them.

## Genuine blockers

Stopping early is allowed only if the remaining dependency genuinely requires:
- physical ESP32/sensors/phone not available to the overnight worker;
- credentials/MFA only the user can provide;
- external service outage;
- destructive/system-wide action that would be irresponsible without consent;
- hard platform limitation after alternatives have been tested and documented;
- budget/resource limit that cannot be avoided.

Document proof in RUN_STATE.md.

## Rabbit-hole policy

Do not confuse persistence with stubbornness.

For a narrow blocker:
- attempt the obvious fix;
- attempt one materially different fix;
- attempt a third approach only if evidence supports it;
- then switch route.

For optional experimental items such as full virtual Bluetooth radio simulation, time-box to roughly 30-45 minutes unless it is clearly succeeding.

The core product outranks optional infrastructure.

## Do not fake completion

Forbidden:
- changing expected values only because implementation failed;
- disabling tests to get green output;
- deleting acceptance gates;
- screenshotting a mock screen and calling Android verified;
- writing "PASS" without executing the test;
- claiming physical BLE success without physical radio evidence;
- using synthetic data to claim real spoilage accuracy.

## State durability

After material milestones, update:
- `context/RUN_STATE.md`
- `context/FAILURES.md` if an approach failed;
- `context/DECISIONS.md` if an architectural/product decision changed;
- `qa/FINAL_STATUS.json` when a QA gate changes.

These files exist so context compaction does not erase state.

## Visual work

Never conclude UI work from source code alone.

Run the interface.

Interact with it.

Capture evidence.

Review sequences, not isolated frames.

Fix issues.

Repeat.

## Overnight communication

Do not ask questions unless the work truly cannot proceed without an answer.

Choose the safest reversible option and document it.

If a supervisor sends a narrow correction, address that issue without throwing away a productive current plan unless the evidence requires rerouting.

## Resource hygiene

Avoid leaving:
- many emulator instances;
- orphan dev servers;
- runaway Gradle daemons;
- abandoned download processes;
- huge untracked build artifacts.

Do not delete user data outside this project/toolchain.

## Git

Create a baseline commit before destructive refactors if possible.

Use small meaningful commits during overnight work when they improve rollback and auditing.

Do not commit secrets, SDKs, caches, node_modules, .pio, emulator images, or generated binary clutter unless the artifact is deliberately needed in deliverables.
