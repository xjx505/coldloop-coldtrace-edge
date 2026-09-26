# ColdLoop morning runbook

The v1.0.1-demo software release is published. The exact 6,691,136-byte Android debug APK (SHA-256 `71113663c66f6fff1f45a7bcaa5b003c4690d4aa26149f6da9591c4cd8a945e0`) passed emulator install and journey QA: 32 screenshots, 51 steps, zero WebView exceptions and zero external requests. The web journey passed 101 screenshots across 360x800, 390x844, 412x915 and 1440x1000; accessibility passed 18 states with zero axe violations. Only physical sensor and phone-to-node BLE checks remain unverified.

## 0. Verify the latest Android build

The current release APK is `deliverables/ColdLoop-Android-debug.apk` (6,691,136 bytes; SHA-256 `71113663c66f6fff1f45a7bcaa5b003c4690d4aa26149f6da9591c4cd8a945e0`). It has already been installed and exercised on `emulator-5554`; results are in `qa/reports/android-journey.json`. To repeat the acceptance journey after a code change:

```powershell
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
& $adb devices -l
& $adb install -r '.\app\android\app\build\outputs\apk\debug\app-debug.apk'
Push-Location app
npm run qa:android
Pop-Location
```

The Android journey runner targets `emulator-5554`, disables that emulator's Wi-Fi/data only for the offline replay check, and restores the prior values in its `finally` path. Inspect the regenerated frames in `qa/screenshots/android` and require `status: PASS` in `qa/reports/android-journey.json` before treating current APK interaction, offline replay, Back or lifecycle behavior as verified.

## 1. Check the board and wiring

Read `wiring/WIRING.md` before connecting sensors. Verify the exact ESP32-C3 board pin labels; the firmware defaults are DHT22 DATA GPIO4, MQ-135 divided AOUT GPIO0/ADC, ENS160 SDA GPIO6 and SCL GPIO7, with common ground.

MQ-135 modules are commonly powered from 5 V. Never connect AOUT directly to an ESP32 ADC until its voltage is known safe. The documented divider is AOUT → 10 kΩ → GPIO0 node → 20 kΩ → GND. Do not power the MQ heater from a GPIO.

Bring sensors up one at a time: ESP32 and serial, DHT22, ENS160, then MQ-135 through the verified divider. Confirm common ground and check sensor supply requirements against the exact breakout.

## 2. Build, flash and read serial

From the repository root, find the board's actual COM port:

```powershell
.\.venv\Scripts\pio.exe device list
```

Replace `COMx` below with that port. Build and flash the hardware target, then open the 115200-baud monitor:

```powershell
.\.venv\Scripts\pio.exe run -d firmware -e hardware
.\.venv\Scripts\pio.exe run -d firmware -e hardware --target upload --upload-port COMx
.\.venv\Scripts\pio.exe device monitor -d firmware -e hardware --port COMx --baud 115200
```

Confirm the boot message, BLE advertising as `ColdLoop-01`, finite DHT values, ENS160 readiness or explicit fault, changing MQ raw ADC and JSON telemetry. The MQ baseline flag means a relative baseline formed; it does not mean the heater has completed physical warm-up or gas calibration.

## 3. Install and open the Android app

Enable USB debugging on the Android phone, connect and authorize it, then check that `adb devices -l` lists the phone. From the repository root:

```powershell
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
& $adb devices -l
& $adb install -r '.\app\android\app\build\outputs\apk\debug\app-debug.apk'
& $adb shell monkey -p com.coldloop.monitor 1
```

If the APK needs rebuilding, use this workstation's user-local JDK 21 and Android SDK:

```powershell
$env:JAVA_HOME = Join-Path $env:LOCALAPPDATA 'ColdLoopToolchain\jdk21-extract\jdk-21.0.12.1+1'
$env:ANDROID_SDK_ROOT = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$env:ANDROID_HOME = $env:ANDROID_SDK_ROOT
$env:Path = "$($env:JAVA_HOME)\bin;$($env:ANDROID_SDK_ROOT)\platform-tools;$env:Path"
Push-Location app
npm ci
npm run android:debug
Pop-Location
& $adb install -r '.\app\android\app\build\outputs\apk\debug\app-debug.apk'
```

The app scans for `ColdLoop-01` using service `6d6f0001-7c62-4f44-a4d2-0c5a9b2bca01` and subscribes to telemetry characteristic `6d6f0002-7c62-4f44-a4d2-0c5a9b2bca01`. Approve the Android Nearby devices prompt. Confirm the sequence and values update before describing the physical BLE path as working.

## 4. Run the physical demo

Show a normal connected reading first. Then gently warm the air or a nearby object at a safe distance from the DHT22; do not direct aggressive heat at the sensor or board. Allow several DHT22 readings for the configured sustained-warning rule, open the warning and event history, remove the heat and wait for the recorded recovery.

State only what was observed: temperature/humidity, sensor readiness, broad relative MQ-135 response, ENS160 AQI/TVOC and event timing. ENS160 eCO₂ is an estimate, not direct CO₂. MQ-135 does not identify a gas. ColdLoop is a condition-monitoring prototype, not food-safety certification or shelf-life prediction.

## 5. Fallbacks

- If DHT22 fails, show its explicit fault and do not trust its values. Continue only with sensors that report ready.
- If ENS160 fails or is warming, show that readiness state; do not describe its values as trusted.
- If MQ-135 is unstable, present only raw/relative response or leave it out of the explanation.
- If BLE fails, show serial JSON as hardware evidence, then switch to the app's deterministic demo. Say plainly that physical radio integration remains unverified.
- If the board or sensors fail, open Settings → Offline simulation → Excursion. Let the trend rise until the sustained warning appears, open the event and History, then choose Recovery and confirm the same event is recovered. Use “Stop simulation” afterward; the Live screen returns to no-data while History remains saved. The Live screen labels this “Simulated data.”
- ColdTrace Edge is a separate three-probe EDGE-3 profile. For a software-only model presentation, use “Run S3 replay” from the disconnected Live screen or presenter “Run shipment replay”; it replays recorded accelerated 10-minute windows through local inference. Do not describe it as a live 60-minute measurement, and do not map the DHT22/ENS160/MQ-135 20-byte ColdLoop node into EDGE-3 inputs. S2 is held-out evaluation only.
- For a browser presentation fallback, start `npm run dev` from `app` and open `http://localhost:5173/showcase`. Use its Normal → Excursion → Recovery controls; the phone frame is the shared product UI and needs no sensor or cloud service.

## 6. Current physical gates

Still to verify on the actual board and phone: board-specific wiring and ADC voltage, sensor readings/readiness, advertising and Android BLE permission, notification sequence updates, and the safe excursion→warning→history→recovery path. No emulator, mock transport or screenshot substitutes for these checks.
## Published judge links

Web showcase: https://coldloop-coldtrace-edge.netlify.app/showcase
Public source and evidence: https://github.com/xjx505/coldloop-coldtrace-edge
Latest debug APK, firmware and model bundle: https://github.com/xjx505/coldloop-coldtrace-edge/releases/tag/v1.0.1-demo

The exact APK in the latest release passed emulator installation and the 32-screenshot Android journey. Physical sensor and phone-to-ESP32 BLE checks remain required; follow sections 1–4 on the actual board and phone.
