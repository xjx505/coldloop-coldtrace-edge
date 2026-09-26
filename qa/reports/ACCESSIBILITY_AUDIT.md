# ColdLoop Accessibility Audit

Generated: 2026-09-26T11:12:42.135Z
Status: PASS
Automated checks: axe-core WCAG 2.1 A/AA and best-practice rules in 18 representative states at 390x844 and 1440x1000.
Keyboard checks: skip link, modal focus loop, Escape close, and trigger-focus return.
Manual checks: Reduced motion PASS; Live status announcement PASS; ColdTrace chart text alternatives PASS.

| State | Violations | Pass rules | Manual review needed |
|---|---:|---:|---|
| phone:no-data | 0 | 33 | None reported |
| phone:simulation-normal | 0 | 33 | None reported |
| phone:temperature-detail-dialog | 0 | 29 | color-contrast |
| phone:temperature-warning | 0 | 34 | None reported |
| phone:event-detail-dialog | 0 | 28 | color-contrast |
| phone:active-history | 0 | 33 | None reported |
| phone:recovered-history | 0 | 33 | None reported |
| phone:device | 0 | 34 | None reported |
| phone:settings | 0 | 39 | None reported |
| phone:settings-advanced | 0 | 40 | None reported |
| phone:coldtrace-s3-ready | 0 | 40 | None reported |
| phone:coldtrace-device | 0 | 35 | None reported |
| showcase:normal | 0 | 35 | None reported |
| showcase:warning | 0 | 35 | None reported |
| showcase:advanced-scenarios | 0 | 38 | None reported |
| showcase:coldtrace-s3-ready | 0 | 43 | None reported |
| showcase:s2-evaluation-alert | 0 | 43 | None reported |
| showcase:s2-evaluation-detail | 0 | 31 | None reported |


## Contrast follow-up

Axe reports color-contrast review as incomplete on the two dialog states; it reports zero violations. Manual CSS token checks for muted text are 5.01:1 on page (#f3f1ea), 5.61:1 on surface (#fffefa), and 5.24:1 on soft surface (#f8f6f0). Ink text (#20251f) exceeds 13:1 on these backgrounds. This closes the noted candidates for the checked token/background combinations; it is not a claim of a full independent WCAG certification.
