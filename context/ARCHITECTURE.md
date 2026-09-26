# Target Architecture

## Guiding constraint

One product, multiple execution surfaces.

Do not build a "web demo" and a separate unrelated Android app.

Target:

React + Vite + TypeScript
        |
        +-- shared telemetry decoder/domain state
        |
        +-- transport interface
        |      +-- MockTransport
        |      +-- NativeBleTransport (Capacitor)
        |      +-- optional WebBleTransport
        |
        +-- shared responsive UI
        |      +-- Live
        |      +-- History
        |      +-- Device
        |      +-- Settings
        |
        +-- Capacitor Android package
        |
        +-- /showcase desktop route

## Why this architecture

The same domain path is exercised in:
- deterministic software QA;
- Android emulator;
- desktop showcase;
- physical Android phone.

This reduces divergence and tomorrow-morning surprises.

## Suggested app structure

A practical structure may resemble:

```
app/
  src/
    app/
    components/
    screens/
      Live/
      History/
      Device/
      Settings/
    telemetry/
      protocol.ts
      fixtures.ts
      domain.ts
    transport/
      TelemetryTransport.ts
      MockTransport.ts
      NativeBleTransport.ts
      WebBleTransport.ts
    scenarios/
    history/
    settings/
    styles/
    tests/
  android/
  capacitor.config.*
  vite.config.*
```

Exact naming is flexible. Separation of protocol/transport/domain/UI is not.

## Telemetry flow

binary BLE notification
-> decoder
-> validated TelemetrySample
-> sensor readiness/staleness
-> trend/event processing
-> domain state
-> UI

Demo flow:
MockTransport emits the same TelemetrySample/packet fixtures
-> exact same domain state
-> exact same UI.

Do not place demo-only condition logic directly inside components.

## Local persistence

Use lightweight local storage for:
- event history;
- threshold/profile settings;
- demo preferences if needed.

Do not add a backend unless necessary for the hackathon demo.

A backend is not required for the local live sensor demo.

## State model

Connection:
- idle;
- scanning/requesting;
- connecting;
- connected;
- reconnecting;
- disconnected;
- error.

Data:
- fresh;
- stale;
- unavailable.

Sensor readiness:
- warming/stabilizing;
- ready;
- fault.

Condition:
- normal;
- watch;
- warning/critical as justified.

Do not conflate transport connection with sensor readiness.

## Android BLE

Use `@capacitor-community/bluetooth-le` 8.x with Capacitor 8.x if dependency compatibility is confirmed.

Prefer `BleClient`, as the plugin documentation recommends.

On Android, initialize permissions correctly for the target SDK. If using `androidNeverForLocation`, ensure manifest and plugin initialization are consistent.

Connection lifecycle should cover:
- initialize;
- request/discover device filtered by service where practical;
- defensive disconnect-before-connect if required by Android quirks;
- connect;
- discover/get service;
- startNotifications once;
- decode notifications centrally;
- stopNotifications/disconnect;
- reconnect.

Do not subscribe separately in every React component.

## Firmware/app compatibility

Current firmware uses:
- BLE name: `ColdLoop-01`
- Service UUID: `6d6f0001-7c62-4f44-a4d2-0c5a9b2bca01`
- Telemetry characteristic: `6d6f0002-7c62-4f44-a4d2-0c5a9b2bca01`
- 20-byte packed little-endian payload.

Preserve this unless necessary.

## Showcase

A desktop route should render a realistic phone presentation around the actual app.

Do not:
- duplicate UI as static HTML;
- hard-code screenshot images;
- create a second data model.

Showcase-only controls may sit outside the phone frame to trigger scenarios for presenters.

Inside the phone frame, the app should behave exactly as it does on Android.

## Testing layers

1. pure protocol/unit tests;
2. domain/event tests;
3. component/UI tests;
4. Playwright browser journeys at defined viewports;
5. Android build;
6. Android emulator install/launch/interactions;
7. physical BLE + hardware in morning.

Each layer catches a different class of defect. Passing one does not replace the others.
