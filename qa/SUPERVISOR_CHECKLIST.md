# Periodic Supervisor Checklist

Run this conservatively.

1. Is the Codex Goal/thread active?
2. Has there been meaningful progress since the previous check?
3. Is a legitimate long operation currently running?
4. Did RUN_STATE change?
5. Did FINAL_STATUS gain supported PASS evidence?
6. Did new build/test/screenshot evidence appear?
7. Did Codex claim completion?
8. If it stopped, why?
9. Is the stated blocker genuine under CODEX_OPERATING_RULES.md?
10. Is it repeating the same failed route?
11. Is it drifting from Android + real shared app + visual QA requirements?
12. Is it modifying anything outside ColdLoop/toolchain unexpectedly?

Decision:
- ACTIVE + PROGRESS -> NO ACTION
- ACTIVE + LONG LEGITIMATE OPERATION -> NO ACTION
- STOPPED + QA INCOMPLETE -> minimal resume/fix message
- FALSE COMPLETE -> reject with exact failing gates
- REPEATED NO-PROGRESS -> request diagnosis + alternate route
- GENUINE PHYSICAL BLOCKER ONLY -> record PHYSICAL_REQUIRED and continue other work
