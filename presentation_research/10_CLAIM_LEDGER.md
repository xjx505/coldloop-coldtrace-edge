# Presentation Claim Ledger

Status vocabulary:

- **VERIFIED** — directly supported by current source/build/test/artifact evidence.
- **PHYSICAL_REQUIRED** — software path exists, but physical device validation is still missing.
- **RESEARCH_SUPPORTED** — defensible concept/method from sources; not proof it was implemented.
- **UNVERIFIED** — appears in handoff/notes but implementation evidence has not been found.
- **FUTURE** — roadmap only.
- **DO_NOT_CLAIM** — scientifically or evidentially unsupported.

| Claim | Status | Evidence / reason |
|---|---|---|
| We built an Android ColdLoop app | VERIFIED | APK exists; Gradle build PASS; emulator journey PASS |
| App also has a desktop/web showcase | VERIFIED | `/showcase`; 1440x1000 QA journey PASS |
| Same React core supports Android/web | VERIFIED | current source + Capacitor structure |
| Native BLE code exists | VERIFIED | `BleTransport.ts` + plugin + tests |
| Native BLE works with the physical ESP32 | PHYSICAL_REQUIRED | no physical phone/board attached during QA |
| ESP32-C3 firmware compiles | VERIFIED | PlatformIO hardware build PASS |
| Wokwi firmware compiles | VERIFIED | PlatformIO Wokwi build PASS |
| Current node uses DHT22 + MQ-135 + ENS160 | VERIFIED | current firmware source |
| Current BLE packet is 20 bytes | VERIFIED | packed struct + static_assert + decoder tests |
| Current app records threshold-based temperature/VOC events | VERIFIED | `engine.ts` + journey evidence |
| Current app uses trained AI to predict future thermal risk | **NO / DO_NOT ATTRIBUTE TO CURRENT APP** | no ML inference in current verified app source |
| Current app predicts shelf life | DO_NOT_CLAIM | explicitly excluded by product/source |
| Current app certifies food safety | DO_NOT_CLAIM | explicitly excluded |
| MQ-135 identifies exact gases | DO_NOT_CLAIM | broad/cross-sensitive relative signal |
| ENS160 eCO2 is direct CO2 | DO_NOT_CLAIM | equivalent/estimated output |
| ColdTrace is a defensible project direction | RESEARCH_SUPPORTED | adversarial reviews + dataset/method research |
| Real strawberry cold-chain data exists | RESEARCH_SUPPORTED | published/HF dataset source |
| ColdTrace uses 6 independent commercial strawberry shipments | RESEARCH_SUPPORTED, verify exact implementation input | research source supports six shipments |
| ColdTrace target is future severe thermal risk in 120 min | RESEARCH_SUPPORTED / implementation UNVERIFIED | dataset supports target concept; local model artifact missing |
| ColdTrace EDGE-3 logistic model exists locally | UNVERIFIED | referenced model artifact not found |
| EDGE-3 F1 = 0.236 | UNVERIFIED | handoff only until evaluation artifact located |
| EDGE-3 recall = 0.441 | UNVERIFIED | handoff only |
| EDGE-3 PR-AUC = 0.320 | UNVERIFIED | handoff only |
| 11/41 events warned | UNVERIFIED | handoff only |
| 9 false alert episodes | UNVERIFIED | handoff only |
| mean warning lead ≈85.5 min | UNVERIFIED | handoff only |
| model JSON is 4,224 bytes | UNVERIFIED | claimed file not located |
| 18 T4 XGBoost fits in 16.755 s | UNVERIFIED | handoff only |
| Python/JS parity over 24 vectors | UNVERIFIED | parity artifacts/tests not located |
| Offline test produced HIGH 0.9707 | UNVERIFIED | claimed implementation not located |
| Driver path has zero cloud inference calls | UNVERIFIED | claimed PWA implementation not located |
| ColdTrace FastAPI/SQLite sync works | UNVERIFIED | backend files not located |
| Weak-point analytics works | UNVERIFIED | claimed backend files not located |
| Food-rescue demo works | UNVERIFIED | claimed backend/UI files not located |
| ColdTrace ESP32 uses 3 DS18B20 probes | UNVERIFIED as built prototype | conflicts with current verified DHT22/MQ/ENS firmware |
| ColdTrace BLE packet is 15 bytes | UNVERIFIED as built prototype | conflicts with current verified 20-byte protocol |
| ColdLoop could integrate fleet history/weak-point learning later | FUTURE | platform vision |
| We reduced food waste by X% | DO_NOT_CLAIM | no field intervention study |
| We validated in real refrigerated trucks | DO_NOT_CLAIM | no truck pilot |
| We know the exact physical cause of every excursion | DO_NOT_CLAIM | insufficient labels/telemetry; research explicitly requires abstention |
| We can identify probable/evidence-supported operational hypotheses | RESEARCH_SUPPORTED | defensible only with appropriate telemetry and language |
| We are open-source / DPG-aligned | VERIFY BEFORE MAIN-DECK CLAIM | source/open-design intent exists; final license/repo/public accessibility should be checked before submission |

## Rule

No quantitative claim enters a slide until:
1. its status is VERIFIED or source-supported for exactly the wording used;
2. the evidence artifact is recorded;
3. the presenter can answer "where did that number come from?" in one sentence.
