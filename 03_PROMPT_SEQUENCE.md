# Prompt sequence — feed to Aider/OpenCode in this order

Read 00_PROJECT_CONTEXT.md, 01_ARCHITECTURE_SPEC.md, 02_BUILD_GUIDELINES.md, and AGENTS.md into the repo root before starting Phase 0.

## Before Phase 0 — do this yourself, not via the coding agent
Install ClamAV on your actual demo laptop, run `freshclam`, and confirm `clamscan` works from a plain terminal against a manually-downloaded EICAR test file. This is an environment step; verify it in isolation before any code exists, so you never have to debug "is it ClamAV or is it Electron" at the same time.

## Phase 0 — Scaffold (Day 1 / Aug 30)

> Scaffold this repo per AGENTS.md's structure: an Electron app with a React + Tailwind renderer. Main process should be minimal for now — just a working window. Confirm `npm start` launches a blank but functioning app before returning.

**Definition of done:** app launches, blank UI, no ClamAV or watcher logic yet.

## Phase 1 — Real detection pipeline (Day 2 / Aug 31)

> In the main process, build a ClamAV wrapper module that spawns `clamscan` against a given file path and parses stdout into `{ file, infected, signature, scannedAt }`. Add a `chokidar` watcher on a designated `/demo-folder`, debounced, that calls the wrapper automatically on file add/change. Send the parsed result to the renderer over IPC and log it to the console — no UI polish yet, just prove the pipeline is real end to end.

**Definition of done:** dropping the EICAR test file into `/demo-folder` produces a correctly-parsed `infected: true` result in the console within a couple seconds, with zero manual button click.

## Phase 2 — LLM narrator (Day 3 / Sept 1)

> Add a narrator module that sends each parsed ClamAV result to the Groq API (fast model) and returns strict JSON: `{ "severity": 0-100, "explanation": "2-3 sentence plain-language summary", "recommendation": "one short action" }`. Wrap the call with a timeout and a hardcoded fallback object used if the call fails or is slow. Pass the combined result (scan + narrator output) to the renderer over IPC.

**Definition of done:** the same EICAR drop now produces both the raw scan result and a real narrator explanation, visible in the console, with the fallback verified by temporarily breaking the API key.

## Phase 3 — Dashboard UI (Day 4 / Sept 2 — feature freeze at end of this day)

> Build the renderer dashboard: a live threat feed (most recent detection first, file name + signature + severity badge + narrator explanation), and a system-health visual that shifts state on detection and returns to calm after a "reset demo" action clears state. Apply a maritime-themed visual identity — color palette, iconography, and copy framing this as endpoint protection for vessel/port/OT-style environments — without inventing fake ship-specific technical claims.

**Definition of done:** the full loop — drop file, real scan, real narrator call, live dashboard update — works visibly, end to end, with a working reset action. This is the last functional feature added. Everything after this point is polish or fixes only.

## Phase 4 — Visual polish only (Day 5 / Sept 3)

> No new backend functionality. Polish only: typing-effect reveal for the narrator's explanation text, subtle animation on the health gauge, visual refinement of the threat feed and overall maritime theming. If asked to add anything backend-functional, decline per AGENTS.md's freeze rule and note it instead.

## Phase 5 — Test and rehearse (Day 6 / Sept 4)

No feature prompts. Use the coding agent only to fix something demonstrably broken found during testing on the actual demo laptop. Otherwise:
- Run the full demo flow at least 5 times consecutively on the real laptop, using reset between runs, to catch anything that only shows up on repetition.
- Record a full successful run on video as the fallback.
- Rehearse the live pitch: what you say while the file is dropped, how you narrate the health-gauge shift, and your one maritime-framing sentence.
