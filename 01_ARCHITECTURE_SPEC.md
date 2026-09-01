# Architecture spec

Reference alongside 00_PROJECT_CONTEXT.md. Solo build — keep each piece as small as it can be while still being real.

## 1. Electron shell
Build: standard main + renderer split. Renderer is React + Tailwind (reuse conventions from earlier work). Main process owns the ClamAV subprocess and the file watcher; renderer only receives events via IPC.
Do not build: auto-update, multi-window, anything packaging-related for the live demo (see locked decisions — dev mode only).

## 2. ClamAV engine wrapper (main process)
Build: a thin module that spawns `clamscan` (or talks to `clamd` over a socket if you want faster repeated scans and have time) against a given file path, captures stdout, and parses it into `{ file, infected: boolean, signature: string | null, scannedAt }`.
Requirement: ClamAV itself and up-to-date virus definitions (`freshclam`) must already be installed on the exact laptop used for the demo — this is an environment step, not a code step, and must be done ahead of time, not live.
Do not build: bundling/packaging ClamAV binaries — irrelevant since you're running on your own known machine (see locked decisions).

## 3. Live file watcher (main process)
Build: `chokidar` watching one designated demo folder. On `add`/`change` events, call the ClamAV wrapper automatically — no manual scan button needed, the drop itself is the demo trigger. Debounce so a burst of file events doesn't queue duplicate scans.
Do not build: recursive whole-disk watching, real-time protection beyond the one designated demo folder.

## 4. LLM narrator (main process or a small local service)
Build: one call to Groq per detection, sending the parsed ClamAV result (not the raw file), returning strict JSON: `{ "severity": 0-100, "explanation": "2-3 sentence plain-language summary", "recommendation": "one short action" }`. Timeout with a hardcoded fallback string if the call is slow or fails — the dashboard must never hang waiting on this.
Do not build: multiple agents, chained calls, anything beyond one request/response per detection.

## 5. IPC + state
Build: main process emits detection events (raw scan result + narrator output) over IPC to the renderer, which appends to a threat feed array in React state. No backend server, no database — in-memory state for the session is enough; a "reset demo" action clears it.
Do not build: persistence, external database, network sync of any kind.

## 6. Dashboard UI (renderer)
Build:
- Live threat feed (most recent detection first): file name, signature, severity badge, narrator explanation.
- System-health visual: a simple gauge/pulse that shifts state (calm -> alert) on detection, returns to calm after the demo resets.
- Maritime-themed visual identity: color palette, iconography, and copy tying the tool to vessel/port/OT-style endpoint protection, without inventing fake ship-specific technical claims.
- Optional polish (only if Day 5 has time): typing-effect reveal of the narrator's explanation, subtle animation on the health gauge.
Do not build: filters, historical charts, export/reporting, anything not visible during a 3-5 minute booth visit.

## Data flow
Demo folder (file dropped) -> chokidar watcher -> ClamAV wrapper (real scan) -> LLM narrator (plain-language explanation) -> IPC -> React dashboard (threat feed + health visual updates live).

## Environment checklist (do this once, ahead of time, not during the build sprint)
- ClamAV installed on the actual demo laptop.
- `freshclam` run at least once, ideally the day before Sept 5 for current definitions.
- Confirm `clamscan` runs successfully from a plain terminal on that machine before wiring it into Electron at all — isolate ClamAV problems from Electron problems.
