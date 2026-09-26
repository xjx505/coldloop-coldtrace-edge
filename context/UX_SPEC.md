# UX and Visual Design Specification

This file is binding. The user cares heavily about actual product usability and strongly rejects generic AI-generated dashboard aesthetics.

## Core design principle

Minimal visible text does not mean minimal information.

The interface should reveal the most important information immediately and progressively disclose deeper technical detail on tap.

Every visual must have an information or interaction purpose.

Ask of every element:

"What question does this answer for the user?"

If there is no concrete answer, remove it.

## Forbidden visual patterns

Do not use:
- dark navy/purple "AI dashboard" palettes;
- neon/cyberpunk gradients;
- decorative gradient blobs;
- floating particles;
- meaningless radar visuals;
- circular gauges used only because they look futuristic;
- random donut/pie charts for scalar sensor values;
- decorative waveforms unrelated to data;
- emoji as UI icons;
- large blocks of explanatory copy on operational screens;
- cards for every possible number simply because cards are easy;
- excessive pills/badges;
- fake glassmorphism;
- animations that delay access to information.

## Preferred visual direction

Prefer a light or warm-neutral product interface:
- off-white / very light gray primary surfaces;
- charcoal/dark neutral typography;
- restrained green for healthy/normal;
- amber for caution;
- red only for actual critical/active problems;
- cool neutral grays for secondary information;
- no gratuitous blue/purple branding.

The product should feel calm in normal operation. Warning color should earn attention by being rare.

## Hierarchy

The first screen should answer, in roughly this order:

1. Are we connected?
2. Are conditions normal?
3. What is the temperature?
4. What is humidity?
5. What is the air/VOC condition?
6. Is anything trending the wrong way?
7. Is there an active event?

Do not give TVOC, eCO2, MQ raw value, ENS internal status, and every threshold equal visual weight on the home screen.

## Progressive disclosure

Examples:

Home temperature:
"4.8 °C" + small useful trend.

Tap:
- threshold;
- recent min/max;
- rate of change;
- larger time-series;
- related event markers.

Home air condition:
"Normal" / "Watch" / "High" + useful small trend.

Tap:
- AQI;
- TVOC;
- eCO2 equivalent;
- MQ-135 relative/raw;
- readiness status;
- recent trend.

## Navigation

Do not hide every core surface behind a hamburger just because it looks clean.

For three high-frequency areas, a restrained bottom navigation is likely better on phones:
- Live
- History
- Device

Settings may be a small top-level control or a fourth low-emphasis destination if usability testing supports it.

If a drawer/hamburger objectively produces a better flow after testing, it is allowed. Navigation choice must be evidence-driven, not style-driven.

## Touch and spacing

Aim for approximately 44-48 CSS px minimum touch target size for primary controls.

Avoid tiny icon-only hit areas near screen edges.

Honor Android safe areas and bottom navigation spacing.

Avoid horizontally scrolling operational content unless the user explicitly chose a horizontally scrollable chart.

## Charts

Useful charts:
- time-series;
- threshold band/line;
- event markers;
- small sparkline for recent direction.

A chart must have a readable time direction and obvious relation to the current value.

Avoid over-labeled axes on the small phone home screen. Deeper detail can show more scale/context.

## Events and warnings

Warnings must be specific and actionable.

Bad:
"ANOMALY DETECTED"

Better:
"Temperature rising"
"8.4 °C · above 8 °C for 45 s"

Use severity based on actual state. Do not make normal fluctuations look catastrophic.

An event should not trigger from a single obviously noisy sample. Favor short smoothing plus sustained threshold and/or meaningful rate-of-rise logic.

## Sensor readiness

If a sensor is warming/stabilizing, communicate that state explicitly.

Never display warm-up data with the same confidence styling as a ready sensor.

Examples:
- ENS160: Warming
- MQ-135: Stabilizing
- DHT22: Ready
- DHT22: No data

## Animation

Allowed:
- panel expansion/collapse;
- screen transition;
- connection state;
- warning appearance;
- graph updates;
- subtle status transitions.

Rules:
- short;
- interruptible;
- not required to wait through;
- no motion for its own sake.

Respect reduced-motion preference where practical.

## Responsive test sizes

At minimum:
- 360x800;
- 390x844;
- 412x915;
- one desktop viewport for showcase.

Important content must remain usable on the smallest target.

## Visual QA as a journey

Do not approve screens individually.

Required storyboard:
1. cold launch;
2. disconnected;
3. scan/request device;
4. connecting;
5. connected-normal;
6. metric detail;
7. return to Live;
8. temperature rising;
9. active warning;
10. warning/event detail;
11. History;
12. reconnect/disconnect state;
13. Device/sensor health;
14. Settings;
15. demo scenario control;
16. recovery to normal.

Compare screenshots in sequence for:
- hierarchy;
- consistency;
- controls moving unexpectedly;
- context loss;
- scroll position;
- confusing navigation;
- poor touch placement;
- excessive information;
- missing information;
- warning escalation;
- recovery clarity.

## Visual audit severity

P0: broken/unusable/crash/critical overlap.
P1: major usability problem, misleading state, missing core action, bad navigation, unreadable/too-small content.
P2: polish/consistency issue.
P3: optional enhancement.

Completion requires zero unresolved P0 and P1 issues.
