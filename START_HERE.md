# ColdLoop Overnight Start

The user will start a Codex Goal manually in the Codex desktop app. Do not create a second autonomous worker for the same repository.

## Mission

Turn the existing ColdLoop technical skeleton into a polished, demo-ready cold-chain monitoring product with:

- verified ESP32-C3 firmware for DHT22 + MQ-135 + ENS160;
- native Android app using the same telemetry contract;
- Bluetooth Low Energy connection path to `ColdLoop-01`;
- deterministic mock/demo transport for complete software QA without physical hardware;
- a desktop/web showcase that renders the real app inside a phone presentation surface;
- history, events, device/sensor health, settings, live metrics, useful trends, warnings, and reconnection behavior;
- strong visual and interaction QA across several phone sizes;
- an Android APK that builds, installs, launches, and is interactively exercised in an emulator;
- a short morning runbook for final physical wiring, flashing, APK install, BLE connection, and judge demo.

The existing app under `app/` is a technical prototype, not the final UX. Preserve useful protocol/parsing logic, but redesign/restructure as necessary.

## Deadline mindset

Favor reliable demo readiness over architectural ambition. Do not waste the night on optional Bluetooth virtualization if it threatens the core product. Physical BLE radio verification can be marked `PHYSICAL_REQUIRED`; everything else should be tested tonight.

## Exact startup command

The exact `/goal` command the user should paste is stored in `GOAL_PROMPT.md` and repeated at its top.
