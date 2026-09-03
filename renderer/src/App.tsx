import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types (mirrored from main/detection.ts) ─────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────
function basename(filePath: string): string {
  return filePath.replace(/\\/g, "/").split("/").pop() ?? filePath;
}

function severityClass(n: number): "low" | "medium" | "high" {
  if (n < 35) return "low";
  if (n < 70) return "medium";
  return "high";
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── Clock ───────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="topbar-clock">{time} UTC+05:30</span>;
}

// ─── Typing-effect text (Phase 4 polish) ─────────────────────────
const TYPING_SPEED_MS = 18;

function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;

    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));

      if (indexRef.current >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, TYPING_SPEED_MS);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="narration-explanation">
      {displayed}
      {!done && <span className="typing-cursor" aria-hidden="true" />}
    </span>
  );
}

// ─── Health Gauge ─────────────────────────────────────────────────
interface HealthGaugeProps {
  alert: boolean;
  threatCount: number;
  cleanCount: number;
}

function HealthGauge({ alert, threatCount, cleanCount }: HealthGaugeProps) {
  return (
    <div className="health-gauge-wrap">
      <div className={`gauge-orb-container ${alert ? "alert" : ""}`}>
        {/* Outer spinning ring */}
        <div className={`gauge-ring gauge-ring-outer ${alert ? "alert" : ""}`} />
        {/* Inner counter-spinning ring */}
        <div className={`gauge-ring gauge-ring-inner ${alert ? "alert" : ""}`} />
        {/* Sonar rings on alert */}
        {alert && (
          <>
            <div className="sonar-ring" style={{ animation: "sonar-ring 2s ease-out infinite" }} />
            <div className="sonar-ring" style={{ animation: "sonar-ring 2s ease-out 0.5s infinite" }} />
            <div className="sonar-ring" style={{ animation: "sonar-ring 2s ease-out 1s infinite" }} />
          </>
        )}
        {/* Central orb */}
        <div className={`gauge-orb ${alert ? "alert" : ""}`}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            style={{ opacity: 0.9 }}
            aria-hidden="true"
          >
            {alert ? (
              /* Shield with exclamation — threat */
              <path
                d="M12 2L4 6v5c0 4.97 3.4 9.62 8 10.93C16.6 20.62 20 15.97 20 11V6L12 2Z"
                fill={`rgba(255,71,87,0.25)`}
                stroke="#FF4757"
                strokeWidth="1.5"
              />
            ) : (
              /* Shield with checkmark — clear */
              <path
                d="M12 2L4 6v5c0 4.97 3.4 9.62 8 10.93C16.6 20.62 20 15.97 20 11V6L12 2Z"
                fill={`rgba(0,229,160,0.18)`}
                stroke="#00E5A0"
                strokeWidth="1.5"
              />
            )}
            {alert ? (
              <text x="12" y="16" textAnchor="middle" fontSize="9" fill="#FF4757" fontWeight="700">!</text>
            ) : (
              <polyline
                points="9,12 11,14 15,10"
                stroke="#00E5A0"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
        {/* Scan line */}
        <div className={`gauge-scan-line ${alert ? "alert" : ""}`} />
      </div>

      <span className={`gauge-label ${alert ? "alert" : ""}`}>
        {alert ? "⚠ THREAT DETECTED" : "● SYSTEMS SECURE"}
      </span>

      <p className="gauge-status-text">
        {alert
          ? "Endpoint threat flagged.\nAwaiting operator review."
          : "All monitored endpoints nominal.\nDrop a file to initiate scan."}
      </p>
    </div>
  );
}

// ─── Individual Threat Card ───────────────────────────────────────
interface ThreatCardProps {
  result: DetectionResult;
  index: number;
}

function ThreatCard({ result, index }: ThreatCardProps) {
  const { scan, narration, narrationSource } = result;
  const sev = severityClass(narration.severity);

  return (
    <article
      id={`threat-card-${index}`}
      className={`threat-card ${scan.infected ? "infected" : ""}`}
      aria-label={`Detection event for ${basename(scan.file)}`}
    >
      <div className="threat-card-top">
        <span className="threat-filename" title={scan.file}>
          {basename(scan.file)}
        </span>
        <div className="threat-card-meta">
          <span className={`severity-badge ${sev}`} title={`Severity ${narration.severity}/100`}>
            SEV {narration.severity}
          </span>
          <span className={`source-badge ${narrationSource}`}>
            {narrationSource === "groq" ? "AI" : "FALLBACK"}
          </span>
        </div>
      </div>

      {scan.infected && scan.signature && (
        <div className="threat-sig-row">
          <span className="threat-sig-label">SIG</span>
          <span className="threat-sig-value">{scan.signature}</span>
        </div>
      )}

      <div className="threat-narration">
        <TypingText text={narration.explanation} />
        <div className="narration-recommendation">
          <span className="rec-icon" aria-hidden="true">
            {scan.infected ? "⚡" : "✔"}
          </span>
          <span className="rec-text">{narration.recommendation}</span>
        </div>
      </div>

      <footer className="threat-card-footer">
        <span className="threat-timestamp">{formatTime(scan.scannedAt)}</span>
        {!scan.infected && (
          <span className="clean-chip">
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <polyline points="2,5.5 4,7.5 8,3" stroke="#00E5A0" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Clean
          </span>
        )}
      </footer>
    </article>
  );
}

// ─── Anchor icon ─────────────────────────────────────────────────
function AnchorIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="5" r="2" stroke="#00E5A0" strokeWidth="1.5"/>
      <line x1="12" y1="7" x2="12" y2="19" stroke="#00E5A0" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 12H18" stroke="#00E5A0" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 19C6 19 6 16 9 16" stroke="#00E5A0" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 19C18 19 18 16 15 16" stroke="#00E5A0" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Root App ─────────────────────────────────────────────────────
export default function App() {
  const [results, setResults] = useState<DetectionResult[]>([]);

  const threatCount = results.filter((r) => r.scan.infected).length;
  const cleanCount  = results.filter((r) => !r.scan.infected).length;
  const isAlert     = threatCount > 0;

  // IPC listener
  useEffect(() => {
    return window.scanner?.onDetectionResult((result) => {
      setResults((prev) => [result, ...prev]);
    });
  }, []);

  // Reset action
  const handleReset = useCallback(() => {
    setResults([]);
  }, []);

  return (
    <div className="app-shell">
      {/* ── Top bar ── */}
      <header className="topbar" role="banner">
        <div className="topbar-brand">
          <div className="topbar-logo-icon" aria-hidden="true">
            <AnchorIcon size={28} />
          </div>
          <div>
            <div className="topbar-wordmark">
              SAN<span>BOXX</span>
            </div>
            <div className="topbar-sub">Maritime Endpoint Shield</div>
          </div>
        </div>

        <div className="topbar-right">
          <LiveClock />
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="main-content" role="main">
        {/* ── Sidebar ── */}
        <aside className="sidebar" aria-label="System status">
          {/* Health gauge */}
          <div className="card" id="health-gauge-card">
            <div className="card-header">
              <span className="card-title">Vessel Health</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="var(--c-text-muted)" strokeWidth="1.5"/>
                <path d="M12 8v4l3 3" stroke="var(--c-text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <HealthGauge
              alert={isAlert}
              threatCount={threatCount}
              cleanCount={cleanCount}
            />
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-cell" id="stat-threats" aria-label="Threats detected">
              <span className={`stat-value ${threatCount > 0 ? "danger" : ""}`}>
                {threatCount}
              </span>
              <span className="stat-label">Threats</span>
            </div>
            <div className="stat-cell" id="stat-clean" aria-label="Clean files">
              <span className={`stat-value ${cleanCount > 0 ? "safe" : ""}`}>
                {cleanCount}
              </span>
              <span className="stat-label">Clean</span>
            </div>
          </div>

          {/* Separator */}
          <div className="anchor-line" aria-hidden="true" />

          {/* Watcher status */}
          <div className="watcher-status" id="watcher-status" aria-label="File watcher status">
            <div className="watcher-dot" aria-hidden="true" />
            <div>
              <div className="watcher-text">Monitoring active</div>
              <div className="watcher-path">./demo-folder</div>
            </div>
          </div>

          {/* Info block */}
          <div
            className="card card-body"
            style={{ fontSize: "11px", color: "var(--c-text-muted)", lineHeight: 1.6 }}
          >
            <strong style={{ color: "var(--c-text-secondary)", display: "block", marginBottom: 4 }}>
              How to trigger a scan
            </strong>
            Drop any file into the <span style={{ fontFamily: "var(--font-mono)", color: "var(--c-text-secondary)" }}>demo-folder</span> directory.
            ClamAV will scan it automatically. Use the EICAR test file for a safe live detection demo.
          </div>

          {/* Reset */}
          <button
            id="btn-reset-demo"
            className="btn-reset"
            onClick={handleReset}
            aria-label="Reset demo — clears all feed entries and health state"
            title="Reset demo"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M1 4v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 15a9 9 0 1 0 .49-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Reset Demo
          </button>
        </aside>

        {/* ── Threat feed ── */}
        <section className="feed-panel" aria-label="Threat feed">
          {/* Feed header */}
          <div className="feed-header">
            <span className="feed-title">Live Threat Feed</span>
            <span
              id="feed-count"
              className={`feed-count-badge ${threatCount > 0 ? "has-threats" : ""}`}
              aria-live="polite"
              aria-label={`${results.length} scan events`}
            >
              {results.length} events
            </span>
          </div>

          {/* Feed entries */}
          {results.length === 0 ? (
            <div className="feed-empty" aria-live="polite" role="status">
              <span className="feed-empty-icon" aria-hidden="true">⚓</span>
              <span className="feed-empty-title">All Clear — No Events</span>
              <span className="feed-empty-sub">
                Drop a file into the demo folder to begin scanning.
                Detections will appear here in real time.
              </span>
            </div>
          ) : (
            <div
              className="feed-list"
              role="list"
              aria-label="Detection events"
              aria-live="polite"
            >
              {results.map((r, i) => (
                <ThreatCard key={`${r.scan.scannedAt}-${i}`} result={r} index={i} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
