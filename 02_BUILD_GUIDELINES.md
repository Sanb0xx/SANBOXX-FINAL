# Build guidelines — non-negotiable

Give this to Aider/OpenCode alongside the architecture spec. If a generated solution violates one of these, reject it and ask for a compliant version.

## Safety (read first)

1. Only ever use the EICAR standard antivirus test file (a well-known, universally-safe string every AV engine is designed to flag) as your "detected threat" during development and demo. Never introduce a real malware sample, even a disabled or "safe" one someone offers you online — there is no legitimate reason to and every AV vendor explicitly warns against it.
2. The demo folder is a designated, isolated location. Do not point the watcher at a real system directory, and do not build "full disk protection" — scope stays to the one folder used for the live drop-in demo.
3. Secrets (GROQ_API_KEY) go in a gitignored env file, never hardcoded or committed.
4. If asked to demo on a judge's own device, only scan a file *they* provide into your designated demo folder — never claim or attempt full-system access to a device you don't own.

## Why model capability doesn't remove the real bottleneck

5. A frontier coding model solves "can this code be written," not "does this work in this specific environment." Three things below are physical/OS-level facts that exist regardless of model quality, and none of them get faster with a better model — they only get discovered by testing on the real target machine:
   - ClamAV requires installed binaries and current virus definitions (`freshclam`) on whatever machine runs it. This is an install step, done once, ahead of time, on your actual demo laptop — not something the coding agent can do for you inside the repo.
   - Spawning `clamscan` as a subprocess needs matching paths/permissions on that specific machine. Test this in isolation (plain terminal, before Electron is involved) before wiring it into the app.
   - Running in dev mode (per the locked decision in 00_PROJECT_CONTEXT.md) avoids Electron's packaged-app subprocess/`asar` footguns entirely — don't package for the live demo, there is no upside once you control the machine.
6. Budget real testing time on the actual demo laptop as its own line item, not an afterthought squeezed into the last evening. This is the part a strong model cannot compress for you.

## Scope discipline (solo-specific)

7. Build the thinnest real end-to-end slice first: one file drop -> real ClamAV detection -> narrator explanation -> dashboard update, working, before any visual polish.
8. No feature is worth adding if it doesn't appear in the live demo. This applies doubly now that you're solo — every hour spent on something invisible to a 3-5 minute booth visitor is an hour not spent hardening or rehearsing.
9. **Hard feature freeze: end of Day 4 (Sept 2).** No new functional features after this point.
   - Day 5 (Sept 3): visual/UI polish only — no new backend logic.
   - Day 6 (Sept 4): testing on the real demo laptop + rehearsal only. Code changes only to fix something demonstrably broken.
10. Keep a short risk register, checked daily: ClamAV install/definitions status on the demo laptop; Groq API latency/rate limits under repeated rapid demo triggers; what the fallback narrator string says if the LLM call fails; whether the backup recorded video actually exists yet.

## Code quality bar (proportional to context)

11. This is a live demo, not production software. Prioritize the happy path being rock solid over edge-case robustness — but the happy path must never crash mid-demo, that is the single worst outcome.
12. Keep the narrator's prompt template in one clearly labeled file — you'll be tuning its tone in the last couple of days.
13. Log detection events (file, result, narrator latency) to the console at minimum, for your own debugging and for anything you want to reference in a written summary later.

## Presentation-readiness

14. Add a "reset demo" action that clears the threat feed and health-gauge state without restarting the app — you'll be demoing to multiple visitors back-to-back.
15. Keep a hardcoded fallback narrator string, used only if the Groq call is slow or fails — the dashboard must never show a blank or broken state.
16. Record a full successful run on video before Sept 4 ends, independent of whether you expect to need it.
