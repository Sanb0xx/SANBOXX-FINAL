import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────
interface ScanResult {
  file: string;
  infected: boolean;
  signature: string | null;
  scannedAt: string;
}

interface Narration {
  severity: number;
  explanation: string;
  recommendation: string;
}

interface DetectionResult {
  scan: ScanResult;
  narration: Narration;
  narrationSource: "groq" | "fallback";
}

// ─── Helpers ──────────────────────────────────────────────────────
function basename(p: string) {
  return p.replace(/\\/g, "/").split("/").pop() ?? p;
}

function severityClass(n: number): "low" | "medium" | "high" {
  if (n < 35) return "low";
  if (n < 70) return "medium";
  return "high";
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return iso; }
}

// ─── Live clock ───────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    const id = setInterval(() => setT(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="topbar-clock">{t}</span>;
}

// ─── Typing effect (Phase 4) ──────────────────────────────────────
const TYPING_MS = 16;

function TypingText({ text }: { text: string }) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const i = useRef(0);

  useEffect(() => {
    setShown(""); setDone(false); i.current = 0;
    const id = setInterval(() => {
      i.current += 1;
      setShown(text.slice(0, i.current));
      if (i.current >= text.length) { clearInterval(id); setDone(true); }
    }, TYPING_MS);
    return () => clearInterval(id);
  }, [text]);

  return (
    <span className="narration-text">
      {shown}{!done && <span className="typing-cursor" aria-hidden />}
    </span>
  );
}

// ─── EventCard ────────────────────────────────────────────────────
function EventCard({ result, index }: { result: DetectionResult; index: number }) {
  const { scan, narration, narrationSource } = result;
  const sev = severityClass(narration.severity);

  return (
    <article
      id={`event-${index}`}
      className={`event-card ${scan.infected ? "infected" : ""}`}
    >
      <div className="card-top">
        <span className="card-file" title={scan.file}>{basename(scan.file)}</span>
        <div className="card-chips">
          <span className={`sev-pill ${sev}`}>
            {narration.severity}
          </span>
          <span className={`src-chip ${narrationSource}`}>
            {narrationSource === "groq" ? "AI" : "fallback"}
          </span>
        </div>
      </div>

      {scan.infected && scan.signature && (
        <div className="card-sig">
          <span className="card-sig-label">Sig</span>
          <span className="card-sig-val">{scan.signature}</span>
        </div>
      )}

      <div className="card-narration">
        <TypingText text={narration.explanation} />
        <div className="rec-row">
          <span className="rec-icon" aria-hidden>{scan.infected ? "→" : "✓"}</span>
          <span className="rec-text">{narration.recommendation}</span>
        </div>
      </div>

      <footer className="card-footer">
        <span className="card-ts">{formatTime(scan.scannedAt)}</span>
        {!scan.infected && <span className="card-clean-chip">Clean</span>}
      </footer>
    </article>
  );
}

// ─── Shield icon ──────────────────────────────────────────────────
function ShieldIcon({ threat }: { threat: boolean }) {
  const color = threat ? "#f43f5e" : "#22c55e";
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2L4 6v5c0 4.97 3.4 9.62 8 10.93C16.6 20.62 20 15.97 20 11V6L12 2Z"
        fill={`${color}20`}
        stroke={color}
        strokeWidth="1.4"
      />
      {threat ? (
        <line x1="12" y1="9" x2="12" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      ) : (
        <polyline points="9,12 11,14.2 15.2,10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      )}
    </svg>
  );
}

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  const [results, setResults] = useState<DetectionResult[]>([]);

  const threats = results.filter((r) => r.scan.infected).length;
  const clean   = results.filter((r) => !r.scan.infected).length;
  const isAlert = threats > 0;

  useEffect(() => {
    return window.scanner?.onDetectionResult((r) => {
      setResults((prev) => [r, ...prev]);
    });
  }, []);

  const handleReset = useCallback(() => setResults([]), []);

  return (
    <div className="shell">
      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-wordmark">SANBOXX</span>
          <span className="topbar-version">v0.1</span>
        </div>
        <div className="topbar-right">
          <LiveClock />
          <span className="topbar-status-label">
            {isAlert ? "Threat Detected" : "Nominal"}
          </span>
          <span
            id="status-indicator"
            className={`topbar-status-dot ${isAlert ? "threat" : ""}`}
            aria-label={isAlert ? "Threat detected" : "Secure"}
          />
        </div>
      </header>

      {/* ── Content ── */}
      <div className="content">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <span className="section-label">Scan Stats</span>

          <div className="stat-row">
            <div className="stat" id="stat-threats">
              <div className={`stat-num ${threats > 0 ? "danger" : "neutral"}`}>{threats}</div>
              <div className="stat-label">Threats</div>
            </div>
            <div className="stat" id="stat-clean">
              <div className={`stat-num ${clean > 0 ? "ok" : "neutral"}`}>{clean}</div>
              <div className="stat-label">Clean</div>
            </div>
          </div>

          <div className="divider" />

          <span className="section-label">Watcher</span>

          <div className="live-row" id="watcher-status">
            <span className="live-dot" aria-hidden />
            <span className="live-text">Active</span>
            <span className="live-path">./drop</span>
          </div>

          <div className="divider" />

          <button
            id="btn-reset"
            className="btn-reset"
            onClick={handleReset}
            aria-label="Clear all events and reset status"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M1 4v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 15a9 9 0 1 0 .49-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Clear
          </button>
        </aside>

        {/* ── Main ── */}
        <main className="main-panel">
          {/* Hero status */}
          <section className="hero">
            <div className="hero-left">
              <div className="hero-eyebrow">System Status</div>
              <div
                id="hero-status-text"
                className={`hero-status ${isAlert ? "threat" : "secure"}`}
                key={isAlert ? "threat" : "secure"}
              >
                {isAlert ? "THREAT" : "SECURE"}
              </div>
              <p className="hero-sub">
                {isAlert
                  ? `${threats} threat${threats > 1 ? "s" : ""} detected — review log below.`
                  : "No threats detected. Drop a file to run a scan."}
              </p>
            </div>

            <div className="hero-orb-wrap">
              <div
                id="status-orb"
                className={`hero-orb ${isAlert ? "threat" : "secure"}`}
              >
                <ShieldIcon threat={isAlert} />
              </div>
            </div>
          </section>

          {/* Feed */}
          <section className="feed">
            <div className="feed-top">
              <span className="feed-heading">Scan Log</span>
              <span
                id="feed-count"
                className={`feed-badge ${threats > 0 ? "active" : ""}`}
                aria-live="polite"
              >
                {results.length} events
              </span>
            </div>

            {results.length === 0 ? (
              <div className="empty" role="status" aria-live="polite">
                <div className="empty-icon" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4"/>
                    <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="empty-title">No events</span>
                <span className="empty-sub">Drop a file into the watched folder to trigger a scan.</span>
              </div>
            ) : (
              <div className="feed-list" role="list" aria-label="Detection events" aria-live="polite">
                {results.map((r, i) => (
                  <EventCard key={`${r.scan.scannedAt}-${i}`} result={r} index={i} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
