# Verified Research Notes

This file records external facts that influence implementation. Re-check live documentation if package/tool versions changed.

## Codex Goals

OpenAI: Using Goals in Codex
https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex

Verified September 25, 2026:
- Goals are persistent objectives scoped to a Codex thread.
- A Goal can continue across turns based on evidence.
- Goal completion should define outcome, verification and constraints.
- Normal engineering failure should be worked through until success, an actual blocker, pause/clear, budget limit, or interruption.
- Goal command form: `/goal <outcome>`.

Implication:
use one strong Goal with evidence-based finish line. The repository stores durable detailed state.

## Capacitor

Official Capacitor docs:
https://capacitorjs.com/docs
https://capacitorjs.com/

Verified current docs identify Capacitor v8 and describe using an existing modern web app as a native Android/iOS container.

Implication:
React/Vite UI can be wrapped into a native Android app instead of building a second UI.

## BLE plugin

Capacitor Community Bluetooth LE:
https://github.com/capacitor-community/bluetooth-le

Verified:
- plugin 8.x aligns with Capacitor 8.x;
- supports Android, iOS, web;
- central role only, which is correct because Android phone connects to ESP32 peripheral;
- supports request/scan, connect, disconnect, read/write, start/stop notifications;
- docs recommend using `BleClient`;
- Android-specific permission/location behavior must be handled according to target SDK;
- connection troubleshooting notes suggest defensive disconnect-before-connect can help on some Android devices.

Implication:
use plugin infrastructure instead of implementing raw Android GATT from scratch tonight.

## Android Emulator

Android Emulator advanced usage:
https://developer.android.com/studio/run/advanced-emulator-usage

Android Emulator networking:
https://developer.android.com/studio/run/emulator-networking
https://developer.android.com/studio/run/emulator-networking-advanced

Current Android documentation is slightly nuanced:
- the advanced-usage limitations page still states standard virtual hardware does not include Bluetooth;
- newer emulator networking documentation lists Bluetooth Classic/BLE networking capabilities for supported API/emulator configurations and newer netsim features;
- BLE/network simulation capabilities are evolving.

Implication:
do not assume emulator BLE will perfectly reproduce phone-to-ESP32 behavior. Use emulator for app/lifecycle/interaction QA and time-box any virtual BLE experiment. Physical radio verification remains required unless actually demonstrated.

## Related cold-chain work

2026 paper:
"Human-centric edge-oriented decision support system for cold chain transportation: Early warning, trigger-time explanation, and prescriptive action ranking"
Advanced Engineering Informatics.
https://www.sciencedirect.com/science/article/pii/S147403462600741X
Repository:
https://github.com/NifferLi/cold-chain-edge-dss

Relevance:
validates a technical pipeline from sensor data -> predicted risk -> explanation -> action comparison/ranking. Do not claim this generic pipeline is novel.

## Commercial precedents

Thermo King Remote Operating Center:
https://www.thermoking.com/na/en/connectedsuite-telematics/remote-operating-center.html

Carrier Lynx Fleet:
https://www.carrier.com/us/en/cold-chain/truck-trailer/lynx-fleet/

Tive cold-chain monitoring:
https://www.tive.com/solutions/cold-chain-monitoring

Controlant analytics:
https://www.controlant.com/analytics

Relevance:
live monitoring, diagnostics, remote actions, excursion analytics and fleet-level weak-point analysis already exist in commercial forms. Differentiation should be open/vendor-neutral integration and thoughtful operator decision support, not claiming invention of monitoring itself.

## Open supply-chain standard

GS1 EPCIS 2.0:
https://www.gs1.org/standards/epcis

Relevance:
possible future vendor-neutral event model for what/when/where/why/how supply-chain events and sensor data.

## Data sources

Processed strawberry cold-chain dataset:
https://huggingface.co/datasets/NifferLi/Cold-Chain-Transportation-Strawberry

Important limitation:
its cause/event labels are thermal-event categories, not validated physical root causes such as door open or compressor failure.

Mango journey dataset:
https://www.sciencedirect.com/science/article/pii/S235234092500530X

Apple commercial cold-room dataset:
https://data.mendeley.com/datasets/h4sghvyjyt/2

These are useful research/demo references, not a reason to claim the overnight sensor prototype has validated universal spoilage prediction.

## Qatar evidence guardrail

Do not claim refrigerated transport is Qatar's proven largest food-loss stage.

A Qatar national food-loss/waste study was reported as running through 2026:
https://thepeninsulaqatar.com/article/08/04/2026/qu-ministry-of-municipality-collaborate-on-national-study-on-food-loss-and-waste

Global food-loss and sustainable cold-chain context:
https://www.fao.org/sustainable-development-goals-data-portal/data/indicators/1231-global-food-losses
https://www.unep.org/topics/food-systems/food-loss-and-waste/sustainable-cold-chains

Use global evidence as global context, not as proof of Qatar-specific transport loss.
