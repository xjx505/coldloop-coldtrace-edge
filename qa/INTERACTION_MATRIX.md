# Interaction and State Matrix

The purpose of this matrix is to prevent happy-path-only QA. The exact UI labels may change. The behavioral states must remain covered.

| Area | Starting state | User/system action | Expected outcome |
|---|---|---|---|
| Launch | first run | open app | app loads without blank frame/crash |
| Live | disconnected | tap Connect | scanning/request flow starts |
| Connect | Bluetooth unavailable/off | connect | useful recovery message/action |
| Connect | permission denied | deny permission | app explains next step without dead end |
| Connect | no device | scan/request ends | retry path exists |
| Connect | device found | select ColdLoop-01 | connecting state |
| Connect | success | BLE connects | connected state + telemetry starts |
| Connect | failure | GATT connect fails | retry/recovery, no infinite spinner |
| Live | normal | telemetry arrives | metrics/trends update without layout jumping |
| Live | normal | tap temperature | detail opens |
| Detail | open | Back | returns predictably |
| Live | ENS warming | telemetry status | air metric shows warming, not false healthy data |
| Live | MQ stabilizing | startup | relative gas channel shows stabilizing/baseline state |
| Live | temp rising | demo/telemetry | trend visibly rises |
| Live | threshold breached | sustained condition | specific warning appears |
| Warning | active | tap warning | event detail opens |
| History | event created | open History | event appears once, not duplicated |
| Event | recovery | temperature returns | event shows recovered/ended |
| Live | packet malformed | bad fixture | no crash; data rejected/flagged |
| Live | packet stops | no telemetry | stale state after timeout |
| Live | disconnect | BLE lost | disconnected/reconnecting state |
| Reconnect | device returns | reconnect | telemetry resumes without duplicate subscriptions |
| Device | connected | open Device | node + sensor health visible |
| Device | DHT fault | fault fixture | DHT status fault, dependent value not trusted |
| Device | ENS fault | fault fixture | ENS status fault |
| Settings | default | change threshold | UI updates and setting persists as intended |
| Settings | baseline action | re-baseline | clear feedback and no duplicate events |
| Demo | off | enable/select scenario | deterministic scenario starts |
| Demo | scenario running | switch scenario | state transition predictable |
| Demo | running | disable demo | returns to appropriate live/disconnected state |
| History | empty | open | intentional empty state |
| History | many events | scroll | bounded/performant history |
| Android | screen | system Back | expected navigation/exit behavior |
| Android | foreground | background then return | state remains coherent |
| Android | killed | relaunch | app launches and persistence behavior is intentional |
| Responsive | 360x800 | run journey | no clipping/overflow |
| Responsive | 390x844 | run journey | no clipping/overflow |
| Responsive | 412x915 | run journey | no clipping/overflow |
| Showcase | desktop | run scenario | real app rendered in phone shell |
| Showcase | desktop | resize | phone/app remains usable |

## Visual evidence

At minimum capture the major storyboard states from QA_GATES.md. Add screenshots whenever a defect is discovered or a state is visually distinct.

## Event duplication check

Repeated telemetry above a threshold must not create a new event every sample. One active condition should remain one event until recovery or a deliberate segmentation rule applies.

## Subscription duplication check

Repeated connect/disconnect/reconnect cycles must not multiply notification callbacks. A single telemetry packet should create one state update/event evaluation.
