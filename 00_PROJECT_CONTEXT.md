# Project context — AI-augmented desktop endpoint scanner

Feed this file to Aider/OpenCode first, every session. It should never need re-explaining.

## What this is

A self-contained Electron desktop app for Innovision 2026, theme: Cyber Security & Digital Innovation. Wraps a real open-source AV engine (ClamAV) with a live file-watcher and an LLM narrator layer that explains detections in plain language, presented through a polished, maritime-themed dashboard UI. Target: Future Technology Award, secondary framing: Social Impact / People's Choice.

## Why this exists (the actual win condition)

AMET is a maritime institute, not an engineering one. Judges will not scrutinize the code — they will remember what they *saw*. The win condition is a real, live detection event (drop a known-safe test file into a watched folder, watch it get caught, explained, and flagged in seconds) plus a visual layer polished enough to hold attention in a 3-5 minute booth visit. Every hour spent should be checked against: does this make the live moment more real, more understandable, or more visually striking — not "is this technically more impressive."

## Locked decisions

- **Solo build.** Teammate is out. This is not "the same plan, done slower" — it changes the shape of the plan. No parallel frontend/backend workstreams; everything is sequential, so scope must be genuinely small enough for one person to finish AND test AND rehearse in 6 days.
- **Coding via Aider/OpenCode with a frontier model.** Model capability is not the constraint on whether code can be written. The constraint is environment/packaging/testing time, which does not compress with a stronger model — see 02_BUILD_GUIDELINES.md.
- **Electron, not Tauri.** Faster with existing JS/React/Tailwind familiarity; ClamAV subprocess integration has far more prior art in Node than Rust.
- **Real ClamAV**, not a simulated/fake detection layer. Genuine `clamscan` execution against real (but harmless) test signatures. This is what makes the demo defensible if anyone asks a real question.
- **Run in dev mode (`electron .` / `npm start`) on your own prepped demo laptop. Do not package/install for the live demo.** You control the exact machine at the booth — that removes the entire reason to package (bundling ClamAV + definitions offline, code-signing to dodge SmartScreen, `asar`-unpack subprocess issues). Package only later if the format literally requires a runnable installer upload, as a separate lower-stakes task, never relied on for the live demo.
- **One LLM narrator agent** (Groq, fast), not a multi-agent pipeline. One well-executed explanation layer beats two half-working ones, solo.
- **Maritime framing baked into copy and pitch**, not just backend logic: this is endpoint protection with maritime/OT environments in mind — ships and ports are increasingly networked and have had real, costly incidents (Maersk's 2017 NotPetya outage being the most famous). Free differentiator specific to this audience.

## Hard constraints

- **6 days total**, Aug 30 (today) to Sept 5 (exhibition, live demo).
- **Feature freeze end of Day 4 (Sept 2).** Day 5 is visual polish only, no new backend functionality. Day 6 is testing on the real demo laptop + rehearsal, no code changes unless something is actually broken.
- **Safety:** only ever scan/flag known-benign test signatures (EICAR standard test file), never real malware. See 02_BUILD_GUIDELINES.md.

## Definition of done for the exhibition

1. ClamAV installed and definitions updated on the actual laptop you'll demo on — done once, ahead of time, not live.
2. App runs in dev mode, watches a designated folder via chokidar.
3. Dropping an EICAR test file into the folder triggers an automatic scan within ~1-2 seconds.
4. Detection result is sent to the LLM narrator, which returns a plain-language explanation and severity.
5. Dashboard updates live: threat feed entry, system-health visual shifts, narrator explanation displayed (typing effect optional polish).
6. A "reset/clear" action exists so you can demo repeatedly for different visitors without restarting the app.
7. A recorded backup video of a full successful run exists, in case live demo fails for any reason.

## Award framing

- **Future Technology Award:** real AV engine + AI-generated plain-language triage, live file-system monitoring, not a canned simulation.
- **Social Impact / People's Choice:** one line of pitch copy — protecting exactly the kind of environment (ships, ports, small operations without a dedicated security team) that doesn't get enterprise-grade tools today.
