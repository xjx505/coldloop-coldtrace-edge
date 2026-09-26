# Exact Codex Goal

Paste this as one command in the Codex desktop app while the working directory/project is `<LOCAL_USER_PATH>\Documents\ColdLoop`:

```
/goal Finish ColdLoop as a genuinely demo-ready cold-chain monitoring product, not a compile-only prototype. Work directly in <LOCAL_USER_PATH>\Documents\ColdLoop regardless of the current thread working directory, and keep all project edits there except explicitly required user-local toolchain installs. Before changing product code, read <LOCAL_USER_PATH>\Documents\ColdLoop\AGENTS.md and every file it lists in its required read order. Treat GOAL_PROMPT.md, context/PRODUCT_REQUIREMENTS.md, context/UX_SPEC.md, plans/MASTER_PLAN.md, and qa/QA_GATES.md as the binding contract. Continue autonomously until every non-physical QA gate is satisfied with evidence. Do not declare completion because code compiles, files exist, unit tests pass, or a single screenshot looks good. Build and verify the native Android app, the web/showcase experience, the ESP32-C3 firmware compatibility, deterministic demo/mock transport, navigation, history, device health, settings, warnings, reconnection/failure states, responsive phone layouts, visual journey screenshots, and the morning runbook. Use React/Vite plus Capacitor Android and the maintained @capacitor-community/bluetooth-le plugin unless repository evidence proves a safer route. Reuse the existing BLE service/characteristic and 20-byte telemetry contract unless a change is necessary and all firmware/app/tests are updated together. Preserve a serial JSON debug path. The app must use thoughtful progressive disclosure, minimal visible text, useful information-dense visuals, and no decorative-only visuals, no dark navy/purple AI-dashboard aesthetic, no emoji UI, and no fake scientific claims. Exercise the actual Android APK in an emulator: build, install, launch, navigate, background/foreground, restart, Back behavior, major states, and screenshots. Exercise the web/showcase at 360x800, 390x844, 412x915 and at least one desktop width. Review screenshots as connected user journeys, record defects, fix them, regenerate evidence, and repeat until the visual/interaction gates pass. Do not treat ordinary build/install/dependency/test/SDK/emulator/UI failures as blockers; investigate and switch approaches after repeated failure rather than looping forever. Physical-only BLE/sensor validation may remain PHYSICAL_REQUIRED, but native BLE code, permissions, UUID compatibility, packet decoding, disconnect/reconnect handling and mock transport must be verified tonight. Keep context/RUN_STATE.md, context/FAILURES.md, context/DECISIONS.md and qa/FINAL_STATUS.json current so progress survives context compaction. Do not weaken acceptance criteria to make the task appear complete. Stop only when the evidence in qa/QA_GATES.md permits completion or a genuine user/physical blocker is documented with proof and a precise morning action.
```

## What this Goal means in practice

The persistent objective is not "make an app." It is "leave the repository in a state where the user can wake up, follow a short runbook, wire/flash the ESP32-C3, install the Android app, connect by BLE, and demonstrate live sensor changes with minimal code repair."

The application must be a real native Android package created from the same core UI/data model used by the web showcase. The showcase may simulate telemetry, but it must not be a fake second UI.

The final app should be calm and simple at first glance while retaining deeper information behind interaction. The default live screen should make connection state, current condition, temperature, humidity, air quality, trend, and active event status immediately understandable. More technical measurements such as TVOC, eCO2, MQ-135 raw/relative response, sensor warm-up state, thresholds, calibration/baseline, and detailed history belong behind drill-down surfaces.

If a requested feature would consume disproportionate time and create risk, preserve the underlying requirement with a simpler implementation and document the tradeoff. Do not silently omit it.

The project must never claim that MQ-135 identifies exact gases, that ENS160 eCO2 is direct CO2 measurement, that the system certifies food safety, or that an unvalidated heuristic is a proven spoilage probability/shelf-life model.

## Completion rule

Codex may mark the Goal complete only when:

1. every gate marked REQUIRED in `qa/QA_GATES.md` is PASS;
2. every hardware-only gate is explicitly `PHYSICAL_REQUIRED` with a concrete morning procedure;
3. `qa/FINAL_STATUS.json` matches the evidence;
4. final screenshots and Android evidence were generated after the last meaningful UI/code change;
5. `MORNING_RUNBOOK.md` is short enough to follow under deadline pressure;
6. `context/RUN_STATE.md` contains no unresolved non-physical blocker.

If any of those conditions are false, continue working.
