# ColdLoop + ColdTrace Edge — demo release

Installable Android debug APK, ESP32-C3 firmware binaries, portable offline model bundle, and sanitized open-source project snapshot.

## Release assets

- `ColdLoop-Android-debug.apk` — sideloadable Android debug build, package `com.coldloop.monitor`, 4,767,382 bytes. SHA-256: `58B7A34214610B170F2D3E482D1FC5B6042CE53BF28AAA103ECD67115E2FE88E`.
- `ColdLoop-ESP32-C3-hardware.bin` — PlatformIO hardware build. SHA-256: `1DD84BF5D001608CA8E7F97C4D1893D8E6D6EB51D466B7FB78F925C1B47D0378`.
- `ColdLoop-ESP32-C3-wokwi.bin` — Wokwi simulator build. SHA-256: `387FC9F8E34ECB45E7A6E0FA21994CCB738A7F3D1ADAED1323A11BEA3D47D83E`.
- `ColdTrace-Edge-portable-model.zip` — model, JavaScript inference, schema, evaluation files and model card. SHA-256: `E63D373D7EED87E4E3C9AA1AD50056DCB77B0D8BA72F5BD3BE2F9DB5A5A68DB4`.

The current web demo and showcase are deployed on Netlify; the project site URL will be added to this release after deployment finishes.

## Verification boundary

The current web production build completed. The web journey report contains 101 screenshots at the required phone sizes and desktop showcase size. Axe reported zero violations over 18 states, with manual contrast review still incomplete for three dialog nodes.

The exact APK attached here was freshly built and fingerprinted but was not installed and journey-tested after that build. `qa/reports/PUBLICATION_STATUS_20260926.md` and `qa/FINAL_STATUS.json` mark current-APK emulator gates incomplete. Both firmware targets were freshly rebuilt. Physical sensor and phone-to-ESP32 BLE checks remain required.

ColdTrace is an experimental thermal-risk demonstration evaluated on six shipments. It is not validated for food safety, spoilage, shelf life, expiry decisions or refrigeration control. See the model card and README.
