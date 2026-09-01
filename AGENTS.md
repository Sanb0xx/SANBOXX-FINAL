# AGENTS.md — persistent instructions for any AI coding agent in this repo

Read by Aider/OpenCode at the start of every session. Narrative and strategy live in 00_PROJECT_CONTEXT.md; component specs in 01_ARCHITECTURE_SPEC.md; non-negotiable rules in 02_BUILD_GUIDELINES.md. Read all three before writing code.

## One-liner
Solo-built Electron desktop app wrapping real ClamAV detection with an LLM plain-language narrator, maritime-themed UI, 6-day build ending in a live in-person demo. No packaging for the demo — runs in dev mode on a known, prepped laptop.

## Stack (fixed)
- Shell: Electron (main + renderer)
- Frontend: React + Tailwind
- Detection: ClamAV (`clamscan`, installed on the host machine, not bundled)
- File watching: chokidar
- AI: Groq API, one narrator call per detection
- No backend server, no database — in-memory state for the demo session

## Repo structure (expected)
```
/main             Electron main process: ClamAV wrapper, chokidar watcher, IPC, Groq narrator call
/renderer          React + Tailwind dashboard UI
/demo-folder       Designated watched folder for the live demo (gitignored contents)
AGENTS.md
00_PROJECT_CONTEXT.md
01_ARCHITECTURE_SPEC.md
02_BUILD_GUIDELINES.md
03_PROMPT_SEQUENCE.md
```

## Non-negotiables (quick check before generating code)
- Only the EICAR standard test file is ever used as a "detection" — never a real malware sample, disabled or not.
- No packaging/installer work for the live demo — dev mode only, on the known demo laptop.
- Secrets only via gitignored env vars.
- Every visible number/state on the dashboard reflects a real event (a real scan result, a real narrator call) — never fake or hardcoded except clearly-static UI copy.
- Hard feature freeze after Day 4 (Sept 2). If asked to add a new feature after freeze, refuse and note it for a "later" list instead — Day 5 is polish-only, Day 6 is test/rehearse-only.

## Coding conventions
- TypeScript in both main and renderer where practical; keep it simple over strict if it slows a solo 6-day build down.
- Narrator prompt template lives in one clearly named file, not inline.
- Every call to Groq wrapped with a timeout and a hardcoded fallback string — nothing on the dashboard should ever hang.
- Commit after every working end-to-end slice ("this still runs"), not after every file.

## Definition of done, per component
Done means: it runs against the real ClamAV binary and a real EICAR test file (not a mock), it has a fallback for the Groq call, and it's been watched running live at least once, not just read in code.

## When in doubt
Priority order: (1) the live demo never crashes, (2) every visible result is real, (3) the thin end-to-end slice (drop file -> real scan -> narrator -> dashboard update) works before any polish, (4) new ideas after Day 4 go on a list for next time, not into the build now.
